/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/src", "<rootDir>/site"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "\\.css$": "<rootDir>/site/test/styleStub.ts",
  },
  transform: { "^.+\\.[tj]sx?$": "babel-jest" },
};
