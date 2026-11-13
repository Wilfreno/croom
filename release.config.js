/**
 * Semantic versioning from commit messages, run by .github/workflows/release.yml
 * on every push to main:
 *
 *   fix: / perf: / revert:            -> patch  (1.0.16 -> 1.0.17)
 *   feat: / feature:                  -> minor  (1.0.16 -> 1.1.0)
 *   "BREAKING CHANGE:" footer, or "!"  -> major  (1.0.16 -> 2.0.0)
 *     after the type (feat!: ...)
 *
 * Anything else (chore, test, ci, refactor, style, docs, ...) releases nothing.
 * Each release tags vX.Y.Z, publishes a GitHub release, and commits the
 * updated CHANGELOG.md back to main.
 */

/** Changelog sections; hidden types still count toward the bump rules above. */
const types = [
  { type: 'feat', section: 'Features' },
  // This repo also writes features as `feature(scope): ...`.
  { type: 'feature', section: 'Features' },
  { type: 'fix', section: 'Bug Fixes' },
  { type: 'perf', section: 'Performance Improvements' },
  { type: 'revert', section: 'Reverts' },
  { type: 'refactor', section: 'Code Refactoring', hidden: true },
  { type: 'chore', hidden: true },
  { type: 'test', hidden: true },
  { type: 'ci', hidden: true },
  { type: 'style', hidden: true },
  { type: 'docs', hidden: true },
  { type: 'build', hidden: true },
  { type: 'version', hidden: true },
];

const preset = { preset: 'conventionalcommits', presetConfig: { types } };

const config = {
  branches: ['main'],
  tagFormat: 'v${version}',
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        ...preset,
        releaseRules: [
          { breaking: true, release: 'major' },
          { type: 'feat', release: 'minor' },
          { type: 'feature', release: 'minor' },
          { type: 'fix', release: 'patch' },
          { type: 'perf', release: 'patch' },
          { type: 'revert', release: 'patch' },
        ],
      },
    ],
    ['@semantic-release/release-notes-generator', preset],
    ['@semantic-release/changelog', { changelogFile: 'CHANGELOG.md' }],
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md'],
        message: 'version: ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ],
    '@semantic-release/github',
  ],
};

module.exports = config;
