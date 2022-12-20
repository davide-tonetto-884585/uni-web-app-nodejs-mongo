import express = require('express');
import bodyParser = require('body-parser');
import cors = require('cors');
import http = require('http');

import colors = require('colors');
import passportHTTP = require('passport-http');
import {expressjwt as jwt} from "express-jwt";
import passport from "passport";
import * as mongoose from "mongoose";
import * as User from './models/User';

const multer = require("multer");

// enable colors for console
colors.enabled = true;

// enable multer for file uploads
const imageStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.fieldname === 'certificateFile') {
            cb(null, './certificates')
        } else {
            cb(null, './uploads')
        }
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
});

export let imageUpload = multer({storage: imageStorage})

// check JWT_SECRET
const dotenv = require('dotenv').config();

if (dotenv.error) {
    console.log("Unable to load \".env\" file. Please provide one to store the JWT secret key".red);
    process.exit(-1);
}
if (!process.env.JWT_SECRET) {
    console.log("\".env\" file loaded but JWT_SECRET=<secret> key-value pair was not found".red);
    process.exit(-1);
}

const JWT_SECRET: string = process.env.JWT_SECRET;

// passport strategy for authentication
passport.use(new passportHTTP.BasicStrategy(
    function (mail, password, done) {
        console.log("New login attempt from ".yellow + mail);

        User.getModel().findOne({
            mail: mail
        }).then((user) => {
            if (!user) return done({statusCode: 401, error: true, errormessage: 'Invalid user'});

            if (!user.verified)
                return done({
                    statusCode: 401,
                    error: true,
                    errormessage: 'You must confirm the mail in order to login.'
                });

            if (user.validatePassword(password))
                return done(null, user);
            else
                return done({statusCode: 401, error: true, errormessage: 'Invalid user'});
        }).catch((err) => {
            if (err) {
                return done({statusCode: 500, error: true, errormessage: err});
            }
        })
    }
));

// enum for user roles
export enum Role {
    Admin = 'admin',
    Teacher = 'teacher',
    Student = 'student',
}

// middleware used to request authentication on routes and, if roles is passed also request a specific role
export function authorize(roles: Role[] = []) {
    return [
        // authenticate JWT token and attach user to request object (req.auth)
        jwt({secret: JWT_SECRET, algorithms: ['HS256']}),

        // authorize based on user role
        (req: any, res: any, next: any) => {
            if (roles.length && !roles.includes(req.auth.roles)) {
                let find = false;
                // check if the user has an allowed role
                req.auth.roles.forEach((role: Role) => {
                    if (roles.includes(role)) find = true;
                })

                // authentication failed, missing role
                if (!find) return res.status(401).json({error: true, errormessage: 'Unhautorized'});
            }

            // authentication and authorization successful
            next();
        }
    ];
}

const app = express();

app.use(cors());
// enable bodyparser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}))

// static folder definition
app.use('/uploads', express.static('uploads'));

// custom debugging middleware that run for every request
app.use((req, res, next) => {
    console.log("------------------------------------------------".inverse)
    console.log("New request for: " + req.url);
    console.log("Method: " + req.method);
    console.log("Time: " + new Date().toLocaleString());
    next();
});

// Add API routes to express application
app.get("/", (req, res) => {
    res.status(200).json({api_version: "1.0", endpoints: ["/login"]});
});

// include all routes
const usersRoutes = require('./routes/users');
const schoolsRoutes = require('./routes/schools');
const coursesRoutes = require('./routes/courses');
const courseSchedulesRoutes = require('./routes/courseSchedules');
const lessonsRoutes = require('./routes/lessons');
const inscriptionsRoutes = require('./routes/inscriptions');
const classroomsRoutes = require('./routes/classrooms');
const questionsRoutes = require('./routes/questions');
const attendancesRoutes = require('./routes/attendances');
const statisticsRoutes = require('./routes/statistics');
const globalSettingsRoutes = require('./routes/globalSettings');

app.use("/users", usersRoutes);
app.use("/schools", schoolsRoutes);
app.use("/courses", coursesRoutes);
app.use("/courses/:id/courseSchedules", (req, res, next) => {
    res.locals.courseId = req.params.id;
    next();
}, courseSchedulesRoutes);
app.use("/courses/:id/courseSchedules/:scheduleId/lessons", (req, res, next) => {
    res.locals.courseId = req.params.id;
    res.locals.scheduleId = req.params.scheduleId;
    next();
}, lessonsRoutes);
app.use("/courses/:id/courseSchedules/:scheduleId/inscriptions", (req, res, next) => {
    res.locals.courseId = req.params.id;
    res.locals.scheduleId = req.params.scheduleId;
    next();
}, inscriptionsRoutes);
app.use("/classrooms", classroomsRoutes);
app.use("/courses/:id/questions", (req, res, next) => {
    res.locals.courseId = req.params.id;
    next();
}, questionsRoutes);
app.use("/courses/:id/courseSchedules/:scheduleId/lessons/:lessonId/attendances", (req, res, next) => {
    res.locals.courseId = req.params.id;
    res.locals.scheduleId = req.params.scheduleId;
    res.locals.lessonId = req.params.lessonId;
    next();
}, attendancesRoutes);
app.use("/courses/:id/statistics", (req, res, next) => {
    res.locals.courseId = req.params.id;
    next();
}, statisticsRoutes);
app.use("/globalSettings", globalSettingsRoutes);

// Add error handling middleware
app.use(function (err: any, req: any, res: any, next: any) {
    if (typeof err === 'object')
        console.log("Request error: ".red + (JSON.stringify(err) == '{}' ? err : JSON.stringify(err)))
    else
        console.log("Request error: ".red + err);

    res.status(err.statusCode || 500).json(err);
});

// The very last middleware will report an error 404
// (will be eventually reached if no error occurred and if the requested endpoint is not matched by any route)
app.use((req, res, next) => {
    console.log("Invalid endpoint: ".red + req.url);
    res.status(404).json({statusCode: 404, error: true, errormessage: "Invalid endpoint"});
});

// Connect to mongodb and launch the HTTP server trough Express
mongoose.connect('mongodb://localhost:27017/PCTO_DAIS')
    .then(() => {
        console.log("Connected to MongoDB".green);
        return User.getModel().findOne({mail: "admin@PCTODAIS.it"});
    }).then((doc) => {
    if (!doc) {
        console.log("Creating admin user".yellow);

        let u = User.newUser({
            name: "admin",
            surname: "admin",
            mail: "admin@PCTODAIS.it",
            birthdate: new Date(),
            verified: true,
            teacherData: {
                description: "Admin of the site"
            }
        });
        u.setAdmin();
        u.setPassword("admin");

        return u.save()
    } else {
        console.log("Admin user already exists".green);
    }
}).then(() => {
    let server = http.createServer(app);
    // socket server
    /* ios = io(server);
    ios.on('connection', function (client) {
        console.log("Socket.io client connected".green);
    }); */

    server.listen(5000, () => console.log("HTTP Server started on port 5000".green));
}).catch((err) => {
    console.log("Error Occurred during initialization".red);
    console.log(err);
})