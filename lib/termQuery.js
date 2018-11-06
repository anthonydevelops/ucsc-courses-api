const puppeteer = require("puppeteer");
const helper = require("./helper");
const fs = require("fs");

const getCoursesPerTerm = async (status, term) => {
  // Parse term name to term id
  const termID = helper.getTerm(term);

  // Launch puppeteer & go to class search
  const browser = await puppeteer.launch({
    headless: false
  });
  const page = await browser.newPage();

  await page.goto("https://pisa.ucsc.edu/class_search/index.php", {
    waitUntil: "networkidle0"
  });

  // Class Form
  const TERM = "#term_dropdown";
  await page.select(TERM, termID);

  const STATUS = "#reg_status";
  await page.select(STATUS, status);

  const SUBMIT = ".btn.btn-lg.btn-primary.btn-block";
  await page.click(SUBMIT);
  await page.waitForSelector(".panel-body");

  /*
   * Class Search ------------------------------------------------------
  */

  const urls = [];

  // Cycle through new page looking for a match
  const courseList = async function link_list() {
    const COURSE_LINK = await page.evaluate(() => {
      try {
        let result = [];
        let pagination = false;

        // Get all course titles
        let items = document.querySelectorAll(
          "div.panel-heading.panel-heading-custom > h2 > a"
        );

        // Loop through course titles for links
        items.forEach(item => {
          result.push(item.getAttribute("href").toString());
        });

        // Search through each page
        let nav = Array.from(
          document.querySelectorAll(
            "div.panel-body > div.row > div.hide-print > a"
          )
        );

        // Check if next page exists
        for (let i = 0; i < nav.length; i++) {
          if (nav[i].innerText.trim() === "next") {
            nav[i].classList.add("pagination");
            pagination = true;
          }
        }

        // Return data
        return [result, pagination];
      } catch (e) {
        console.log(e);
      }
    });

    const urlArr = COURSE_LINK[0].slice();
    for (let i = 0; i < urlArr.length; i++) {
      urls.push(urlArr[i]);
    }

    // If no course found, go to next page
    if (COURSE_LINK[1]) {
      await page.click(".pagination");
      await page.waitForSelector(".panel-body");
      return link_list();
    }

    return urls;
  };

  // Description, professor, availability, credits ...
  const infoList = async function info_list() {
    const COURSE_INFO = await page.evaluate(() => {
      try {
        let result = [];

        // Get titles of each row
        let headers = Array.from(
          document.querySelectorAll(
            "div.panel-group > div.panel.panel-default.row > div.panel-heading.panel-heading-custom > h2"
          )
        );

        // Get all row information
        let items = Array.from(
          document.querySelectorAll(
            "div.panel-group > div.panel.panel-default.row > div.panel-body"
          )
        );

        // Parse course meta data information
        const metaData = [];
        let meta = items[0].innerText.split("\n");

        for (let i = 0; i < meta.length; i++) {
          if (i > 0) {
            if (i % 2 === 0) {
              metaData.push(`${meta[i - 2]}: ${meta[i - 1]}`);
            }
          }
        }

        // Parse lecture information
        const lectureInfo = [];
        if (headers[headers.length - 1].innerText === "Meeting Information") {
          let lecture = items[items.length - 1].innerText
            .replace(/\t/g, "*")
            .split("\n");

          let lecture_labels = lecture[0].split("*");
          let lecture_data = lecture[1].split("*");

          lectureInfo.push(
            `${lecture_labels[0]}: ${lecture_data[0]}`,
            `${lecture_labels[1]}: ${lecture_data[1]}`,
            `${lecture_labels[2]}: ${lecture_data[2]}`,
            `${lecture_labels[3]}: ${lecture_data[3]}`
          );
        } else {
          let lecture = items[items.length - 2].innerText
            .replace(/\t/g, "*")
            .split("\n");

          let lecture_labels = lecture[0].split("*");
          let lecture_data = lecture[1].split("*");

          lectureInfo.push(
            `${lecture_labels[0]}: ${lecture_data[0]}`,
            `${lecture_labels[1]}: ${lecture_data[1]}`,
            `${lecture_labels[2]}: ${lecture_data[2]}`,
            `${lecture_labels[3]}: ${lecture_data[3]}`
          );
        }

        // Parse section information
        const sectionInfo = [];
        if (
          headers[headers.length - 1].innerText ===
          "Associated Discussion Sections or Labs"
        ) {
          let section = items[items.length - 1].innerText.split("\n");

          for (let i = 0; i < section.length; i++) {
            if (i % 7 === 0 && i > 0) {
              sectionInfo.push({
                sectionID: section[i - 7],
                times: section[i - 6],
                ta: section[i - 5],
                location: section[i - 4],
                enrolled: section[i - 3],
                waitlist: section[i - 2],
                status: section[i - 1]
              });
            }
          }
        }

        // Return resulting query data
        result.push({
          courseID: course,
          meta: metaData,
          description: items[1].innerText,
          prereqs:
            headers[2].innerText === "Enrollment Requirements"
              ? items[2].innerText
              : "",
          notes:
            headers[3].innerText === "Class Notes"
              ? items[3].innerText
              : headers[2].innerText === "Class Notes"
                ? items[2].innerText
                : "",
          lecture:
            headers[headers.length - 1].innerText === "Meeting Information"
              ? lectureInfo
              : headers[headers.length - 2].innerText === "Meeting Information"
                ? lectureInfo
                : "",
          sections:
            headers[headers.length - 1].innerText ===
            "Associated Discussion Sections or Labs"
              ? sectionInfo
              : ""
        });

        return result;
      } catch (e) {
        console.log(e);
      }
    });

    return COURSE_INFO;
  };

  let URLS = await courseList();
  // const TERM_DATA = [];

  // for (let i = 0; i < 1; i++) {
  //   await page.goto(`https://pisa.ucsc.edu/class_search/${URLS[i]}`);
  //   await page.waitForSelector("div.panel-group");
  //   const CLASSES = await infoList();
  //   TERM_DATA.push(CLASSES);
  // }

  browser.close();

  // Write data to JSON
  console.log(URLS);
};

getCoursesPerTerm("O", "2018 Fall Quarter");
