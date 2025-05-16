const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: false },
  fees: { type: String, required: true },
  type: { type: String }, // "regular" or "arrear"
  examSchedule: { type: String }, // e.g., "2025-05-10"
  semester: { type: String },
  department: { type: String },
});

const Subject = mongoose.model("Subject", subjectSchema);
module.exports = Subject;
