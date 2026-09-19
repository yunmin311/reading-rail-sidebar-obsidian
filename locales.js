/* Reading Rail Sidebar —— 界面字符串表。
   含面板内、弹窗内、Notice 与设置页的全部界面文字。 */

"use strict";

const COMMON = {
  zh: {
    "settings.language.name": "界面语言",
    "settings.language.desc":
      "设置页、命令与提示的显示语言。「跟随 Obsidian」会随界面语言自动切换。",
    "sponsor.title": "赞助支持",
    "sponsor.body":
      "这些插件都是独立开发并免费开源的，没有任何商业绑定。如果它确实省下了时间，可以通过 GitHub Sponsors 支持后续维护。",
    "meta.version": "版本",
    "meta.repository": "仓库",
    "common.reset": "恢复默认",
    "common.reset.done": "已恢复默认设置",
    "common.clear": "清除",
  },
  en: {
    "settings.language.name": "Interface language",
    "settings.language.desc":
      'Language for this settings page, commands and notices. "Follow Obsidian" tracks the app language.',
    "sponsor.title": "Sponsorship",
    "sponsor.body":
      "These plugins are built independently and released free and open-source, with no commercial tie-in. If one of them saves you time, you can support ongoing maintenance via GitHub Sponsors.",
    "meta.version": "Version",
    "meta.repository": "Repository",
    "common.reset": "Restore defaults",
    "common.reset.done": "Settings restored to defaults",
    "common.clear": "Clear",
  },
};

const OWN = {
  zh: {
    "meta.desc": "把阅读进度、标题导航与位置记忆放进右侧栏面板，并在正文右缘铺一列刻度。",

    "view.name": "轨道",

    "command.open": "打开阅读轨道面板",
    "command.toggle": "切换阅读轨道面板",
    "command.resume": "跳回本篇上次阅读位置",

    "notice.noRightLeaf": "无法打开右侧栏",
    "notice.noNote": "没有打开的笔记",
    "notice.noMemory": "这篇笔记还没有阅读记录",
    "notice.lastRead": "上次读到 {pct}%",
    "notice.previewOnly": "切到阅读视图后才能定位",

    "panel.empty": "打开一篇 Markdown 笔记以启用阅读轨道",
    "panel.noHeadings": "这篇笔记里没有可用的 H2 标题",
    "panel.previewHint": "实时预览下不跟踪进度，切到阅读视图即可",
    "panel.sectionCount": "{i} / {n} 节",
    "panel.sectionCountUnknown": "— / {n} 节",
    "panel.atTop": "（文首）",
    "panel.resumeHint": "上次读到 {pct}% · 跳回",

    "settings.usage":
      "面板只读地跟踪滚动，不修改正文。刻度条挂在正文容器上，点任意高度即跳到全篇对应位置。",
    "settings.level.name": "标题层级",
    "settings.level.desc": "面板里显示到哪一级标题（从 H2 起）。",
    "settings.level.opt2": "仅 H2",
    "settings.level.opt3": "H2–H3",
    "settings.level.opt4": "H2–H4",
    "settings.progress.name": "显示进度",
    "settings.progress.desc": "在面板顶部显示阅读百分比与进度条。",
    "settings.memory.name": "记忆阅读位置",
    "settings.memory.desc": "按文件保存读到的位置，下次打开时提示跳回。",
    "settings.fade.name": "读过的刻度变淡",
    "settings.fade.desc":
      "已滚过部分对应的刻度会缩短并变淡，留下阅读痕迹。默认关闭——开着会让整列刻度显得发灰、不清晰。",
    "settings.reset.name": "恢复默认设置",
    "settings.reset.desc": "把标题层级、进度显示、位置记忆与刻度变淡清回初始值。",
  },

  en: {
    "meta.desc":
      "Reading progress, heading navigation and position memory in a right-sidebar panel, plus a tick ruler along the note's right edge.",

    "view.name": "Rail",

    "command.open": "Open reading rail panel",
    "command.toggle": "Toggle reading rail panel",
    "command.resume": "Jump to last reading position",

    "notice.noRightLeaf": "Could not open the right sidebar",
    "notice.noNote": "No note is open",
    "notice.noMemory": "This note has no saved reading position yet",
    "notice.lastRead": "Last read {pct}%",
    "notice.previewOnly": "Switch to reading view before jumping",

    "panel.empty": "Open a Markdown note to enable the reading rail",
    "panel.noHeadings": "This note has no usable H2 headings",
    "panel.previewHint": "Progress is not tracked in live preview — switch to reading view",
    "panel.sectionCount": "{i} / {n} sections",
    "panel.sectionCountUnknown": "— / {n} sections",
    "panel.atTop": "(top of note)",
    "panel.resumeHint": "Last read {pct}% · jump back",

    "settings.usage":
      "The panel tracks scrolling read-only and never edits the note. The tick ruler hangs off the content container; click any height to jump to that position.",
    "settings.level.name": "Heading levels",
    "settings.level.desc": "How deep the panel lists headings (starting at H2).",
    "settings.level.opt2": "H2 only",
    "settings.level.opt3": "H2–H3",
    "settings.level.opt4": "H2–H4",
    "settings.progress.name": "Show progress",
    "settings.progress.desc": "Show the reading percentage and progress bar at the top of the panel.",
    "settings.memory.name": "Remember reading position",
    "settings.memory.desc":
      "Save the position per file and offer to jump back next time it opens.",
    "settings.fade.name": "Fade read ticks",
    "settings.fade.desc":
      "Ticks you have scrolled past shrink and fade, leaving a reading trail. Off by default — it makes the whole ruler look washed out.",
    "settings.reset.name": "Restore defaults",
    "settings.reset.desc":
      "Reset heading levels, progress display, position memory and tick fading.",
  },
};

module.exports = { LOCALES: buildLocales() };

/** 把公共表与本插件表合并；插件缺某语言时回落到英语。 */
function buildLocales() {
  const out = {};
  const langs = new Set([...Object.keys(COMMON), ...Object.keys(OWN)]);
  for (const lang of langs) {
    out[lang] = Object.assign(
      {},
      COMMON[lang] || COMMON.en,
      OWN[lang] || OWN.en
    );
  }
  return out;
}
