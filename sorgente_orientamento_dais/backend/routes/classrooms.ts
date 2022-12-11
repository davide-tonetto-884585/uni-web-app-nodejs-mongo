import * as Classroom from "../models/Classroom";
import {authorize, Role} from "../index";

const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
    let filter = Object();
    if (req.body.name) filter.name = {$regex: '.*' + req.body.name + '.*'};
    if (req.body.building) filter.building = {$regex: '.*' + req.body.building + '.*'};
    if (req.body.campus) filter.campus = {$regex: '.*' + req.body.campus + '.*'};

    Classroom.getModel().find(filter).then((classrooms) => {
        return res.status(200).json(classrooms);
    }).catch((err) => {
        return next({statusCode: 500, error: true, errormessage: "Error in finding classrooms: " + err});
    });
});

router.post('/', authorize([Role.Admin]), (req, res, next) => {
    if (!req.body.name || !req.body.building || !req.body.campus || !req.body.capacity) {
        return next({statusCode: 400, error: true, errormessage: "Missing parameters"});
    }

    const newClassroom = Classroom.newClassroom({
        name: req.body.name,
        building: req.body.building,
        campus: req.body.campus,
        capacity: req.body.capacity
    })

    newClassroom.save().then((classroom) => {
        return res.status(200).json(classroom);
    }).catch((err) => {
        return next({statusCode: 500, error: true, errormessage: "Error in saving classroom: " + err});
    });
});

router.get('/:id', (req, res, next) => {
    Classroom.getModel().findOne({
        _id: req.params.id
    }).then((classroom) => {
        res.status(200).json(classroom);
    }).catch((err) => {
        return next({statusCode: 500, error: true, errormessage: "Error in finding classroom: " + err});
    })
});

module.exports = router;