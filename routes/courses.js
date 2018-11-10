const express = require("express");
const router = express.Router();
const cors = require("cors");
const getCourse = require("../lib/course").getCourse;
const getTerm = require("../lib/term").getCoursesPerTerm;

// Models
const Courses = require("../models/Courses");

// Middleware
router.use(express.json());
router.use(cors());

// Routes
// Post a single course available during the quarter
router.post("/course/:courseID/quarter/:quarter", async (req, res) => {
  try {
    const courseData = await getCourse(req.params.courseID, req.params.quarter);
    for (let i = 0; i < courseData.length; i++) {
      const course = new Courses({
        courseTitle: courseData[i].courseTitle,
        courseID: courseData[i].courseID,
        meta: courseData[i].meta,
        description: courseData[i].description,
        prereqs: courseData[i].prereqs,
        notes: courseData[i].notes,
        lecture: courseData[i].lecture,
        sections: courseData[i].sections
      });

      // course.save().then(console.log(`Saving ${i} documents ...`));
    }
    res.send(courseData);
  } catch (e) {
    console.log(e);
  }
});

// Post all the courses available during the quarter
router.post("/status/:status/quarter/:quarter", async (req, res) => {
  try {
    const termData = await getTerm(req.params.status, req.params.quarter);
    for (let i = 0; i < termData.length; i++) {
      const course = new Courses({
        courseTitle: termData[i].courseTitle,
        courseID: termData[i].courseID,
        meta: termData[i].meta,
        description: termData[i].description,
        prereqs: termData[i].prereqs,
        notes: termData[i].notes,
        lecture: termData[i].lecture,
        sections: termData[i].sections
      });

      // course.save().then(console.log(`Saving ${i} documents ...`));
    }
  } catch (e) {
    console.log(e);
  }
});

module.exports = router;
