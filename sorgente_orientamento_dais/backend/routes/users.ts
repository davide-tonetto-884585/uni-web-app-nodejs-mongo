import {sendMails} from "../utils";

const express = require('express');
const router = express.Router();
import passport from "passport";
import jsonwebtoken = require('jsonwebtoken');
import crypto = require('crypto');

import {Role} from "../index";
import * as User from '../models/User';

if (!process.env.JWT_SECRET) {
    console.log("\".env\" file loaded but JWT_SECRET=<secret> key-value pair was not found".red);
    process.exit(-1);
}

const JWT_SECRET: string = process.env.JWT_SECRET;

router.get('/login', passport.authenticate('basic', {session: false}), async (req: any, res: any) => {
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
router.post('/students', async (req: any, res: any, next: any) => {
    if (!req.body.mail || !req.body.password || !req.body.name || !req.body.surname || !req.body.birthdate)
        return next({statusCode: 404, error: true, errormessage: "Missing fields."})

    const count = await User.getModel().count({mail: req.body.mail});
    if (count === 1) return next({statusCode: 409, error: true, errormessage: "Already existing user."})

    const token_salt = crypto.randomBytes(16).toString('hex');
    let hmac = crypto.createHmac('sha512', token_salt);
    const token = hmac.digest('hex');

    let new_user = User.newUser({
        name: req.body.name,
        surname: req.body.surname,
        mail: req.body.mail,
        birthdate: new Date(req.body.birthdate),
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

module.exports = router;