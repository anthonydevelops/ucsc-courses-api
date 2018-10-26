const data = require("./data");

describe("Tests class search functionality", () => {
  test("Class is found", () => {
    expect(data("AMS10")).toBeDefined();
  });
});
