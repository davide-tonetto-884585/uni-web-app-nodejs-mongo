import {authorize, Role} from "../index";
import * as Course from '../models/Course';

const express = require('express');
const router = express.Router();

// add schedule to course
router.post('/', authorize([Role.Admin, Role.Teacher]), async (req, res, next) => {
    let course = await Course.getModel().findOne({_id: res.locals.courseId});
    if (!course) return next({statusCode: 409, error: true, errormessage: "Course not found."})

    if (!req.auth.roles.includes(Role.Admin) && course.teacherId !== req.auth.id)
        return next({
            statusCode: 401,
            error: true,
            errormessage: "You are not authorized to schedule a course that does not belong to you."
        })

    if (!req.body.modality || !req.body.certificatePassword)
        return next({statusCode: 404, error: true, errormessage: "Missing fields."})

    course.addSchedule(req.body.modality, req.body.inscriptionLimit, req.body.certificatePassword);
    course.save().then((r) => {
        return res.status(200).json({error: false, errormessage: ""})
    }).catch(err => {
        return next({statusCode: 500, error: true, errormessage: "Cannot add course schedule: " + err});
    })
});

router.put('/:scheduleId', authorize([Role.Admin, Role.Teacher]), async (req, res, next) => {
    let course = await Course.getModel().findOne({_id: req.params.id});
    if (!course) return next({statusCode: 409, error: true, errormessage: "Course not found."})

    if (!req.auth.roles.includes(Role.Admin) && course.teacherId !== req.auth.id)
        return next({
            statusCode: 401,
            error: true,
            errormessage: "You are not authorized to schedule a course that does not belong to you."
        })

    // find and modify course schedule
})

module.exports = router;