import {authorize, Role} from "../index";
import * as Course from '../models/Course';

const express = require('express');
const router = express.Router();

router.get('/lessons', async (req, res, next) => {
    let course = await Course.getModel().findOne({
        _id: res.locals.courseId,
        "schedules._id": req.params.scheduleId,
    }, {
        schedules: {$elemMatch: {_id: req.params.scheduleId}}
    });
})

module.exports = router;