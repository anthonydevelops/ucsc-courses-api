const puppeteer = require("puppeteer");
const helper = require("./helper");

const getCoursesPerTerm = async (status, term) => {
  // Parse term name to term id
  const termID = helper.getTerm(term);
  console.log(termID);
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
  await page.select(TERM, "2182");

  const STATUS = "#reg_status";
  await page.select(STATUS, status);

  const SUBMIT = ".btn.btn-lg.btn-primary.btn-block";
  await page.click(SUBMIT);
  await page.waitForSelector(".panel-body");

  /*
   * Class Search ------------------------------------------------------
  */

  // Cycle through new page looking for a match
  const courseList = async function link_list() {
    const urls = [];

    const COURSE_LINK = await page.evaluate(() => {
      try {
        let result = [];

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
        if (nav[2].innerText.trim() === "next") {
          nav[2].classList.add("pagination");
        }

        // Return course link
        return {
          links: result,
          page: nav[2].classList
        };
      } catch (e) {
        console.log(e);
      }
    });

    // for (let i = 0; i < COURSE_LINK.links.length; i++) {
    //   urls.push(COURSE_LINK.links[i]);
    // }

    // Return course if found
    if (COURSE_LINK.page.contains("pagination")) {
      // If no course found, go to next page
      await page.click(".pagination");
      await page.waitForSelector(".panel-body");
      return link_list();
    }

    return COURSE_LINK;
  };

  let courseURLS = await courseList();
  browser.close();

  return courseURLS;
};

getCoursesPerTerm("all", "2018 Fall Quarter");
