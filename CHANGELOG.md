# Changelog

All notable changes to this plugin are documented here.
This project follows [Semantic Versioning](https://semver.org/).

## 0.1.1

Community-directory review fixes — no behavioural change.

- Progress-bar resets no longer assign a literal inline width; the bar is set
  through a single `setBarFill()` method so the value is always computed at
  runtime. Per-element static style assignments are rejected by the directory
  (`obsidianmd/no-static-styles-assignment`).
- The ticks container is created with Obsidian's `createDiv()` helper instead of
  `document.createElement()`, which resolves against the correct window in
  pop-out windows.

## 0.1.0

- Initial release.
- Right-sidebar panel: progress percentage, current heading, heading outline.
- Reading rail along the right edge, with tick length reflecting text density.
- Gaussian-smoothed density curve; uniform tick thickness.
- Drag or click the rail to scrub through the document.
- Per-file position memory with a one-click resume hint.
