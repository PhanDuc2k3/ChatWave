const mongoose = require("mongoose");

const acceptanceItemSchema = new mongoose.Schema(
  { text: String, checked: { type: Boolean, default: false } },
  { _id: false }
);

const deliverableSchema = new mongoose.Schema(
  { label: String, link: { type: String, default: null } },
  { _id: false }
);

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: mongoose.Schema.Types.Mixed, default: "" },
    assignerId: { type: String, required: true },
    assignerName: { type: String, required: true },
    assigneeId: { type: String, default: null },
    assigneeName: { type: String, default: null },
    reviewerId: { type: String, default: null },
    reviewerName: { type: String, default: null },
    source: { type: String, enum: ["group", "friend"], default: "friend" },
    sourceId: { type: String, default: null },
    sourceName: { type: String, required: true },
    dueDate: { type: String, default: "" },
    estimatedEffort: { type: String, default: "" },
    expectedResults: { type: [String], default: [] },
    acceptanceCriteria: { type: [acceptanceItemSchema], default: [] },
    deliverables: { type: [deliverableSchema], default: [] },
    references: { type: [deliverableSchema], default: [] },
    risksNotes: { type: String, default: "" },
    completionNote: { type: String, default: "" },
    completedAt: { type: Date, default: null },
    submissionDeliverables: { type: [deliverableSchema], default: [] },
    status: {
      type: String,
      enum: ["pending", "in_progress", "done", "cancelled"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
  },
  { timestamps: true }
);

function normalize(doc, ret) {
  ret.id = ret._id;
  delete ret._id;
  delete ret.__v;
  return ret;
}

taskSchema.set("toJSON", { transform: normalize });
taskSchema.set("toObject", { transform: normalize });

const Task = mongoose.model("Task", taskSchema);
module.exports = Task;
