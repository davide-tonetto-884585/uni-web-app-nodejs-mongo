import * as mongoose from "mongoose";

const lessonSchema = new mongoose.Schema({
    date: {
        type: mongoose.SchemaTypes.Date,
        required: true
    },
    startTime: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    endTime: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    virtualRoomLink: {
        type: mongoose.SchemaTypes.String,
        required: false
    },
    virtualRoomPasscode: {
        type: mongoose.SchemaTypes.String,
        required: false
    },
    presencePasscode: {
        type: mongoose.SchemaTypes.String,
        required: true,
        minlength: 5
    },
    classroomId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Classroom',
        required: false
    },
    attendance: [{
        studentId: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'User',
            required: true
        }
    }]
});

lessonSchema.methods.addAttendance = function(studentId): void {
    this.attendance.push({studentId: studentId});
}

export function getSchema() {
    return lessonSchema;
}