const mongoose = require("mongoose");

const SubjectSchema = new mongoose.Schema({
  subjectID: {
    type: String,
    trim: true
  },
  subjectName: {
    type: String,
    required: true,
    trim: true
  }
});

module.exports = Subject = mongoose.model("Subject", SubjectSchema);
