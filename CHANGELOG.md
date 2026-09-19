# Changelog

All notable changes to this plugin are documented here.
This project follows [Semantic Versioning](https://semver.org/).

## 0.2.0

- Bilingual interface: settings page, the panel itself (empty state, heading
  count, resume hint), command names, the view title and every notice now ship
  in Chinese and English, with an in-settings language selector
  (`Auto` / `简体中文` / `English`). `Auto` follows Obsidian's own language.
  A further language is a pure data change in `locales.js`.
- Settings page footer with version and repository link, plus a sponsorship
  block listing international and China-friendly options.
- Restore-defaults button, which keeps the language choice (that preference is
  about the page itself) and drops the rail's saved reading positions.

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
