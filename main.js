const mongoose = require("mongoose");
const express = require("express");
const fetchClass = require("./lib/data");

console.log(fetchClass);

const app = express();

// Models
const subjects = require("./models/Subjects");

// Port
const port = process.env.PORT || 5000;

// Connect to MongoDB
const db = require("./config/keys").mongoURI;
mongoose
  .connect(db)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

app.listen(port, () => console.log(`Listening on port ${port}`));
