const puppeteer = require("puppeteer");
const subjects = require("./subjects/subjects.json");

const run = async course => {
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
  const browser = await puppeteer.launch({
    headless: false
  });

  const page = await browser.newPage();

  await page.goto("https://pisa.ucsc.edu/class_search/index.php", {
    waitUntil: "networkidle0"
  });

  await page.setCacheEnabled(false);

  // Class Search -----------------------------------------------------

  // Fall quarter 2018
  const TERMS = "#term_dropdown";
  await page.select(TERMS, "2188");

  // All classes
  const STATUS = "#reg_status";
  await page.select(STATUS, "all");

  // Subject inputted
  const SUBJECT = "#subject";
  await page.select(SUBJECT, ID);

  // Submit selection & wait for result page
  const SUBMIT = ".btn.btn-lg.btn-primary.btn-block";
  await page.click(SUBMIT);
  await page.waitForSelector(".panel-body");

  // Cycle through new page looking for a match
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
          result = item.getAttribute("href");
        }
      });

      // Return course link
      return result.toString();
    } catch (e) {
      console.log(e);
    }
  }, course);

  // Go to new course info page
  await page.goto(`https://pisa.ucsc.edu/class_search/${COURSE_LINK}`);
  await page.waitFor(2 * 1000);

  await page.screenshot({ path: "../screenshots/course.png" });
};

run("CMPS5J");
