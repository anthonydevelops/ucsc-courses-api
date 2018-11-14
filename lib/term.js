const puppeteer = require("puppeteer");
const helper = require("./helpers/course_helper");
const fs = require("fs");

module.exports.getCoursesPerTerm = async (status, term) => {
  // Parse term name to term id
  const termID = helper.getTerm(term);

  // Launch puppeteer & go to class search
  const browser = await puppeteer.launch({
    headless: false
  });
  const page = await browser.newPage();

  // Remove all images, css, and font styles
  /*
   https://www.scrapehero.com/how-to-increase-web-scraping-speed-using-puppeteer/
   */
  await page.setRequestInterception(true);
  page.on("request", req => {
    if (
      req.resourceType() == "stylesheet" ||
      req.resourceType() == "font" ||
      req.resourceType() == "image"
    ) {
      req.abort();
    } else {
      req.continue();
    }
  });

  // Class Search Homepage
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
  let log = 0;

  // Cycle through pages
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

        // Find navigation tags
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

    // Go to next page if nav "next" exists
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
        // Get course title
        const courseTitle = document.querySelector(".row > .col-xs-12 > h2");

        // Get course id
        let courseID = courseTitle.innerText.split("-");
        courseID = courseID[0].split(" ").join("");

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
        const metaData = {};
        let meta = items[0].innerText.split("\n");

        for (let i = 0; i < meta.length; i++) {
          if (i > 0) {
            if (i % 2 === 0) {
              const key = meta[i - 2].replace(/\s/g, "_").toLowerCase();
              const val = meta[i - 1];
              metaData[key] = val;
            }
          }
        }

        // Parse lecture information
        const lectureInfo = {};
        if (headers[headers.length - 1].innerText === "Meeting Information") {
          let lecture = items[items.length - 1].innerText
            .replace(/\t/g, "*")
            .split("\n");

          // Split values into an array
          let lecture_data = lecture[1].split("*");
          const meeting = lecture_data[0].split(" ");

          lectureInfo["days"] = meeting[0];
          lectureInfo["times"] = meeting[1];
          lectureInfo["room"] = lecture_data[1];
          lectureInfo["instructor"] = lecture_data[2];
          lectureInfo["meetingDates"] = lecture_data[3];
        } else {
          let lecture = items[items.length - 2].innerText
            .replace(/\t/g, "*")
            .split("\n");

          // Split values into an array
          let lecture_data = lecture[1].split("*");
          const meeting = lecture_data[0].split(" ");

          lectureInfo["days"] = meeting[0];
          lectureInfo["times"] = meeting[1];
          lectureInfo["room"] = lecture_data[1];
          lectureInfo["instructor"] = lecture_data[2];
          lectureInfo["meetingDates"] = lecture_data[3];
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
              const meeting = section[i - 6].split(" ");

              sectionInfo.push({
                sectionID: section[i - 7],
                days: meeting[0],
                times: meeting[1],
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
        return {
          courseTitle: courseTitle.innerText.trim(),
          courseID: courseID,
          meta: metaData,
          description:
            headers[1].innerText === "Description"
              ? items[1].innerText
              : headers[2].innerText === "Description"
              ? items[2].innerText
              : "",
          prereqs:
            headers[2].innerText === "Enrollment Requirements"
              ? items[2].innerText
              : headers[3].innerText === "Enrollment Requirements"
              ? items[3].innerText
              : "",
          notes:
            headers[headers.length - 2].innerText === "Class Notes"
              ? items[items.length - 2].innerText
              : headers[headers.length - 3].innerText === "Class Notes"
              ? items[items.length - 3].innerText
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
        };
      } catch (e) {
        console.log(e);
      }
    });

    return COURSE_INFO;
  };

  let URLS = await courseList();
  const TERM_DATA = [];

  for (let i = 0; i < URLS.length; i++) {
    await page.goto(`https://pisa.ucsc.edu/class_search/${URLS[i]}`);
    await page.waitForSelector("div.panel-group");
    const course = await infoList();
    TERM_DATA.push(course);
  }

  // AMS 204 return NULL, idk why
  const result = TERM_DATA.filter(n => n != null || n != undefined);

  browser.close();

  return result;
};
