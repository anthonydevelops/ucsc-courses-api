"use strict";

const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

const getTerms = async () => {
  const terms = [];

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
      $("#term_dropdown")
        .find("option")
        .each((i, elem) => {
          terms.push({
            termID: $(elem).attr("value"),
            termName: $(elem)
              .text()
              .trim()
              .split(" ")
              .filter(n => n !== "Quarter")
              .join("")
          });
        });
    }
  } catch (e) {
    console.log(e);
  }

  // // Write data to JSON
  fs.writeFile("terms.json", JSON.stringify(terms, null, 4), err => {
    console.log("File successfully written");
  });
};

getTerms();
