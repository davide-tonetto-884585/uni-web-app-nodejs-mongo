import {authorize, Role} from "../index";
import * as Course from "../models/Course";

const express = require('express');
const router = express.Router();

router.post('/', authorize([Role.Admin, Role.Teacher, Role.Student]), async (req, res, next) => {
    if (!req.body.studentId || !req.body.presencePasscode) {
        return next({statusCode: 400, error: true, errormessage: "Missing parameters."});
    }

    if (req.auth.roles.includes(Role.Student) && req.auth.id !== req.body.studentId) {
        return next({statusCode: 401, error: true, errormessage: "You are not authorized to add an attendance for another student."});
    }

    let course = await Course.getModel().findOne({
        _id: res.locals.courseId,
        "schedules._id": res.locals.scheduleId,
    }, {
        schedules: {$elemMatch: {_id: res.locals.scheduleId}},
    });
    if (!course || !course.schedules[0]) return next({statusCode: 409, error: true, errormessage: "Course not found."});

    let lesson = course.schedules[0].lessons.find((l) => l._id === res.locals.lessonId);
    if (!lesson) return next({statusCode: 409, error: true, errormessage: "Lesson not found."});

    if (!course.schedules[0].inscriptions.find((i) => i.studentId === req.body.studentId))
        return next({statusCode: 409, error: true, errormessage: "Student not subscribed."});

    if (!lesson.addAttendance(req.body.studentId, req.body.presencePasscode))
        return next({statusCode: 409, error: true, errormessage: "Invalid presence passcode."});

    course.save().then(() => {
        res.status(200).json({error: false, errormessage: ""});
    }).catch((err) => {
        return next({statusCode: 500, error: true, errormessage: "Cannot add attendance: " + err});
    });
});

module.exports = router;