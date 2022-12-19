import {authorize, Role} from "../index";
import * as Course from '../models/Course';
import * as School from '../models/School';

const express = require('express');
const router = express.Router();

router.get('/', authorize([Role.Admin, Role.Teacher]), async (req, res, next) => {
    let course = await Course.getModel().findOne({
        _id: res.locals.courseId,
    }).populate("schedules.inscriptions.studentId");
    if (!course) return next({statusCode: 409, error: true, errormessage: "Course not found."})

    if (req.auth.roles.includes(Role.Teacher) && course.teacherId != req.auth.id)
        return next({
            statusCode: 401,
            error: true,
            errormessage: "You are not authorized to view the statistics of a course that does not belong to you."
        })

    let maleInscriptionsCount = 0;
    let femaleInscriptionCount = 0;
    let otherInscriptionCount = 0;
    let middleAge = 0;
    let inscriptionCount = 0;
    let lessonsCount = 0;
    let attendanceCount = 0;
    let studentDistribution: { schoolId: string, name: string, value: number }[] = [];
    let studentProvenience: { name: string, value: number }[] = [];
    let inPresenceInscriptionCount = 0;
    let onlineInscriptionCount = 0;
    let dualInscriptionCount = 0;
    let inPresenceLessonsCount = 0;
    let onlineLessonsCount = 0;
    let dualLessonsCount = 0;
    let inPresenceAttendanceCount = 0;
    let onlineAttendanceCount = 0;
    let dualAttendanceCount = 0;
    let schedulesComparison: any[] = [];
    course.schedules.forEach(schedule => {
        maleInscriptionsCount += schedule.inscriptions.filter((inscription: any) => inscription.studentId.gender === 'M').length;
        femaleInscriptionCount += schedule.inscriptions.filter((inscription: any) => inscription.studentId.gender === 'F').length;
        otherInscriptionCount += schedule.inscriptions.filter((inscription: any) => inscription.studentId.gender === null).length;
        middleAge += schedule.inscriptions.reduce((acc: any, inscription: any) => acc + (new Date().getFullYear() - inscription.studentId.birthdate.getFullYear()), 0);
        inscriptionCount += schedule.inscriptions.length;
        lessonsCount += schedule.lessons.length;
        attendanceCount += schedule.lessons.reduce((acc: any, lesson: any) => acc + lesson.attendances.length, 0);
        schedule.inscriptions.forEach(async (inscription: any) => {
            let school = studentDistribution.find((school) => school.schoolId === inscription.studentId.studentData.schoolId);
            if (school) school.value++;
            else {
                studentDistribution.push({
                    schoolId: inscription.studentId.studentData.schoolId,
                    name: '',
                    value: 1
                });
            }
        });
        schedule.inscriptions.forEach((inscription: any) => {
            let student = studentProvenience.find((student: any) => student.name === inscription.studentId.studentData.fieldOfStudy);
            if (student) student.value++;
            else studentProvenience.push({name: inscription.studentId.studentData.fieldOfStudy, value: 1});
        });
        if (schedule.modality === 'In presence') inPresenceInscriptionCount += schedule.inscriptions.length;
        else if (schedule.modality === 'Online') onlineInscriptionCount += schedule.inscriptions.length;
        else dualInscriptionCount += schedule.inscriptions.length;
        if (schedule.modality === 'In presence') inPresenceLessonsCount += schedule.lessons.length;
        else if (schedule.modality === 'Online') onlineLessonsCount += schedule.lessons.length;
        else dualLessonsCount += schedule.lessons.length;
        if (schedule.modality === 'In presence') inPresenceAttendanceCount += schedule.lessons.reduce((acc: any, lesson: any) => acc + lesson.attendances.length, 0);
        else if (schedule.modality === 'Online') onlineAttendanceCount += schedule.lessons.reduce((acc: any, lesson: any) => acc + lesson.attendances.length, 0);
        else dualAttendanceCount += schedule.lessons.reduce((acc: any, lesson: any) => acc + lesson.attendances.length, 0);
        schedulesComparison.push({
            _id: schedule._id,
            modality: schedule.modality,
            inscriptionCount: schedule.inscriptions.length,
            attendanceCount: schedule.lessons.reduce((acc: any, lesson: any) => acc + lesson.attendances.length, 0),
        });
    })

    for (let school of studentDistribution) {
        const s = await School.getModel().findOne({_id: school.schoolId});
        if (!s) return next({statusCode: 409, error: true, errormessage: "School not found."})
        school.name = s.PROVINCIA;
    }

    return res.status(200).json({
        error: false, errormessage: "",
        maleInscriptionsCount: maleInscriptionsCount,
        femaleInscriptionCount: femaleInscriptionCount,
        otherInscriptionCount: otherInscriptionCount,
        middleAge: middleAge / inscriptionCount,
        inscriptionCount: inscriptionCount,
        lessonsCount: lessonsCount,
        attendanceCount: attendanceCount,
        studentDistribution: studentDistribution,
        studentProvenience: studentProvenience,
        inPresenceInscriptionCount: inPresenceInscriptionCount,
        onlineInscriptionCount: onlineInscriptionCount,
        dualInscriptionCount: dualInscriptionCount,
        inPresenceLessonsCount: inPresenceLessonsCount,
        onlineLessonsCount: onlineLessonsCount,
        dualLessonsCount: dualLessonsCount,
        inPresenceAttendanceCount: inPresenceAttendanceCount,
        onlineAttendanceCount: onlineAttendanceCount,
        dualAttendanceCount: dualAttendanceCount,
        schedulesComparison: schedulesComparison
    });
});

module.exports = router;