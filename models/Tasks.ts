import mongoose, { Schema, Document } from 'mongoose';

const TaskSchema = new Schema({
    id: { type: String, required: true },
    title: { type: String, required: true },
    duration: { type: Number, required: true },
    completed: { type: Boolean, default: false },
    timeSpent: { type: Number, default: 0 },
    groupId: { type: Number, default: 0 }
}, { _id: false });

const TasksSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    tasks: { type: [TaskSchema], default: [] },
    tomorrowTasks: { type: [TaskSchema], default: [] },
    tasksDate: { type: String, default: '' },
    taskGroupNames: { type: [String], default: ['Core Tasks', 'Daily Routine', 'Milestones'] },
    countdowns: { type: Array, default: [] },
    deadlines: { type: Array, default: [] },
    dismissedDeadlineAlerts: { type: Array, default: [] },
    syntheticDeadlines: { type: Object, default: {} },
    plans: { type: Array, default: [] },
    lastModified: { type: Number, default: Date.now }
}, {
    timestamps: true,
    collection: 'Tasks'
});

if (mongoose.models.Tasks) {
    delete mongoose.models.Tasks;
}

export default mongoose.model('Tasks', TasksSchema, 'Tasks');