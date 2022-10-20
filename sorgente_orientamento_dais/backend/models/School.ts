import mongoose = require('mongoose');

export interface School extends mongoose.Document {
    readonly _id: mongoose.Schema.Types.ObjectId,
    ANNOSCOLASTICO: number,
    AREAGEOGRAFICA: string,
    CAPSCUOLA: string,
    CODICECOMUNESCUOLA: string,
    CODICEISTITUTORIFERIMENTO: string,
    CODICESCUOLA: string,
    DENOMINAZIONEISTITUTORIFERIMENTO: string,
    DENOMINAZIONESCUOLA: string,
    DESCRIZIONECARATTERISTICASCUOLA: string,
    DESCRIZIONECOMUNE: string,
    DESCRIZIONETIPOLOGIAGRADOISTRUZIONESCUOLA: string,
    INDIRIZZOEMAILSCUOLA: string,
    INDIRIZZOSCUOLA: string,
    PROVINCIA: string,
    REGIONE: string,
    SITOWEBSCUOLA: string
}

const schoolSchema = new mongoose.Schema({
    ANNOSCOLASTICO: {
        type: mongoose.SchemaTypes.Number,
        required: false
    },
    AREAGEOGRAFICA: {
        type: mongoose.SchemaTypes.String,
        required: false
    },
    CAPSCUOLA: {
        type: mongoose.SchemaTypes.String,
        required: false
    },
    CODICECOMUNESCUOLA: {
        type: mongoose.SchemaTypes.String,
        required: false
    },
    CODICEISTITUTORIFERIMENTO: {
        type: mongoose.SchemaTypes.String,
        required: false
    },
    CODICESCUOLA: {
        type: mongoose.SchemaTypes.String,
        required: false
    },
    DENOMINAZIONEISTITUTORIFERIMENTO: {
        type: mongoose.SchemaTypes.String,
        required: false
    },
    DENOMINAZIONESCUOLA: {
        type: mongoose.SchemaTypes.String,
        required: false
    },
    DESCRIZIONECARATTERISTICASCUOLA: {
        type: mongoose.SchemaTypes.String,
        required: false
    },
    DESCRIZIONECOMUNE: {
        type: mongoose.SchemaTypes.String,
        required: false
    },
    DESCRIZIONETIPOLOGIAGRADOISTRUZIONESCUOLA: {
        type: mongoose.SchemaTypes.String,
        required: false
    },
    INDIRIZZOEMAILSCUOLA: {
        type: mongoose.SchemaTypes.String,
        required: false
    },
    INDIRIZZOSCUOLA: {
        type: mongoose.SchemaTypes.String,
        required: false
    },
    PROVINCIA: {
        type: mongoose.SchemaTypes.String,
        required: false
    },
    REGIONE: {
        type: mongoose.SchemaTypes.String,
        required: false
    },
    SITOWEBSCUOLA: {
        type: mongoose.SchemaTypes.String,
        required: false
    }
});

export function getSchema() {
    return schoolSchema;
}

// Mongoose Model
let schoolModel: any;  // This is not exposed outside the model
export function getModel(): mongoose.Model<School> { // Return Model as singleton
    if (!schoolModel) {
        schoolModel = mongoose.model('School', getSchema())
    }
    return schoolModel;
}