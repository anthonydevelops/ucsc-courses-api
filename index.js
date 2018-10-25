const mongoose = require("mongoose");
const express = require("express");
const puppeteer = require("puppeteer");

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

const run = async () => {
  const browser = await puppeteer.launch({
    headless: false
  });

  const page = await browser.newPage();

  await page.goto("https://pisa.ucsc.edu/class_search/index.php");

  // Selectors
  const TERMS = "#term_dropdown";
  await page.select(TERMS, "2180");

  const STATUS = "#reg_status";
  await page.select(STATUS, "all");

  const SUBJECTS = "#subject";
  await page.select(SUBJECTS, "CMPS");

  const DAYS = "#Days";
  await page.select(DAYS, "MWF");

  const SUBMIT = ".btn.btn-lg.btn-primary.btn-block";
  await page.click(SUBMIT);

  await page.waitForNavigation();
};

run();

app.listen(port, () => console.log(`Listening on port ${port}`));
