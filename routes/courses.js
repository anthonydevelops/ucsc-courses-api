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
    const courseData = await getCourse(req.params.courseID, req.params.quarter);

    let result = [];

    for (let i = 0; i < courseData.length; i++) {
      const instructor = courseData[i].lecture.instructor;
      let professorRating;

      // Check if instructor exists & search
      if (instructor && instructor !== "Staff") {
        professorRating = await getRmp(courseData[i].lecture.instructor);
      } else {
        professorRating = {
          rating: null,
          amountReviewed: null
        };
      }

      // Store course info
      const course = new Courses({
        courseTitle: courseData[i].courseTitle,
        courseID: courseData[i].courseID,
        meta: courseData[i].meta,
        description: courseData[i].description,
        prereqs: courseData[i].prereqs,
        notes: courseData[i].notes,
        lecture: courseData[i].lecture,
        sections: courseData[i].sections,
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

// Post all the courses available during the quarter
router.post("/status/:status/quarter/:quarter", async (req, res) => {
  try {
    // Get course data for the queried term
    const termData = await getTerm(req.params.status, req.params.quarter);

    // Rating dictionary to store prev searched prof
    const ratingDict = {};

    // Temp result to show on Postman
    const result = [];

    for (let i = 0; i < termData.length; i++) {
      let professorRating;
      let professorSearched = false;

      // Get instructor for course
      const instructor = termData[i].lecture.instructor;

      // Search if instructor exists
      if (instructor && instructor !== "Staff") {
        if (ratingDict.hasOwnProperty(instructor)) {
          professorSearched = true;
          professorRating = ratingDict[instructor];
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

      // Store course info
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
