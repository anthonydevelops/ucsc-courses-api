const puppeteer = require("puppeteer");

module.exports.getRating = async professor => {
  // Parse professor name
  if (professor === null || professor === undefined) {
    return null;
  }

  const name = professor.split(",");

  // Last name
  const lastName = name[0];

  // First initial
  const firstInitial = name[1].charAt(0);

  // Launch w/ Ublock to remove ads and popups/overlays
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

  // Click "Enter Your Professor's Name"
  await page.click("#professor-name");
  await page.keyboard.type(lastName);
  await page.waitFor(1000);

  // Searches & returns prof rating
  const searchProf = await page.evaluate(
    (lastName, firstInitial) => {
      try {
        const result = {
          rating: null,
          amountReviewed: null
        };

        let instructors = document.querySelectorAll(
          ".side-panel > .result-list > ul > li"
        );

        instructors.forEach(elem => {
          const tokens = elem.innerText.split("\n");
          const professor = tokens[1].split(",");
          if (professor[0] === lastName) {
            if (professor[1].charAt(1) === firstInitial) {
              result.rating = tokens[0];
              result.amountReviewed = tokens[2];
            }
          }
        });

        return result;
      } catch (e) {
        console.log(e);
      }
    },
    lastName,
    firstInitial
  );

  browser.close();

  return searchProf;
};
