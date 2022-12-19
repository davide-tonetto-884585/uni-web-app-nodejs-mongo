import {authorize, imageUpload, Role} from "../index";
import * as Course from '../models/Course';

const express = require('express');
const router = express.Router();

router.get('/', async (req, res, next) => {
    let course = await Course.getModel().findOne({
        _id: res.locals.courseId,
        "schedules._id": res.locals.scheduleId,
    }, {
        schedules: {$elemMatch: {_id: res.locals.scheduleId}}
    });

    if (!course) return next({statusCode: 409, error: true, errormessage: "Course not found."})

    return res.status(200).json(course.schedules[0].lessons);
})

//insert new lesson
router.post('/', imageUpload.array(), authorize([Role.Teacher, Role.Admin]), async (req, res, next) => {
    let course = await Course.getModel().findOne({
        _id: res.locals.courseId,
        "schedules._id": res.locals.scheduleId,
    }, {
        schedules: {$elemMatch: {_id: res.locals.scheduleId}}
    });

    if (!course) return next({statusCode: 409, error: true, errormessage: "Course not found."})

    if (!req.auth.roles.includes(Role.Admin) && course.teacherId != req.auth.id)
        return next({
            statusCode: 401,
            error: true,
            errormessage: "You are not authorized to schedule a course that does not belong to you."
        });

    if (!req.body.date || !req.body.startTime || !req.body.endTime || !req.body.presencePasscode)
        return next({statusCode: 400, error: true, errormessage: "Missing fields."});

    course.schedules[0].addLesson(
        req.body.date,
        req.body.startTime,
        req.body.endTime,
        req.body.virtualRoomLink,
        req.body.virtualRoomPasscode,
        req.body.presencePasscode,
        req.body.classroomId
    );

    course.save().then((c) => {
        return res.status(200).json({error: false, errormessage: ""})
    }).catch((err) => {
        return next({statusCode: 500, error: true, errormessage: "Cannot insert lesson: " + err});
    })
})

// modify lesson
router.put('/:lessonId', imageUpload.array(), authorize([Role.Teacher, Role.Admin]), async (req, res, next) => {
    let course = await Course.getModel().findOne({
        _id: res.locals.courseId,
        "schedules._id": res.locals.scheduleId,
        "schedules.lessons._id": req.params.lessonId
    }, {
        schedules: {
            $elemMatch: {
                _id: res.locals.scheduleId
            }
        }
    });

    if (!course) return next({statusCode: 409, error: true, errormessage: "Course not found."})

    if (!req.auth.roles.includes(Role.Admin) && course.teacherId != req.auth.id)
        return next({
            statusCode: 401,
            error: true,
            errormessage: "You are not authorized to schedule a course that does not belong to you."
        });

    let lesson = course.schedules[0].lessons.find(lesson => lesson._id == req.params.lessonId);
    if (!lesson) return next({statusCode: 409, error: true, errormessage: "Lesson not found."})

    if (req.body.date)
        lesson.date = req.body.date;
    if (req.body.startTime)
        lesson.startTime = req.body.startTime;
    if (req.body.endTime)
        lesson.endTime = req.body.endTime;
    lesson.virtualRoomLink = req.body.virtualRoomLink;
    lesson.virtualRoomPasscode = req.body.virtualRoomPasscode;
    if (req.body.presencePasscode)
        lesson.presencePasscode = req.body.presencePasscode;
    lesson.classroomId = req.body.classroomId;

    course.save().then((c) => {
        return res.status(200).json({error: false, errormessage: ""})
    }).catch((err) => {
        return next({statusCode: 500, error: true, errormessage: "Cannot modify lesson: " + err});
    })
})

router.get('/:lessonId', async (req, res, next) => {
    let course = await Course.getModel().findOne({
        _id: res.locals.courseId,
        "schedules._id": res.locals.scheduleId,
        "schedules.lessons._id": req.params.lessonId
    }, {
        schedules: {
            $elemMatch: {
                _id: res.locals.scheduleId
            }
        }
    });
    if (!course) return next({statusCode: 409, error: true, errormessage: "Course not found."})

    let lesson = course.schedules[0].lessons.find(lesson => lesson._id == req.params.lessonId);
    if (!lesson) return next({statusCode: 409, error: true, errormessage: "Lesson not found."})

    return res.status(200).json(lesson);
})

module.exports = router;