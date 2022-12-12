import {authorize, Role} from "../index";
import * as Course from '../models/Course';

const express = require('express');
const router = express.Router();

router.get('/', authorize([Role.Admin, Role.Teacher]), async (req, res, next) => {
    let course = await Course.getModel().aggregate<Course.Course>([{
        $match: {
            _id: res.locals.courseId,
        },
    }, {
        $lookup: {
            from: "users",
            localField: "schedules.inscriptions.userId",
            foreignField: "_id",
            as: "schedule.inscriptions.user"
        }
    }
    ])[0];
    if (!course) return next({statusCode: 409, error: true, errormessage: "Course not found."})

    console.log(course)

    if (req.auth.roles.includes(Role.Teacher) && course.teacherId !== req.auth.id)
        return next({
            statusCode: 401,
            error: true,
            errormessage: "You are not authorized to view the statistics of a course that does not belong to you."
        })

    return res.status(200).json({error: false, errormessage: ""});
});

module.exports = router;