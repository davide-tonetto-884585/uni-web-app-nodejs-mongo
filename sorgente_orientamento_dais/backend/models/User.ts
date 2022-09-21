import mongoose = require('mongoose');
import crypto = require('crypto');

export interface User extends mongoose.Document {
    readonly _id: mongoose.Schema.Types.ObjectId,
    mail: string,
    salt: string,    // salt is a random string that will be mixed with the actual password before hashing
    digest: string,  // this is the hashed password (digest of the password)
    name: string,
    surname: string,
    birthdate: Date,
    verifyToken: string,
    verified: boolean,
    enabled: boolean,
    gender: string,
    studentData: {
        fieldOfStudy: string,
        schoolId: number
    },
    teacherData: {
        isAdmin: boolean,
        description: string,
        profilePicture: string,
        teacherPageLink: string
    },

    setPassword: (pwd: string) => void,
    validatePassword: (pwd: string) => boolean,
    hasAdminRole: () => boolean,
    setAdmin: () => void,
    hasModeratorRole: () => boolean,
    setModerator: () => void,
}

const userSchema = new mongoose.Schema({
    name: {
        type: mongoose.SchemaTypes.String,
        required: true,
        minLength: 2,
        maxLength: 55
    },
    surname: {
        type: mongoose.SchemaTypes.String,
        required: true,
        minLength: 2,
        maxLength: 55
    },
    birthdate: {
        type: mongoose.SchemaTypes.Date,
        required: true
    },
    mail: {
        type: mongoose.SchemaTypes.String,
        required: true,
        unique: true,
        match: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
    },
    salt: {
        type: mongoose.SchemaTypes.String,
        required: false
    },
    digest: {
        type: mongoose.SchemaTypes.String,
        required: false
    },
    verifyToken: {
        type: mongoose.SchemaTypes.String,
        required: false
    },
    verified: {
        type: mongoose.SchemaTypes.Boolean,
        required: true,
        default: false
    },
    enabled: {
        type: mongoose.SchemaTypes.Boolean,
        required: true,
        default: true
    },
    gender: {
        type: mongoose.SchemaTypes.String,
        enum: ['M', 'F'],
        required: false,
    },
    studentData: {
        type: {
            fieldOfStudy: {
                type: mongoose.SchemaTypes.String,
                enum: ['Art school', 'IT technical institute', 'Scientific lyceum'],
                required: true
            },
            schoolId: {
                type: mongoose.SchemaTypes.ObjectId,
                required: true
            }
        },
        required: false
    },
    teacherData: {
        type: {
            isAdmin: {
                type: mongoose.SchemaTypes.Boolean,
                required: true,
                default: false
            },
            description: {
                type: mongoose.SchemaTypes.String,
                required: true
            },
            profilePicture: {
                type: mongoose.SchemaTypes.String,
                required: false
            },
            teacherPageLink: {
                type: mongoose.SchemaTypes.String,
                required: false
            }
        },
        required: false
    },
});

userSchema.methods.setPassword = function (pwd: string) {
    this.salt = crypto.randomBytes(16).toString('hex'); // We use a random 16-bytes hex string for salt

    // We use the hash function sha512 to hash both the password and salt to
    // obtain a password digest
    //
    // From wikipedia: (https://en.wikipedia.org/wiki/HMAC)
    // In cryptography, an HMAC (sometimes disabbreviated as either keyed-hash message
    // authentication code or hash-based message authentication code) is a specific type
    // of message authentication code (MAC) involving a cryptographic hash function and
    // a secret cryptographic key.
    let hmac = crypto.createHmac('sha512', this.salt);
    hmac.update(pwd);
    this.digest = hmac.digest('hex'); // The final digest depends on both by the password and the salt
}

userSchema.methods.validatePassword = function (pwd: string): boolean {
    // To validate the password, we compute the digest with the
    // same HMAC to check if it matches with the digest we stored
    // in the database.
    let hmac = crypto.createHmac('sha512', this.salt);
    hmac.update(pwd);
    const digest = hmac.digest('hex');
    return (this.digest === digest);
}

userSchema.methods.hasAdminRole = function (): boolean {
    return this.teacherData?.isAdmin;
}

userSchema.methods.setAdmin = function () {
    if (this.teacherData) this.teacherData.isAdmin = true;
}

userSchema.methods.hasTeacherRole = function (): boolean {
    return this.teacherData !== null;
}

export function getSchema() {
    return userSchema;
}

// Mongoose Model
let userModel: any;  // This is not exposed outside the model
export function getModel(): mongoose.Model<User> { // Return Model as singleton
    if (!userModel) {
        userModel = mongoose.model('User', getSchema())
    }
    return userModel;
}

export function newUser(data: any): User {
    const _userModel = getModel();
    return new _userModel(data);
}