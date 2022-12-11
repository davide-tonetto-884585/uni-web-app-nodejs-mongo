import * as Course from "../models/Course";
import {authorize, Role} from "../index";

const express = require('express');
const router = express.Router();

router.get('/', async (req, res, next) => {
    let filter = Object();
    if (req.body.text) filter.text = {$regex: '.*' + req.body.text + '.*'};
    if (req.body.isClosed) filter.isClosed = req.body.isClosed;

    let slice = Object();
    if (req.body.skip && req.body.limit) slice.$slice = [req.body.skip, req.body.skip + req.body.limit];

    let course = await Course.getModel().findOne({
        _id: res.locals.courseId,
    }, {
        questions: {
            $elemMatch: {
                ...filter
            },
            ...slice
        }
    });

    if (!course) return next({statusCode: 409, error: true, errormessage: "Course not found."});

    if (req.body.orderBy === 'like')
        course.questions.sort((a, b) => b.likes.length - a.likes.length);
    else
        course.questions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return res.status(200).json(course.questions);
})

router.get('/:id/answers', async (req, res, next) => {
    let course = await Course.getModel().findOne({
        _id: res.locals.courseId,
    }, {
        questions: {
            $elemMatch: {
                _id: req.params.id
            }
        }
    });

    if (!course) return next({statusCode: 409, error: true, errormessage: "Course not found."});

    let question = course.questions[0];
    if (!question) return next({statusCode: 409, error: true, errormessage: "Question not found."});

    return res.status(200).json(question.answers.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
});

router.post('/', authorize([Role.Admin, Role.Teacher, Role.Student]), async (req, res, next) => {
    const text = req.body.text;
    if (!text) return next({statusCode: 400, error: true, errormessage: "Text is required."});

    let course = await Course.getModel().findOne({
        _id: res.locals.courseId,
    });
    if (!course) return next({statusCode: 409, error: true, errormessage: "Course not found."});

    if (req.auth.roles.includes(Role.Teacher) && course.teacherId !== req.auth.id)
        return next({statusCode: 401, error: true, errormessage: "You are not authorized to post a question in a course that does not belong to you."});

    course.addQuestion(req.auth.id, text);
    course.save().then(() => {
        return res.status(200).json({error: false, errormessage: ""});
    }).catch((err) => {
        return next({statusCode: 500, error: true, errormessage: err});
    });
});

router.post('/:id/answers', authorize([Role.Admin, Role.Teacher, Role.Student]), async (req, res, next) => {
    const text = req.body.text;
    if (!text) return next({statusCode: 400, error: true, errormessage: "Text is required."});

    let course = await Course.getModel().findOne({
        _id: res.locals.courseId,
    }, {
        questions: {
            $elemMatch: {
                _id: req.params.id
            }
        }
    });
    if (!course || !course.questions[0]) return next({statusCode: 409, error: true, errormessage: "Course not found."});

    if (req.auth.roles.includes(Role.Student) && course.questions[0].userId !== req.auth.id)
        return next({statusCode: 401, error: true, errormessage: "You are not authorized to post an answer to a question that does not belong to you."});

    if (course.questions[0].isClosed)
        return next({statusCode: 409, error: true, errormessage: "Question is closed."});

    course.questions[0].addAnswer(req.auth.id, text);
    course.save().then(() => {
        return res.status(200).json({error: false, errormessage: ""});
    }).catch((err) => {
        return next({statusCode: 500, error: true, errormessage: err});
    });
});

router.get('/:id/likes', async (req, res, next) => {
    let course = await Course.getModel().findOne({
        _id: res.locals.courseId,
    }, {
        questions: {
            $elemMatch: {
                _id: req.params.id
            }
        }
    });

    if (!course) return next({statusCode: 409, error: true, errormessage: "Course not found."});

    let question = course.questions[0];
    if (!question) return next({statusCode: 409, error: true, errormessage: "Question not found."});

    return res.status(200).json(question.likes);
});

router.post('/:id/likes', authorize([Role.Admin, Role.Teacher, Role.Student]), async (req, res, next) => {
    let course = await Course.getModel().findOne({
        _id: res.locals.courseId,
    }, {
        questions: {
            $elemMatch: {
                _id: req.params.id
            }
        }
    });
    if (!course || !course.questions[0]) return next({statusCode: 409, error: true, errormessage: "Course not found."});

    if (!course.questions[0].addLike(req.auth.id))
        return next({statusCode: 409, error: true, errormessage: "You already liked this question."});

    course.save().then(() => {
        return res.status(200).json({error: false, errormessage: ""});
    }).catch((err) => {
        return next({statusCode: 500, error: true, errormessage: err});
    });
});

router.delete('/:id/likes', authorize([Role.Admin, Role.Teacher, Role.Student]), async (req, res, next) => {
    let course = await Course.getModel().findOne({
        _id: res.locals.courseId,
    }, {
        questions: {
            $elemMatch: {
                _id: req.params.id
            }
        }
    });
    if (!course || !course.questions[0]) return next({statusCode: 409, error: true, errormessage: "Course not found."});

    if (!course.questions[0].removeLike(req.auth.id))
        return next({statusCode: 409, error: true, errormessage: "You did not like this question."});

    course.save().then(() => {
        return res.status(200).json({error: false, errormessage: ""});
    }).catch((err) => {
        return next({statusCode: 500, error: true, errormessage: err});
    });
});

module.exports = router;