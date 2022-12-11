import {authorize, Role} from "../index";
import * as User from '../models/User';
import * as Course from '../models/Course';

const express = require('express');
const router = express.Router();

router.post('/', authorize([Role.Teacher, Role.Admin, Role.Student]), async (req, res, next) => {
    // TODO: aggiungere limite iscrizioni per studente
    if (!req.body.studentId)
        return next({statusCode: 400, error: true, errormessage: "Missing student ID."});

    const student = await User.getModel().findOne({_id: req.body.studentId});
    if (!student || !student.hasStudentRole()) return next({
        statusCode: 409,
        error: true,
        errormessage: "Student not found."
    });

    if (req.auth.roles.includes(Role.Student) && req.auth.id !== student._id)
        return next({
            statusCode: 400,
            error: true,
            errormessage: "You are not authorized to subscribe other students."
        });

    /* let course = await Course.getModel().findOne({
        _id: res.locals.courseId,
        "schedules._id": res.locals.scheduleId,
    }, {
        schedules: {$elemMatch: {_id: res.locals.scheduleId}}
    }); */

    let course = await Course.getModel().aggregate<Course.Course>([{
        $match: {
            _id: res.locals.courseId,
            "schedules._id": res.locals.scheduleId,
        },
    }, {
        $project: {
            schedules: {$elemMatch: {_id: res.locals.scheduleId}}
        }
    }, {
        $lookup: {
            from: "classrooms",
            localField: "schedules.lessons.classroomId",
            foreignField: "_id",
            as: "schedules.lessons.classroom"
        }
    }
    ])[0];

    if (!course) return next({statusCode: 409, error: true, errormessage: "Course not found."});

    if (course.schedules[0].inscriptions.find(i => i.studentId === student._id))
        return next({statusCode: 409, error: true, errormessage: "Student already subscribed."});

    let minCapacity = 0;
    if (course.schedules[0].modality === "In presence" || course.schedules[0].modality === "Dual") {
        minCapacity = Math.min(...course.schedules[0].lessons.map(l => l.classroom.capacity));
    }

    if (course.schedules[0].modality === "In presence" &&
        (course.schedules[0].inscriptions.length >= course.schedules[0].inscriptionLimit || course.schedules[0].inscriptions.length >= minCapacity))
        return next({statusCode: 409, error: true, errormessage: "Course is full."});

    const inPresenceCount = course.schedules[0].inscriptions.filter(i => i.modality === "In presence").length;
    if (course.schedules[0].modality === "Dual" &&
        (inPresenceCount >= course.schedules[0].inscriptionLimit || inPresenceCount >= minCapacity))
        return next({statusCode: 409, error: true, errormessage: "Course is full."});

    if (!await course.schedules[0].addInscription(course._id, req.body.studentId, req.body.isInPresence))
        return next({statusCode: 409, error: true, errormessage: "Invalid request."});
    course.save().then(() => {
        res.status(200).json({error: false, errormessage: ""});
    }).catch((err) => {
        next({statusCode: 500, error: true, errormessage: err});
    });
});

router.get('/', (req, res, next) => {
    Course.getModel().findOne({
        _id: res.locals.courseId,
        "schedules._id": res.locals.scheduleId,
    }, {
        schedules: {$elemMatch: {_id: res.locals.scheduleId}}
    }).then((course) => {
        if (!course) return next({statusCode: 409, error: true, errormessage: "Course not found."});
        res.status(200).json(course.schedules[0].inscriptions);
    }).catch((err) => {
        next({statusCode: 500, error: true, errormessage: err});
    })
})

router.delete('/:studentId', authorize([Role.Teacher, Role.Admin, Role.Student]), async (req, res, next) => {
    let course = await Course.getModel().findOne({
        _id: res.locals.courseId,
        "schedules._id": res.locals.scheduleId,
    }, {
        schedules: {$elemMatch: {_id: res.locals.scheduleId}}
    });

    if (!course) return next({statusCode: 409, error: true, errormessage: "Course not found."});

    if (req.auth.roles.includes(Role.Student) && req.auth.id !== req.params.studentId)
        return next({
            statusCode: 400,
            error: true,
            errormessage: "You are not authorized to unsubscribe other students."
        });

    if (req.auth.roles.includes(Role.Teacher) && !req.auth.roles.includes(Role.Admin)) {
        if (course.teacherId !== req.auth.id) return next({
            statusCode: 400,
            error: true,
            errormessage: "You are not authorized to unsubscribe students from this course."
        });
    }

    // check that course is not started
    if (course.schedules[0].lessons.find(l => l.date < new Date()))
        return next({statusCode: 401, error: true, errormessage: "Course already started."});

    if (!await course.schedules[0].removeInscription(course._id, req.params.studentId))
        return next({statusCode: 409, error: true, errormessage: "Invalid request."});

    course.save().then(() => {
        res.status(200).json({error: false, errormessage: ""});
    }).catch((err) => {
        next({statusCode: 500, error: true, errormessage: err});
    });
})

module.exports = router;