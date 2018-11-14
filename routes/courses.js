const express = require("express");
const router = express.Router();
const cors = require("cors");
const getCourse = require("../lib/course").getCourse;
const getTerm = require("../lib/term").getCoursesPerTerm;
const getRmp = require("../lib/rmp").getRating;

// Models
const Courses = require("../models/Courses");

// Middleware
router.use(express.json());
router.use(cors());

// Routes
// Post a single course available during the quarter
router.post("/course/:courseID/quarter/:quarter", async (req, res) => {
  try {
    // Course data for queried courseID
    let courseData = await getCourse(req.params.courseID, req.params.quarter);

    if (courseData == null) {
      res.send(courseData);
      return;
    }

    courseData = await getRmp(courseData);

    let result = [];

    for (let i = 0; i < courseData.length; i++) {
      // Store course info
      const course = new Courses.Winter19({
        courseTitle: courseData[i].courseTitle,
        courseID: courseData[i].courseID,
        meta: courseData[i].meta,
        description: courseData[i].description,
        prereqs: courseData[i].prereqs,
        notes: courseData[i].notes,
        lecture: courseData[i].lecture,
        sections: courseData[i].sections,
        profReview: {
          rating: null,
          amountReviewed: null
        }
      });

      // course.save().then(console.log(`Saving ${i} documents ...`));
      result.push(course);
    }
    res.send(result);
  } catch (e) {
    console.log(e);
  }
});

// Post all the courses available during the quarter
router.post("/status/:status/quarter/:quarter", async (req, res) => {
  try {
    const status = req.params.status;
    const quarter = req.params.quarter;

    // Get course data for the queried term
    let termData = await getTerm(status, quarter);
    termData = await getRmp(termData);

    for (let i = 0; i < termData.length; i++) {
      // Store course info
      const course = new Courses.Fall18({
        courseTitle: termData[i].courseTitle,
        courseID: termData[i].courseID,
        meta: termData[i].meta,
        description: termData[i].description,
        prereqs: termData[i].prereqs,
        notes: termData[i].notes,
        lecture: termData[i].lecture,
        sections: termData[i].sections,
        profReview: termData[i].profReview
      });

      course.save().then(console.log(`Saving ${i} documents ...`));
    }
  } catch (e) {
    console.log(e);
  }
});

module.exports = router;
