const config = {
  branches: [{ name: "main" }],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    ,
    "@semantic-release/github",
    [
      "@semantic-release/changelog",
      {
        changelogFile: "CHANGELOG.md",
      },
    ],

    [
      "@semantic-release/git",
      {
        assets: ["CHANGELOG.md"],
        message: "version: ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
      },
    ],
  ],
};

module.exports = config;
