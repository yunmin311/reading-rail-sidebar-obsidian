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

"use strict";

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

module.exports = { renderSponsor, SPONSORS };
