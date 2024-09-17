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
        message:
          "chore(release):${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
        assets: ["CHANGELOG.md"],
      },
    ],
  ],
};

module.exports = config;