const mongoose = require("mongoose");
const express = require("express");
const search = require("./lib/data").search;

const app = express();

// Models
const courses = require("./models/Courses");

// Port
const port = process.env.PORT || 5000;

// Connect to MongoDB
const db = require("./config/keys").mongoURI;
mongoose
  .connect(db)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

app.get("/test", async (req, res) => {
  const course = await search("cmps111");
  res.send(course);
});

app.listen(port, () => console.log(`Listening on port ${port}`));
