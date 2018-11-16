const puppeteer = require("puppeteer");
const helper = require("./helpers/course_helper");

module.exports.getCourse = async (course, term) => {
  /*
   * Course Setup ------------------------------------------------------
   */
  const courseSubject = helper.getSubject(course);
  const termID = helper.getTerm(term);

  // Launch puppeteer & go to class search
  const browser = await puppeteer.launch({
    headless: false
  });
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
        const result = [];
        // Get all course titles
        const items = document.querySelectorAll(
          "div.panel-heading.panel-heading-custom > h2 > a"
        );

        // Loop through course titles for match(es)
        items.forEach(item => {
          const target = item.innerText
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
        // Get course title
        const courseTitle = document.querySelector(
          "div.row > div.col-xs-12 > h2"
        );

        // Get titles of each row
        const headers = Array.from(
          document.querySelectorAll(
            "div.panel-group > div.panel.panel-default.row > div.panel-heading.panel-heading-custom > h2"
          )
        );

        // Get all row information
        const items = Array.from(
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
          const lecture = items[items.length - 1].innerText
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
          const lecture = items[items.length - 2].innerText
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
          const section = items[items.length - 1].innerText.split("\n");

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
        return {
          courseTitle: courseTitle.innerText.trim(),
          courseID: course.toUpperCase(),
          meta: metaData,
          description: headers
            .map((i, elem) => {
              if (i.innerText === "Description") {
                return items[elem].innerText;
              }
            })
            .join(""),
          prereqs: headers
            .map((i, elem) => {
              if (i.innerText === "Enrollment Requirements") {
                return items[elem].innerText;
              }
            })
            .join(""),
          notes: headers
            .map((i, elem) => {
              if (i.innerText === "Class Notes") {
                return items[elem].innerText;
              }
            })
            .join(""),
          lecture: headers
            .map((i, elem) => {
              if (i.innerText === "Meeting Information") {
                return lectureInfo;
              }
            })
            .filter(n => n != null)[0],
          sections:
            headers[headers.length - 1].innerText ===
            "Associated Discussion Sections or Labs"
              ? sectionInfo
              : ""
        };
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
  const COURSE_DATA = [];

  // Go to new course info page(s)
  if (LINK.length > 0) {
    for (let i = 0; i < LINK.length; i++) {
      await page.goto(`https://pisa.ucsc.edu/class_search/${LINK[i]}`);
      await page.waitForSelector("div.panel-group");
      const CLASSES = await infoList();
      COURSE_DATA.push(CLASSES);
    }
  } else {
    return COURSE_DATA;
  }

  browser.close();

  return (result = COURSE_DATA.filter(n => n != null || n != undefined));
};
