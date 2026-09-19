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

"use strict";

const { LOCALES } = require("./locales");

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

module.exports = { bindI18n, resolveLanguage, translate, LANGUAGE_OPTIONS };
