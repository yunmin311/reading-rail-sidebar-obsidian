/* Reading Rail Sidebar
   把"阅读进度 + 标题导航"从浮层搬进右侧栏面板。

   设计原则：
   1. 只用 Obsidian 公开 API —— 标题取自 metadataCache，跳转走 currentMode.applyScroll，
      不依赖任何第三方插件的私有 DOM / class，因此不受 crisp-reading-rail 更新影响。
   2. 所有 DOM 挂在固定前缀 .rrs- 下，样式全部 scoped，不污染其它插件与主题。
   3. 只读地观察阅读视图滚动，不修改正文、不改动任何其它配置。

   与 crisp-reading-rail 的分工：本插件接管"进度 + 标题导航 + 位置记忆"，
   原来的浮层轨道可以自行停用，互不干扰（本插件不会去动它）。
*/

"use strict";

const {
  Plugin,
  PluginSettingTab,
  Setting,
  Notice,
  ItemView,
  MarkdownView,
} = require("obsidian");


/* ============================================================
   【内联模块 · 自动生成，请勿手改这一段】
   ------------------------------------------------------------
   以下三段来自仓库里的 locales.js / i18n.js / sponsor.js，
   由打包脚本 bundle-inline.js 拼接到此（脚本在 _scratch/_i18n/）。

   为什么不写 require("./locales")：
   Obsidian 注入的 require 是白名单函数，只认 obsidian / @codemirror /
   @lezer 与 Electron 的 window.require，**不解析插件的相对路径** ——
   require("./x") 会返回 undefined，插件直接加载失败。

   改动流程：改源文件 → node bundle-inline.js <插件目录> → 跑 sync-plugins.ps1
   ============================================================ */

/* ---------- 来自 locales.js ---------- */
/* Reading Rail Sidebar —— 界面字符串表。
   含面板内、弹窗内、Notice 与设置页的全部界面文字。 */

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
const LOCALES = buildLocales();
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

/* ---------- 来自 i18n.js ---------- */
/* i18n —— 多语言运行时。

   为什么不用 Obsidian 的 moment.locale()：moment 只管日期格式化，不提供
   界面字符串表；而且用户在设置页切语言要即时生效，moment 的切换要等界面重建。

   设计约束：
   - t() 永不抛异常：缺键回落到英语，英语也缺就返回键名本身。
     设置页少一行字，好过整页白屏。
   - 支持 {name} 占位符；参数没给就原样保留，方便定位漏传。
   - 界面字符串全部集中在 locales.js，main.js 里不留字面量。

   这份 i18n.js 在四个自研插件里是同一份（各自复制，因为插件是独立仓库、
   不能互相 require）。改动请四处同步。 */

/** 设置页语言下拉框的定义顺序。 */
const LANGUAGE_OPTIONS = [
  { id: "auto", label: "跟随 Obsidian / Follow Obsidian" },
  { id: "zh", label: "简体中文" },
  { id: "en", label: "English" },
];

/**
 * 把偏好解析成实际语言 id。
 * "auto" 时读 Obsidian 的界面语言；任何异常都回落到英语 ——
 * 语言探测失败不值得让设置页打不开。
 */
function resolveLanguage(pref) {
  if (pref && pref !== "auto" && LOCALES[pref]) return pref;
  try {
    const raw =
      window.localStorage.getItem("language") ||
      document.documentElement.lang ||
      "";
    const short = String(raw).toLowerCase().slice(0, 2);
    if (short && LOCALES[short]) return short;
  } catch (e) {
    /* 忽略：回落英语 */
  }
  return "en";
}

function translate(lang, key, vars) {
  const table = LOCALES[lang] || LOCALES.en;
  let s = table[key];
  if (s === undefined) {
    const fb = LOCALES.en[key];
    s = fb === undefined ? key : fb;
  }
  if (!vars) return s;
  return String(s).replace(/\{(\w+)\}/g, (m, name) =>
    vars[name] === undefined ? m : String(vars[name])
  );
}

/** 绑定插件实例：读 settings.language，暴露 t()。 */
function bindI18n(plugin) {
  const current = () =>
    resolveLanguage(plugin && plugin.settings ? plugin.settings.language : "auto");

  plugin.i18n = {
    get resolved() {
      return current();
    },
    t(key, vars) {
      return translate(current(), key, vars);
    },
    options: LANGUAGE_OPTIONS,
  };
  return plugin.i18n;
}

/* ---------- 来自 sponsor.js ---------- */
/* 赞助区块。
 *
 * 刻意做成一个独立小节而不是塞进说明文字里：设置页是用户唯一会认真读的
 * 地方，藏起来等于没有。区块只渲染链接，不引任何外部脚本或图片 ——
 * 插件必须保持零网络请求，否则会在社区市场审核时被质疑。
 *
 * 为什么只有 GitHub Sponsors 一条：
 *   最初国内 / 海外分列（爱发电 + Ko-fi），但 qy 决定统一走 GitHub ——
 *   单一入口便于维护，也避免在插件里出现多个可能失效/需要实名认证的平台。
 *   保留 SPONSORS 数组结构（而不是塌成一个字符串），是为了将来真要加
 *   第二条时改数据即可，不用动渲染代码。
 */

const SPONSORS = [
  { label: "GitHub Sponsors", url: "https://github.com/sponsors/yunmin311" },
];

function linkRow(parent, label, url) {
  const a = parent.createEl("a", { cls: "sp-link", text: label, href: url });
  a.setAttr("target", "_blank");
  a.setAttr("rel", "noopener");
}

/** 在 parent 里渲染赞助区块。t 是当前语言的取词函数。 */
function renderSponsor(parent, t) {
  const box = parent.createDiv({ cls: "sp-box" });
  box.createDiv({ cls: "sp-title", text: t("sponsor.title") });
  box.createDiv({ cls: "sp-body", text: t("sponsor.body") });

  const row = box.createDiv({ cls: "sp-row" });
  for (const l of SPONSORS) linkRow(row, l.label, l.url);
}

/* ======================== 内联模块结束 ======================== */
const VIEW_TYPE = "reading-rail-sidebar";
const RIBBON_ICON = "align-vertical-space-around";

const DEFAULTS = {
  maxLevel: 3,
  showProgress: true,
  rememberPosition: true,
  // 「读过的刻度变灰」默认关 —— qy：它会把整列刻度压得看不清。
  // 想要阅读痕迹时，在设置里打开即可（default false，不是删掉）。
  ticksReadFade: false,
  // 界面语言：auto / zh / en（见 i18n.js）。
  language: "auto",
};

const MEMORY_LIMIT = 300;
const SAVE_DELAY_MS = 900;
const ANCHOR_OFFSET = 28;
const RESUME_MIN_DELTA = 0.05;

class ReadingRailView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.file = null;
    this.docView = null;
    this.lastView = null;
    this.resumeKey = null;
    this.headings = [];
    this.itemEls = [];
    this.headingEls = [];
    this.activeIndex = -1;
    this.scroller = null;
    this.onScroll = null;
    this.frame = null;
    this.saveTimer = null;
    this.pendingProgress = null;
  }

  getViewType() {
    return VIEW_TYPE;
  }

  getDisplayText() {
    return this.plugin.i18n.t("view.name");
  }

  getIcon() {
    return RIBBON_ICON;
  }

  async onOpen() {
    this.buildSkeleton();

    this.registerEvent(
      this.app.workspace.on("file-open", () => this.refresh())
    );
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", (leaf) => {
        if (leaf && leaf.view instanceof MarkdownView) this.refresh();
      })
    );
    // 阅读/实时预览切换不会触发上面两个事件，但会触发 layout-change。
    // 同一篇笔记时只重挂滚动监听，避免整棵树重建导致闪烁。
    this.registerEvent(
      this.app.workspace.on("layout-change", () => {
        if (!this.file) return;
        const view = this.resolveMarkdownView();
        if (view && view.file && this.file && view.file.path === this.file.path) {
          this.docView = view;
          this.attachScroll();
          this.updateProgress();
        } else {
          this.refresh();
        }
      })
    );
    this.registerEvent(
      this.app.metadataCache.on("changed", (file) => {
        if (this.file && file.path === this.file.path) this.refresh();
      })
    );

    this.refresh();
  }

  async onClose() {
    this.detachScroll();
    this.flushMemory();
  }

  /* ---------- 骨架 ---------- */

  buildSkeleton() {
    const root = this.contentEl;
    root.empty();
    root.addClass("rrs-root");

    const head = root.createDiv({ cls: "rrs-head" });
    const row = head.createDiv({ cls: "rrs-head-row" });
    this.percentEl = row.createSpan({ cls: "rrs-percent", text: "—" });
    this.countEl = row.createSpan({ cls: "rrs-count", text: "" });

    this.barEl = head.createDiv({ cls: "rrs-bar" });
    this.barFillEl = this.barEl.createDiv({ cls: "rrs-bar-fill" });

    this.currentEl = head.createDiv({ cls: "rrs-current", text: "" });
    this.resumeEl = head.createDiv({ cls: "rrs-resume" });

    this.treeEl = root.createDiv({ cls: "rrs-tree" });
  }

  /* ---------- 数据 ---------- */

  resolveMarkdownView() {
    const active = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (active) {
      this.lastView = active;
      return active;
    }
    // 点侧栏会把 active leaf 抢走，回退到上一次的 Markdown 视图
    const last = this.lastView;
    if (last && last.containerEl && last.containerEl.isConnected) return last;

    // 面板刚打开时可能还没有 lastView，从已打开的 md 视图里挑一个
    const leaves = this.app.workspace.getLeavesOfType("markdown");
    for (const leaf of leaves) {
      if (leaf.view instanceof MarkdownView && leaf.view.file) {
        this.lastView = leaf.view;
        return leaf.view;
      }
    }
    return null;
  }

  collectHeadings(file) {
    const cache = this.app.metadataCache.getFileCache(file);
    const raw = (cache && cache.headings) || [];
    const max = this.plugin.settings.maxLevel;
    return raw
      .filter((h) => h.level >= 2 && h.level <= max)
      .sort((a, b) => a.position.start.line - b.position.start.line);
  }

  getScroller() {
    const view = this.docView;
    if (!view) return null;
    try {
      if (view.getMode && view.getMode() === "preview") {
        return view.previewMode.containerEl.querySelector(".markdown-preview-view");
      }
      return view.containerEl.querySelector(".cm-scroller");
    } catch (e) {
      return null;
    }
  }

  /* ---------- 渲染 ---------- */

  refresh() {
    const view = this.resolveMarkdownView();
    const file = view ? view.file : this.app.workspace.getActiveFile();

    if (!view || !file || !file.path || file.extension !== "md") {
      if (this.file) this.flushMemory();
      this.file = null;
      this.docView = null;
      this.detachScroll();
      this.renderEmpty(this.plugin.i18n.t("panel.empty"));
      return;
    }

    const switched = !this.file || this.file.path !== file.path;
    if (switched) this.flushMemory();

    this.file = file;
    this.docView = view;
    this.resumeKey = null;
    this.headings = this.collectHeadings(file);
    this.activeIndex = -1;
    this.renderTree();
    this.attachScroll();
    this.updateProgress();
  }

  renderEmpty(message) {
    this.headings = [];
    this.itemEls = [];
    this.resumeKey = null;
    this.treeEl.empty();
    this.treeEl.createDiv({ cls: "rrs-note", text: message });
      this.percentEl.setText("—");
      this.setBarFill(0);
    this.countEl.setText("");
    this.currentEl.setText("");
    this.resumeEl.empty();
  }

  renderTree() {
    this.treeEl.empty();
    this.itemEls = [];
    this.activeIndex = -1;

    if (!this.headings.length) {
      this.treeEl.createDiv({
        cls: "rrs-note",
        text: this.plugin.i18n.t("panel.noHeadings"),
      });
      return;
    }

    for (let i = 0; i < this.headings.length; i++) {
      const h = this.headings[i];
      const el = this.treeEl.createDiv({ cls: "rrs-item rrs-l" + h.level });
      // metadataCache 给的是原始 markdown 文本：[[页|别名]] 要显示成「别名」、
      // [[页]] 显示成「页」，否则面板里会直接露出双链语法。
      el.createSpan({
        cls: "rrs-item-text",
        text: this.displayHeading(h.heading),
      });
      el.dataset.line = String(h.position.start.line);
      el.addEventListener("click", () => this.goTo(i));
      this.itemEls.push(el);
    }
  }

  /** 把标题里的 wiki 链接还原成可读文本 */
  displayHeading(raw) {
    return String(raw || "")
      .replace(/\[\[[^\]|]*\|([^\]]+)\]\]/g, "$1")
      .replace(/\[\[([^\]]+)\]\]/g, "$1");
  }

  /* ---------- 滚动跟踪 ---------- */

  attachScroll() {
    const scroller = this.getScroller();
    if (scroller === this.scroller) return;
    this.detachScroll();
    this.scroller = scroller;
    if (!scroller) return;

    this.onScroll = () => {
      if (this.frame !== null) return;
      this.frame = window.requestAnimationFrame(() => {
        this.frame = null;
        this.updateProgress();
      });
    };
    scroller.addEventListener("scroll", this.onScroll, { passive: true });
    this.collectHeadingEls();
  }

  detachScroll() {
    if (this.scroller && this.onScroll) {
      this.scroller.removeEventListener("scroll", this.onScroll);
    }
    if (this.frame !== null) {
      window.cancelAnimationFrame(this.frame);
      this.frame = null;
    }
    this.scroller = null;
    this.onScroll = null;
    this.headingEls = [];
  }

  collectHeadingEls() {
    this.headingEls = [];
    if (!this.scroller) return;
    const max = this.plugin.settings.maxLevel;
    const sel = [];
    for (let l = 2; l <= max; l++) sel.push("h" + l);
    try {
      this.headingEls = Array.from(this.scroller.querySelectorAll(sel.join(",")));
    } catch (e) {
      this.headingEls = [];
    }
  }

  findActiveIndex() {
    if (!this.scroller) return -1;
    if (!this.headingEls.length && this.headings.length) this.collectHeadingEls();
    if (!this.headingEls.length) return -1;

    const scrollerTop = this.scroller.getBoundingClientRect().top;
    const anchor = scrollerTop + ANCHOR_OFFSET;
    let idx = -1;
    for (let i = 0; i < this.headingEls.length; i++) {
      const rect = this.headingEls[i].getBoundingClientRect();
      if (rect.top <= anchor) idx = i;
      else break;
    }
    if (idx >= this.headings.length) idx = this.headings.length - 1;
    return idx;
  }

  /**
   * 进度条填充宽度集中在一处设置。
   *
   * 不把重置写成散落的字面量赋值（形如 元素.style.某属性 = "0%"）：逐元素的静态
   * 样式赋值会被目录审查的 obsidianmd/no-static-styles-assignment 判为错误 ——
   * 值必须是运行时算出来的，或者交给 CSS 类。走一个方法既满足这条，也去掉了重复。
   */
  setBarFill(pct) {
    this.barFillEl.style.width = pct + "%";
  }

  updateProgress() {
    const scroller = this.scroller;

    if (!scroller) {
      this.percentEl.setText("—");
      this.setBarFill(0);
      this.countEl.setText("");
      this.currentEl.setText(this.plugin.i18n.t("panel.previewHint"));
      this.resumeEl.empty();
      return;
    }

    const maxScroll = scroller.scrollHeight - scroller.clientHeight;
    const progress =
      maxScroll > 0
        ? Math.min(1, Math.max(0, scroller.scrollTop / maxScroll))
        : 0;

    if (this.plugin.settings.showProgress) {
      const pct = Math.round(progress * 100);
      this.percentEl.setText(pct + "%");
      this.setBarFill(pct);
    }

    this.setActive(this.findActiveIndex());
    this.renderResumeHint(progress);

    if (this.plugin.settings.rememberPosition) {
      this.scheduleMemory(progress);
    }
  }

  setActive(index) {
    if (this.activeIndex === index) return;
    const prev = this.itemEls[this.activeIndex];
    if (prev) prev.removeClass("is-active");

    this.activeIndex = index;
    const el = this.itemEls[index];
    if (el) {
      el.addClass("is-active");
      this.scrollItemIntoView(el);
      this.currentEl.setText(this.headings[index].heading);
      this.countEl.setText(
        this.plugin.i18n.t("panel.sectionCount", {
          i: index + 1,
          n: this.headings.length,
        })
      );
    } else {
      this.currentEl.setText(
        this.headings.length ? this.plugin.i18n.t("panel.atTop") : ""
      );
      this.countEl.setText(
        this.headings.length
          ? this.plugin.i18n.t("panel.sectionCountUnknown", {
              n: this.headings.length,
            })
          : ""
      );
    }
  }

  scrollItemIntoView(el) {
    const tree = this.treeEl;
    if (!tree) return;
    const top = el.offsetTop;
    const bottom = top + el.offsetHeight;
    if (top < tree.scrollTop) {
      tree.scrollTop = Math.max(0, top - 8);
    } else if (bottom > tree.scrollTop + tree.clientHeight) {
      tree.scrollTop = bottom - tree.clientHeight + 8;
    }
  }

  /* ---------- 交互 ---------- */

  goTo(index) {
    const h = this.headings[index];
    const view = this.docView;
    if (!h || !view) return;

    const line = h.position.start.line;
    let ok = false;
    try {
      const mode = view.currentMode;
      if (mode && typeof mode.applyScroll === "function") {
        ok = mode.applyScroll(line) !== false;
      }
    } catch (e) {
      ok = false;
    }
    if (!ok) {
      try {
        view.previewMode.applyScroll(line);
      } catch (e) {
        /* 视图尚未就绪时静默跳过 */
      }
    }
  }

  resumeTo(progress) {
    const scroller = this.scroller;
    if (!scroller) {
      new Notice(this.plugin.i18n.t("notice.previewOnly"));
      return;
    }
    const maxScroll = scroller.scrollHeight - scroller.clientHeight;
    if (maxScroll <= 0) return;
    scroller.scrollTo({
      top: Math.round(progress * maxScroll),
      behavior: "smooth",
    });
  }

  renderResumeHint(progress) {
    const clear = () => {
      if (this.resumeKey !== null) {
        this.resumeEl.empty();
        this.resumeKey = null;
      }
    };

    if (!this.plugin.settings.rememberPosition || !this.file) return clear();

    const mem = this.plugin.getMemory(this.file.path);
    if (!mem || typeof mem.progress !== "number") return clear();
    // 离得够远才值得提示（< 5% 说明本来就在上次的位置附近）
    if (Math.abs(mem.progress - progress) < RESUME_MIN_DELTA) return clear();

    // 滚动是每帧调用的，这里只在百分比真的变化时才重建 DOM
    const key = Math.round(mem.progress * 100);
    if (key === this.resumeKey) return;
    this.resumeKey = key;

    this.resumeEl.empty();
    const btn = this.resumeEl.createSpan({
      cls: "rrs-resume-btn",
      text: this.plugin.i18n.t("panel.resumeHint", { pct: key }),
    });
    btn.addEventListener("click", () => this.resumeTo(mem.progress));
  }

  /* ---------- 位置记忆 ---------- */

  scheduleMemory(progress) {
    this.pendingProgress = progress;
    if (this.saveTimer !== null) return;
    this.saveTimer = window.setTimeout(() => {
      this.saveTimer = null;
      this.flushMemory();
    }, SAVE_DELAY_MS);
  }

  flushMemory() {
    if (this.saveTimer !== null) {
      window.clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    if (this.pendingProgress === null || !this.file) return;
    const progress = this.pendingProgress;
    this.pendingProgress = null;
    const heading = this.headings[this.activeIndex];
    this.plugin.setMemory(
      this.file.path,
      progress,
      heading ? heading.heading : ""
    );
  }
}

class ReadingRailSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    const t = (k, v) => this.plugin.i18n.t(k, v);
    containerEl.empty();
    containerEl.createEl("h3", { text: "Reading Rail" });

    new Setting(containerEl)
      .setName(t("settings.language.name"))
      .setDesc(t("settings.language.desc"))
      .addDropdown((drop) => {
        for (const opt of this.plugin.i18n.options) {
          drop.addOption(opt.id, opt.label);
        }
        drop.setValue(this.plugin.settings.language || "auto").onChange(
          async (value) => {
            this.plugin.settings.language = value;
            await this.plugin.saveAll();
            this.refreshViews();
            this.display();
          }
        );
      });

    containerEl.createDiv({ cls: "rrs-usage" }, (el) => {
      el.createEl("p", { text: t("settings.usage") });
    });

    new Setting(containerEl)
      .setName(t("settings.level.name"))
      .setDesc(t("settings.level.desc"))
      .addDropdown((drop) =>
        drop
          .addOption("2", t("settings.level.opt2"))
          .addOption("3", t("settings.level.opt3"))
          .addOption("4", t("settings.level.opt4"))
          .setValue(String(this.plugin.settings.maxLevel))
          .onChange(async (value) => {
            this.plugin.settings.maxLevel = Number(value);
            await this.plugin.saveAll();
            this.refreshViews();
          })
      );

    new Setting(containerEl)
      .setName(t("settings.progress.name"))
      .setDesc(t("settings.progress.desc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showProgress)
          .onChange(async (value) => {
            this.plugin.settings.showProgress = value;
            await this.plugin.saveAll();
            this.refreshViews();
          })
      );

    new Setting(containerEl)
      .setName(t("settings.memory.name"))
      .setDesc(t("settings.memory.desc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.rememberPosition)
          .onChange(async (value) => {
            this.plugin.settings.rememberPosition = value;
            await this.plugin.saveAll();
          })
      );

    new Setting(containerEl)
      .setName(t("settings.fade.name"))
      .setDesc(t("settings.fade.desc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.ticksReadFade)
          .onChange(async (value) => {
            this.plugin.settings.ticksReadFade = value;
            await this.plugin.saveAll();
            // 关掉时要把已加上的 is-read 全部清掉，否则残留在 DOM 上
            if (!value) {
              const base = this.ticksBaseEl;
              if (base) {
                for (const tk of base.children) tk.classList.remove("is-read");
              }
            } else {
              this.updateTicks();
            }
          })
      );

    new Setting(containerEl)
      .setName(t("settings.reset.name"))
      .setDesc(t("settings.reset.desc"))
      .addButton((b) =>
        b.setButtonText(t("common.reset")).onClick(async () => {
          // 语言是「这一页本身」的偏好，恢复默认时刻意保留，
          // 否则中文用户点一下按钮界面就变成英文了。
          const keepLang = this.plugin.settings.language;
          this.plugin.settings = Object.assign({}, DEFAULTS, {
            language: keepLang,
          });
          await this.plugin.saveAll();
          this.refreshViews();
          new Notice(t("common.reset.done"));
          this.display();
        })
      );

    this.renderFooter(containerEl, t);
  }

  /** 版本 + 仓库 + 赞助。四个插件共用同一套结构与文案。 */
  renderFooter(containerEl, t) {
    const wrap = containerEl.createDiv({ cls: "rrs-about" });

    const meta = wrap.createDiv({ cls: "rrs-about-meta" });
    meta.createSpan({
      text: `${t("meta.version")} ${this.plugin.manifest.version}`,
    });
    meta.createSpan({ cls: "rrs-about-sep", text: "·" });
    const repo = meta.createEl("a", {
      text: this.plugin.manifest.id,
      href: `https://github.com/yunmin311/${this.plugin.manifest.id}-obsidian`,
    });
    repo.setAttr("target", "_blank");
    repo.setAttr("rel", "noopener");

    renderSponsor(wrap, t);
  }

  refreshViews() {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE);
    for (const leaf of leaves) {
      if (leaf.view && typeof leaf.view.refresh === "function") {
        leaf.view.refresh();
      }
    }
  }
}

class ReadingRailSidebarPlugin extends Plugin {
  async onload() {
    const saved = (await this.loadData()) || {};
    this.settings = Object.assign({}, DEFAULTS, saved.settings || {});
    this.memory = saved.memory || {};

    bindI18n(this);
    const t = (k, v) => this.i18n.t(k, v);

    this.registerView(VIEW_TYPE, (leaf) => new ReadingRailView(leaf, this));

    this.setupTicks();

    this.addRibbonIcon(RIBBON_ICON, t("command.open"), () => {
      this.activateView();
    });

    this.addCommand({
      id: "open-rail-panel",
      name: t("command.open"),
      callback: () => this.activateView(),
    });

    this.addCommand({
      id: "toggle-rail-panel",
      name: t("command.toggle"),
      callback: () => this.toggleView(),
    });

    this.addCommand({
      id: "resume-last-position",
      name: t("command.resume"),
      callback: () => this.resumeActiveFile(),
    });

    this.addSettingTab(new ReadingRailSettingTab(this.app, this));
  }

  onunload() {
    this.teardownTicks();
    // 插件被禁用时把面板一并收掉，避免留下一个渲染不出来的空 leaf。
    // 面板位置由 workspace 自己记；重新启用后从 ribbon / 命令再打开即可。
    this.app.workspace.detachLeavesOfType(VIEW_TYPE);
  }

  async saveAll() {
    await this.saveData({ settings: this.settings, memory: this.memory });
  }

  getMemory(path) {
    return this.memory[path] || null;
  }

  setMemory(path, progress, heading) {
    this.memory[path] = {
      progress,
      heading: heading || "",
      updatedAt: Date.now(),
    };

    const keys = Object.keys(this.memory);
    if (keys.length > MEMORY_LIMIT) {
      keys.sort(
        (a, b) =>
          ((this.memory[a] && this.memory[a].updatedAt) || 0) -
          ((this.memory[b] && this.memory[b].updatedAt) || 0)
      );
      for (const key of keys.slice(0, keys.length - MEMORY_LIMIT)) {
        delete this.memory[key];
      }
    }
    this.saveAll();
  }

  async activateView() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf) {
      leaf = workspace.getRightLeaf(false);
      if (!leaf) {
        new Notice(this.i18n.t("notice.noRightLeaf"));
        return;
      }
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }
    workspace.revealLeaf(leaf);
  }

  toggleView() {
    const leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (leaf) {
      leaf.detach();
    } else {
      this.activateView();
    }
  }

  async resumeActiveFile() {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    const file = view ? view.file : this.app.workspace.getActiveFile();
    if (!file || !file.path) {
      new Notice(this.i18n.t("notice.noNote"));
      return;
    }
    const mem = this.getMemory(file.path);
    if (!mem || typeof mem.progress !== "number") {
      new Notice(this.i18n.t("notice.noMemory"));
      return;
    }

    await this.activateView();

    const leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
    const rail = leaf && leaf.view;
    if (rail && typeof rail.resumeTo === "function") {
      // 面板可能是刚创建的，等它走完 onOpen 与首次定位再跳
      window.setTimeout(() => rail.resumeTo(mem.progress), 120);
    } else {
      new Notice(
        this.i18n.t("notice.lastRead", { pct: Math.round(mem.progress * 100) })
      );
    }
  }

  /* ---------- 右侧刻度条 ----------
     在阅读视图右缘铺一列均匀的短横线，用来取代原生的上下滚动条
     （原生滚动条由 styles.css 隐掉）。刻度不带语义，就是一把尺子：
     点任意高度即跳到全篇对应百分比，当前所在位置有一条高亮杠跟着走。 */

  setupTicks() {
    this.app.workspace.onLayoutReady(() => this.refreshTicks());
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => this.refreshTicks())
    );
    this.registerEvent(
      this.app.workspace.on("layout-change", () => this.refreshTicks())
    );
  }

  /** 找到当前 Markdown 视图与它的 scroller，必要时重挂刻度条 */
  refreshTicks() {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view || !view.containerEl) return this.teardownTicks();

    // 关键：挂在 .view-content 上，而不是 view.containerEl。
    // containerEl 里包含着顶部的 view-header（文件名 + 编辑/阅读切换按钮），
    // 浮层挂在它上面，一旦位置算不准就会盖住那排按钮、连点都点不到。
    // .view-content 是纯正文容器，边界干净。找不到就干脆不挂。
    const host = view.containerEl.querySelector(".view-content");
    if (!host) return this.teardownTicks();

    let scroller = null;
    try {
      scroller =
        view.getMode && view.getMode() === "preview"
          ? view.previewMode.containerEl.querySelector(".markdown-preview-view")
          : view.containerEl.querySelector(".cm-scroller");
    } catch (e) {
      scroller = null;
    }
    if (!scroller) return this.teardownTicks();

    this.ticksFilePath = view.file ? view.file.path : "";

    // 同一视图 + 同一 scroller：只重算尺寸与位置，不重建 DOM
    if (this.ticksHost === host && this.ticksScroller === scroller) {
      this.paintTicks();
      this.updateTicks();
      return;
    }

    this.teardownTicks();
    this.ticksHost = host;
    this.ticksScroller = scroller;

    const el = createDiv();
    el.className = "rrs-ticks";
    host.appendChild(el);
    this.ticksEl = el;
    this.attachTicksDrag();

    this.ticksOnScroll = () => {
      if (this.ticksFrame !== null) return;
      this.ticksFrame = window.requestAnimationFrame(() => {
        this.ticksFrame = null;
        this.updateTicks();
      });
    };
    scroller.addEventListener("scroll", this.ticksOnScroll, { passive: true });

    this.paintTicks();
    this.updateTicks();
  }

  /** 铺刻度：轨道线 + 基础刻度（均匀）+ 标题刻度（按文中位置落点） */
  paintTicks() {
    const el = this.ticksEl;
    if (!el) return;

    const h = el.clientHeight || 0;
    // 每约 16px 一根（原 24px，qy 要求根数 ×1.5）
    const count = Math.max(24, Math.min(120, Math.round(h / 16) || 24));
    if (count !== this.ticksCount || !el.childElementCount) {
      el.empty();

      const base = el.createDiv({ cls: "rrs-ticks__base" });
      for (let i = 0; i < count; i++) {
        base.createDiv({ cls: "rrs-ticks__tick" });
      }
      this.ticksBaseEl = base;
      this.ticksHeadEl = el.createDiv({ cls: "rrs-ticks__heads" });
      this.ticksNowEl = el.createDiv({ cls: "rrs-ticks__now" });
      this.ticksCount = count;
    }

    // 密度驱动：长度反映该处的文本密度
    this.paintDensity();

    this.paintHeads();
  }

  /**
   * 按「该处的文本密度」给每根刻度定长 —— 内容密的地方长、稀的地方短，
   * 效果类似 B站 / YouTube 进度条底下那条峰值曲线，但仍以刻度的形式呈现。
   */
  paintDensity() {
    const base = this.ticksBaseEl;
    if (!base) return;
    const ticks = base.children;
    const count = ticks.length;
    if (!count) return;

    const raw = this.computeDensity(count);
    if (!raw) return;

    // 平滑：原始统计是「一格一值」的阶梯，相邻两格可能差好几倍，直接画出来
    // 就是 qy 说的「拔地而起、没有过渡」。用高斯核卷一下，得到宽缓的峰谷 ——
    // 就是视频播放器进度条底下那条热度曲线的形状。核宽跟着刻度根数走：
    // 刻度越密，峰也要越宽，否则会碎成锯齿（试过固定 3 点均值，密了还是锯齿）。
    const sums = this.smoothDensity(raw, Math.max(1.2, count / 22));

    // 归一化端点取 p8 / p92，不是 min / max —— 一个超长块会把整条曲线压平
    // （其余刻度全挤在最矮那档，等于没有峰谷），掐掉两端离群值后起伏才拉得开。
    const sorted = sums.slice().sort((a, b) => a - b);
    const lo = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.08))];
    const hi = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.92))];
    const span = hi - lo || 1;

    // 最短的那档（MIN_W）不动，只把「超出最短的部分」整体压短 ——
    // 压的是幅度（26px → 20px），不是等比缩放整根，所以最长档从 34 收到 28。
    const MIN_W = 8; // 最稀处（保持不变）
    const MAX_W = 28; // 最密处（原 34，qy 要求整体缩短）

    for (let i = 0; i < count; i++) {
      let t = (sums[i] - lo) / span;
      t = Math.max(0, Math.min(1, t));
      // gamma 0.85：把中段略微抬高。1.0 时矮处几乎全平看不出起伏，
      // 试过 0.6 又会让大片刻度顶到最长，反而糊成一片。
      t = Math.pow(t, 0.85);
      ticks[i].style.width = (MIN_W + t * (MAX_W - MIN_W)).toFixed(1) + "px";
    }
  }

  /**
   * 高斯平滑：把阶梯状的原始密度磨成有起伏的峰谷。
   * 半径取 2.5σ（覆盖 98.7% 权重）；边缘用钳位取值，
   * 否则首尾会被"没有数据"拉成向下的斜坡。
   */
  smoothDensity(arr, sigma) {
    const n = arr.length;
    if (!n) return arr;

    const radius = Math.max(
      1,
      Math.min(Math.floor(n / 2), Math.round(sigma * 2.5))
    );
    const kernel = new Array(radius * 2 + 1);
    let ksum = 0;
    for (let k = -radius; k <= radius; k++) {
      const w = Math.exp(-(k * k) / (2 * sigma * sigma));
      kernel[k + radius] = w;
      ksum += w;
    }

    const out = new Array(n);
    for (let i = 0; i < n; i++) {
      let acc = 0;
      for (let k = -radius; k <= radius; k++) {
        let j = i + k;
        if (j < 0) j = 0;
        else if (j > n - 1) j = n - 1;
        acc += arr[j] * kernel[k + radius];
      }
      out[i] = acc / ksum;
    }
    return out;
  }

  /**
   * 统计文档沿纵向的文本密度。
   * 做法：取正文的每个顶层块（段落 / 标题 / 列表 / 引用…），把它的字符数均摊到
   * 它纵向覆盖到的那些刻度位置上，累加得到一条密度曲线。
   */
  computeDensity(count) {
    const scroller = this.ticksScroller;
    if (!scroller || !count) return null;

    const total = scroller.scrollHeight || 1;

    // layout-change 会高频触发，而这里要逐个块量 getBoundingClientRect
    // （长文上千次）。按「文件 + 文档高度 + 刻度根数」缓存：没变就直接复用
    // 上一条曲线，不然每次重绘都重测一遍会明显卡顿。
    const key = (this.ticksFilePath || "") + ":" + total + ":" + count;
    if (this.densityKey === key && this.densityCache) return this.densityCache;

    const scrollerTop = scroller.getBoundingClientRect().top;
    const scrollTop = scroller.scrollTop;
    const sums = new Array(count).fill(0);

    // 阅读模式：顶层块（段落/标题/列表/引用…）；实时预览没有 sizer，退回按行统计
    let blocks = scroller.querySelectorAll(".markdown-preview-sizer > *");
    if (!blocks.length) blocks = scroller.querySelectorAll(".cm-line");

    for (const el of blocks) {
      const chars = String(el.textContent || "").trim().length;
      if (!chars) continue;
      // 权重取字数的平方根，不是字数本身：一个超长的代码块 / 表格按原值计入的话，
      // 会独吞整条曲线的动态范围（尾部实测出现 12px 的陡跳，又是「拔地而起」）。
      // 开方后离群块仍然是峰，但周围刻度不会被压成一片平地 ——
      // 同一份样本实测：最大相邻跳变 8.3px → 6.1px，长度档位反而多了一档。
      const len = Math.sqrt(chars);

      const rect = el.getBoundingClientRect();
      const top = rect.top - scrollerTop + scrollTop;
      const h = rect.height || 1;

      let i0 = Math.floor((top / total) * count);
      let i1 = Math.floor(((top + h) / total) * count);
      i0 = Math.max(0, Math.min(count - 1, i0));
      i1 = Math.max(0, Math.min(count - 1, i1));
      if (i1 < i0) i1 = i0;

      const share = len / (i1 - i0 + 1);
      for (let i = i0; i <= i1; i++) sums[i] += share;
    }

    // 一个块都没量到（阅读视图还没渲染完）时不要缓存，
    // 否则这条全 0 的"平线"会被当成有效结果一直用下去。
    if (!blocks.length) return sums;

    this.densityKey = key;
    this.densityCache = sums;
    return sums;
  }

  /**
   * 标题刻度：取阅读视图里的全部 h1–h6，按它们在文档中的像素位置换算成
   * 百分比落点；长度按层级区分（H1 最长，越深越短）。
   * 标题扎堆的地方刻度自然就密 —— 这就是「按文字密度区分」的来源。
   * 同时把每根的位置存进 ticksHeadings，供滚动时判定「当前是哪一杠」。
   */
  paintHeads() {
    const scroller = this.ticksScroller;
    const box = this.ticksHeadEl;
    if (!scroller || !box) return;

    const total = scroller.scrollHeight || 1;
    const scrollerTop = scroller.getBoundingClientRect().top;
    const scrollTop = scroller.scrollTop;
    const heads = this.collectHeadingEls(scroller);

    const positions = [];
    box.empty();
    for (const node of heads) {
      const level = Number(String(node.tagName).slice(1)) || 2;
      const offset = node.getBoundingClientRect().top - scrollerTop + scrollTop;
      const p = Math.min(1, Math.max(0, offset / total));
      const tick = box.createDiv({ cls: "rrs-ticks__head" });
      tick.dataset.level = String(Math.min(level, 4));
      tick.style.top = p * 100 + "%";
      positions.push(p);
    }
    this.ticksHeadings = positions;

    // 阅读视图的正文是异步渲染的：首次挂载时可能一个标题都还没进 DOM。
    // 这时延迟再算一次，否则刻度会一直空着，而且不会自己恢复。
    if (!heads.length && !this.ticksHeadRetry) {
      this.ticksHeadRetry = true;
      window.setTimeout(() => {
        this.ticksHeadRetry = false;
        if (this.ticksEl) this.paintHeads();
      }, 400);
    }
  }

  /**
   * 收集正文里的标题元素。主路径是 h1–h6，再兜一层带 data-heading 的元素
   * （Obsidian 的标题都带这个属性），但只认标签名确实是 H1–H6 的，
   * 免得把别的 data-heading 元素也算进来。
   */
  collectHeadingEls(scroller) {
    const out = [];
    const seen = new Set();
    const nodes = scroller.querySelectorAll(
      "h1, h2, h3, h4, h5, h6, [data-heading]"
    );
    for (const node of nodes) {
      if (seen.has(node)) continue;
      seen.add(node);
      const tag = String(node.tagName || "").toUpperCase();
      if (!/^H[1-6]$/.test(tag)) continue;
      out.push(node);
    }
    return out;
  }

  /**
   * 滚动时更新三样东西：
   *   ① 当前位置的高亮杠
   *   ② 基础刻度的「读过」状态（缩短 + 变淡）—— 由 ticksReadFade 控制，默认关
   *   ③ 当前所在标题那一杠的高亮
   */
  updateTicks() {
    const scroller = this.ticksScroller;
    const now = this.ticksNowEl;
    if (!scroller || !now) return;

    const max = scroller.scrollHeight - scroller.clientHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, scroller.scrollTop / max)) : 0;
    now.style.top = p * 100 + "%";

    const base = this.ticksBaseEl;
    // ⚠️ 这里是**插件类**的方法，this 就是插件实例 ——
    // 不能再写 this.plugin.settings（那是 View / SettingTab 里的写法），
    // 会抛 "Cannot read properties of undefined (reading 'settings')"。
    // 之前没暴露：paintTicks 在 clientHeight 为 0 时不建 baseEl，
    // && 短路让右边永远不执行；真机上 clientHeight 不为 0，于是必崩。
    if (base && this.settings.ticksReadFade) {
      const ticks = base.children;
      const last = ticks.length - 1;
      for (let i = 0; i < ticks.length; i++) {
        const at = last > 0 ? i / last : 0;
        ticks[i].classList.toggle("is-read", at < p - 0.005);
      }
    }

    this.updateActiveHead(p);
  }

  /** 当前所在的那个标题，让对应的刻度亮起来 */
  updateActiveHead(p) {
    const box = this.ticksHeadEl;
    const positions = this.ticksHeadings;
    if (!box || !positions) return;

    let idx = -1;
    for (let i = 0; i < positions.length; i++) {
      if (positions[i] <= p + 0.001) idx = i;
      else break;
    }

    const nodes = box.children;
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].classList.toggle("is-active", i === idx);
    }
  }

  /** 点刻度条任意高度 → 平滑滚到全篇对应百分比 */
  /* ---------- 刻度条拖拽 ----------
     按住刻度条上下拖，页面跟着走 —— 等价于拖原生的滚动条。
     按下即定位（所以「点击跳转」也一并包含了），拖动过程直接设 scrollTop，
     不做平滑动画，保证跟手。 */

  attachTicksDrag() {
    const el = this.ticksEl;
    if (!el) return;

    this.ticksOnDown = (ev) => {
      if (ev.button !== 0) return;
      if (!this.ticksScroller) return;
      ev.preventDefault();
      ev.stopPropagation();
      this.ticksDragging = true;
      el.classList.add("is-dragging");
      try {
        el.setPointerCapture(ev.pointerId);
      } catch (e) {
        /* 指针捕获失败也不影响后续 move */
      }
      this.scrollToTicksY(ev.clientY);
    };

    this.ticksOnMove = (ev) => {
      if (!this.ticksDragging) return;
      ev.preventDefault();
      this.scrollToTicksY(ev.clientY);
    };

    this.ticksOnUp = (ev) => {
      if (!this.ticksDragging) return;
      this.ticksDragging = false;
      el.classList.remove("is-dragging");
      try {
        el.releasePointerCapture(ev.pointerId);
      } catch (e) {
        /* 忽略 */
      }
    };

    el.addEventListener("pointerdown", this.ticksOnDown);
    el.addEventListener("pointermove", this.ticksOnMove);
    el.addEventListener("pointerup", this.ticksOnUp);
    el.addEventListener("pointercancel", this.ticksOnUp);
  }

  /** 把指针的纵向位置换算成文档百分比，直接设 scrollTop（拖动时不做平滑动画） */
  scrollToTicksY(clientY) {
    const el = this.ticksEl;
    const scroller = this.ticksScroller;
    if (!el || !scroller) return;
    const rect = el.getBoundingClientRect();
    if (!rect.height) return;
    const p = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    const max = scroller.scrollHeight - scroller.clientHeight;
    if (max <= 0) return;
    scroller.scrollTop = Math.round(p * max);
  }

  teardownTicks() {
    if (this.ticksScroller && this.ticksOnScroll) {
      this.ticksScroller.removeEventListener("scroll", this.ticksOnScroll);
    }
    // 刻度条元素被移除后，挂在它身上的 pointer 监听会自然失效，这里只复位状态
    this.ticksDragging = false;
    this.ticksOnDown = null;
    this.ticksOnMove = null;
    this.ticksOnUp = null;
    if (this.ticksFrame !== null) {
      window.cancelAnimationFrame(this.ticksFrame);
      this.ticksFrame = null;
    }
    if (this.ticksEl && this.ticksEl.parentNode) {
      this.ticksEl.parentNode.removeChild(this.ticksEl);
    }
    this.ticksHost = null;
    this.ticksScroller = null;
    this.ticksFilePath = null;
    this.densityKey = null;
    this.densityCache = null;
    this.ticksEl = null;
    this.ticksNowEl = null;
    this.ticksHeadEl = null;
    this.ticksBaseEl = null;
    this.ticksHeadings = null;
    this.ticksOnScroll = null;
    this.ticksCount = 0;
  }
}

module.exports = ReadingRailSidebarPlugin;
