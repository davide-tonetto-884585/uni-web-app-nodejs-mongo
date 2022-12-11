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
    isClosed: {
        type: mongoose.SchemaTypes.Boolean,
        required: true,
        default: false
    },
    timestamp: {
        type: mongoose.SchemaTypes.Date,
        required: true,
        default: Date.now()
    },
    likes: [{
        userId: {
            type: mongoose.SchemaTypes.ObjectId,
            required: true,
            ref: 'User'
        }
    }],
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

questionSchema.methods.addLike = function(userId): boolean {
    if (this.likes.find(like => like.userId == userId)) return false;

    this.likes.push({
        userId: userId
    });

    return true;
}

questionSchema.methods.removeLike = function(userId): boolean {
    const like = this.likes.find(like => like.userId == userId);
    if (!like) return false;

    this.likes.splice(this.likes.indexOf(like), 1);

    return true;
}

export function getSchema() {
    return questionSchema;
}