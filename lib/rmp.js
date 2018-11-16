const puppeteer = require("puppeteer");

module.exports.getRating = async data => {
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

  // Remove all media, fonts, and images from rmp
  /*
   https://www.scrapehero.com/how-to-increase-web-scraping-speed-using-puppeteer/
   */
  await page.setRequestInterception(true);
  page.on("request", req => {
    if (
      req.resourceType() == "media" ||
      req.resourceType() == "font" ||
      req.resourceType() == "image"
    ) {
      req.abort();
    } else {
      req.continue();
    }
  });

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

  // Ratings dictionary
  const ratingDict = {};

  for (let i = 0; i < data.length; i++) {
    console.log(i, data[i].courseID);

    // Check to see lecture exists
    if (data[i].lecture != null || undefined) {
      const professor = data[i].lecture.instructor;

      // Check if professor listed
      if (professor !== "Staff" && professor !== "N/A") {
        if (ratingDict.hasOwnProperty(professor)) {
          const result = ratingDict[professor];
          data[i].lecture["profReview"] = result;
          continue;
        }

        // Parse prof name
        const name = professor.split(",");
        const lastName = name[0];
        const firstInitial = name[1].charAt(0);

        // Search prof
        await page.keyboard.type(lastName, 100);
        await page.waitFor(1000);

        // Finds & returns prof rating if applicable
        const searchProf = await page.evaluate(
          (lastName, firstInitial) => {
            try {
              // Result that'll store prof rating
              const result = {
                rating: null,
                amountReviewed: null
              };

              // Get all professors after input
              let instructors = document.querySelectorAll(
                ".side-panel > .result-list > ul > li"
              );

              // Loop through prof list & look for match
              instructors.forEach(elem => {
                const tokens = elem.innerText.split("\n");
                const professor = tokens[1].split(",");
                if (professor[0] === lastName) {
                  // If match, change result to reflect prof rating info
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

        data[i].lecture["profReview"] = searchProf;

        // Store in dict
        ratingDict[professor] = searchProf;

        // Remove previously searched name
        for (let i = 0; i < lastName.length; i++) {
          page.keyboard.down("Backspace");
        }
      } else {
        data[i].lecture["profReview"] = {
          rating: null,
          amountReviewed: null
        };
      }
    } else {
      continue;
    }
  }

  browser.close();

  return data;
};
