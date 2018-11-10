"use strict";

const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

const getSubjects = async () => {
  const subjects = [];

  try {
    // Get class search page
    const response = await axios.get(
      "https://pisa.ucsc.edu/class_search/index.php"
    );

    // Scrape if website is OK
    if (response.status === 200) {
      const html = await response.data;
      const $ = cheerio.load(html);

      // Get all options in subject selector
      $("#subject")
        .find("option")
        .filter(n => {
          return n != "";
        })
        .each((i, elem) => {
          subjects.push({
            subjectID: $(elem).attr("value"),
            subjectName: $(elem)
              .text()
              .trim()
          });
        });
    }
  } catch (e) {
    console.log(e);
  }

  // // Write data to JSON
  fs.writeFile(
    `lib/json/subjects.json`,
    JSON.stringify(subjects, null, 4),
    err => {
      console.log("File successfully written");
    }
  );
};

getSubjects();
