const puppeteer = require("puppeteer");
const courses = require("./json/courses.json");
const helper = require("./helpers/course_helper");

const getRating = async professor => {
  // Launch w/ Adblock
  // https://gist.github.com/kaytwo/54909ad753aecfcba0cf8038ebfa9322
  const browser = await puppeteer.launch({
    defaultViewport: {
      width: 1200,
      height: 1200
    },
    headless: false,
    ignoreHTTPSErrors: true,
    ignoreDefaultArgs: true,
    args: [
      "--load-extension=C:/Users/Ender/Downloads/ublock/uBlock0.chromium",
      "--user-data-dir=C:/Users/Ender/Downloads/empty/"
    ]
  });

  const page = await browser.newPage();

  // UCSC RMP Page
  await page.goto(
    "https://www.ratemyprofessors.com/campusRatings.jsp?sid=1078#",
    {
      waitUntil: "networkidle0"
    }
  );

  // Click "School"
  await page.click("#schoolNav");
  // await page.waitForSelector(".result-list");

  // Click "Enter Your Professor's Name"
  await page.click("#professor-name");
  await page.keyboard.type(professor);
  await page.waitFor(1000);

  const PROFESSORS = await page.evaluate(() => {
    try {
      const result = [];

      let instructors = document.querySelectorAll(
        ".side-panel > .result-list > ul > li"
      );

      instructors.forEach(elem => {
        result.push(elem.innerText);
      });

      return result;
    } catch (e) {
      console.log(e);
    }
  });

  console.log(PROFESSORS);

  // browser.close();
};

getRating("mackey");
