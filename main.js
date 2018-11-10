const mongoose = require("mongoose");
const express = require("express");
const ucsc = require("./routes/courses");

const app = express();

// Port
const port = process.env.PORT || 5000;

// Connect to MongoDB
const db = require("./config/keys").mongoURI;
mongoose
  .connect(db)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// Route handler
app.use("/ucsc", ucsc);

app.listen(port, () => console.log(`Listening on port ${port}`));
