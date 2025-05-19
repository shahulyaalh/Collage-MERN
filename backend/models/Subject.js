const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: false },
  fees: { type: String, required: true },
  
});

const Subject = mongoose.model("Subject", subjectSchema);
module.exports = Subject;
