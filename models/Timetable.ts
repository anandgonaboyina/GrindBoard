import mongoose, { Schema, Document } from 'mongoose';

export interface ITimetable extends Document {
    userId: mongoose.Types.ObjectId;
    timetableGrid: Record<string, any>;
    timetableColors: Record<string, any>;
    weekdayTimes: string[];
    weekendTimes: string[];
    timetableStartTime: number;
    timetableWeekendStartTime: number;
    useTimetableRange: boolean;
    lastModified: number;
}

const TimetableSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    timetableGrid: { type: Schema.Types.Mixed, default: {} },
    timetableColors: { type: Schema.Types.Mixed, default: {} },
    weekdayTimes: [{ type: String }],
    weekendTimes: [{ type: String }],
    timetableStartTime: { type: Number, default: 540 },
    timetableWeekendStartTime: { type: Number, default: 540 },
    useTimetableRange: { type: Boolean, default: true },
    lastModified: { type: Number, default: Date.now }
}, { timestamps: true });

export default mongoose.models.Timetable || mongoose.model<ITimetable>('Timetable', TimetableSchema);