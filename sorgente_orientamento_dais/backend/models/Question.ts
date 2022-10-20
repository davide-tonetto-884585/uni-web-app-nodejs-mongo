import * as mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true,
        ref: 'User'
    },
    text: {
        type: mongoose.SchemaTypes.String,
        required: true,
        minLength: 5
    },
    closed: {
        type: mongoose.SchemaTypes.Boolean,
        required: true,
        default: false
    },
    timestamp: {
        type: mongoose.SchemaTypes.Date,
        required: true,
        default: Date.now()
    },
    answers: [{
        userId: {
            type: mongoose.SchemaTypes.ObjectId,
            required: true,
            ref: 'User'
        },
        text: {
            type: mongoose.SchemaTypes.String,
            required: true,
            minlength: 2
        },
        timestamp: {
            type: mongoose.SchemaTypes.Date,
            required: true,
            default: Date.now()
        }
    }]
});

questionSchema.methods.addAnswer = function(userId, text): boolean {
    if (text.length < 2) return false;

    this.answare.push({
        userId: userId,
        text: text
    });

    return true;
}

export function getSchema() {
    return questionSchema;
}