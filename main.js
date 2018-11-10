const mongoose = require("mongoose");
const express = require("express");
const courseQuery = require("./lib/courseQuery").getCourse;
const termQuery = require("./lib/termQuery").getCoursesPerTerm;

const app = express();

// Models
const Courses = require("./models/Courses");

// Port
const port = process.env.PORT || 5000;

// Connect to MongoDB
const db = require("./config/keys").mongoURI;
mongoose
  .connect(db)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

app.get("/course/:courseID/quarter/:quarterID", async (req, res) => {
  try {
    const courseData = await courseQuery(
      req.params.courseID,
      req.params.quarterID
    );
    for (let i = 0; i < courseData.length; i++) {
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
    res.send(courseData);
  } catch (e) {
    console.log(e);
  }
});

app.get("/test/courses/all", async (req, res) => {
  try {
    const termData = await termQuery("all", "2018 Fall Quarter");
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

      course.save().then(console.log(`Saving ${i} documents ...`));
    }
  } catch (e) {
    console.log(e);
  }
});

app.listen(port, () => console.log(`Listening on port ${port}`));
