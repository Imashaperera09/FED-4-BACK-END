import mongoose from "mongoose";

const anomalySchema = new mongoose.Schema({
    solarUnitId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SolarUnit',
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['ZERO_GENERATION', 'LOW_EFFICIENCY', 'DATA_GAP', 'OVER_CAPACITY_SPIKE']
    },
    severity: {
        type: String,
        required: true,
        enum: ['CRITICAL', 'WARNING', 'INFO']
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: ['OPEN', 'RESOLVED'],
        default: 'OPEN'
    },
    affectedPeriodStart: {
        type: Date,
        required: false
    },
    affectedPeriodEnd: {
        type: Date,
        required: false
    }
}, {
    timestamps: true
});

export const Anomaly = mongoose.model("Anomaly", anomalySchema);
