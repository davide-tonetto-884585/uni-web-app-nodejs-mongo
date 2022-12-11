import * as mongoose from "mongoose";
import * as Lesson from './Lesson';
import * as User from './User';

const courseScheduleSchema = new mongoose.Schema({
    modality: {
        type: mongoose.SchemaTypes.String,
        enum: {values: ['In presence', 'Online', 'Dual'], message: '{VALUE} is not supported'},
        required: true
    },
    inscriptionLimit: {
        type: mongoose.SchemaTypes.Number,
        required: false,
        min: [5, 'Too few students']
    },
    certificatePassword: {
        type: mongoose.SchemaTypes.String,
        required: true,
        minLength: 5
    },
    inscriptions: [{
        studentId: {
            type: mongoose.SchemaTypes.ObjectId,
            required: true,
            ref: 'User'
        },
        isInPresence: {
            type: mongoose.SchemaTypes.Boolean,
            required: true,
            default: true
        }
    }],
    lessons: [Lesson.getSchema()]
});

courseScheduleSchema.methods.addLesson = function (date, startTime, endTime, virtualRoomLink, virtualRoomPasscode, presencePasscode, classroomId): boolean {
    if ((this.modality === 'In presence' || this.modality === 'Dual') && (!virtualRoomLink || !virtualRoomPasscode || !classroomId))
        return false;

    if (startTime > endTime) return false;

    this.lessons.push({
        date: date,
        startTime: startTime,
        endTime: endTime,
        virtualRoomLink: virtualRoomLink,
        virtualRoomPasscode: virtualRoomPasscode,
        presencePasscode: presencePasscode,
        classroomId: classroomId
    });

    return true;
}

courseScheduleSchema.methods.addInscription = async function (courseId, studentId, isInPresence): Promise<boolean> {
    let student = await User.getModel().findOne({_id: studentId});
    if (student && student.hasStudentRole()) {
        student.studentData.inscriptions.push({
            courseId: courseId,
            courseScheduleId: this._id,
        })

        let res = true
        student.save().catch(err => {
            res = false
        });

        if (!res) return false;
    } else return false

    this.inscriptions.push({
        userId: studentId,
        isInPresence: isInPresence
    });

    return true;
}

courseScheduleSchema.methods.removeInscription = async function (courseId, studentId): Promise<boolean> {
    const index = this.inscriptions.findIndex(inscription => inscription.studentId === studentId);
    if (index === -1) return false;

    let student = await User.getModel().findOne({_id: studentId});
    if (student && student.hasStudentRole()) {
        const index_2 = student.studentData.inscriptions.findIndex(inscription => inscription.courseId === courseId && inscription.courseScheduleId === this._id);
        if (index_2 === -1) return false;

        this.inscriptions.splice(index_2, 1);
        let res = true
        student.save().catch(err => {
            res = false
        });

        if (!res) return false;
    } else return false;

    this.inscriptions.splice(index, 1);
    return true;
}

export function getSchema() {
    return courseScheduleSchema;
}