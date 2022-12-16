import * as mongoose from "mongoose";

export interface Classroom extends mongoose.Document {
    readonly _id: mongoose.Schema.Types.ObjectId,
    name: string,
    building: string,
    campus: string,
    capacity: number,
}

const classroomSchema = new mongoose.Schema({
    name: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    building: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    campus: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    capacity: {
        type: mongoose.SchemaTypes.Number,
        required: true
    }
});

export function getSchema() {
    return classroomSchema;
}

// Mongoose Model
let userModel: any;  // This is not exposed outside the model
export function getModel(): mongoose.Model<Classroom> { // Return Model as singleton
    if (!userModel) {
        userModel = mongoose.model('Classroom', getSchema())
    }
    return userModel;
}

export function newClassroom(data: any): Classroom {
    const _userModel = getModel();
    return new _userModel(data);
}