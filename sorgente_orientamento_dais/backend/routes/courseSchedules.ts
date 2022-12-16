import {authorize, Role, upload} from "../index";
import * as Course from '../models/Course';

const express = require('express');
const router = express.Router();

// add schedule to course
router.post('/', upload.array(), authorize([Role.Admin, Role.Teacher]), async (req, res, next) => {
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
        return res.status(200).json({error: false, errormessage: ""})
    }).catch(err => {
        return next({statusCode: 500, error: true, errormessage: "Cannot add course schedule: " + err});
    })
});

// modify course schedule
router.put('/:scheduleId', upload.array(), authorize([Role.Admin, Role.Teacher]), async (req, res, next) => {
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
    if (req.query.modality) filter.modality = req.query.modality;
    if (req.query.current && req.query.current === 'true')
        filter.lessons = {
            $elemMatch: {
                date: {
                    $gte: new Date()
                }
            }
        };

    if (Object.keys(filter).length !== 0)
        filter = {
            schedules: {
                $elemMatch: {
                    ...filter
                }
            }
        }
    else filter = undefined;

    let course = await Course.getModel().findOne({
        _id: res.locals.courseId
    }, filter);

    if (!course) return next({statusCode: 409, error: true, errormessage: "Course not found."})

    return res.status(200).json(course.schedules);
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

// TODO: add route get certificate

module.exports = router;