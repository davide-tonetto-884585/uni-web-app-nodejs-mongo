import {authorize, imageUpload, Role} from "../index";
import * as Course from '../models/Course';

const fs = require('fs');
const ini = require('ini');

const express = require('express');
const router = express.Router();

// add schedule to course
router.post('/', imageUpload.array(), authorize([Role.Admin, Role.Teacher]), async (req, res, next) => {
    let course = await Course.getModel().findOne({_id: res.locals.courseId});
    if (!course) return next({statusCode: 409, error: true, errormessage: "Course not found."})

    if (!req.auth.roles.includes(Role.Admin) && course.teacherId != req.auth.id)
        return next({
            statusCode: 401,
            error: true,
            errormessage: "You are not authorized to schedule a course that does not belong to you."
        })

    if (!req.body.modality || !req.body.certificatePassword)
        return next({statusCode: 404, error: true, errormessage: "Missing fields."})

    course.addSchedule(req.body.modality, req.body.inscriptionLimit, req.body.certificatePassword);
    course.save().then((r) => {
        return res.status(200).json({error: false, errormessage: "", courseScheduleId: r.schedules[r.schedules.length - 1]._id});
    }).catch(err => {
        return next({statusCode: 500, error: true, errormessage: "Cannot add course schedule: " + err});
    })
});

// modify course schedule
router.put('/:scheduleId', imageUpload.array(), authorize([Role.Admin, Role.Teacher]), async (req, res, next) => {
    // get course with only the schedule we need
    let course = await Course.getModel().findOne({
        _id: res.locals.courseId,
        "schedules._id": req.params.scheduleId,
    }, {
        schedules: {$elemMatch: {_id: req.params.scheduleId}}
    });

    if (!course) return next({statusCode: 409, error: true, errormessage: "Course not found."})

    if (!req.auth.roles.includes(Role.Admin) && course.teacherId != req.auth.id)
        return next({
            statusCode: 401,
            error: true,
            errormessage: "You are not authorized to schedule a course that does not belong to you."
        })

    if (req.body.modality)
        course.schedules[0].modality = req.body.modality;
    if (req.body.inscriptionLimit)
        course.schedules[0].inscriptionLimit = req.body.inscriptionLimit;
    if (req.body.certificatePassword)
        course.schedules[0].certificatePassword = req.body.certificatePassword;

    course.save().then((r) => {
        return res.status(200).json({error: false, errormessage: ""});
    }).catch((err) => {
        return next({statusCode: 500, error: true, errormessage: "Cannot modify course schedule: " + err});
    })
});

router.get('/', async (req, res, next) => {
    let filter = Object();
    if (req.query.current) {
        filter["schedules.lessons.date"] = {$gt: Date.now()}
    }

    let course = await Course.getModel().findOne({
        _id: res.locals.courseId,
    });
    if (!course) return next({statusCode: 409, error: true, errormessage: "Course not found."})

    course = await Course.getModel().findOne({
        _id: res.locals.courseId,
        ...filter
    });

    if (course && req.query.currentOrNull) {
        let schedules = Array();
        course.schedules.forEach((schedule) => {
            // @ts-ignore
            if (schedule.lessons.length === 0 || schedule.lessons.find((lesson) => lesson.date.getTime() > Date.now()) !== undefined)
                schedules.push(schedule)
        });

        return res.status(200).json(schedules);
    } else
        return res.status(200).json(course?.schedules ?? []);
});

router.get('/:scheduleId', async (req, res, next) => {
    // get course with only the schedule we need
    let course = await Course.getModel().findOne({
        _id: res.locals.courseId,
        "schedules._id": req.params.scheduleId,
    }, {
        schedules: {$elemMatch: {_id: req.params.scheduleId}}
    });

    if (!course) return next({statusCode: 409, error: true, errormessage: "Course not found."})

    return res.status(200).json(course.schedules[0]);
});

router.post('/:scheduleId/certificate', imageUpload.array(), authorize([Role.Student]), async (req, res, next) => {
    // get course with only the schedule we need
    let course = await Course.getModel().findOne({
        _id: res.locals.courseId,
        "schedules._id": req.params.scheduleId,
    }, {
        schedules: {$elemMatch: {_id: req.params.scheduleId}}
    });

    if (!course) return next({statusCode: 409, error: true, errormessage: "Course not found."})

    if (!course.schedules[0].certificatePassword)
        return next({statusCode: 409, error: true, errormessage: "Certificate password not set."})

    if (course.schedules[0].certificatePassword !== req.body.certificatePassword)
        return next({statusCode: 409, error: true, errormessage: "Wrong password."})

    const config = ini.parse(fs.readFileSync('./globalSettings.ini', 'utf-8'));
    const attendanceCount = course.schedules[0].lessons.filter(l => l.attendances.includes(req.auth.id)).length;
    if (attendanceCount * 100 / course.schedules[0].lessons.length < config.SETTINGS.minimumAttendancePercentage)
        return next({statusCode: 409, error: true, errormessage: "Not enough attendance to the course."})

    if (!course.certificateFile)
        return next({
            statusCode: 409,
            error: true,
            errormessage: "Certificate not found, please contact course teacher."
        });

    res.status(200).download(course.certificateFile);
});

module.exports = router;