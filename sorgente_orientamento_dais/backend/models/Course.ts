import mongoose = require('mongoose');
import * as CourseSchedule from './CourseSchedule';
import * as Question from './Question';

export interface Course extends mongoose.Document {
    readonly _id: mongoose.Schema.Types.ObjectId,
    title: string,
    description: string,
    language: string,
    image: string,
    certificateFile: string,
    enabled: boolean,
    teacherId: mongoose.Schema.Types.ObjectId,
    schedules: [{
        readonly _id: mongoose.Schema.Types.ObjectId,
        modality: string,
        inscriptionLimit: number,
        certificatePassword: string,
        inscriptions: [{
            readonly _id: mongoose.Schema.Types.ObjectId,
            studentId: mongoose.Schema.Types.ObjectId,
            isInPresence: boolean
        }],
        lessons: [{
            readonly _id: mongoose.Schema.Types.ObjectId,
            date: Date,
            startTime: string,
            endTime: string,
            virtualRoomLink: string,
            virtualRoomPasscode: string,
            presencePasscode: string,
            classroomId: mongoose.Schema.Types.ObjectId,
            attendance: [{
                studentId: mongoose.Schema.Types.ObjectId
            }],
            addAttendance: (studentId) => void
        }],
        addLesson: (date, startTime, endTime, virtualRoomLink, virtualRoomPasscode, presencePasscode, classroomId) => boolean,
        addInscription: (userId, isInPresence) => boolean
    }],
    questions: [{
        readonly _id: mongoose.Schema.Types.ObjectId,
        userId: mongoose.Schema.Types.ObjectId,
        text: string,
        closed: boolean,
        timestamp: Date,
        answers: [{
            readonly _id: mongoose.Schema.Types.ObjectId,
            userId: mongoose.Schema.Types.ObjectId,
            text: string,
            timestamp: Date
        }],
        addAnswer: (userId, text) => boolean
    }],
    addSchedule: (modality, inscriptionLimit, certificatePassword) => void;
    addQuestion: (userId, text) => void;
}

const courseSchema = new mongoose.Schema({
    title: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    description: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    language: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    image: {
        type: mongoose.SchemaTypes.String,
        required: false
    },
    certificateFile: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    enabled: {
        type: mongoose.SchemaTypes.Boolean,
        required: true,
        default: true
    },
    teacherId: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true,
        ref: 'User'
    },
    schedules: [CourseSchedule.getSchema()],
    questions: [Question.getSchema()]
});

courseSchema.methods.addSchedule = function(modality, inscriptionLimit, certificatePassword): void {
    this.schedules.push({
        modality: modality,
        inscriptionLimit: inscriptionLimit,
        certificatePassword: certificatePassword
    });
}

courseSchema.methods.addQuestion = function(userId, text): void {
    this.questions.push({
        userId: userId,
        text: text
    });
}

export function getSchema() {
    return courseSchema;
}

// Mongoose Model
let userModel: any;  // This is not exposed outside the model
export function getModel(): mongoose.Model<Course> { // Return Model as singleton
    if (!userModel) {
        userModel = mongoose.model('Course', getSchema())
    }
    return userModel;
}

export function newCourse(data: any): Course {
    const _userModel = getModel();
    return new _userModel(data);
}