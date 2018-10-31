const search = require("./data").search;

const load = async () => {
  const course1 = await search("cmps5j");
  const course2 = await search("ams131");
  const course3 = await search("phil1111");
  const course4 = await search("math21");

  return [course1, course2, course3, course4];
};

const temp1 = load[0];
const temp2 = load[1];
const temp3 = load[2];
const temp4 = load[3];

describe("Tests class search functionality", () => {
  test("Class is found", () => {
    expect(temp1).toBeDefined();
  });
  test("Class is found", () => {
    expect(temp2).toBeDefined();
  });
  test("Class is found", () => {
    expect(temp3).toBe("No Course Found");
  });
  test("Class is found", () => {
    expect(temp4).toBeDefined();
  });
});
