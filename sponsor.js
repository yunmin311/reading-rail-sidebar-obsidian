/* 赞助区块。

   刻意做成一个独立小节而不是塞进说明文字里：详情页是用户唯一会认真读的
   地方，藏起来等于没有。区块只渲染链接，不引任何外部脚本或图片 ——
   插件必须保持零网络请求，否则会在社区市场审核时被质疑。

   为什么国内 / 海外分开列：两条链路的可用性完全不同，
   只给一条总有一半用户点不开。 */

"use strict";

const SPONSORS = {
  // 海外：GitHub Sponsors 覆盖绝大多数国际信用卡 / PayPal。
  overseas: [
    { label: "GitHub Sponsors", url: "https://github.com/sponsors/yunmin311" },
  ],
  // 国内：爱发电支持微信 / 支付宝，无需外币卡。
  domestic: [
    { label: "爱发电", url: "https://afdian.com/a/yunmin311" },
    { label: "Ko-fi", url: "https://ko-fi.com/yunmin311" },
  ],
};

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

  const grid = box.createDiv({ cls: "sp-grid" });
  for (const [key, links] of [
    ["sponsor.overseas", SPONSORS.overseas],
    ["sponsor.domestic", SPONSORS.domestic],
  ]) {
    if (!links.length) continue;
    const col = grid.createDiv({ cls: "sp-col" });
    col.createDiv({ cls: "sp-col-head", text: t(key) });
    for (const l of links) linkRow(col, l.label, l.url);
  }
}

module.exports = { renderSponsor, SPONSORS };
