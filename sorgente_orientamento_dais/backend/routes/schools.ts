const express = require('express');
const router = express.Router();

import * as School from '../models/School';

router.get('/', (req, res, next) => {
    const _id = req.query.id;
    const name = req.query.name;
    const skip = req.query.skip;
    const limit = req.query.limit;

    let filter = Object();
    if (_id) filter._id = _id;
    if (name) filter.DENOMINAZIONESCUOLA = {$regex: '.*' + name + '.*'};

    let query = School.getModel().find(filter);
    if (skip) query.skip(skip);
    if (limit) query.limit(limit);

    query.then((schools) => {
        return res.status(200).json(schools);
    }).catch((err) => {
        return next({statusCode: 500, error: true, errormessage: "Error in finding schools: " + err});
    })
});

module.exports = router;