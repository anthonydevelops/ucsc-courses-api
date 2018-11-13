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
    const courseData = await getCourse(req.params.courseID, req.params.quarter);

    let result = [];

    for (let i = 0; i < courseData.length; i++) {
      const courseRating = await getRmp(courseData[i].lecture.instructor);

      const course = new Courses({
        courseTitle: courseData[i].courseTitle,
        courseID: courseData[i].courseID,
        meta: courseData[i].meta,
        description: courseData[i].description,
        prereqs: courseData[i].prereqs,
        notes: courseData[i].notes,
        lecture: courseData[i].lecture,
        sections: courseData[i].sections,
        review: courseRating
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
    const result = [];
    const termData = await getTerm(req.params.status, req.params.quarter);

    const ratingDict = {};

    for (let i = 0; i < termData.length; i++) {
      let professorRating;
      let professorSearched = false;
      const instructor = termData[i].lecture.instructor;

      if (instructor && instructor !== "Staff") {
        for (let key in ratingDict) {
          if (key === instructor) {
            professorSearched = true;
            professorRating = ratingDict[key];
          }
        }

        if (professorSearched === false) {
          professorRating = await getRmp(instructor);
          ratingDict[instructor] = professorRating;
        }
      } else {
        professorRating = {
          rating: null,
          amountReviewed: null
        };
      }

      const course = new Courses.Winter19({
        courseTitle: termData[i].courseTitle,
        courseID: termData[i].courseID,
        meta: termData[i].meta,
        description: termData[i].description,
        prereqs: termData[i].prereqs,
        notes: termData[i].notes,
        lecture: termData[i].lecture,
        sections: termData[i].sections,
        professorReview: professorRating
      });

      // course.save().then(console.log(`Saving ${i} documents ...`));
      result.push(course);
    }

    res.send(result);
  } catch (e) {
    console.log(e);
  }
});

module.exports = router;
