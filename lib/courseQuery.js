const puppeteer = require("puppeteer");
const helper = require("./helper");

module.exports.getCourse = async (course, term) => {
  /*
   * Course Setup ------------------------------------------------------
  */
  const courseSubject = helper.getSubject(course);
  const termID = helper.getTerm(term);

  // Launch puppeteer & go to class search
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto("https://pisa.ucsc.edu/class_search/index.php", {
    waitUntil: "networkidle0"
  });

  await page.setCacheEnabled(false);

  /*
   * Class Form --------------------------------------------------------
  */

  // Fall quarter 2018
  const TERMS = "#term_dropdown";
  await page.select(TERMS, termID);

  // All classes
  const STATUS = "#reg_status";
  await page.select(STATUS, "all");

  // Subject selected
  const SUBJECT = "#subject";
  await page.select(SUBJECT, courseSubject);

  // Submit selection & wait for result page
  const SUBMIT = ".btn.btn-lg.btn-primary.btn-block";
  await page.click(SUBMIT);
  await page.waitForSelector(".panel-body");

  /*
   * Class Search ------------------------------------------------------
  */

  // Cycle through new page looking for a match
  const courseList = async function link_list() {
    const COURSE_LINK = await page.evaluate(course => {
      try {
        let result = [];
        // Get all course titles
        let items = document.querySelectorAll(
          "div.panel-heading.panel-heading-custom > h2 > a"
        );

        // Loop through course titles for match(es)
        items.forEach(item => {
          let target = item.innerText
            .split(" ")
            .slice(0, 2)
            .join("");

          // On course match, get url of course
          if (target === course.toUpperCase()) {
            result.push(item.getAttribute("href").toString());
          }
        });

        // If no class(s) found, fetch new page
        if (result.length === 0) {
          let nav = Array.from(
            document.querySelectorAll(
              "div.panel-body > div.row > div.hide-print > a"
            )
          );

          if (nav[2].innerText.trim() === "next") {
            nav[2].classList.add("pagination");
            result.push(nav[2].getAttribute("class"));
          }
        }

        // Return course link
        return result;
      } catch (e) {
        console.log(e);
      }
    }, course);

    // Return course if found
    if (COURSE_LINK[0] != "pagination") {
      return COURSE_LINK;
    }

    // If no course found, go to next page
    await page.click(".pagination");
    await page.waitForSelector(".panel-body");
    return link_list();
  };

  /*
   * Class Info --------------------------------------------------------
  */

  // Description, professor, availability, credits ...
  const infoList = async function info_list() {
    const COURSE_INFO = await page.evaluate(course => {
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
    }, course);

    return COURSE_INFO;
  };

  /*
   * Initiate Search ---------------------------------------------------
  */

  // Get course link
  let LINK = await courseList();

  // Declare variable to return data
  const COURSE_DATA = [];

  // Go to new course info page(s)
  if (LINK.length === 0) {
    // Returns if no course was found
    return "No Course Found";
  } else if (LINK.length === 1) {
    // Fetches a single course
    await page.goto(`https://pisa.ucsc.edu/class_search/${LINK[0]}`);
    await page.waitForSelector("div.panel-group");
    const CLASS = await infoList();
    COURSE_DATA.push(CLASS);
  } else if (LINK.length > 1) {
    // Fetches each course offered
    for (let i = 0; i < LINK.length; i++) {
      await page.goto(`https://pisa.ucsc.edu/class_search/${LINK[i]}`);
      await page.waitForSelector("div.panel-group");
      const CLASSES = await infoList();
      COURSE_DATA.push(CLASSES);
    }
  }

  browser.close();

  return COURSE_DATA;
};
