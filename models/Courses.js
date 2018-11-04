const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema({
  courseID: {
    type: String,
    trim: true
  },
  meta: [String],
  description: {
    type: String,
    default: "",
    trim: true
  },
  prereqs: {
    type: String,
    default: "",
    trim: true
  },
  notes: {
    type: String,
    default: "",
    trim: true
  },
  lecture: {
    type: [String],
    default: ""
  },
  sections: {
    type: [{}],
    default: ""
  }
});

module.exports = Course = mongoose.model("Course", CourseSchema);
