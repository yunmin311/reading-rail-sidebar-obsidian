# Changelog

All notable changes to this plugin are documented here.
This project follows [Semantic Versioning](https://semver.org/).

## 0.2.2

- Sponsorship now points at GitHub Sponsors only; the previous
  international/China split (Ko-fi, 爱发电) has been removed.

## 0.2.1

- **Fixed: the plugin failed to load in Obsidian.** 0.2.0 split the code into
  sibling modules and pulled them in with `require("./i18n")`. Obsidian injects
  a whitelist `require` that resolves *only* `obsidian`, `@codemirror/*` and
  `@lezer/*`; anything else falls through to Electron's `window.require`, which
  resolves relative paths against Obsidian's install directory rather than the
  plugin folder. The call returned `undefined` and the plugin threw
  `Cannot destructure property 'bindI18n' of 'require(...)' as it is undefined.`
  The three modules are now inlined into `main.js`, which is self-contained.
  The readable sources are still shipped as `i18n.js` / `locales.js` /
  `sponsor.js` and are inlined by a packaging step.

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
