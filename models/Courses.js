const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema({
  courseID: {
    type: String,
    trim: true
  },
  meta: [String],
  description: {
    type: String,
    trim: true
  },
  prereqs: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  lecture: [String],
  sections: [
    {
      sectionID: String,
      times: String,
      ta: String,
      location: String,
      enrolled: String,
      waitlist: String,
      status: String
    }
  ]
});

module.exports = Course = mongoose.model("Course", CourseSchema);
