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

app.get("/test/course", async (req, res) => {
  try {
    const courseData = await courseQuery("ams131", "2018 Fall Quarter");
    for (let i = 0; i < courseData.length; i++) {
      const course = new Courses({
        courseID: courseData[i][0].courseID,
        meta: courseData[i][0].meta,
        description: courseData[i][0].description,
        prereqs: courseData[i][0].prereqs,
        notes: courseData[i][0].notes,
        lecture: courseData[i][0].lecture,
        sections: courseData[i][0].sections
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
    const termData = await termQuery("O", "2018 Fall Quarter");
    res.send(termData);
  } catch (e) {
    console.log(e);
  }
});

app.listen(port, () => console.log(`Listening on port ${port}`));
