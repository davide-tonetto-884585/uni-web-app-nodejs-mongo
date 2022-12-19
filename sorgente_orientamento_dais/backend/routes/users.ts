import {sendMails} from "../utils";
import passport from "passport";

import {authorize, imageUpload, Role} from "../index";
import * as User from '../models/User';
import * as Course from '../models/Course';

const express = require('express');
const router = express.Router();
import jsonwebtoken = require('jsonwebtoken');
import crypto = require('crypto');

if (!process.env.JWT_SECRET) {
    console.log("\".env\" file loaded but JWT_SECRET=<secret> key-value pair was not found".red);
    process.exit(-1);
}

const JWT_SECRET: string = process.env.JWT_SECRET;

router.get('/login', passport.authenticate('basic', {session: false}), async (req, res) => {
    const roles: Role[] = Array();

    let tokenData: any = {
        id: req.user.id,
        mail: req.user.mail,
        name: req.user.name,
        surname: req.user.surname,
        birthdate: req.user.birthdate,
    };

    if (req.user.studentData) {
        tokenData.schoolId = req.user.studentData.schoolId;
        tokenData.fieldOfStudy = req.user.studentData.fieldOfStudy;
        roles.push(Role.Student);
    }

    if (req.user.teacherData) {
        tokenData.description = req.user.teacherData.description;
        tokenData.profilePicture = req.user.teacherData.profilePicture;
        tokenData.teacherPageLink = req.user.teacherData.teacherPageLink;
        roles.push(Role.Teacher);

        if (req.user.teacherData.isAdmin) roles.push(Role.Admin);
    }

    tokenData.roles = roles;

    console.log("Login granted. Generating token...".green);
    let token_signed: string;
    token_signed = jsonwebtoken.sign(tokenData, JWT_SECRET, {expiresIn: '4h'});

    return res.status(200).json({error: false, errormessage: "", token: token_signed});
});

// add new student
router.post('/students', imageUpload.array(), async (req, res, next) => {
    if (!req.body.mail || !req.body.password || !req.body.name || !req.body.surname || !req.body.birthdate)
        return next({statusCode: 404, error: true, errormessage: "Missing fields."})

    const count = await User.getModel().count({mail: req.body.mail});
    if (count === 1) return next({statusCode: 409, error: true, errormessage: "Already existing user."})

    const token_salt = crypto.randomBytes(16).toString('hex');
    let hmac = crypto.createHmac('sha512', token_salt);
    const token = hmac.digest('hex');

    const dateParts = req.body.birthdate.split("/");
    const dateObject = new Date(+dateParts[2], dateParts[1] - 1, +dateParts[0]);

    let new_user = User.newUser({
        name: req.body.name,
        surname: req.body.surname,
        mail: req.body.mail,
        birthdate: dateObject,
        gender: req.body.gender,
        verifyToken: token,
    });

    new_user.setPassword(req.body.password);
    new_user.save().then(async (user) => {
        try {
            await sendMails(
                process.env.MAIL ?? 'pigeonline.project@gmail.com',
                [user.mail],
                'Confirm your email for PCTO DAIS',
                `<h3>Benvenuto ${user.name} ${user.surname}!</h3>
                            <p>
                                To verify your email please press this button: 
                                <a href="${req.body.frontend_activation_link}/studente/${new_user.verifyToken}/${user._id}">Confirm your email</a>
                            </p>`
            )
        } catch (err) {
            console.log('Cannot send verification mail: '.yellow + err);
            await User.getModel().deleteOne({_id: user._id})
            throw Error('Cannot send verification mail')
        }

        return user;
    }).then((user) => {
        return res.status(200).json({error: false, errormessage: '', token: token, id: user._id});
    }).catch((err) => {
        console.log("Cannot insert student: ".red + err);
        return next({statusCode: 500, error: true, errormessage: "Internal server error, please try again later."});
    });
});

// complete student registration
router.post('/students/:id', imageUpload.array(), async (req, res, next) => {
    if (!req.body.verifyToken || !req.body.fieldOfStudy || !req.body.schoolId)
        return next({statusCode: 404, error: true, errormessage: "Missing fields."});

    let user = await User.getModel().findOne({_id: req.params.id});

    if (user?.verified === true) {
        return next({statusCode: 409, error: true, errormessage: "Already activated."});
    }

    if (user) {
        if (user.verifyToken === req.body.verifyToken) {
            user.studentData = {
                schoolId: req.body.schoolId,
                fieldOfStudy: req.body.fieldOfStudy,
                inscriptions: [],
            };
            user.verified = true;
            user.verifyToken = "";
            user.save().then((user) => {
                return res.status(200).json({error: false, errormessage: ''})
            }).catch((err) => {
                console.log("Cannot complete student registration: ".red + err);
                return next({
                    statusCode: 500,
                    error: true,
                    errormessage: "Internal server error, please try again later."
                });
            });
        } else return next({statusCode: 400, error: true, errormessage: "Token not valid."})
    } else return next({statusCode: 400, error: true, errormessage: "Cannot complete user creation."})
});

// add new teacher (only admin can use this route)
router.post('/teachers', imageUpload.array(), authorize([Role.Admin]), async (req, res, next) => {
    if (!req.body.mail || !req.body.name || !req.body.surname || !req.body.birthdate)
        return next({statusCode: 404, error: true, errormessage: "Missing fields."})

    const count = await User.getModel().count({mail: req.body.mail});
    if (count === 1) return next({statusCode: 409, error: true, errormessage: "Already existing user."})

    const token_salt = crypto.randomBytes(16).toString('hex');
    let hmac = crypto.createHmac('sha512', token_salt);
    const token = hmac.digest('hex');

    const dateParts = req.body.birthdate.split("/");
    const dateObject = new Date(+dateParts[2], dateParts[1] - 1, +dateParts[0]);

    let gender = Object();
    if (req.body.gender !== 'null')
        gender.gender = req.body.gender;

    let new_teacher = User.newUser({
        name: req.body.name,
        surname: req.body.surname,
        mail: req.body.mail,
        birthdate: dateObject,
        ...gender,
        verifyToken: token,
        teacherData: {
            isAdmin: false
        }
    });

    new_teacher.save().then(async (user) => {
        try {
            await sendMails(
                process.env.MAIL ?? 'pigeonline.project@gmail.com',
                [user.mail],
                'Confirm your email for PCTO DAIS',
                `<h3>Benvenuto ${user.name} ${user.surname}!</h3>
                            <p>
                                To verify your email please press this button: 
                                <a href="${req.body.frontend_activation_link}/docente/${new_teacher.verifyToken}/${user._id}">Confirm your email</a>
                            </p>`
            )
        } catch (err) {
            console.log('Cannot send verification mail: '.yellow + err);
            await User.getModel().deleteOne({_id: user._id})
            throw Error('Cannot send verification mail')
        }

        return user;
    }).then((user) => {
        return res.status(200).json({error: false, errormessage: '', token: token, id: user._id});
    }).catch((err) => {
        console.log("Cannot insert student: ".red + err);
        return next({statusCode: 500, error: true, errormessage: "Internal server error, please try again later."});
    });
});

// complete teacher registration
router.post('/teachers/:id', imageUpload.array("profilePicture"), async (req, res, next) => {
    if (!req.body.verifyToken || !req.body.password)
        return next({statusCode: 404, error: true, errormessage: "Missing fields."})

    let user = await User.getModel().findOne({_id: req.params.id});

    if (user?.verified === true) {
        return next({statusCode: 409, error: true, errormessage: "Already activated."});
    }

    if (user && user.teacherData) {
        if (user.verifyToken === req.body.verifyToken) {
            user.teacherData.description = req.body.description;
            user.teacherData.teacherPageLink = req.body.teacherPageLink;
            if (req.files[0].path)
                user.teacherData.profilePicture = req.files[0].path;

            user.setPassword(req.body.password);

            user.verified = true;
            user.verifyToken = "";
            user.save().then((user) => {
                return res.status(200).json({error: false, errormessage: ''})
            }).catch((err) => {
                console.log("Cannot complete teacher registration: ".red + err);
                return next({
                    statusCode: 500,
                    error: true,
                    errormessage: "Internal server error, please try again later."
                });
            });
        } else return next({statusCode: 400, error: true, errormessage: "Token not valid."})
    } else return next({statusCode: 400, error: true, errormessage: "Cannot complete user creation."})
});

router.get('/students/:id', authorize(), async (req, res, next) => {
    if (req.auth.roles.includes(Role.Student) && req.auth.id != req.params.id)
        return next({statusCode: 401, error: true, errormessage: "Permission denied."})

    const user = await User.getModel().findOne({_id: req.params.id});
    if (user) {
        const data = user?.studentData;
        return res.status(200).json({
            name: user.name,
            surname: user.surname,
            fieldOfStudy: data.fieldOfStudy,
            schoolId: data.schoolId,
            _id: user._id
        });
    } else
        return next({statusCode: 404, error: true, errormessage: "Student not found."})
});

router.get('/teachers/:id', async (req, res, next) => {
    const teacher = await User.getModel().findOne({_id: req.params.id});
    if (teacher) {
        const data = teacher.teacherData;
        return res.status(200).json({
            name: teacher.name,
            surname: teacher.surname,
            description: data.description,
            profilePicture: data.profilePicture,
            teacherPageLink: data.teacherPageLink,
            _id: teacher._id
        });
    } else
        return next({statusCode: 404, error: true, errormessage: "Teacher not found."})
})

// get basic information about user
router.get('/:id', async (req, res, next) => {
    let user = await User.getModel().findOne({_id: req.params.id});
    if (user)
        return res.status(200).json({
            name: user.name,
            surname: user.surname,
            birthdate: user.birthdate,
            gender: user.gender,
        });
    else
        return next({statusCode: 404, error: true, errormessage: "User not found."})
});

// update student information
router.put('/students/:id', imageUpload.array(), authorize([Role.Admin, Role.Student]), async (req, res, next) => {
    if (req.auth.roles.includes(Role.Student) && req.auth.id != req.params.id)
        return next({statusCode: 401, error: true, errormessage: "Permission denied."})

    let user = await User.getModel().findOne({_id: req.params.id});
    if (!user) return next({statusCode: 404, error: true, errormessage: "Student not found."});

    if (req.body.name)
        user.name = req.body.name;
    if (req.body.surname)
        user.surname = req.body.surname;
    if (req.body.fieldOfStudy)
        user.studentData.fieldOfStudy = req.body.fieldOfStudy;
    if (req.body.schoolId)
        user.studentData.schoolId = req.body.schoolId;

    user.save().then((user) => {
        return res.status(200).json({error: false, errormessage: ''});
    }).catch((err) => {
        console.log('Student update failed: ' + err);
        return next({statusCode: 500, error: true, errormessage: 'Cannot update student information'});
    });
});

router.put('/teachers/:id',
    authorize([Role.Admin, Role.Teacher]),
    imageUpload.array("profilePicture"),
    async (req, res, next) => {
        if (req.auth.roles.includes(Role.Teacher) && req.auth.id != req.params.id)
            return next({statusCode: 401, error: true, errormessage: "Permission denied."})

        let user = await User.getModel().findOne({_id: req.params.id});
        if (!user) return next({statusCode: 404, error: true, errormessage: "Teacher not found."});

        if (req.body.name)
            user.name = req.body.name;
        if (req.body.surname)
            user.surname = req.body.surname;
        if (req.body.description)
            user.teacherData.description = req.body.description;
        if (req.body.teacherPageLink)
            user.teacherData.teacherPageLink = req.body.teacherPageLink;

        if (req.files[0].path)
            user.teacherData.profilePicture = req.files[0].path;

        user.save().then((user) => {
            return res.status(200).json({error: false, errormessage: ''});
        }).catch((err) => {
            console.log('Teacher update failed: ' + err);
            return next({statusCode: 500, error: true, errormessage: 'Cannot update teacher information'});
        });
    });

router.get('/students/:id/inscriptions', authorize([Role.Admin, Role.Teacher, Role.Student]), async (req, res, next) => {
    if (req.auth.roles.includes(Role.Student) && req.auth.id != req.params.id)
        return next({statusCode: 401, error: true, errormessage: "Permission denied."})

    let user = await User.getModel().findOne({_id: req.params.id});
    if (!user) return next({statusCode: 404, error: true, errormessage: "Student not found."});

    return res.status(200).json(user.studentData.inscriptions);
});

router.get('/teachers/:id/courses', (req, res, next) => {
    Course.getModel().find({teacherId: req.params.id}).then((courses) => {
        return res.status(200).json(courses);
    }).catch((err) => {
        return next({statusCode: 500, error: true, errormessage: 'Cannot get teacher courses: ' + err});
    });
})

module.exports = router;