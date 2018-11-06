"use strict";

const subjects = require("./subjects/subjects.json");
const terms = require("./terms/terms.json");

// Parses the subject of a course (i.e. AMS131 -> AMS)
module.exports.getSubject = course => {
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

  return ID;
};

module.exports.getTerm = term => {
  // Parse term information here ...
  let termID = "";

  for (let i = 0; i < terms.length; i++) {
    if (term === terms[i].termName) {
      termID = terms[i].termID;
    }
  }

  return termID;
};
