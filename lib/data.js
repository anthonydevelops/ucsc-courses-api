const puppeteer = require("puppeteer");
const subjects = require("./subjects/subjects.json");

module.exports.search = async course => {
  const s_id = course.substring(0, 3).toUpperCase();
  const l_id = course.substring(0, 4).toUpperCase();
  let ID = "";

  // Check if id is short or long & loop through subjects
  for (let i = 0; i < subjects.length; i++) {
    if (s_id === subjects[i].subjectID) {
      ID = s_id;
    } else if (l_id === subjects[i].subjectID) {
      ID = l_id;
    }
  }

  // Launch puppeteer & go to class search
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto("https://pisa.ucsc.edu/class_search/index.php", {
    waitUntil: "networkidle0"
  });

  await page.setCacheEnabled(false);

  // Class Search ------------------------------------------------------

  // Fall quarter 2018
  const TERMS = "#term_dropdown";
  await page.select(TERMS, "2188");

  // All classes
  const STATUS = "#reg_status";
  await page.select(STATUS, "all");

  // Subject selected
  const SUBJECT = "#subject";
  await page.select(SUBJECT, ID);

  // Submit selection & wait for result page
  const SUBMIT = ".btn.btn-lg.btn-primary.btn-block";
  await page.click(SUBMIT);
  await page.waitForSelector(".panel-body");

  // Cycle through new page looking for a match
  const courseList = async function link_list() {
    const COURSE_LINK = await page.evaluate(course => {
      try {
        let result;
        // Get all course titles
        let items = document.querySelectorAll(
          "div.panel-heading.panel-heading-custom > h2 > a"
        );

        // Loop through course titles for match
        items.forEach(item => {
          let target = item.innerText
            .split(" ")
            .slice(0, 2)
            .join("");

          // On course match, get url of course
          if (target === course.toUpperCase()) {
            return (result = item.getAttribute("href").toString());
          }
        });

        // If no class found, fetch new page
        if (result === undefined) {
          let nav = Array.from(
            document.querySelectorAll(
              "div.panel-body > div.row > div.hide-print > a"
            )
          );

          if (nav[2].innerText.trim() === "next") {
            nav[2].classList.add("pagination");
            result = nav[2].getAttribute("class");
          }
        }

        // Return course link
        return result;
      } catch (e) {
        console.log(e);
      }
    }, course);

    // Return course if found
    if (COURSE_LINK != "pagination") {
      return COURSE_LINK;
    }

    // If no course found, go to next page
    await page.click(".pagination");
    await page.waitForSelector(".panel-body");
    return link_list();
  };

  // Get course link
  let LINK = await courseList();

  if (LINK === undefined) {
    return "No Course Found";
  }

  // Go to new course info page
  await page.goto(`https://pisa.ucsc.edu/class_search/${LINK}`);
  await page.waitForSelector("div.panel-group");

  // Class Info --------------------------------------------------------

  // Description, professor, availability, credits ...
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

      // Parse section information
      const sectionInfo = [];
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

      // Check length and return resulting query data
      result.push({
        courseID: course,
        meta: metaData,
        description: items[1].innerText,
        prereqs: items.length === 5 ? {} : items[2].innerText,
        notes: items.length === 5 ? items[2].innerText : items[3].innerText,
        lecture: lectureInfo,
        sections: sectionInfo
      });

      return result;
    } catch (e) {
      console.log(e);
    }
  }, course);

  browser.close();

  return COURSE_INFO;
};
