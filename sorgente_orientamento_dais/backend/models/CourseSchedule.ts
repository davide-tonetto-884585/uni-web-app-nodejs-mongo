import * as mongoose from "mongoose";
import * as Lesson from './Lesson'

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

courseScheduleSchema.methods.addLesson = function(date, startTime, endTime, virtualRoomLink, virtualRoomPasscode, presencePasscode, classroomId): boolean {
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

courseScheduleSchema.methods.addInscription = function(studentId, isInPresence): boolean {
    if (this.modality === 'Online' && isInPresence) return false;

    this.inscriptions.push({
        userId: studentId,
        isInPresence: isInPresence
    });

    return true;
}

export function getSchema() {
    return courseScheduleSchema;
}