import {authorize, imageUpload, Role} from "../index";
import * as Course from '../models/Course';
import * as User from '../models/User';

const fs = require('fs');
const ini = require('ini');

const express = require('express');
const router = express.Router();

router.get('/', async (req, res, next) => {
    const title = req.query.title;
    const skip = req.query.skip;
    const limit = req.query.limit;
    const language = req.query.language;
    const scheduled = req.query.scheduled;
    const popular = req.query.popular;

    let filter = Object();
    if (title) filter.title = {$regex: '.*' + title + '.*'};
    if (language) filter.language = {$regex: '.*' + language + '.*'};
    if (scheduled) {
        filter["schedules.lessons.date"] = {$gt: Date.now()}
    }

    let query = Course.getModel().find(filter);
    const count = await Course.getModel().countDocuments(query);

    if (popular)
        query = query.sort({"schedules.inscriptions": -1});
    else if (scheduled)
        query = query.sort({"schedules.lessons.date": -1});

    if (skip) query.skip(skip);
    if (limit) query.limit(limit);

    query.then((courses) => {
        return res.status(200).json({courses: courses, count: count});
    }).catch((err) => {
        return next({statusCode: 500, error: true, errormessage: "Error in finding courses: " + err});
    });
});

// get course by id
router.get('/:id', (req, res, next) => {
    Course.getModel().findOne({
        _id: req.params.id
    }).then((course) => {
        res.status(200).json(course);
    }).catch((err) => {
        return next({statusCode: 500, error: true, errormessage: "Error in finding course: " + err});
    })
});

// add new course
router.post('/', authorize([Role.Admin, Role.Teacher]),
    imageUpload.fields([{
        name: 'image', maxCount: 1
    }, {
        name: 'certificateFile', maxCount: 1
    }]), async (req, res, next) => {
        const title = req.body.title;
        if (!title) return next({statusCode: 404, error: true, errormessage: "Missing fields."});

        const config = ini.parse(fs.readFileSync('./config.ini', 'utf-8'));
        const courseCount = await Course.getModel().count({teacherId: req.params.id});
        if (courseCount >= config.SETTINGS.teacherCoursesLimit) return next({
            statusCode: 403,
            error: true,
            errormessage: "You have reached the maximum number of courses."
        });

        if (await Course.getModel().count({title: title}) > 0)
            return next({statusCode: 409, error: true, errormessage: "Course with same title already exist."});

        const enabled = (req.body.enabled ? true : req.body.enabled);

        let teacherId = req.body.teacherId;
        if (teacherId) {
            const teacherData = await User.getModel().findOne({_id: teacherId});
            if (!teacherData?.hasTeacherRole())
                return next({statusCode: 409, error: true, errormessage: "User not valid."});
        } else
            teacherId = req.auth.id;

        const newCourse = Course.newCourse({
            title: title,
            description: req.body.description,
            language: req.body.language,
            image: req.files.image[0].path,
            certificateFile: req.files.certificateFile[0].path,
            teacherId: teacherId,
            enabled: enabled,
        });

        newCourse.save().then((c) => {
            return res.status(200).json({error: false, errormessage: "", courseId: c._id})
        }).catch((err) => {
            return next({statusCode: 500, error: true, errormessage: "Cannot create course: " + err});
        })
    });

// modify course
router.put('/:id', authorize([Role.Admin, Role.Teacher]),
    imageUpload.fields([{
        name: 'image', maxCount: 1
    }, {
        name: 'certificateFile', maxCount: 1
    }]),
    async (req, res, next) => {
        const course = await Course.getModel().findOne({_id: req.params.id});

        if (!course)
            return next({statusCode: 409, error: true, errormessage: "Course not found."});

        if (req.auth.roles.includes(Role.Teacher) && req.auth.roles.length === 1 && course.teacherId != req.auth.id)
            return next({
                statusCode: 401,
                error: true,
                errormessage: "You cannot edit a course that does not belong to you."
            });

        if (req.body.title) course.title = req.body.title;
        if (req.body.description) course.description = req.body.description;
        if (req.body.language) course.language = req.body.language;
        if (req.body.enabled) course.enabled = req.body.enabled;
        if (req.files.image) course.image = req.files.image[0].path;
        if (req.files.certificateFile) course.certificateFile = req.files.certificateFile[0].path;

        course.save().then((c) => {
            return res.status(200).json({error: false, errormessage: ""})
        }).catch((err) => {
            return next({statusCode: 500, error: true, errormessage: "Cannot update course: " + err});
        })
    });

// delete course
router.delete('/:id', authorize([Role.Admin]), (req, res, next) => {
    Course.getModel().deleteOne({_id: req.params.id}).then((out) => {
        return res.status(200).json({error: false, errormessage: ""})
    }).catch((err) => {
        return next({statusCode: 500, error: true, errormessage: "Cannot delete course: " + err});
    });
});

module.exports = router;