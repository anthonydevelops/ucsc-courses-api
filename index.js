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

  await page.goto("https://pisa.ucsc.edu/class_search/index.php", {
    waitUntil: "networkidle0"
  });

  // Search --- Selectors
  const TERMS = "#term_dropdown";
  await page.select(TERMS, "2180");

  const STATUS = "#reg_status";
  await page.select(STATUS, "all");

  const SUBJECTS = "#subject";
  await page.select(SUBJECTS, "CMPS");

  const SUBMIT = ".btn.btn-lg.btn-primary.btn-block";
  await page.click(SUBMIT);
  await page.waitForSelector(".panel-body");

  const COURSE_LIST = ".panel.panel-default.row";
  let header = await page.evaluate(() => {
    let result = [];
    let items = document.querySelectorAll(
      ".panel-heading.panel-heading-custom > h2"
    );
    items.forEach(item => {
      result.push({
        title: item.querySelector("a").innerText,
        status: item.querySelector("span").innerText,
        url: item.querySelector("a").getAttribute("href")
      });
    });

    return result;
  });

  console.log(header);

  let body = await page.evaluate(() => {
    let result = [];
    let items = document.querySelectorAll(
      ".panel.panel-default.row > div.panel-body > div.row"
    );
    items.forEach(item => {
      result.push({
        info: document.querySelectorAll(".col-xs-6.col-sm-3").innerText
      });
    });

    return result;
  });

  console.log(body);

  await browser.close();
};

run();

app.listen(port, () => console.log(`Listening on port ${port}`));
