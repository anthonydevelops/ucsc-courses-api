const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema({
  courseTitle: {
    type: String,
    trim: true
  },
  courseID: {
    type: String,
    trim: true
  },
  meta: {
    type: mongoose.Schema.Types.Mixed
  },
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
    type: mongoose.Schema.Types.Mixed,
    default: ""
  },
  sections: {
    type: [{}],
    default: ""
  },
  review: {
    type: mongoose.Schema.Types.Mixed
  }
});

module.exports = Spring18 = mongoose.model("Spring18", CourseSchema);
