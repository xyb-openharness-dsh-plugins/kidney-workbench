#!/usr/bin/env node
/**
 * 小肾宝原型无头实测（M4 自验：必须出数字，不口头说"没问题"）。
 *
 * 数字：
 *  - 11 一级 × 34 二级 × 2 档案逐页签走查（查询→点击→再查询；aria-selected / state.sub /
 *    内容指纹互异 / 每页 overflow / 禁词扫描）；
 *  - 一图秀四必查件：数值线连线、末点标签=序列数、归一化水印、事件竖虚线上端止于 CY0-10；
 *  - 指标卡 3D 翻转（aria-pressed 切换）；
 *  - 档案切换（A 晚期 → B 主动监测）+ B 的空态诚实（treatment 显示"暂无系统治疗记录"）；
 *  - AI 面板开合 + 提示词含"小肾宝" + 模拟回复红线自检 0 命中；
 *  - 窄宽（400px）关键页不横向溢出；
 *  - 关键页截图存 docs/shots/（G1 与 README 用）。
 *
 * 用法：node scripts/probe-proto.mjs；退出码 0/1。依赖本机 Chrome（file:// 直开）。
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchChrome, stopChrome, sleep } from './cdp.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SHOTS = join(ROOT, 'docs', 'shots');
mkdirSync(SHOTS, { recursive: true });
const CDP_PORT = Number(process.env.RENAL_PROBE_CDP_PORT || 9362);
const URL_APP = `file://${join(ROOT, 'prototypes', 'v0.2', 'index.html')}`;

/* 11 一级页；'' = 无二级页签的页（看板）。 */
const VIEW_SUBS = [
  ['dashboard', ''],
  ['tumor', '分型档案'], ['tumor', '分期记录'], ['tumor', '病理分级'], ['tumor', '遗传与家系'],
  ['renal', '手术档案'], ['renal', '肾功能趋势'], ['renal', '对侧肾记录'],
  ['monitor', '监测时间轴'], ['monitor', '影像与大小'], ['monitor', '监测节奏'],
  ['treatment', '线序时间轴'], ['treatment', '危险度分层'], ['treatment', '辅助治疗'],
  ['tox', '方案档案'], ['tox', '副作用记录'], ['tox', '血压'], ['tox', '甲功'], ['tox', '尿蛋白'],
  ['labs', '指标卡'], ['labs', '一图秀'], ['labs', '参考范围'],
  ['imaging', '影像时间轴'], ['imaging', '报告原文'], ['imaging', '资料整理'],
  ['review', '随访日历'], ['review', '复诊摘要'], ['review', '问题清单'],
  ['life', '饮食与体重'], ['life', '活动'], ['life', '情绪与照护者'], ['life', '出行与资源'],
  ['trials', '2026 线索'], ['trials', '已收藏'], ['trials', '入组问题']
];
/* 禁词：任何语境都不该出现（否定语境也不许——写了否定句说明文案在围着禁词打转）。 */
const FORBIDDEN = ['建议治疗', '可能复发', '可以停药', '无需就医', '治愈率', '预后良好', '推荐方案', '生存率', '自动分级', '风险评分'];
/* 必现句（逐页断言：肾癌红线必须在页面上"看得见"）。 */
const REQUIRED = [
  ['dashboard', '', '刻意不做'],
  ['tumor', '分型档案', '未回报'],
  ['tumor', '病理分级', 'WHO/ISUP'],
  ['treatment', '危险度分层', 'IMDC 是预后模型，不是预测工具'],
  ['monitor', '影像与大小', '不算生长速度'],
  ['tox', '副作用记录', '不是产品判定的级别'],
  ['labs', '参考范围', '上限未引入'],
  ['review', '问题清单', '这一句需要问你的医生'],
  ['tumor', '遗传与家系', '未检测']
];
/* G1 / README 截图清单（view + sub + profile）。 */
const SHOT_LIST = [
  ['dashboard', '', 'A'], ['tumor', '分型档案', 'A'], ['renal', '肾功能趋势', 'A'],
  ['treatment', '线序时间轴', 'A'], ['tox', '副作用记录', 'A'], ['labs', '一图秀', 'A'],
  ['monitor', '影像与大小', 'B'], ['review', '随访日历', 'B'], ['imaging', '资料整理', 'A'], ['trials', '2026 线索', 'A']
];

const ch = await launchChrome({ port: CDP_PORT, userDataPrefix: '.xyb-renal-proto-' });
const { cdp } = ch;
const errors = cdp.errors;
const badResponses = cdp.badResponses;
const out = {
  tabs: 0, screenshots: 0, overflow: [], ariaMismatch: [], forbidden: [], required: [],
  dupFingerprint: [], chart: {}, flip: {}, profileSwitch: {}, agent: {}, narrow: [], jsErrors: 0
};

try {
  await cdp.send('Page.navigate', { url: URL_APP });
  await sleep(600);
  for (let i = 0; i < 60; i += 1) {
    const ready = await cdp.eval("document.querySelectorAll('#nav .nav-button').length");
    if (ready >= 11) break;
    await sleep(200);
  }
  out.navButtons = await cdp.eval("document.querySelectorAll('#nav .nav-button').length");
  if (out.navButtons !== 11) out.ariaMismatch.push(`导航按钮 ${out.navButtons} ≠ 11`);

  async function goto(page, sub) {
    await cdp.eval(`location.hash = ${JSON.stringify('#' + page)}`);
    await sleep(70);
    if (sub) {
      const idx = await cdp.eval(`(SUBPAGES[${JSON.stringify(page)}] || []).indexOf(${JSON.stringify(sub)})`);
      if (idx < 0) { out.ariaMismatch.push(`${page}: 页签「${sub}」不在 SUBPAGES`); return; }
      await cdp.eval(`(() => { const b = document.querySelector('#main .subnav [role=tab][data-sub="${idx}"]'); if (b) b.click(); })()`);
      await sleep(70);
    }
    await cdp.eval('window.scrollTo(0,0)');
    await sleep(50);
  }
  const textOf = async () => (await cdp.eval("(document.getElementById('main').innerText || '').replace(/\\s+/g, ' ')")) || '';

  /* ── 逐 (view,sub) × 2 档案 ── */
  for (const pid of ['A', 'B']) {
    for (const [page, sub] of VIEW_SUBS) {
      await cdp.eval(`(() => { state.profile = ${JSON.stringify(pid)}; state.pin = null; })()`);
      await goto(page, sub);
      const chk = await cdp.eval(`(() => {
        const html = document.getElementById('main').innerHTML;
        const crumb = document.getElementById('breadcrumb').textContent;
        /* 指纹取头尾两段：只取头部时，页签差异（在 section-title 之后）会落进窗口外误判为重复。 */
        const norm = html.replace(/\\s+/g, '');
        return JSON.stringify({ len: norm.length, fp: norm.slice(120, 340) + '|' + norm.slice(-240), crumb });
      })()`);
      const d = JSON.parse(chk);
      if (d.len < 500) out.ariaMismatch.push(`${pid}/${page}/${sub || '(本页)'}: 内容过短（${d.len}），可能渲染失败`);
      if (sub) {
        const selOk = await cdp.eval(`(() => { const b = document.querySelector('#main .subnav [role=tab][aria-selected="true"]'); return b ? b.textContent.trim() : null; })()`);
        if (selOk !== sub) out.ariaMismatch.push(`${pid}/${page}/${sub}: aria-selected 落在「${selOk}」`);
      }
      const text = await textOf();
      for (const w of FORBIDDEN) if (text.includes(w)) out.forbidden.push(`${pid}/${page}/${sub || '(本页)'}: 禁词「${w}」`);
      const ov = await cdp.eval('JSON.stringify({ s: document.documentElement.scrollWidth, i: window.innerWidth })');
      const o = JSON.parse(ov);
      if (o.s > o.i + 1) out.overflow.push(`${pid}/${page}/${sub || '(本页)'}: scrollWidth=${o.s} > innerWidth=${o.i}`);
      out.tabs += 1;
      /* 指纹入库：同页不同页签必须互异 */
      const key = `${pid}/${page}`;
      out.dupFingerprint.push({ key, sub: sub || '(本页)', fp: d.fp, len: d.len });
    }
  }
  /* 同页指纹互异校验（排除空态相同的合法情况：B 档案 treatment 三页签有两条合法空态文案不同） */
  const byPage = {};
  for (const f of out.dupFingerprint) { (byPage[f.key] = byPage[f.key] || []).push(f); }
  const dupReport = [];
  for (const [k, list] of Object.entries(byPage)) {
    const seen = {};
    for (const f of list) {
      if (seen[f.fp]) dupReport.push(`${k}: 「${seen[f.fp]}」与「${f.sub}」内容指纹相同`);
      seen[f.fp] = f.sub;
    }
  }
  out.dupFingerprint = dupReport;

  /* ── 必现句（A / B 各跑一遍能跑到的页） ── */
  for (const [page, sub, phrase] of REQUIRED) {
    for (const pid of ['A', 'B']) {
      await cdp.eval(`(() => { state.profile = ${JSON.stringify(pid)}; })()`);
      await goto(page, sub);
      const t = await textOf();
      if (!t.includes(phrase)) out.required.push(`必现句缺失 ${pid}/${page}/${sub || '(本页)'}: 「${phrase}」`);
    }
  }

  /* ── 一图秀四必查件 ── */
  await cdp.eval(`(() => { state.profile = 'A'; })()`);
  await goto('labs', '一图秀');
  out.chart = await cdp.eval(`(() => {
    const svg = document.querySelector('#main .chart-wrap svg.chart');
    if (!svg) return { err: '一图秀 svg 缺失' };
    const lines = [...svg.querySelectorAll('path.line')];
    const pts = [...svg.querySelectorAll('circle.pt')];
    const dashes = [...svg.querySelectorAll('line[stroke-dasharray]')];
    const marks = [...svg.querySelectorAll('path[d*="l4 4"]')];
    const y0 = 132, y1 = 366;
    let dashAbove = 0;
    for (const l of dashes) { const yy = Number(l.getAttribute('y1')); if (yy >= y0 - 10 - 0.5 && yy <= y0 - 10 + 0.5) dashAbove += 1; }
    return {
      series: lines.length,
      pts: pts.length,
      endLabels: svg.querySelectorAll('text.delta-tag').length,
      watermark: svg.textContent.includes('不代表数值可比'),
      dashCount: dashes.length,
      dashStopsAtCY0minus10: dashes.length ? dashAbove === dashes.length : null,
      markDiamonds: marks.length,
      gridRows: svg.querySelectorAll('line.grid').length,
      axisNote: svg.textContent.includes('归一化')
    };
  })()`);
  /* 分类记录不连线：把分类指标（hfsr）加进选择，连线数应等于其中数值指标数，且分类指标不贡献圆点 */
  const catCheck = await cdp.eval(`(() => {
    const sel = ['cr', 'egfr', 'hfsr'];
    const numeric = sel.filter((c) => METRICS.A[c] && numPts(METRICS.A[c]).length);
    state.sel = sel;
    render();
    const svg = document.querySelector('#main .chart-wrap svg.chart');
    const dots = [...svg.querySelectorAll('circle.pt')];
    return JSON.stringify({ expected: numeric.length, after: svg.querySelectorAll('path.line').length, hfsrColor: METRICS.A.hfsr.color, hfsrDots: dots.filter((c) => c.getAttribute('fill') === METRICS.A.hfsr.color).length });
  })()`);
  out.chart.categoryNotLinked = JSON.parse(catCheck);
  if (out.chart.categoryNotLinked.after !== out.chart.categoryNotLinked.expected
    || out.chart.categoryNotLinked.hfsrDots !== 0) out.chart.err = '分类指标被连线了（契约违反）';

  /* ── 单点序列断言（SCENARIOS 一图秀断言：单点写「只有 1 次记录，暂不连线」） ── */
  const singleCheck = await cdp.eval(`(() => {
    state.profile = 'B';
    state.sel = ['tsh'];
    render();
    const svg = document.querySelector('#main .chart-wrap svg.chart');
    if (!svg) return JSON.stringify({ err: '单点 svg 缺失' });
    return JSON.stringify({
      note: svg.textContent.includes('只有 1 次记录，暂不连线'),
      dots: svg.querySelectorAll('circle.pt').length,
      lines: svg.querySelectorAll('path.line').length
    });
  })()`);
  out.chart.single = JSON.parse(singleCheck);
  /* 卡背迷你折线同款断言：翻 tsh 卡，背面 sparkline 也要写这句话 */
  await goto('labs', '指标卡');
  const sparkSingle = await cdp.eval(`(() => {
    const card = document.querySelector('#main .mcard[data-mcard="tsh"]');
    if (!card) return JSON.stringify({ err: 'tsh 卡缺失' });
    card.click();
    const back = card.querySelector('[data-face="back"]');
    return JSON.stringify({ flipped: card.dataset.flipped, note: back ? back.textContent.includes('只有 1 次记录，暂不连线') : false });
  })()`);
  out.chart.sparkSingle = JSON.parse(sparkSingle);
  await cdp.eval(`(() => { state.profile = 'A'; state.sel = ['cr', 'hgb', 'bp_sys']; render(); })()`);

  /* ── 指标卡 3D 翻转 ── */
  await goto('dashboard', '');
  out.flip = await cdp.eval(`(() => {
    const card = document.querySelector('#main .mcard[data-mcard]:not([data-static])');
    if (!card) return { err: '看板无数值卡' };
    const before = card.getAttribute('aria-pressed');
    card.click();
    return JSON.stringify({ before, after: card.getAttribute('aria-pressed'), staticExists: !!document.querySelector('#main .mcard[data-static]') });
  })()`);
  out.flip = JSON.parse(out.flip);

  /* ── 档案切换 + B 空态诚实 ── */
  const nameA = await cdp.eval("document.getElementById('profile-name').textContent");
  await cdp.eval(`(() => { document.getElementById('profile-btn').click(); })()`);
  await sleep(60);
  await cdp.eval(`(() => { const b = document.querySelector('.profile-row[data-pick-profile="B"]'); if (b) b.click(); })()`);
  await sleep(80);
  const nameB = await cdp.eval("document.getElementById('profile-name').textContent");
  await goto('treatment', '线序时间轴');
  const emptyHonest = (await textOf()).includes('本档案暂无系统治疗记录');
  out.profileSwitch = { nameA, nameB, switched: nameA !== nameB, emptyHonest };
  if (!out.profileSwitch.switched) out.profileSwitch.err = '档案切换失败';
  if (!out.profileSwitch.emptyHonest) out.profileSwitch.err2 = 'B 档案 treatment 空态文案缺失';

  /* ── AI 面板 ── */
  await cdp.eval(`(() => { state.profile = 'A'; })()`);
  await goto('dashboard', '');
  await cdp.eval(`(() => { document.getElementById('agent-toggle').click(); })()`);
  await sleep(120);
  out.agent.open = await cdp.eval("!document.getElementById('agent-dock').hidden");
  await cdp.eval(`(() => { document.querySelector('[data-action="agent-build"]').click(); })()`);
  await sleep(80);
  const promptText = await cdp.eval("(document.querySelector('.agent-card pre') || {}).textContent || ''");
  out.agent.promptHasBrand = promptText.includes('小肾宝');
  out.agent.promptHasBoundary = promptText.includes('不是医疗建议');
  await cdp.eval(`(() => { document.querySelector('[data-action="agent-demo"]').click(); })()`);
  await sleep(80);
  const replyText = await cdp.eval("(document.querySelectorAll('.agent-card pre')[1] || {}).textContent || ''");
  out.agent.replyHits = FORBIDDEN.filter(w => replyText.includes(w));
  await cdp.eval(`(() => { document.querySelector('.agent-dock [data-action="agent"]').click(); })()`);
  await sleep(80);
  out.agent.closed = await cdp.eval("document.getElementById('agent-dock').hidden");

  /* ── 窄宽（400px）关键页 ── */
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 400, height: 820, deviceScaleFactor: 0, mobile: false });
  await sleep(150);
  for (const [page, sub] of [['dashboard', ''], ['labs', '一图秀'], ['tox', '副作用记录'], ['monitor', '影像与大小'], ['treatment', '危险度分层']]) {
    await goto(page, sub);
    const ov = await cdp.eval('JSON.stringify({ s: document.documentElement.scrollWidth, i: window.innerWidth })');
    const o = JSON.parse(ov);
    if (o.s > o.i + 1) out.narrow.push(`${page}/${sub || '(本页)'}: scrollWidth=${o.s} > innerWidth=${o.i}`);
  }
  await cdp.send('Emulation.clearDeviceMetricsOverride');

  /* ── G1 / README 截图（整页：captureBeyondViewport） ── */
  for (const [page, sub, pid] of SHOT_LIST) {
    await cdp.eval(`(() => { state.profile = ${JSON.stringify(pid)}; })()`);
    await goto(page, sub);
    await cdp.eval('window.scrollTo(0,0)');
    await sleep(120);
    let data;
    try {
      const r = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, fromSurface: true });
      data = r.data;
    } catch {
      const r = await cdp.send('Page.captureScreenshot', { format: 'png' });
      data = r.data;
    }
    writeFileSync(join(SHOTS, `${page}-${sub || 'main'}-${pid}.png`), Buffer.from(data, 'base64'));
    out.screenshots += 1;
  }
} catch (error) {
  out.fatal = String(error?.stack ?? error);
} finally {
  await stopChrome(ch);
}

out.jsErrors = errors.length;
out.consoleErrorSamples = errors.slice(0, 3);
const ok = !out.fatal && out.jsErrors === 0 && badResponses.length === 0
  && out.overflow.length === 0 && out.ariaMismatch.length === 0 && out.forbidden.length === 0
  && out.required.length === 0 && out.dupFingerprint.length === 0 && out.narrow.length === 0
  && out.tabs === 70 && out.navButtons === 11
  && out.chart.series === 3 && out.chart.pts > 0 && out.chart.endLabels === 3
  && out.chart.watermark === true && out.chart.dashStopsAtCY0minus10 === true
  && out.chart.single && out.chart.single.note === true && out.chart.single.dots === 1 && out.chart.single.lines === 0
  && out.chart.sparkSingle && out.chart.sparkSingle.flipped === 'true' && out.chart.sparkSingle.note === true
  && !out.chart.err && out.flip.after === 'true' && out.flip.before === 'false'
  && out.profileSwitch.switched && out.profileSwitch.emptyHonest
  && out.agent.open === true && out.agent.closed === true && out.agent.promptHasBrand && out.agent.promptHasBoundary
  && out.agent.replyHits.length === 0;
console.log(JSON.stringify({
  ok,
  summary: { tabs: out.tabs, screenshots: out.screenshots, navButtons: out.navButtons, jsErrors: out.jsErrors, networkFailures: badResponses.length },
  issues: {
    overflow: out.overflow, ariaMismatch: out.ariaMismatch, forbidden: out.forbidden, required: out.required,
    dupFingerprint: out.dupFingerprint, narrow: out.narrow, fatal: out.fatal ?? null
  },
  detail: { chart: out.chart, flip: out.flip, profileSwitch: out.profileSwitch, agent: out.agent, consoleErrorSamples: out.consoleErrorSamples }
}, null, 2));
process.exitCode = ok ? 0 : 1;
