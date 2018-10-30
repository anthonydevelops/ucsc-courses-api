const search = require("./data").search;

describe("Tests class search functionality", () => {
  test("Class is found", () => {
    expect(search("AMS10")).toBeDefined();
  });
});
