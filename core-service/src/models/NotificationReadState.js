const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    lastReadAt: { type: Date, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("NotificationReadState", schema);
