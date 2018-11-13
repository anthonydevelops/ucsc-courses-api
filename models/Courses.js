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
  profReview: {
    type: mongoose.Schema.Types.Mixed
  }
});

const Winter19 = mongoose.model("Winter19", CourseSchema);
const Fall18 = mongoose.model("Fall18", CourseSchema);
const Summer18 = mongoose.model("Summer18", CourseSchema);
const Spring18 = mongoose.model("Spring18", CourseSchema);
const Winter18 = mongoose.model("Winter18", CourseSchema);
const Fall17 = mongoose.model("Fall17", CourseSchema);

module.exports = {
  Winter19,
  Fall18,
  Summer18,
  Spring18,
  Winter18,
  Fall17
};
