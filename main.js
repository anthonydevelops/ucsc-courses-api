const mongoose = require("mongoose");
const express = require("express");
const search = require("./lib/courseQuery").getCourse;

const majorCourses = [
  "cmps12a",
  "cmps12l",
  "cmps5j",
  "cmps11",
  "cmpe13",
  "cmpe13l",
  "cmps12b",
  "cmps12m",
  "cmps13h",
  "cmps13l",
  "math19a",
  "math20a",
  "math19b",
  "math20b",
  "math23a",
  "ams10",
  "math21",
  "cmpe16",
  "cmpe12",
  "cmpe12l",
  "cmpe110",
  "cmps101",
  "cmps111",
  "cmps102",
  "cmps112",
  "ams131",
  "cmpe107"
];

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

app.get("/test", async (req, res) => {
  try {
    const courseData = await search("ams131", "2018 Fall Quarter");
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

app.listen(port, () => console.log(`Listening on port ${port}`));
