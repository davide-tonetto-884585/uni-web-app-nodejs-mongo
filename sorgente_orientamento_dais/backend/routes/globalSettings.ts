import {authorize, Role, upload} from "../index";
const fs = require('fs');
const ini = require('ini');

const express = require('express');
const router = express.Router();

router.get('/', authorize([Role.Admin]), async (req, res, next) => {
    let config = ini.parse(fs.readFileSync('./globalSettings.ini', 'utf-8'));

    return res.status(200).json({error: false, errormessage: "", settings: config.SETTINGS});
});

router.put('/', upload.array(), authorize([Role.Admin]), async (req, res, next) => {
    let config = ini.parse(fs.readFileSync('./globalSettings.ini', 'utf-8'));

    if (req.body.minimumAttendancePercentage)
        config.SETTINGS.minimumAttendancePercentage = req.body.minimumAttendancePercentage;

    if (req.body.studentInscriptionsLimit)
        config.SETTINGS.studentInscriptionsLimit = req.body.studentInscriptionsLimit;

    if (req.body.teacherCoursesLimit)
        config.SETTINGS.teacherCoursesLimit = req.body.teacherCoursesLimit;

    fs.writeFileSync('./globalSettings.ini', ini.stringify(config));

    return res.status(200).json({error: false, errormessage: ""});
});

module.exports = router;