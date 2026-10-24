'use strict';
/* 小肾宝 RenalPal v0.2.0 — 交互原型。患者数据全部为模拟；临床试验列表为真实登记摘录（状态未核实）。
   不读写真实文件、不调用模型或宿主 API。视觉体系沿用家族原型，品牌色重映射为小肾宝绛莓红 #A3455C。
   与样板（胃癌）的差异：
   - 一级页 11 个：DIFF-MATRIX 定的 10 页（看板/我的瘤与分型/手术与肾功能/主动监测/治疗与线序/
     用药与副作用/化验与指标/影像与报告/随访与复诊/生活与照护）+ 临床研究（演示数据有 10 条登记摘录，
     不放页面就孤儿了；DEV-PLAN 记了 +1 的账）。资料整理流（上传→解析→核对→入库）收在
     「影像与报告 · 资料整理」页签，不单开一级页。
   - 指标字典没有肿瘤标志物（肾癌无常规血清标志物）：肾功能（Cr/eGFR）、血象（IMDC 六项之三）、
     生化、甲功（TKI 语境）、尿蛋白（TKI 语境）、血压（副作用监测）、体重、治疗毒性（分类记录）。
   - 两个档案各走一条主路径：A = 晚期 mRCC 一线 IO+TKI；B = 小肿块主动监测（AS）。
   - 一图秀事件竖虚线上端止于 CY0-10（DEV-REQUIREMENTS 硬约束 23）。 */

const APP_INFO = {
  version: '0.2.0',
  build: '2026-10-24',
  channel: 'prototype',
  channelLabel: '交互原型 · 未接入 DSH'
};
APP_INFO.displayVersion = `v${APP_INFO.version}`;

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let uidSeq = 0;
const uid = (p) => p + (++uidSeq);

/* ---------------- icons & nav ---------------- */
const icons = {
  home: 'M3 10 12 3l9 7M5 9v12h5v-7h4v7h5V9',
  badge: 'M12 3l7 4v10l-7 4-7-4V7ZM9 12l2 2 4-4',
  drip: 'M12 3v6m0 0a5 5 0 1 0 0 10 5 5 0 0 0 0-10ZM7 7h10',
  /* 活检 / 手术：手术刀轮廓 */
  cut: 'M14.5 3.5 20.5 9.5M18 5l-9.5 9.5-3.5.5.5-3.5L15 2M4 20l4-4',
  /* 主动监测：眼睛（只观察，不判断） */
  eye: 'M12 5c5 0 9.2 4.6 10.6 7-1.4 2.4-5.6 7-10.6 7S2.8 14.4 1.4 12C2.8 9.6 7 5 12 5Zm0 3.4a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2Z',
  /* 用药与副作用：胶囊 */
  pill: 'M4.8 13.4 10.6 19.2a4.3 4.3 0 0 0 6.1-6.1l-5.8-5.8a4.3 4.3 0 0 0-6.1 6.1Zm4.6-4.6 5.2 5.2',
  /* 影像与报告：胶片 */
  film: 'M3 5h18v14H3Zm0 4.5h18M7.5 5v4.5m9-4.5v4.5M7.5 14.5h3m3 0h4',
  lab: 'M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3M7 15h10',
  chart: 'M4 3v17h17M7 14l4-5 4 3 5-7',
  leaf: 'M20 4c-9.4 0-15 4.1-15 9.6A5.4 5.4 0 0 0 10.4 19C16 19 20 13.4 20 4ZM5.5 18.6C8 13.4 12 10.6 17 9.6',
  heart: 'M12 20.3c-4.6-2.9-7.4-5.6-7.4-9A4.1 4.1 0 0 1 12 8.4a4.1 4.1 0 0 1 7.4 2.9c0 3.4-2.8 6.1-7.4 9Z',
  calendar: 'M4 5h16v16H4ZM8 3v4m8-4v4M4 10h16m-12 4h2m4 0h2m-8 3h2',
  flask: 'M9 3h6v5l5 9a2 2 0 0 1-2 3H6a2 2 0 0 1-2-3l5-9Z',
  folder: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z',
  chat: 'M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H10l-6 5V5ZM8 8h8M8 11h5'
};
/* 看板任务卡用的是页面键，图标表里叫别的名；做一次别名，避免拼错键时静默输出空 path。 */
const ICON_ALIAS = { review: 'calendar', labs: 'lab', timeline: 'chart', mind: 'heart', treatment: 'drip', trials: 'flask', dashboard: 'home', tox: 'pill', monitor: 'eye', imaging: 'film', tumor: 'badge', renal: 'cut', life: 'leaf', records: 'folder', chat: 'chat', scope: 'film' };
const icon = (k) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${icons[k] || icons[ICON_ALIAS[k]] || icons.badge}"/></svg>`;

/* 11 个一级页（DIFF-MATRIX 定的 10 页 + 临床研究；二级页签见 SUBPAGES）。
   看板是单视图（今日一页 / 待办 / 最近记录是页内分区，不是页签），其余 10 页都有页签。 */
const PAGES = [
  ['dashboard', '看板', 'home'], ['tumor', '我的瘤与分型', 'badge'], ['renal', '手术与肾功能', 'cut'],
  ['monitor', '主动监测', 'eye'], ['treatment', '治疗与线序', 'drip'], ['tox', '用药与副作用', 'pill'],
  ['labs', '化验与指标', 'lab'], ['imaging', '影像与报告', 'film'], ['review', '随访与复诊', 'calendar'],
  ['life', '生活与照护', 'leaf'], ['trials', '临床研究', 'flask']
];
const SUBPAGES = {
  tumor: ['分型档案', '分期记录', '病理分级', '遗传与家系'],
  renal: ['手术档案', '肾功能趋势', '对侧肾记录'],
  monitor: ['监测时间轴', '影像与大小', '监测节奏'],
  treatment: ['线序时间轴', '危险度分层', '辅助治疗'],
  tox: ['方案档案', '副作用记录', '血压', '甲功', '尿蛋白'],
  labs: ['指标卡', '一图秀', '参考范围'],
  imaging: ['影像时间轴', '报告原文', '资料整理'],
  review: ['随访日历', '复诊摘要', '问题清单'],
  life: ['饮食与体重', '活动', '情绪与照护者', '出行与资源'],
  trials: ['2026 线索', '已收藏', '入组问题']
};
const SUBTITLES = {
  dashboard: '当前方案、下一次节点和最近数值放在一页；接下来能做的事也从这里出发。',
  tumor: '分型、分期、分级是三个不同的词，各记各的；未回报的显示「未回报」，不猜也不补。',
  renal: '保肾还是根治是第一个大决策，术后有人盯一辈子肾功能——Cr / eGFR 与基线并列，不判读。',
  monitor: '小肿块「先看着」也是真实路径：影像按原文并列，不连线、不算速度、不设阈值。',
  treatment: '换过几种方案、医生判过什么分层，按时间留痕；不比较方案，不自行打分。',
  tox: '靶向药的副作用是患者自己在家面对的：症状与同日血压并置，只给观察项，不给处置。',
  labs: '同一个指标按时间排好；参考区间取化验单自带，换医院、换方法都标出来。',
  imaging: '影像（CT / MRI / 超声 + 结节原文）是主动监测与疗效评估的主证据；报告原文不丢。',
  review: '四种路径四种节奏；想问的事和我的看法分两区，导出时不合并。',
  life: '肾癌没有特定饮食处方，这里只记录；活动、情绪与照护者同样只记事实。',
  trials: '线索不是推荐；先弄清入组条件，再决定要不要问。'
};

/* ---------------- 数据层（由 demo/build-demo-data.mjs 生成；改数据请改生成器重跑） ---------------- */
const D = window.DEMO_DATA;
const PROFILES = {}, METRICS = {}, EVENTS = {}, DASH_KEYS = {}, DOCS = {}, CANDS = {};
for (const [k, p] of Object.entries(D.profiles)) {
  /* 字段逐条显式列出：生成器加字段时这里会同步补，不会静默丢字段。
     胃癌的 hp / resection / perioperative / mealLog / dumping / supplements / peritoneal /
     endoscopy / molecular 换成肾癌的 pathology / staging / surgery / contra / as / lines /
     imdc / cycles / tox / genetics / questions + titles（每节标题， subjects 表 *_title 列）。 */
  PROFILES[k] = { name: p.name, sex: p.sex, age: p.age, meta: p.meta, headline: p.headline, stage: p.stage, mindset: p.mindset,
    dash_keys: p.dash_keys, path: p.path, titles: p.titles || {},
    pathology: p.pathology || [], staging: p.staging || [], surgery: p.surgery || [], contra: p.contra || [],
    as: p.as || [], lines: p.lines || [], imdc: p.imdc || [], cycles: p.cycles || [], tox: p.tox || [],
    genetics: p.genetics || [], questions: p.questions || [], rhythm: p.rhythm || [], viewpoints: p.viewpoints || [],
    activity: p.activity, familyTalk: p.familyTalk,
    docs: p.docs || [], candidates: p.candidates || [] };
  METRICS[k] = {};
  for (const m of p.metrics) METRICS[k][m.key] = m;
  EVENTS[k] = p.events;
  DASH_KEYS[k] = p.dash_keys;
  DOCS[k] = (p.docs || []).map(d => ({ ...d }));
  CANDS[k] = (p.candidates || []).map(c => ({ ...c }));
}
const TRIALS = D.trials;

/* ---------------- state ---------------- */
/* 一图秀默认指标走各档案 dash_keys：A = Cr/Hb/收缩压（晚期一线盯肾功能与靶向高血压），
   B = Cr/eGFR/UACR（AS 盯基础肾功能与尿蛋白）。 */
const state = { view: 'dashboard', profile: 'A', agentOpen: false, agentSize: 'std', sel: [],
  range: 'all', zoom: 100, toggles: { treatment: true, keypoints: true }, pin: null, saved: [], sub: {},
  query: '', parsing: false, parseError: false, loaded: {}, parsingName: '', lastUpload: null, uploads: 0 };
state.sel = (DASH_KEYS.A || []).slice(0, 3);
const defaultSel = (k) => (DASH_KEYS[k] || []).filter(c => { const m = METRICS[k][c]; return m && typeof m.points.find(p => typeof p.v === 'number')?.v === 'number'; }).slice(0, 3);
const P = () => PROFILES[state.profile];
const M = () => METRICS[state.profile];

/* ---------------- helpers ---------------- */
const fmtDate = (d) => d;
const delta = (m) => {
  if (!m.points || m.points.length < 2) return null;
  const a = m.points[m.points.length - 1], b = m.points[m.points.length - 2];
  if (typeof a.v !== 'number' || typeof b.v !== 'number') return null;
  const d = a.v - b.v;
  return { text: (d > 0 ? '+' : '') + d.toFixed(m.dec ?? 1), up: d > 0, from: b.d };
};
function sparkline(m, w = 200, h = 44) {
  const pts = (m.points || []).filter(p => typeof p.v === 'number');
  /* 单点：不画线，写明「只有 1 次记录，暂不连线」——两点成线、一点不成趋势，
     画线会让人读出「在升 / 在降」，那是判断不是记录（SCENARIOS 一图秀断言）。 */
  if (pts.length === 1) {
    const y = h / 2 - 2;
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(m.name)}：只有 1 次记录，暂不连线">
      <path class="base" d="M4 ${h - 5}H${w - 4}"/><circle cx="${w / 2}" cy="${y}" r="3.2" fill="${m.color}"/>
      <text x="${w / 2}" y="${y + 17}" text-anchor="middle" font-size="10" fill="#8fa1b5">只有 1 次记录，暂不连线</text></svg>`;
  }
  if (pts.length < 2) return '';
  const vs = pts.map(p => p.v);
  let lo = Math.min(...vs), hi = Math.max(...vs); if (hi === lo) { hi += 1; lo -= 1; }
  const X = i => 4 + (w - 8) * i / (pts.length - 1);
  const Y = v => h - 5 - (h - 10) * (v - lo) / (hi - lo);
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(p.v).toFixed(1)}`).join('');
  const dots = pts.map((p, i) => `<circle class="sp-dot" cx="${X(i).toFixed(1)}" cy="${Y(p.v).toFixed(1)}" r="2.6" fill="${m.color}"/>`).join('');
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" aria-hidden="true"><path class="base" d="M4 ${h - 5}H${w - 4}"/><path class="sp-line" d="${path}" stroke="${m.color}"/>${dots}</svg>`;
}
/* 3D 翻面：点整卡转 180°，再点返回；两面互换 aria-hidden，隐藏面不进读屏顺序。分类记录不翻。 */
function flipCard(key) {
  const el = document.querySelector(`[data-mcard="${key}"]`);
  if (!el || el.dataset.static) return;
  const on = el.dataset.flipped !== 'true';
  el.dataset.flipped = String(on);
  el.setAttribute('aria-pressed', String(on));
  const front = el.querySelector('[data-face="front"]');
  const back = el.querySelector('[data-face="back"]');
  if (front) front.setAttribute('aria-hidden', String(on));
  if (back) back.setAttribute('aria-hidden', String(!on));
}
function mcard(key, m) {
  const last = (m.points || []).slice(-1)[0];
  if (!last) return '';
  const numeric = typeof last.v === 'number' && m.dec !== null;
  const d = delta(m);
  const cat = `<span class="cat"><i style="background:${m.color}"></i>${esc(m.cat)}</span>`;
  if (!numeric) {
    return `<div class="mcard" data-mcard="${key}" data-static="1" role="group" aria-roledescription="指标卡"
      aria-label="${esc(m.name)}：${esc(String(last.v))}（分类记录，只按原文记录，不连折线）">
      <span class="mface front" data-face="front">${cat}<span class="name">${esc(m.name)}</span>
      <span class="na">${esc(last.v)}</span>
      <span class="meta"><span>${esc(last.src)}</span><span class="hint">分类记录</span></span></span></div>`;
  }
  /* ×ULN 契约：band[1] 为 null = 这张化验单没引入上限。显示「参考下限」并标明上限未引入，
     不借成人通用上限凑区间——「下限可以借，上限不能借」。 */
  const bandTxt = m.band
    ? (m.band[1] == null
      ? `参考下限 ${m.band[0]} ${esc(m.unit)}${pill('上限未引入', 'yellow')}`
      : `参考 ${m.band[0]}–${m.band[1]} ${esc(m.unit)}`)
    : `${esc(last.d)} · ${esc(last.src)}`;
  const rec = m.band ? `${bandTxt}<span class="rec">${esc(last.d)} · ${esc(last.src)}</span>` : bandTxt;
  return `<div class="mcard" role="group" tabindex="0" data-mcard="${key}" data-flipped="false" aria-pressed="false" aria-roledescription="指标卡"
    aria-label="${esc(m.name)} 最近 ${last.v.toFixed(m.dec ?? 1)} ${esc(m.unit)}（${esc(last.d)}）；点一下翻面看趋势">
    <span class="mcard-inner">
    <span class="mface front" data-face="front">${cat}<span class="name">${esc(m.name)}</span>
      <span class="val"><span data-countup="${last.v}" data-dec="${m.dec ?? 1}">${last.v.toFixed(m.dec ?? 1)}</span><small>${esc(m.unit)}</small></span>
      ${d ? `<span class="delta">较上次 <em>${d.text}${m.unit ? ' ' + esc(m.unit) : ''}</em>（${esc(d.from)}）</span>` : ''}
      ${rec}</span>
    <span class="mface back" data-face="back" aria-hidden="true">${cat}<span class="name">${esc(m.name)}</span>
      ${sparkline(m, 190, 40)}
      <span class="meta"><span>${esc(m.note)}</span><span class="hint">轻点翻回</span></span></span>
    </span></div>`;
}
/* ---------------- 一图秀引擎（统一画布 · 多序列归一化 · 家族合同） ---------------- */
const CW = 980, CH = 420, CX0 = 62, CX1 = 954, CY0 = 132, CY1 = 366;
const CAT_ORDER = ['肾功能', '血象', '生化', '电解质', '甲功', '尿液', '体征', '治疗毒性'];
/* 每类的口径角标：写在这一类指标「凭什么这样看」的一句话，来源都指向化验单或指南小节。 */
const CAT_TAG = {
  肾功能: '<span class="source-link">参考区间取化验单自带</span>',
  血象: '<span class="source-link">IMDC 六项之三（Hb / PLT / NEU）</span>',
  生化: '<span class="source-link">靶向 / 免疫期间监测</span>',
  电解质: '<span class="source-link">IMDC 六项之一（校正钙）</span>',
  甲功: '<span class="source-link">TKI 常见甲减 · CSCO 2025 §7 含甲功</span>',
  尿液: '<span class="source-link">定性照抄报告原文</span>',
  体征: '<span class="source-link">家庭自测 · 与症状并置不并轴</span>',
  治疗毒性: '<span class="source-link">只记原话，不分级</span>'
};
const fmtNum = (v, dec) => typeof v === 'number' ? v.toFixed(dec ?? 1) : String(v ?? '');
const shortDate = (d) => d.slice(5).replace('-', '.');
const longDate = (d) => d;
const numPts = (m) => (m.points || []).filter(p => typeof p.v === 'number');
const addDays = (d, n) => new Date(Date.parse(d) + n * 86400000).toISOString().slice(0, 10);

function dataBounds() {
  const ds = [];
  for (const m of Object.values(M())) for (const p of m.points) ds.push(p.d);
  for (const e of (EVENTS[state.profile] || [])) ds.push(e.d);
  ds.sort();
  return [Date.parse(ds[0]), Date.parse(ds[ds.length - 1])];
}
function domain() {
  const [s, e] = dataBounds();
  const months = { '3m': 3, '6m': 6, '12m': 12 }[state.range];
  const start = months ? new Date(new Date(e).setMonth(new Date(e).getMonth() - months)) : new Date(s);
  const span = e - start.getTime();
  const kept = span * state.zoom / 100;
  return [e - kept, e];
}
const inDomain = (d, t0, t1) => { const t = Date.parse(d); return t >= t0 && t <= t1; };
const xOf = (t, t0, t1) => CX0 + (t - t0) / Math.max(1, t1 - t0) * (CX1 - CX0);

/* 单调三次插值（Fritsch-Carlson，同 d3 curveMonotoneX）：
   只平滑折线，且保证曲线段不越过相邻数据点的 y 范围——不会出现"过冲鼓包"式变形 */
function smoothPath(coords) {
  const n = coords.length;
  if (!n) return '';
  if (n === 1) return `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
  const dx = [], slope = [];
  for (let i = 0; i < n - 1; i++) {
    const ddx = coords[i + 1].x - coords[i].x;
    dx.push(ddx);
    slope.push(ddx ? (coords[i + 1].y - coords[i].y) / ddx : 0);
  }
  const tan = [slope[0]];
  for (let i = 1; i < n - 1; i++) {
    if (slope[i - 1] * slope[i] <= 0) tan.push(0);           // 拐点处切线置平，防鼓包
    else {
      const w1 = 2 * dx[i] + dx[i - 1], w2 = dx[i] + 2 * dx[i - 1];
      tan.push((w1 + w2) / (w1 / slope[i - 1] + w2 / slope[i])); // 调和加权，保证单调
    }
  }
  tan.push(slope[n - 2]);
  let d = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const c1x = coords[i].x + dx[i] / 3, c1y = coords[i].y + tan[i] * dx[i] / 3;
    const c2x = coords[i + 1].x - dx[i] / 3, c2y = coords[i + 1].y - tan[i + 1] * dx[i] / 3;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${coords[i + 1].x.toFixed(1)} ${coords[i + 1].y.toFixed(1)}`;
  }
  return d;
}

/* 治疗条：周期带（IO 输注周期）+ 评估标记（活检 / MDT / 一线开始 / 病理回报 / AS 复查），
   两行独立于数据区。肾癌配色：周期带用品牌绛莓红，菱形标记分术式深红与其他金褐。 */
function bandsFor(t0, t1) {
  const p = P(), items = [];
  p.cycles.forEach((c, i) => {
    const from = c[1];
    const to = c[4] && p.cycles[i + 1] ? p.cycles[i + 1][1] : addDays(from, 21);
    items.push({ kind: 'cycle', from, to, label: c[0], color: '#a3455c' });
  });
  (EVENTS[state.profile] || []).forEach((e) => {
    if (/活检|切除|消融|手术/.test(e.label)) items.push({ kind: 'mark', from: e.d, to: e.d, label: e.label, color: '#7e2f3d' });
    else if (/MDT|一线开始|病理回报|AS 复查|增强 CT|体检超声/.test(e.label)) items.push({ kind: 'mark', from: e.d, to: e.d, label: e.label, color: '#9a6410' });
  });
  return items.filter((tr) => Date.parse(tr.to) >= t0 && Date.parse(tr.from) <= t1)
    .sort((a, b) => Date.parse(a.from) - Date.parse(b.from))
    .map((tr, lane) => { const s = Math.max(Date.parse(tr.from), t0), e2 = Math.min(Date.parse(tr.to), t1); return { ...tr, x1: xOf(s, t0, t1), x2: xOf(e2, t0, t1), lane }; });
}

function monthTicks(t0, t1) {
  const out = []; const d = new Date(t0); let cur = new Date(d.getFullYear(), d.getMonth(), 1);
  if (cur.getTime() < t0) cur.setMonth(cur.getMonth() + 1);
  while (cur.getTime() <= t1) {
    const x = xOf(cur.getTime(), t0, t1);
    if (x > CX0 + 6 && x < CX1 - 6) out.push({ x, label: `${cur.getMonth() + 1}月` });
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
  }
  if (out.length > 7) return out.filter((_, i) => i % 2 === 0);
  return out;
}

function seriesFor(code, t0, t1) {
  const m = M()[code];
  const all = numPts(m).map((p) => p.v);
  const lo = Math.min(...all), hi = Math.max(...all);
  const span = hi - lo || Math.max(Math.abs(hi) * 0.08, 1);
  const pts = numPts(m).filter((p) => inDomain(p.d, t0, t1));
  return { code, m, lo, hi, span, pts };
}

/* codes 缺省取 state.sel（一图秀页签）；肾功能趋势等固定场景显式传 ['cr','egfr']。 */
function chartSVG(t0, t1, codes) {
  const bands = state.toggles.treatment ? bandsFor(t0, t1) : [];
  const series = (codes || state.sel).filter((c) => M()[c]).map((c) => seriesFor(c, t0, t1)).filter((s) => s.pts.length);
  if (!series.length) return `<div class="empty"><h3>这个时间窗里没有所选指标</h3><p>扩大时间范围，或在左侧加选一个指标。</p></div>`;
  const yOf = (s, v) => CY1 - (v - s.lo) / s.span * (CY1 - CY0);
  const grid = [0, 1, 2, 3, 4].map((i) => { const y = CY0 + i * (CY1 - CY0) / 4; return `<line class="grid" x1="${CX0}" x2="${CX1}" y1="${y}" y2="${y}"/>`; }).join('');

  const strip = bands.map((b) => {
    if (b.kind === 'mark') {
      const x = b.x1.toFixed(1), row = 64;
      return `<g><path d="M ${x} ${row - 4} l4 4 -4 4 -4 -4 Z" fill="${b.color}"/>
        <text x="${(+x + 8).toFixed(1)}" y="${row + 3.5}" font-size="9.5" fill="${b.color}" font-weight="600">${esc(b.label)}</text></g>`;
    }
    const w = Math.max(b.x2 - b.x1, 7).toFixed(1);
    return `<g><rect x="${b.x1.toFixed(1)}" y="36" width="${w}" height="8" rx="4" fill="${b.color}" opacity=".3"/>
      <text x="${(b.x1 + 1).toFixed(1)}" y="30" font-size="9" fill="${b.color}" font-weight="500">${esc(b.label)}</text></g>`;
  }).join('');

  /* 事件竖虚线：上端止于 CY0-10（DEV-REQUIREMENTS 硬约束 23），下到数据区底。 */
  const markLines = bands.filter((b) => b.kind === 'mark').map((b) =>
    `<line x1="${b.x1.toFixed(1)}" x2="${b.x1.toFixed(1)}" y1="${CY0 - 10}" y2="${CY1}" stroke="${b.color}" stroke-width="1.2" stroke-dasharray="3 6" opacity=".45"/>`).join('');

  // 末点标签：按 y 排序强制最小间距 13px，右端左锚定，防叠字
  const lastPos = series.map((s) => {
    const c = s.pts.map((p) => ({ x: xOf(Date.parse(p.d), t0, t1), y: yOf(s, p.v) }));
    const last = c[c.length - 1];
    return { s, x: last.x, y: last.y, v: s.pts[s.pts.length - 1].v };
  }).sort((a, b) => a.y - b.y);
  let cursor = -Infinity;
  for (const it of lastPos) { it.ly = Math.max(it.y, cursor + 13); cursor = it.ly; }
  const overflow = lastPos.length ? Math.max(0, lastPos[lastPos.length - 1].ly - (CY1 + 2)) : 0;
  if (overflow) for (const it of lastPos) it.ly -= overflow;

  const lines = series.map((s) => {
    const coords = s.pts.map((p) => ({ x: xOf(Date.parse(p.d), t0, t1), y: yOf(s, p.v) }));
    const path = s.pts.length > 1 ? `<path class="line" d="${smoothPath(coords)}" stroke="${s.m.color}" pathLength="1"/>` : '';
    const points = coords.map((c, i) => {
      const p = s.pts[i];
      const isLast = i === s.pts.length - 1;
      const r = isLast ? 5.2 : (i === 0 ? 4.6 : 4);
      const active = state.pin && state.pin.code === s.code && state.pin.date === p.d;
      return `<circle class="pt${active ? ' active' : ''}" cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="${r}" fill="${s.m.color}" data-action="pin" data-code="${s.code}" data-date="${p.d}"/>`;
    }).join('');
    const lp = lastPos.find((x) => x.s === s);
    const nearRight = lp.x > CX1 - 44;
    const lx = nearRight ? lp.x - 8 : lp.x + 8;
    const label = state.toggles.keypoints
      ? `<text class="delta-tag" x="${lx.toFixed(1)}" y="${(lp.ly + 4).toFixed(1)}" text-anchor="${nearRight ? 'end' : 'start'}" fill="${s.m.color}">${fmtNum(lp.v, s.m.dec)}</text>` : '';
    /* 单点序列：写「只有 1 次记录，暂不连线」而不是画一条一个点的线（SCENARIOS 一图秀断言）。
       位置避开末点数值标签（数值在 ly+4，注记在下 18px）。 */
    const single = s.pts.length === 1
      ? `<text x="${(nearRight ? lp.x - 10 : lp.x + 10).toFixed(1)}" y="${(lp.ly + 20).toFixed(1)}" text-anchor="${nearRight ? 'end' : 'start'}" font-size="9.5" fill="#8fa1b5">只有 1 次记录，暂不连线</text>` : '';
    return `<g>${path}${points}${label}${single}</g>`;
  }).join('');

  const ticks = monthTicks(t0, t1).map((t) => `<line class="axis" x1="${t.x.toFixed(1)}" x2="${t.x.toFixed(1)}" y1="${CY1}" y2="${CY1 + 5}"/><text class="tick" x="${t.x.toFixed(1)}" y="${CY1 + 18}" text-anchor="middle">${t.label}</text>`).join('');
  const rowLabels = state.toggles.treatment
    ? `<text x="6" y="34" font-size="9" fill="#8fa1b5">周期</text><text x="6" y="68" font-size="9" fill="#8fa1b5">评估</text>`
    : '';

  return `<svg class="chart" viewBox="0 0 ${CW} ${CH}" role="img" aria-label="所选指标的时序图，共 ${series.length} 条序列">
    ${grid}${ticks}${markLines}${strip}${rowLabels}${lines}
    <text class="tick" x="${CX0}" y="${CY1 + 36}">各序列按自身全部记录的最小值–最大值归一化，不代表数值可比</text>
  </svg>`;
}

const pageHead = (sub) => `<div class="page-head"><div><h1>${esc(PAGES.find(p => p[0] === state.view)[1])}</h1><p>${esc(SUBTITLES[state.view])}</p></div></div>${sub ? `<div class="subnav" role="tablist">${SUBPAGES[state.view].map((s, i) => `<button role="tab" aria-selected="${(state.sub[state.view] || 0) === i}" data-sub="${i}">${esc(s)}</button>`).join('')}</div>` : ''}`;
const row = (b, p, right = '') => `<div class="row"><div class="row-main"><div><b>${b}</b>${p ? `<p>${p}</p>` : ''}</div></div>${right}</div>`;
const pill = (t, c = '') => `<span class="pill ${c}">${esc(t)}</span>`;

/* ---------------- views ---------------- */
function vDashboard() {
  const p = P(), m = M();
  const next = p.rhythm[0];
  const alertNext = `<div class="alert-strip"><div><b>下一次节点：${esc(next[0])}</b><p>${esc(next[3])}</p></div><button class="soft" data-action="go-sub" data-view="review" data-sub-i="0">看随访日历</button></div>`;
  /* 待办按档案分：晚期（A）先记症状，主动监测（B）先记影像——两条主路径各自的第一件事。 */
  const tasks = state.profile === 'B'
    ? [{ ic: 'monitor', t: '记一次影像结果', d: '日期 / 方式 / 大小原文，一行一次', view: 'monitor', sub: 1 },
       { ic: 'imaging', t: '报告看不懂？先理资料', d: '上传 → 解析 → 核对 → 入库，原件始终保留', view: 'imaging', sub: 2 },
       { ic: 'chat', t: '和 AI 理一理这一页', d: '生成可预览的提示词草稿；发送前你确认', view: null, sub: 0, act: 'agent-open' },
       { ic: 'review', t: '准备下次复诊清单', d: '想问的事 + 我的看法，两区分开导出', view: 'review', sub: 2 },
       { ic: 'labs', t: '本周期检验结果', d: 'Cr / eGFR / 尿蛋白已录入', view: 'labs', sub: 0 }]
    : [{ ic: 'tox', t: '记一笔这周的症状', d: '手脚反应 / 腹泻 / 乏力，只记原话', view: 'tox', sub: 1 },
       { ic: 'imaging', t: '报告看不懂？先理资料', d: '上传 → 解析 → 核对 → 入库，原件始终保留', view: 'imaging', sub: 2 },
       { ic: 'chat', t: '和 AI 理一理这一页', d: '生成可预览的提示词草稿；发送前你确认', view: null, sub: 0, act: 'agent-open' },
       { ic: 'review', t: '准备下次复诊清单', d: '想问的事 + 我的看法，两区分开导出', view: 'review', sub: 2 },
       { ic: 'labs', t: '本周期检验结果', d: 'Cr / eGFR / 甲功 / 尿蛋白已录入', view: 'labs', sub: 0 }];
  const taskCards = tasks.map(t => `<button class="task-entry" data-action="${t.act || 'go-sub'}"${t.view ? ` data-view="${t.view}" data-sub-i="${t.sub}"` : ''}><span class="entry-icon">${icon(t.ic)}</span><b>${t.t}</b><span>${t.d}</span><span class="arrow">›</span></button>`).join('');
  const rhythm = `<div class="card"><div class="card-head"><h2>${esc(p.titles.rhythm || '监测与随访节奏')}</h2><span class="source-link">以医生安排为准</span></div>
    ${p.rhythm.map(r => row(`<b>${esc(r[0])}</b>`, `${esc(r[1])} — ${esc(r[2])}`, `<small>${esc(r[3])}</small>`)).join('')}
    <p class="small-note">以上为指南常见节奏摘录（机构 + 版本 + 小节，页码待核），仅供准备讨论；实际安排以你的医生为准。</p></div>`;
  const cards = (DASH_KEYS[state.profile] || []).filter(k => m[k]).map(k => mcard(k, m[k])).join('');
  return `<div class="page-enter">${pageHead()}
  <div class="hero"><div><span class="eyebrow">当前情况</span><h1>${esc(p.headline)}</h1><p>${esc(p.mindset)}</p>
    <div class="actions"><button class="primary" data-action="go-sub" data-view="labs" data-sub-i="1">看病情一图秀</button><button class="soft" data-action="go-sub" data-view="tumor">我的瘤与分型</button><button class="soft hero-ai" data-action="agent-open">${icon('chat')}AI 对话</button></div></div>
    <div class="hero-mascot" aria-hidden="true"><span style="font-size:56px">🫘</span></div></div>
  ${alertNext}
  <div class="intent"><i>✓</i><span>工作台只做<b>记录与整理</b>；诊断、方案调整由医生决定。页面里全部资料为<b>演示数据</b>。</span></div>
  <div class="section-title"><h2>接下来可以做的事</h2></div>
  <div class="task-grid">${taskCards}</div>
  <div class="dash-cols"><div class="stack">${rhythm}
    <div class="card"><div class="card-head"><h2>这个工作台刻意不做的事</h2><span class="source-link">写进表结构，不只是文案</span></div>
      ${row('<b>不算生长速度</b>', '主动监测的大小只按原文并列，不折算 mm/年——一算就等于替医生下「要不要做手术」的结论。')}
      ${row('<b>不打 IMDC 分</b>', '六项标准只引用原文；分层由医生判定，产品不自行打分（IMDC 是预后模型，不是预测工具）。')}
      ${row('<b>不判方案优劣</b>', '线序只记方案名、起止与当时指标，不比较、不排序。')}
      ${row('<b>不给停药 / 减量建议</b>', '副作用与同日血压并置不并轴；「要不要调」永远是问医生的问题。')}
      ${row('<b>不做复发预测</b>', '没有预测句子；记录放回位置，判断交给医生。')}
      <p class="small-note">这些不是「还没做」的功能，是刻意不做——表里就没有这些字段，页面也不补。</p></div></div>
  <div class="stack">
    <div class="card"><div class="card-head"><h2>最近指标</h2><span class="source-link">轻点卡片翻面</span></div>
      <div class="metric-grid">${cards}</div></div></div></div></div>`;
}

/* 我的瘤与分型：分型 / 分期 / 分级 / 遗传说四个不同的词，四页签各自记录，不合并。 */
function vTumor() {
  const p = P();
  const i = state.sub.tumor || 0;
  const rowItems = p.pathology.filter(r => r[0] === 'row');
  const gapItems = p.pathology.filter(r => r[0] === 'gap');
  const hero = `<div class="subtype-hero"><div><span class="code">病理与分型档案</span><h2>${esc(p.stage)}</h2><span class="en">${esc(p.path[0])} · 依据：病理报告原件（已归档）</span>
    <div class="subtype-meta">${p.path.map(s => pill(s, 'violet')).join('')}</div></div>
    <div class="path-tree">${p.path.map((s, j) => `<div class="${j === 0 ? 'on' : ''} ${j > 0 ? 'lv' + Math.min(j, 3) : ''}">${esc(s)}</div>`).join('')}</div></div>
    <p class="small-note">分型（是什么癌）、分期（长到哪了）、分级（细胞长得多凶）是三个不同的词，分别记录、不互相推导；不同标本、不同时间的结论各自保留，不用新报告覆盖旧记录。</p>`;
  const histoCard = `<div class="section-title"><h2>${esc(p.titles.pathology || '病理与分型')}</h2><span class="source-link">报告原文照抄</span></div>
    <div class="card">${rowItems.length ? rowItems.map(r => row(`<b>${esc(r[1])}</b>`, esc(r[2]), `<small>${esc(r[3])}<br>${esc(r[4])}</small>`)).join('') : '<p>本档案暂无已核实的病理条目。</p>'}
    ${gapItems.length ? `<div class="section-title" style="margin-top:14px"><h2>缺项</h2><span class="source-link">未回报 ≠ 阴性</span></div>
      ${gapItems.map(r => row(`<b>${esc(r[1])}</b>`, esc(r[2]), pill('未回报', 'grey'))).join('')}` : ''}
    <p class="small-note">未检测、未回报的项原样显示「未回报」，不补成阴性；是否补做、怎么解读由医生判断。</p></div>`;
  const staging = `<div class="section-title"><h2>${esc(p.titles.staging || '分期记录')}</h2><span class="source-link">TNM 原文照抄</span></div>
    <div class="card">${p.staging.length ? p.staging.map(s => row(`<b>${esc(s[1])}</b>`, `${esc(s[0])} · ${esc(s[2])}`, `<small>${esc(s[3])}<br>${esc(s[4])}</small>`)).join('') : '<p>本档案暂无分期记录。</p>'}
    <p class="small-note">界面上的「分期」只用于 TNM 语境，不用于分型语境；临床分期（c）与病理分期（p）可能不同，分别保留。</p></div>
    <div class="card"><div class="card-head"><h2>「分期」是什么</h2><span class="source-link">AJCC 第 8 版 · 小节页码待核</span></div>
      ${row('<b>TNM 三个字母</b>', 'T 看原发肿瘤的大小与范围，N 看区域淋巴结，M 看远处转移；后面的数字由影像与病理确定。')}
      ${row('<b>临床分期 vs 病理分期</b>', 'c 开头是影像判断，p 开头是术后病理确认；两者结论可能不同，各记各的。')}
      <p class="small-note">以上为名词解释（机构 + 版本 + 小节，页码待核）；你的分期以报告原文与医生解读为准。</p></div>`;
  const gradeRows = p.pathology.filter(r => /分级/.test(r[1]));
  const grading = `<div class="section-title"><h2>病理分级</h2><span class="source-link">只照抄，不评语</span></div>
    <div class="card">${gradeRows.length ? gradeRows.map(r => r[0] === 'row'
      ? row(`<b>${esc(r[1])}</b>`, esc(r[2]), `<small>${esc(r[3])}<br>${esc(r[4])}</small>`)
      : row(`<b>${esc(r[1])}</b>`, esc(r[2]), pill('未回报', 'grey'))).join('') : '<p>本档案暂无分级记录。</p>'}
    <p class="small-note">分级描述的是细胞核形态，与分型（透明细胞 / 乳头状 / 嫌色…）是两个词；界面不出「高级别 / 低级别」这类评语——那句话属于医生的判断。</p></div>
    <div class="card"><div class="card-head"><h2>「分级」是什么</h2><span class="source-link">WHO/ISUP 分级 · 出处待核</span></div>
      ${row('<b>1–4 级</b>', '肾癌常用 WHO/ISUP 分级（1–4 级），依据细胞核形态；级别写在病理报告里，由病理科医生判定。')}
      ${row('<b>它不等于分期</b>', '分期说「长到哪了」，分级说「细胞长得多凶」；两个都要看，但回答的是不同问题。')}
      <p class="small-note">以上为名词解释；你的分级以病理报告原文为准。</p></div>`;
  const genetics = `<div class="section-title"><h2>${esc(p.titles.genetics || '遗传与家系')}</h2><span class="source-link">默认私密</span></div>
    <div class="card">${p.genetics.length ? p.genetics.map(g => {
      const [cls, label] = { ok: ['green', '已检测'], na: ['grey', '未检测'], warn: ['yellow', '需关注'], pending: ['violet', '待出'] }[g[3]] || ['grey', '未检测'];
      return row(`<b>${esc(g[0])}（${esc(g[1])}）</b>`, esc(g[2]), `<div style="text-align:right">${pill(label, cls)}<small style="display:block;margin-top:4px">${esc(g[4])}</small><small style="display:block">${esc(g[5] || '')}</small></div>`);
    }).join('') : '<p>本档案暂无家系记录。</p>'}
    <p class="small-note">只记录成员的检测状态与报告原文：已检测 / 未检测 / 需关注 / 待出四态分列，未检测不写成「阴性」；家属口述会标明「非检测」。这一页默认私密，不进导出白名单；家系多人有肾相关问题时，是否进一步检查由医生判断。</p></div>`;
  const bodies = [`${hero}${histoCard}`, staging, grading, genetics];
  return `<div class="page-enter">${pageHead(true)}${bodies[i] || bodies[0]}</div>`;
}

/* 手术与肾功能：术式档案 + Cr/eGFR 趋势（与基线并列）+ 对侧肾记录。 */
function vRenal() {
  const p = P(), m = M();
  const i = state.sub.renal || 0;
  const surgery = `<div class="section-title"><h2>${esc(p.titles.surgery || '诊断与手术记录')}</h2><span class="source-link">术式与日期照抄</span></div>
    <div class="card">${p.surgery.length ? p.surgery.map(s => row(`<b>${esc(s[1])}</b>`,
      `${esc(s[2])}${s[3] && s[3] !== '—' ? ` · 重建 / 吻合：${esc(s[3])}` : ''}`,
      `<small>${esc(s[0])}<br>${esc(s[4])}<br>${esc(s[5])}</small>`)).join('') : ''}
    ${p.surgery.length ? '' : `<div class="empty" style="margin-top:0"><h3>本档案暂无手术记录</h3><p>本档案走主动监测路径，还没有手术；如后续手术，术式、日期与机构会按记录原文留在这里，不补默认值。</p></div>`}
    <p class="small-note">活检也记在这里——它是诊断路径的一步，不是治疗决策。</p></div>
    <div class="card"><div class="card-head"><h2>术式词表</h2><span class="source-link">六种，按记录原文选</span></div>
      ${row('<b>肾部分切除（PN）/ 根治性肾切除（RN）</b>', '保肾还是根治是第一个大决策；工作台只记录最终选择与报告原文，不出现「哪种更好」的文案。')}
      ${row('<b>消融（射频 / 冷冻 / 微波）</b>', '小肿块的另一种处理方式；记录方式、日期与机构。')}
      ${row('<b>活检</b>', '穿刺取组织做病理；晚期取活检确定分型与用药依据。')}
      <p class="small-note">术式选择由患者与医生共同决定，工作台不参与也不评判。</p></div>`;
  const [t0, t1] = domain();
  const base = m.cr && m.cr.points.length ? m.cr.points[0] : null;
  const trend = `<div class="card"><div class="card-head"><h2>Cr / eGFR 趋势</h2><span class="source-link">与基线并列 · 不判读</span></div>
    <div class="chart-wrap">${chartSVG(t0, t1, ['cr', 'egfr'])}</div>
    <div class="metric-grid">${m.cr ? mcard('cr', m.cr) : ''}${m.egfr ? mcard('egfr', m.egfr) : ''}</div>
    <p class="small-note">两条线各按自身记录的最小值–最大值归一化，只用于同屏看「什么时候升、什么时候降」，不代表数值可比；没有「恶化 / 下降」字样。术后肌酐比术前高要不要紧，是「想问医生的问题」，不是工作台的判断。</p></div>
    <div class="card"><div class="card-head"><h2>基线点（最早一条 Cr 记录）</h2><span class="source-link">治疗前 / 手术前</span></div>
    ${base ? row(`<b>${esc(base.d)} · Cr ${base.v} ${esc(m.cr.unit)}</b>`, esc(base.src), pill('基线', 'violet')) : row('<b>暂无基线记录</b>', '最早一条 Cr 记录会作为基线点显示在这里。')}
    <p class="small-note">${state.profile === 'A'
      ? '本档案的基线是穿刺前评估（2026-04-20）；一线开始后的变化都与这一天对照。'
      : '本档案未手术，基线取首次评估值（2026-04-21）；AS 期间的基础肾功能同样只并列，不判断。'}</p></div>`;
  const contra = `<div class="section-title"><h2>${esc(p.titles.contra || '对侧肾与基础肾')}</h2><span class="source-link">原文照抄</span></div>
    <div class="card">${p.contra.length ? p.contra.map(c => row(`<b>${esc(c[1])}</b>`, esc(c[2]), `<small>${esc(c[0])}<br>${esc(c[3])}</small>`)).join('') : '<p>本档案暂无对侧肾记录。</p>'}
    <p class="small-note">「未记录」与「正常」必须能分开：没记就是没记，不补成正常。孤立肾、双侧病变、慢性肾病患者的肾功能负担更重，这些状态按报告原文记录，供复诊时逐条与医生核对。</p></div>`;
  const bodies = [surgery, trend, contra];
  return `<div class="page-enter">${pageHead(true)}${bodies[i] || bodies[0]}</div>`;
}

/* 主动监测：小肿块「先看着」也是真实路径。影像按原文并列——不连线、不算速度、不设阈值。 */
function vMonitor() {
  const p = P();
  const i = state.sub.monitor || 0;
  const asRows = p.as || [];
  const timeline = `<div class="section-title"><h2>${esc(p.titles.as || '主动监测影像')}</h2><span class="source-link">一行一次影像 · 并列摆放</span></div>
    <div class="card">${asRows.length ? asRows.map(a => row(`<b>${esc(a[0])} · ${esc(a[1])}</b>`,
      `大小原文：${esc(a[2])} · 位置：${esc(a[3])}`, `<small>${esc(a[4])}<br>${esc(a[5])}</small>`)).join('')
      : `<div class="empty" style="margin-top:0"><h3>本档案没有主动监测记录</h3><p>本档案走晚期治疗路径，疗效评估影像在「影像与报告」页；AS 记录位留给「先看着」的小肿块路径。</p></div>`}
    <p class="small-note">每次影像是一行：日期、方式、大小原文、位置、机构、来源。新增一行，旧行不动（更正只新增版本）；<b>不连线成「生长曲线」</b>——连线会让人读出「在长快」，那是判断，不是记录。</p></div>`;
  const sizes = `<div class="section-title"><h2>影像与大小</h2><span class="source-link">原文并列 · 不算 mm/年</span></div>
    <div class="card">${asRows.length ? `<div class="dv-row">${asRows.map((a, j) => `<div class="dv ${j === asRows.length - 1 ? 'on' : ''}"><span>${esc(a[0])} · ${esc(a[1])}</span><b>${esc(a[2])}</b><p>${esc(a[3])} · ${esc(a[4])}</p></div>`).join('')}</div>` : `<div class="empty" style="margin-top:0"><h3>本档案暂无影像记录</h3><p>AS 路径的影像条目会按原文并列在这里；本档案未走这条路径。</p></div>`}
    <p class="small-note">大小按报告原文记录（cm / mm 不换算、不取平均）；<b>不算生长速度、不设「该手术了」的阈值</b>。「这次大了一毫米，要紧吗？」这类问题在产品里的出口是「想问医生的问题」，见「随访与复诊 · 问题清单」。</p></div>
    ${asRows.length ? `<div class="card"><div class="card-head"><h2>关于 AS 想问的事</h2><span class="source-link">只记录，不生成答案</span></div>
      ${(p.questions || []).filter(q => /AS|监测|间隔|大小|毫米|拍片|影像/.test(q[1])).map(q => row(`<b>${esc(q[0])}</b>`, esc(q[1]), q[2] ? pill('已问', 'green') : pill('待问', 'yellow'))).join('') || row('<b>暂无</b>', '想到什么就先记下来。')}
      <p class="small-note">产品不生成答案；医生回答过的原话会记在同一行。</p></div>` : ''}`;
  const rhythm = `<div class="section-title"><h2>监测节奏</h2><span class="source-link">CSCO 2025 §7 原文引用</span></div>
    <div class="card">${p.rhythm.map(r => row(`<b>${esc(r[0])}</b>`, `${esc(r[1])} — ${esc(r[2])}`, `<small>${esc(r[3])}</small>`)).join('')}
    <p class="small-note">密切监测（T1a）的指南原文：「开始前 2 年每 3 个月 1 次，然后每 6 个月 1 次，5 年后每年 1 次」（机构 + 版本 + 小节，页码待核）。节点 = 起点 + k×间隔，是参考不是计划，<b>不发提醒</b>；实际安排以医生为准。</p></div>`;
  const bodies = [timeline, sizes, rhythm];
  return `<div class="page-enter">${pageHead(true)}${bodies[i] || bodies[0]}</div>`;
}

/* 治疗与线序：换方案 = 新增行；IMDC 只引用原文，产品不打分。 */
function vTreatment() {
  const p = P();
  const i = state.sub.treatment || 0;
  const done = p.cycles.filter(c => c[4]).length;
  const lineStrip = p.lines.length ? `<div class="line-strip">${p.lines.map((l, j) => `<button class="line-chip" aria-pressed="${j === p.lines.length - 1}">${esc(l[1])}</button>`).join('')}</div>` : '';
  const plan = p.lines.length ? `<div class="plan-card"><div><span class="eyebrow">当前方案</span><div class="big">${esc(p.lines[p.lines.length - 1][1])}<small>${esc(p.lines[p.lines.length - 1][2])}</small></div>
    <div class="progress"><i style="width:${Math.round(done / Math.max(p.cycles.length, 1) * 100)}%"></i></div>
    <p class="small-note" style="margin:8px 0 0">已完成 ${done} / ${p.cycles.length} 个周期（按记录）</p></div>
    <button class="primary" data-action="go-sub" data-view="labs" data-sub-i="1">与指标对照</button></div>` : '';
  const linesCard = `<div class="section-title"><h2>${esc(p.titles.lines || '治疗线序')}</h2><span class="source-link">换方案 = 新增行</span></div>
    <div class="card">${p.lines.length ? p.lines.map(l => row(`<b>第 ${l[0]} 线 · ${esc(l[1])}</b>`,
      `${esc(l[2])}<br>起：${esc(l[3])}${l[4] ? ` · 止：${esc(l[4])}` : ' · 止：—'}`,
      `<div style="text-align:right">${pill(l[5], l[5] === '进行中' ? 'green' : 'grey')}<small style="display:block;margin-top:4px">${esc(l[6])}</small></div>`)).join('')
      : `<div class="empty" style="margin-top:0"><h3>本档案暂无系统治疗记录</h3><p>本档案走主动监测路径，没有用过靶向 / 免疫方案；如后续开始系统治疗，每一线按医嘱原文新增一行。</p></div>`}
    <p class="small-note">线序来自医嘱与出院小结原件；换线、调药以医生决定为准，工作台只做记录，不比较方案优劣。</p>
    <p class="small-note">界面出现的药名（本档案演示方案：帕博利珠单抗、阿昔替尼）均为演示数据，<b>各药在中国肾癌适应症的获批状态未逐条核实</b>（DEV-PLAN 已知风险 3）——是否获批、是否在适应症内、怎么用，以医嘱与药品说明书为准。</p></div>`;
  const imdc = `<div class="section-title"><h2>${esc(p.titles.imdc || '危险度分层（医生判定）')}</h2><span class="source-link">产品不打分</span></div>
    <div class="card">${p.imdc.length ? p.imdc.map(im => `<div class="row"><div class="row-main"><div><b>${esc(im[0])} · ${esc(im[1])}</b><p>${esc(im[2])}</p></div></div>
      <div style="text-align:right">${pill('医生判定', 'green')}<small style="display:block;margin-top:4px">${esc(im[3])}</small><small style="display:block">${esc(im[4])}</small></div></div>`).join('') : `<div class="empty" style="margin-top:0"><h3>本档案暂无危险度分层记录</h3><p>晚期开始系统治疗时，医生会按 IMDC 六项判定分层；本台只记录医生给出的结论原文。</p></div>`}
    <p class="small-note">IMDC 六项（KPS&lt;80% / 距确诊&lt;1 年 / 血红蛋白&lt;正常下限 / 校正钙&gt;正常上限 / 血小板&gt;正常上限 / 中性粒细胞&gt;正常上限；0 项低危、1–2 项中危、≥3 项高危）为 Heng 2009, J Clin Oncol 原文引用。<b>IMDC 是预后模型，不是预测工具</b>——工作台不自行打分，也不据它预测疗效。</p></div>`;
  const adjTrials = TRIALS.filter(t => /辅助|局限性/.test(t.title));
  const adjuvant = `<div class="section-title"><h2>辅助治疗</h2><span class="source-link">记录位 · 无判断字段</span></div>
    <div class="card"><div class="empty" style="margin-top:0"><h3>本档案暂无辅助治疗记录</h3><p>术后是否辅助、辅助用什么，由医生按病理高危因素决定；工作台只记录已发生的医嘱原文，不生成「需要 / 不需要」的判断。</p></div></div>
    <div class="section-title"><h2>相关研究线索</h2><span class="source-link">登记状态未核实</span></div>
    <div class="card">${adjTrials.length ? adjTrials.map(t => `<div class="saved-item"><b>${esc(t.title)}</b>
      <p>${esc(t.phase)} · ${esc(t.status)} · 申办：${esc(t.sponsor)}</p>
      <small>NCT ${esc(t.id)} · <a href="${t.url}" target="_blank" rel="noopener">登记页原文 ↗</a></small></div>`).join('')
      : '<p>暂无相关线索。</p>'}
    <p class="small-note">线索只是线索：登记状态不等于入组资格，是否适合由医生与研究中心判断。更多见「临床研究」页。</p></div>`;
  const bodies = [`${lineStrip}${plan}${linesCard}`, imdc, adjuvant];
  return `<div class="page-enter">${pageHead(true)}${bodies[i] || bodies[0]}</div>`;
}

/* 用药与副作用：靶免患者天天在家面对的一页。症状与同日血压 / 甲功 / 尿蛋白并置不并轴。 */
function vTox() {
  const p = P(), m = M();
  const i = state.sub.tox || 0;
  const done = p.cycles.filter(c => c[4]).length;
  const plan = p.lines.length ? `<div class="plan-card"><div><span class="eyebrow">当前用药</span><div class="big">${esc(p.lines[p.lines.length - 1][1])}<small>${esc(p.lines[p.lines.length - 1][2])}</small></div>
    <p class="small-note" style="margin:8px 0 0">起：${esc(p.lines[p.lines.length - 1][3])} · ${pill(p.lines[p.lines.length - 1][5], p.lines[p.lines.length - 1][5] === '进行中' ? 'green' : 'grey')}</p></div>
    <button class="primary" data-action="go-sub" data-view="treatment">看线序时间轴</button></div>
    <div class="card"><div class="card-head"><h2>周期记录</h2><span class="source-link">来自输液记录与医嘱</span></div>
    <div class="table-wrap"><table class="cycle-table"><thead><tr><th>周期</th><th>日期</th><th>用药</th><th>状态</th></tr></thead><tbody>
    ${p.cycles.map(c => `<tr class="${c[4] ? 'done' : 'next'}"><td><b>${esc(c[0])}</b></td><td class="num">${esc(c[1])}</td><td>${esc(c[2])}</td><td>${pill(c[3], c[4] ? 'green' : 'violet')}</td></tr>`).join('')}</tbody></table></div>
    <p class="small-note">已完成 ${done} / ${p.cycles.length} 个周期（按记录）；周期记录来自出院小结与输液记录原件，更正只新增版本。</p>
    <p class="small-note">界面出现的药名均为演示数据，<b>各药在中国肾癌适应症的获批状态未逐条核实</b>（DEV-PLAN 已知风险 3）——是否获批、是否在适应症内、怎么用，以医嘱与药品说明书为准。</p></div>`
    : `<div class="empty"><h3>本档案暂无用药记录</h3><p>本档案走主动监测路径，没有系统治疗用药；后续开始的方案会按医嘱原文记在这里。</p></div>`;
  const toxCards = ['hfsr', 'fatigue', 'diarrhea'].filter(k => m[k]).map(k => mcard(k, m[k])).join('');
  const symptoms = `<div class="section-title"><h2>${esc(p.titles.tox || '副作用与症状')}</h2><span class="source-link">只记原话 · 不分级</span></div>
    <div class="card"><div class="table-wrap"><table class="cycle-table"><thead><tr><th>日期</th><th>症状</th><th>原话 / 医生记录</th><th>备注</th></tr></thead><tbody>
    ${p.tox.map(t => `<tr><td class="num"><b>${esc(t[0])}</b></td><td>${esc(t[1])}</td><td>${t[2] && t[2] !== '—' ? esc(t[2]) : '<small style="color:var(--muted)">未记录</small>'}</td><td><small>${esc(t[3])}</small></td></tr>`).join('')}</tbody></table></div>
    ${toxCards ? `<div class="section-title" style="margin-top:14px"><h2>症状原话（分类记录）</h2><span class="source-link">不翻面 · 不连线</span></div><div class="metric-grid">${toxCards}</div>` : ''}
    <p class="small-note">「原话 / 医生记录」列存的是你照抄的 CTCAE 语境原文或医生原话，<b>不是产品判定的级别</b>——所以列名不叫 grade。「该联系谁」只给观察项：症状出现在什么程度、持续多久、要不要提前复诊，由医生判断；停药 / 减量建议一句不生成。</p></div>`;
  const bpCards = ['bp_sys', 'bp_dia'].filter(k => m[k]).map(k => mcard(k, m[k])).join('');
  const bp = `<div class="section-title"><h2>血压</h2><span class="source-link">家庭自测 · 与症状并置</span></div>
    <div class="card">${bpCards ? `<div class="metric-grid">${bpCards}</div>` : '<p>本档案暂无血压记录。</p>'}
    <p class="small-note">血压在靶向治疗期间是副作用监测项（TKI 常见高血压），所以放在这一页而不是普通体征。血压与症状<b>并置不并轴</b>——「因为血压高所以停药」这类因果句一句不生成；是否调整降压药，问你的医生。</p></div>`;
  const thyroidCards = ['tsh', 'ft4'].filter(k => m[k]).map(k => mcard(k, m[k])).join('');
  const thyr = `<div class="section-title"><h2>甲功</h2><span class="source-link">TKI 常见甲减</span></div>
    <div class="card">${thyroidCards ? `<div class="metric-grid">${thyroidCards}</div>` : `<div class="empty" style="margin-top:0"><h3>本档案暂无甲功记录</h3><p>TSH / FT4 主要出现在靶向治疗期间；本档案未记录，保持空态不补默认值。</p></div>`}
    <p class="small-note">CSCO 2025 肾癌分册 §7 全身治疗随访含甲功（小节页码待核）；甲功异常是否处理、怎么处理由医生决定。</p></div>`;
  const urineCards = ['uacr', 'up_qual'].filter(k => m[k]).map(k => mcard(k, m[k])).join('');
  const urine = `<div class="section-title"><h2>尿蛋白</h2><span class="source-link">TKI 蛋白尿语境</span></div>
    <div class="card">${urineCards ? `<div class="metric-grid">${urineCards}</div>` : '<p>本档案暂无尿蛋白记录。</p>'}
    <p class="small-note">UACR 按该院化验单参考区间记录；定性结果照抄尿常规报告原文——报告写「阴性」才记阴性，没查就不记。蛋白尿要不要紧、要不要调药，问你的医生。</p></div>`;
  const bodies = [plan, symptoms, bp, thyr, urine];
  return `<div class="page-enter">${pageHead(true)}${bodies[i] || bodies[0]}</div>`;
}

/* 化验与指标：指标卡 / 一图秀 / 参考范围。肾癌没有常规血清标志物——指标字典从肾功能开始。 */
function vLabs() {
  const m = M();
  const i = state.sub.labs || 0;
  if (i === 1) {
    const [t0, t1] = domain();
    const series = state.sel.filter((c) => m[c]).map((c) => seriesFor(c, t0, t1)).filter((s) => s.pts.length);
    const groups = CAT_ORDER.map((cat) => ({ cat, codes: Object.keys(m).filter((k) => m[k].cat === cat) })).filter((g) => g.codes.length);
    const pinData = state.pin && m[state.pin.code] ? m[state.pin.code].points.find((p) => p.d === state.pin.date) : null;
    const [bs, be] = dataBounds();
    const rng = `${shortDate(new Date(bs).toISOString().slice(0, 10))} – ${shortDate(new Date(be).toISOString().slice(0, 10))}`;
    const rangeChips = `<div class="chips" style="margin:0 0 14px" aria-label="时间范围">${[['3m', '近 3 月'], ['6m', '近 6 月'], ['12m', '近 12 月'], ['all', '全期']].map(([k, l]) => `<button class="chip" aria-pressed="${state.range === k}" data-action="range" data-range="${k}">${l}</button>`).join('')}</div>`;
    const rail = `<aside class="rail" aria-label="筛选与指标选择">
      <details class="pick" ${state.sel.length && (typeof window !== 'undefined' && window.innerWidth > 900 ? 'open' : '')}>
        <summary>选择指标 <small>最多 4 个 · 已选 ${state.sel.length}</small></summary>
        <div class="metric-list">
          ${groups.map((g) => `<div class="cat-label">${esc(g.cat)}</div>${g.codes.filter((c) => numPts(m[c]).length).map((c) => `<label class="metric-pick"><input type="checkbox" ${state.sel.includes(c) ? 'checked' : ''} data-pick="${c}"><i style="background:${m[c].color}"></i><span>${esc(m[c].name)}</span><small>${numPts(m[c]).length} 次</small></label>`).join('')}`).join('')}
        </div>
      </details>
      <section><h3>显示</h3>
        <div class="chips">
          <button class="chip" aria-pressed="${state.toggles.treatment}" data-action="toggle" data-key="treatment">治疗节点</button>
          <button class="chip" aria-pressed="${state.toggles.keypoints}" data-action="toggle" data-key="keypoints">末点数值</button>
        </div>
      </section>
      <section><h3>时间窗缩放</h3>
        <div class="zoom"><input type="range" min="40" max="100" value="${state.zoom}" data-action="zoom" aria-label="时间窗缩放"><span>${state.zoom}%</span></div>
        <p class="small-note">右端锚定最新记录；40% 表示只看最近四成时间。</p>
      </section>
      <section><h3>口径</h3><p class="small-note">每条线按该指标全部记录的最小值–最大值归一化，只用于同屏回顾，不能比较不同指标的绝对值；换医院、换方法的结果以来源标注区分。</p></section>
    </aside>`;
    const chartPanel = `<div class="chart-panel">
        <div class="chart-top">
          <div><h2 style="font-size:15px">${series.length} 条序列 · ${state.range === 'all' ? '全期' : '近 ' + state.range.replace('m', ' 月')}</h2><p class="small-note">点击数据点固定详情；治疗条与数据区分离，不压曲线。</p></div>
          <span class="pill grey">${rng}</span>
        </div>
        <div class="legend">${series.map((s) => `<span><i style="background:${s.m.color}"></i><b>${esc(s.m.name)}</b><span class="range">${fmtNum(s.lo, s.m.dec)}–${fmtNum(s.hi, s.m.dec)} ${esc(s.m.unit)}</span></span>`).join('')}</div>
        <p class="scroll-hint small-note">图表可左右滑动</p>
        <div class="chart-wrap">${chartSVG(t0, t1)}</div>
        ${pinData ? `<div class="pin"><div><b>${esc(m[state.pin.code].name)} · ${fmtNum(pinData.v, m[state.pin.code].dec)} ${esc(m[state.pin.code].unit)}</b><p>${esc(longDate(pinData.d))} · 来源：${esc(pinData.src)}</p></div><button class="icon-button" data-action="unpin" aria-label="关闭详情">×</button></div>` : ''}
      </div>`;
    const cardGroups = `<div class="section-title"><h2>指标卡片</h2><span class="source-link">点一张卡翻到背面；每张卡互不影响</span></div>
      ${groups.map((g) => `<div class="metric-group"><div class="metric-group-head"><h3>${esc(g.cat)}</h3><span>${g.codes.length} 项</span></div><div class="metric-grid">${g.codes.map((k) => mcard(k, m[k])).join('')}</div></div>`).join('')}`;
    return `<div class="page-enter">${pageHead(true)}${rangeChips}<div class="overview">${rail}<div class="timeline-main">${chartPanel}${cardGroups}</div></div></div>`;
  }
  if (i === 2) {
    const bandRows = Object.keys(m).map((k) => {
      const x = m[k];
      const band = x.band ? (x.band[1] == null ? `下限 ${x.band[0]}` : `${x.band[0]} – ${x.band[1]}`) : '无（记录项）';
      return row(`<b>${esc(x.name)}</b>`, `${esc(x.unit || '—')} · 参考 ${band}${x.band && x.band[1] == null ? `　${pill('上限未引入', 'yellow')}` : ''}`, `<small>${esc(x.cat)}</small>`);
    }).join('');
    return `<div class="page-enter">${pageHead(true)}
    <div class="card"><div class="card-head"><h2>参考范围（每张化验单自带）</h2><span class="source-link">不合并不同医院</span></div>
    ${bandRows}
    <p class="small-note">参考区间取每张化验单自带，可空；不同医院、不同方法的区间不合并。缺上限时，倍数类计算返回「需参考上限」，<b>不拿成人通用上限凑</b>——「下限可以借，上限不能借」。「未引入」不是「正常」：没引入就是没引入。</p></div>
    <div class="card"><div class="card-head"><h2>怎么看这些数</h2></div>
      ${row('<b>分级只用「对照」</b>', '界面不写「偏高 / 偏低 / 严重」；数值与参考区间并排，怎么理解由医生说。')}
      ${row('<b>趋势不等于疗效</b>', '一图秀的曲线只按自身记录归一化，看「什么时候升、什么时候降」，不代表疗效、复发或诊断判断。')}
      ${row('<b>缺值不是 0</b>', '某段时间没有记录就是没查；不插值、不补齐、不把空档读成「稳定」。')}
    </div></div>`;
  }
  return `<div class="page-enter">${pageHead(true)}${metricSections(CAT_ORDER)}
    <p class="small-note">肾癌没有常规血清标志物——所以这一页从肾功能开始。同一实验室、同一方法可比；指标卡轻点翻面看参考区间与口径说明，分类记录（症状原话、定性结果）不翻面、不连线。</p></div>`;
}

/* 影像与报告：影像时间轴 / 报告原文 / 资料整理（上传 → 解析 → 核对 → 入库）。 */
function vImaging() {
  const p = P();
  const i = state.sub.imaging || 0;
  const imagingEvents = (EVENTS[state.profile] || []).filter(e => /CT|超声|MRI|影像|PET/.test(e.label));
  const imagingDocs = DOCS[state.profile].filter(d => d.type === '影像');
  const timeline = `<div class="section-title"><h2>影像时间轴</h2><span class="source-link">只记日期与名称</span></div>
    <div class="card">${imagingEvents.length ? imagingEvents.map(e => row(`<b>${esc(e.d)}</b>`, esc(e.label))).join('') : '<p>本档案暂无影像事件。</p>'}
    <p class="small-note">工作台<b>不解读影像</b>：影像结论以报告原文为准，时间轴只回答「什么时候做过什么」。AS 路径的影像大小在「主动监测」页按原文并列。</p></div>
    <div class="card"><div class="card-head"><h2>报告里可能出现的词 · Bosniak 分级</h2><span class="source-link">解释卡 · 不是判读工具</span></div>
      ${row('<b>它是什么</b>', '对肾囊性肿块的影像分类，按 CT/MRI 上的表现分 I–IV 类；常用于「这个囊肿要不要紧」的影像描述语境。')}
      ${row('<b>出处</b>', 'Bosniak 分级：1986 年首版（Bosniak MA, Radiology），2019 年更新版覆盖 CT 与 MRI。机构与版本已注明，**页码待核**（中文指南原件未取得，见 DEV-PLAN 风险 2）。')}
      ${row('<b>工作台怎么用它</b>', '只解释、不判读：报告原文写了类别就照抄留档，没写就不补、不猜、不按影像描述自行归类——分类是影像科与临床医生的事。')}
      <p class="small-note">这张卡是「遇到不懂的词时查一下」的解释位（第②层：指标是什么、检查查什么）；「我的囊肿是几类、要不要处理」属第③层判断，出口只有「这一句需要问你的医生」。</p></div>
    <div class="card"><div class="card-head"><h2>影像报告（资料库中的影像类）</h2><span class="source-link">${imagingDocs.length} 份</span></div>
    ${imagingDocs.length ? imagingDocs.map(d => row(`<b>${esc(d.name)}</b>`, `${esc(d.date)} · ${esc(d.status)}`, `<button class="source-link" data-action="source" data-doc="${esc(d.id)}">原文</button>`)).join('') : '<p>暂无影像类材料。</p>'}</div>`;
  const reports = `<div class="section-title"><h2>报告原文</h2><span class="source-link">原件不丢 · 可点回来源</span></div>
    <div class="card">${docsTable()}
    <p class="small-note">每份材料保留各自的日期、类型与核对状态；「原文」按钮指向资料目录里的原件（演示中只显示文件名与日期）。新报告不覆盖旧记录——不同时间、不同来源的结论分别保留。</p></div>`;
  const bodies = [timeline, reports, recordsBody()];
  return `<div class="page-enter">${pageHead(true)}${bodies[i] || bodies[0]}</div>`;
}

/* 随访与复诊：随访日历 / 复诊摘要 / 问题清单。四种路径四种节奏，不排计划、不发提醒。 */
function vReview() {
  const p = P();
  const i = state.sub.review || 0;
  const calendar = `<div class="section-title"><h2>随访日历</h2><span class="source-link">节奏引用 · 节点参考</span></div>
    <div class="card">${p.rhythm.map(r => row(`<b>${esc(r[0])}</b>`, `${esc(r[1])} — ${esc(r[2])}`, `<small>${esc(r[3])}</small>`)).join('')}
    <p class="small-note">肾癌四种路径（PN/RN T1–2、RN T3–4、消融、AS）节奏各不相同，日历按你档案里的路径取值；<b>不排计划、不发提醒</b>——节点 = 起点 + k×间隔，是参考不是安排，实际以医生为准。</p></div>`;
  const asked = (p.questions || []).filter(q => !q[2]).length;
  const summary = `<div class="dash-cols"><div class="stack"><div class="card"><div class="card-head"><h2>复诊摘要预览</h2>${pill('模拟资料', 'violet')}</div>
    <p>范围：${DOCS[state.profile].length ? DOCS[state.profile].slice().sort((a, b) => a.date < b.date ? -1 : 1)[0].date : '—'} 至 2026-10-18 · 本次只预览资料组织与分享选择。</p>
    <div class="row"><div><b>治疗线序</b><p>${p.lines.length ? p.lines.map(l => `第 ${l[0]} 线 ${l[1]}（${l[3]} 起）`).join('；') : '本档案暂无系统治疗记录'}</p></div></div>
    <div class="row"><div><b>材料</b><p>${DOCS[state.profile].length} 份，保留各自日期与核对状态（待核对 ${DOCS[state.profile].filter(d => d.status !== '已核对').length} 份）。</p></div></div>
    <div class="row"><div><b>候选字段</b><p>${CANDS[state.profile].length} 项中已核对 ${CANDS[state.profile].filter(c => c.status === 'accepted').length} 项；未核对项在导出里保留「未核对」标记。</p></div></div>
    <div class="row"><div><b>想问的事</b><p>${(p.questions || []).length} 条，其中 ${asked} 条还没问出口。</p></div></div>
    <div class="notice">心理感受与「我的看法」默认不进入这份摘要。</div>
    <button class="primary" data-action="export-review">编辑并导出问题清单</button></section></div>
  <div class="stack"><div class="card"><h2>分享之前，再看一眼</h2>
    <p>未核对内容与来源状态在所有格式中都要保留。原型下载只包含主动选择的问题。</p>
    <div class="notice plain" style="margin-top:14px">一期只做 Markdown 导出；PDF / DOCX 等格式需逐格式验收，未实现。</div>
    <details><summary>导出会包含什么</summary><p>资料范围、来源版本、已核对与草稿区分、选入的问题；不含病历原文与私密记录。</p></details></div></div></div>`;
  const questions = `<div class="section-title"><h2>${esc(p.titles.question || '想问医生的问题')}</h2><span class="source-link">产品不生成答案</span></div>
    <div class="card">${(p.questions || []).length ? (p.questions || []).map(q => row(`<b>${esc(q[0])}</b>`, esc(q[1]),
      `<div style="text-align:right">${q[2] ? pill('已问', 'green') : pill('待问', 'yellow')}${q[3] ? `<small style="display:block;margin-top:4px;max-width:220px;text-align:right">${esc(q[3])}</small>` : ''}</div>`)).join('') : '<p>还没有记录问题。想到什么就先记下来——问出口之前的都算。</p>'}
    <div class="actions"><button class="soft" data-action="add-review-question">保留一个核实问题</button></div>
    <p class="small-note">这一句需要问你的医生：产品不生成答案，只把问题按日期收拢，医生回答过的原话记在同一行。</p></div>
    <div class="card"><div class="card-head"><h2>我的看法</h2>${pill('不是医生结论', 'grey')}</div>
    ${(p.viewpoints || []).map(v => row(`<b>${esc(v[0])} · ${esc(v[1])}</b>`, esc(v[2]), pill('不是医生结论', 'grey'))).join('')}
    <p class="small-note">你的判断按「一条信息」记录，与事实区明确分开，不进趋势、不进摘要事实。</p></div>`;
  const bodies = [calendar, summary, questions];
  return `<div class="page-enter">${pageHead(true)}${bodies[i] || bodies[0]}</div>`;
}

/* 生活与照护：肾癌无特定饮食处方——只记录，不设营养支持页。 */
function vLife() {
  const p = P(), m = M();
  const i = state.sub.life || 0;
  const diet = `<div class="section-title"><h2>饮食与体重</h2><span class="source-link">只记录 · 无处方</span></div>
    <div class="card"><div class="metric-grid">${m.wt ? mcard('wt', m.wt) : ''}</div>
    <p class="small-note">肾癌没有特定饮食处方的证据，所以这里不设「营养支持」页、不给食谱、不给食材替换建议——表结构里就没有这些字段，页面也不补。体重按同一台体重秤记录；治疗期间的食欲变化可以写进「用药与副作用 · 副作用记录」，与血压、甲功并置。</p></div>`;
  const activity = `<div class="section-title"><h2>活动</h2><span class="source-link">以能承受的强度为准</span></div>
    <div class="card">${row('<b>当前活动量</b>', esc(p.activity))}
    <p class="small-note">活动记录只写事实（能走多久、累不累）；运动强度是否调整由医生或康复师决定，工作台不给训练计划。</p></div>`;
  const mood = `<div class="section-title"><h2>情绪与照护者</h2><span class="source-link">默认私密</span></div>
    <div class="notice violet">这一页的内容<b>默认私密</b>：不进导出、不进看板摘要；只有你显式开放时才会出现在就诊材料里。</div>
    <div class="card">${(p.viewpoints || []).map(v => row(`<b>${esc(v[0])} · ${esc(v[1])}</b>`, esc(v[2]), pill('不是医生结论', 'grey'))).join('')}</div>
    <div class="card"><div class="card-head"><h2>想对家人说</h2></div>
    ${row('<b>待沟通</b>', esc(p.familyTalk))}
    <p class="small-note">照护者可以代记，但私密内容的分级由你决定；这里只留你想说的话。</p></div>`;
  const resources = `<div class="section-title"><h2>出行与资源</h2><span class="source-link">只记自己留下的</span></div>
    <div class="card">
      ${row('<b>就诊交通 / 住宿</b>', '复诊当天的往返安排、外地就诊的住宿信息。', pill('未记录', 'grey'))}
      ${row('<b>请假与工作安排</b>', '输注日的请假、周期之间的工作节奏。', pill('未记录', 'grey'))}
      ${row('<b>资料复印 / 借片</b>', '外院借影像片、复印病理报告的办理记录。', pill('未记录', 'grey'))}
      ${row('<b>费用与医保</b>', '门诊特病、用药报销的办理进度（只记状态，不记金额明细也行）。', pill('未记录', 'grey'))}
      <p class="small-note">资源类信息只记录你自己留下的条目；工作台不推荐医院、不推荐机构、不排名。</p></div>`;
  const bodies = [diet, activity, mood, resources];
  return `<div class="page-enter">${pageHead(true)}${bodies[i] || bodies[0]}</div>`;
}

/* 临床研究：线索不是推荐。登记状态 ≠ 入组资格。 */
function vTrials() {
  const i = state.sub.trials || 0;
  const saved = new Set(state.saved);
  const cardOf = (t) => `<div class="saved-item"><b>${esc(t.title)}</b>
    <p>${esc(t.phase)} · ${esc(t.status)} · 申办：${esc(t.sponsor)}</p>
    <small>NCT ${esc(t.id)} · <a href="${t.url}" target="_blank" rel="noopener">登记页原文 ↗</a></small>
    <div class="actions" style="margin-top:8px">${pill('登记摘录 · 状态未核实', 'yellow')}<button class="soft" data-action="save-trial" data-id="${t.id}">${saved.has(t.id) ? '已收藏 ✓' : '收藏'}</button><button class="text-button" data-action="ask-trial" data-id="${t.id}">加入入组问题</button></div></div>`;
  const notice = `<div class="notice plain"><b>这是 2026-10-24 采集的临床试验登记摘录</b>（CDE 363 条 + CTV 358 条，共 721 条；演示选 10 条）。检索式是 8 个肾癌关键词的宽口径检索：721 条里<b>标题明确含肾癌 / RCC 表述的只有 68 条</b>，其余为宽检索带入的生物等效性研究（149 条）、肾功能 / 肾病 / 移植 / 尿路上皮等非肾癌表述（31 条）与实体瘤早期试验等（473 条）——登记记录只有标题级字段，无法逐条判定适应症，故不剔除、原样保留并如实说明。演示选出的 10 条均在这 68 条内。ChiCTR 在线与 ICTRP 两个通道本轮采集失败，未计入，覆盖未知。登记状态不等于入组资格；线索不排序、不推荐、不预测获益；入组资格以研究中心答复为准。</div>`;
  const toolbar = `<div class="toolbar"><div class="chips"><button class="chip" aria-pressed="true">全部 ${TRIALS.length}</button><button class="chip" aria-pressed="false">晚期一线</button><button class="chip" aria-pressed="false">辅助 / 局限</button></div>
    <input type="search" placeholder="搜索标题 / NCT 号（原型内不生效）" aria-label="搜索"></div>`;
  const bodies = [
    `${toolbar}${TRIALS.map(cardOf).join('')}`,
    `${saved.size ? TRIALS.filter(t => saved.has(t.id)).map(cardOf).join('') : '<div class="empty" style="margin-top:0"><h3>还没有收藏</h3><p>点线索里的「收藏」，把想再看的试验留在这里；收藏只在本机，不上传。</p></div>'}`,
    `<div class="section-title"><h2>入组问题清单</h2></div>
      <div class="card">${state.questions ? state.questions.map(q => row(`<b>${esc(q)}</b>`, '')).join('') : '<div class="empty" style="margin-top:0"><p>还没有添加问题。点任意试验的「加入入组问题」，把想问研究中心的问题先写在这里。</p></div>'}</div>`
  ];
  return `<div class="page-enter">${pageHead(true)}${notice}${bodies[i] || bodies[0]}</div>`;
}

/* ---------------- 资料整理（imaging · 资料整理）：上传 → 解析 → 确认指标 → 入库 ---------------- */
function flowSteps(cur) {
  const steps = ['文件上传', '文件解析', '确认指标', '导入数据库'];
  return `<div class="flow-steps">${steps.map((s) => `<span class="${s === cur ? 'on' : ''}">${s}</span>`).join('<span class="fs-arrow">→</span>')}</div>`;
}
function docsTable() {
  const docs = DOCS[state.profile].filter((d) => !state.query || d.name.includes(state.query) || d.type.includes(state.query));
  const pillOf = (s) => s === '已核对' ? 'green' : s === '待解析' ? 'violet' : s === '解析失败' ? 'red' : 'yellow';
  return `<div class="table-wrap"><table><thead><tr><th>材料名称</th><th>日期</th><th>类型</th><th>整理状态</th><th>操作</th></tr></thead><tbody>
    ${docs.map((d) => `<tr><td><b>${esc(d.name)}</b><br><small>${esc(d.note || '模拟资料 · 无真实文件')}</small></td><td>${esc(d.date)}</td><td>${esc(d.type)}</td>
      <td>${pill(d.status, pillOf(d.status))}</td>
      <td><button class="source-link" data-action="source" data-doc="${esc(d.id)}">原文</button> ${d.status === '待核对' ? `<button class="source-link" data-action="go-sub" data-view="imaging" data-sub-i="2">看草稿</button>` : ''}</td></tr>`).join('')}
  </tbody></table></div>${!docs.length ? '<div class="empty"><h3>没有找到这份材料</h3><p>试试「病理」「检验」或清空搜索。</p></div>' : ''}`;
}
function candidateRows() {
  return CANDS[state.profile].map((c) => `<tr><td>${esc(c.name)}</td><td>${esc(c.value)}</td>
    <td><button class="source-link" data-action="source" data-source="${esc(c.source)}">${esc(c.source.split('·').slice(-1)[0].trim())} ↗</button></td>
    <td>${pill(c.status === 'accepted' ? '已核对' : c.status === 'needs_review' ? '需要确认' : '未核对', c.status === 'accepted' ? 'green' : 'yellow')}</td>
    <td><button class="source-link" data-action="candidate" data-id="${esc(c.id)}">查看 / 更正</button></td></tr>`).join('');
}
function metricSections(cats = CAT_ORDER) {
  const m = M();
  return cats.map((c) => {
    const ks = Object.keys(m).filter((k) => m[k].cat === c);
    if (!ks.length) return '';
    return `<div class="section-title"><h2>${c}</h2>${CAT_TAG[c] || ''}</div><div class="metric-grid">${ks.map((k) => mcard(k, m[k])).join('')}</div>`;
  }).join('');
}
function recordsBody() {
  const pending = CANDS[state.profile].filter((c) => c.status !== 'accepted').length;
  return `<div class="notice">上传走系统原生文件选择窗口：选中的文件只读取<b>文件名与大小</b>，原型不读取内容、不上传云端。原件永远保留，接受之前都只是候选。</div>
  ${flowSteps('文件上传')}
  <div class="toolbar"><input aria-label="搜索材料名称或类型" placeholder="搜索材料名称或类型" value="${esc(state.query)}" data-action="records-search">
    <div class="actions">${pill(state.uploads ? '含本机文件 · 只读文件名不读内容' : '全部为模拟数据', 'violet')}
      <button class="primary" data-action="pick-file">上传本次资料</button>
      <button class="soft" data-action="load-report">载入模拟报告</button>
      <input type="file" id="file-picker" multiple hidden accept=".pdf,.jpg,.jpeg,.png,.heic,.docx,.doc,.txt,.xlsx">
    </div></div>
  ${state.parsing ? `<div class="card" role="status">正在解析「${esc(state.parsingName || '本次资料')}」…原件留在本机，解析结果只作候选</div>` : ''}
  ${state.parseError ? `<div class="notice warn">解析失败。材料仍保留在资料库，不产生候选，可重试或手工核对。<button class="source-link" data-action="retry">重试</button></div>` : ''}
  <div class="card" id="docs-table">${docsTable()}</div>
  ${flowSteps('确认指标')}
  <div class="card"><div class="card-head"><h2>从材料里抽出来的候选字段</h2><span class="source-link">解析结果 · 候选不是结论</span></div>
    <div class="notice ${pending ? 'warn' : ''}">${pending ? `整理草稿 · 仍有 ${pending} 项未核对。可以先看轮廓，暂时不处理疑点。` : '整理草稿 · 这一档的候选都已核对。'}</div>
    <div class="table-wrap"><table><thead><tr><th>项目</th><th>材料中的内容</th><th>来源</th><th>状态</th><th>操作</th></tr></thead><tbody>${candidateRows()}</tbody></table></div>
    <div class="actions" style="margin-top:12px"><button class="soft" data-action="add-review-question">保留核实问题</button></div>
    <p class="small-note">候选只表示「解析读到了这一项」；接受 = 你逐字核对过转录，不等于医学审核。接受后写入演示数据库（record + 事实表），原始候选不覆盖、留版本。解析失败的文件不产生候选，原件不删、随时可重试。<button class="source-link" data-action="parse-fail">演示解析失败</button></p></div>
  <div class="help-box">事实四层：documents（原件）/ candidate_fields（候选）/ metric_points（已确认记录）/ events（事件轴）四层各自独立，候选不许并进记录表。</div>`;
}
/* ---------------- 本机文件上传（系统原生选择窗口） ---------------- */
const TYPE_BY_EXT = { pdf: '报告', jpg: '影像', jpeg: '影像', png: '影像', heic: '影像', docx: '其他', doc: '其他', txt: '其他', xlsx: '检验' };
function guessType(name) {
  if (/病理|biopsy|patho/i.test(name)) return '病理';
  if (/出院|住院|admission|discharge/i.test(name)) return '住院';
  if (/基因|分子|pd-?l1|检测|血常规|生化|化验|尿常规|lab/i.test(name)) return '检验';
  if (/(^|[^a-z])(ct|mri|pet)([^a-z]|$)|超声|影像/i.test(name)) return '影像';
  return TYPE_BY_EXT[(name.split('.').pop() || '').toLowerCase()] || '其他';
}
const fmtSize = (n) => n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const DEMO_CAND = {
  病理: ['组织学分型（演示占位）', '透明细胞癌（演示值，待核对）'],
  检验: ['最近一次肌酐（演示占位）', 'Cr 86 μmol/L（演示值，待核对）'],
  住院: ['出院日期（演示占位）', '2026-08-20（演示值，待核对）'],
  影像: ['影像结论（演示占位）', '右肾中极 27 mm（演示值，待核对）'],
  报告: ['报告日期（演示占位）', '2026-10-18（演示值，待核对）'],
  其他: ['材料日期（演示占位）', '2026-10-18（演示值，待核对）']
};

function ingestFiles(fileList) {
  const files = Array.from(fileList || []);
  if (!files.length) return;
  if (state.parsing) { toast('上一份还在解析，稍等一下'); return; }
  const docs = DOCS[state.profile];
  const fresh = [], dup = [], seen = new Set();
  for (const f of files) {
    const key = `${f.name}|${f.size}`;
    if (seen.has(key) || docs.some((d) => d.fileName === f.name && d.size === f.size)) { dup.push(f.name); continue; }
    seen.add(key); fresh.push(f);
  }
  if (!fresh.length) { toast('这些材料已在资料库（按文件名 + 大小去重），没有重复新增'); return; }
  for (const f of fresh) {
    const id = 'up' + Date.now().toString(36) + Math.random().toString(16).slice(2, 6);
    docs.unshift({ id, name: f.name.replace(/\.[^.]+$/, ''), fileName: f.name, size: f.size, date: todayISO(),
      type: guessType(f.name), status: '待解析', note: `本机文件 · ${fmtSize(f.size)}（只读文件名与大小）` });
    state.uploads += 1;
  }
  state.lastUpload = docs[0] ? docs[0].id : null;
  state.parsing = true; state.parseError = false; state.parsingName = fresh[0].name;
  if (state.view !== 'imaging') { state.view = 'imaging'; location.hash = 'imaging'; }
  state.sub.imaging = 2;
  render();
  setTimeout(() => {
    for (const f of fresh) {
      const d = docs.find((x) => x.fileName === f.name && x.size === f.size && x.status === '待解析');
      if (!d) continue;
      d.status = '待核对';
      const [cn, cv] = DEMO_CAND[d.type] || DEMO_CAND.其他;
      CANDS[state.profile].push({ id: 'cu' + d.id, name: cn, value: cv, source: `${d.name} · 第 1 页`, status: 'candidate' });
    }
    state.parsing = false; state.parsingName = '';
    render();
    toast(`已加入 ${fresh.length} 份材料，候选在「资料整理」${dup.length ? `；${dup.length} 份重复已跳过` : ''}`);
  }, 900);
}

/* 11 个一级页与 PAGES 一一对应。 */
const VIEWS = { dashboard: vDashboard, tumor: vTumor, renal: vRenal, monitor: vMonitor, treatment: vTreatment, tox: vTox, labs: vLabs, imaging: vImaging, review: vReview, life: vLife, trials: vTrials };

/* ---------------- agent dock（dsh 原生会话挂载位） ---------------- */
const FORBIDDEN = ['建议治疗', '可能复发', '预后良好', '治愈率', '可以停药', '无需就医', '推荐方案', '生存率', '自动分级', '风险评分'];
const PAGE_CONTEXT = {
  dashboard: () => ({ facts: [`${P().name}：${P().headline}`, '看板节奏卡以医生安排为准'], missing: ['下次节点的具体日期以医生安排为准'] }),
  tumor: () => ({ facts: P().pathology.filter(r => r[0] === 'row').map(r => `${r[1]}：${r[2]}（${r[4]}）`), missing: P().pathology.filter(r => r[0] === 'gap').map(r => `${r[1]}（未回报）`) }),
  renal: () => ({ facts: [...P().surgery.map(s => `${s[1]}（${s[0]} · ${s[4]}）`), ...P().contra.map(c => `${c[1]}：${c[2]}`)], missing: P().surgery.length ? [] : ['手术记录（本档案暂无）'] }),
  monitor: () => ({ facts: P().as.map(a => `${a[0]} ${a[1]}：${a[2]}（${a[3]}）`), missing: P().as.length ? [] : ['主动监测影像记录（本档案暂无）'] }),
  treatment: () => ({ facts: [...P().lines.map(l => `第 ${l[0]} 线 ${l[1]}：${l[3]} 起`), ...P().imdc.map(im => `危险度分层：${im[1]}（${im[3]} 医生判定）`)], missing: P().lines.length ? [] : ['治疗线序（本档案暂无）'] }),
  tox: () => ({ facts: P().tox.map(t => `${t[0]} ${t[1]}：${t[2] && t[2] !== '—' ? t[2] : t[3] || ''}`.trim()), missing: [] }),
  labs: () => ({ facts: Object.values(M()).filter(m => m.points && m.points.length).map(m => `${m.name} 最近：${String(m.points.slice(-1)[0].v)}（${m.points.slice(-1)[0].d}）`), missing: [] }),
  imaging: () => ({ facts: [`资料库 ${DOCS[state.profile].length} 份，待核对 ${DOCS[state.profile].filter(d => d.status !== '已核对').length} 份`], missing: CANDS[state.profile].filter(c => c.status !== 'accepted').map(c => `${c.name}（未核对）`) }),
  review: () => ({ facts: P().rhythm.map(r => `${r[0]}：${r[1]}（${r[2]}）`), missing: P().questions.filter(q => !q[2]).map(q => `待问：${q[1]}`) }),
  life: () => ({ facts: ['活动量：' + P().activity], missing: [] }),
  trials: () => ({ facts: [`2026 线索演示 ${TRIALS.length} 条（真实登记摘录，状态未核实；全量采集 721 条，其中标题明确含肾癌 / RCC 表述 68 条，演示 10 条均在 68 条内）`], missing: [] })
};
function buildPrompt() {
  const ctx = PAGE_CONTEXT[state.view]();
  const title = PAGES.find(p => p[0] === state.view)[1];
  return [`【来自小肾宝工作台 · ${title}页】`, `档案：${P().name}（${P().meta}）——演示数据`, '',
    '本页已核对的事实：', ...ctx.facts.map(f => '- ' + f), '',
    '尚未核对 / 待确认：', ...(ctx.missing.length ? ctx.missing.map(f => '- ' + f) : ['- （无）']), '',
    '边界：以上是记录整理，不是医疗建议；请基于原文与医生沟通，不要求工作台外推结论。'].join('\n');
}
function mockReply() {
  return '根据你整理的本页事实：记录已按日期排好，未核对项标在「尚未核对」里。这些内容只是记录整理，不构成医疗建议；是否需要调整、算不算好转，请以医生意见为准。';
}
function renderAgent() {
  const dock = $('#agent-dock'), grid = $('#work-grid'), btn = $('#agent-toggle');
  dock.hidden = !state.agentOpen;
  grid.classList.toggle('agent-open', state.agentOpen);
  grid.classList.toggle('agent-wide', state.agentOpen && state.agentSize === 'wide');
  grid.classList.toggle('agent-narrow', state.agentOpen && state.agentSize === 'narrow');
  btn.setAttribute('aria-expanded', String(state.agentOpen));
  $('#agent-state').textContent = state.agentOpen ? '已打开' : '未进入激活';
  $('#agent-toggle i').classList.toggle('grey', !state.agentOpen);
  $('#agent-toggle i').classList.toggle('on', state.agentOpen);
  $('#agent-dot').classList.toggle('on', state.agentOpen);
  $$('.agent-sizes button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.size === state.agentSize)));
  const body = $('#agent-body');
  if (!body.dataset.built) {
    body.innerHTML = `<div class="agent-note"><b>dsh 原生会话挂载位</b><br>原生会话仅在 DSH Desktop 内可用；当前为浏览器预览，这里保留宿主会话的挂载点（#dsh-conversation-slot），不模拟聊天窗口。</div>
      <div id="dsh-conversation-slot" aria-live="polite"></div>`;
    body.dataset.built = '1';
  }
}
function agentBuild() {
  const slot = $('#dsh-conversation-slot');
  slot.innerHTML = `<div class="agent-card"><h4>提示词预览（发送前可读 · 由你在宿主会话发送）</h4><pre>${esc(buildPrompt())}</pre></div>`;
}
function agentDemo() {
  const slot = $('#dsh-conversation-slot');
  const text = mockReply();
  const hits = FORBIDDEN.filter(w => text.includes(w));
  slot.innerHTML = `<div class="agent-card"><h4>模拟回复 · 红线自检</h4><pre>${esc(text)}</pre>
    <div class="agent-check">${hits.length ? hits.map(h => `<span class="hit">命中禁用词：${esc(h)}</span>`).join('') : '<span class="pass">✓ 未命中禁用词表（' + FORBIDDEN.length + ' 项）</span><span class="pass">✓ 免责语句在否定语境中出现</span>'}</div></div>`;
}

/* ---------------- dialogs / toast ---------------- */
let toastTimer;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('visible'), 2200); }
function openDialog(eyebrow, title, body, foot = '') {
  $('#dialog-eyebrow').textContent = eyebrow; $('#dialog-title').textContent = title;
  $('#dialog-body').innerHTML = body; $('#dialog-foot').innerHTML = foot;
  $('#dialog').showModal();
}
const closeDialog = () => $('#dialog').close();

function dlgProfiles() {
  openDialog('小肾宝', '切换演示档案', Object.entries(PROFILES).map(([k, p]) => `
    <button class="profile-row ${state.profile === k ? 'on' : ''}" data-pick-profile="${k}">
      <div><b>${esc(p.name)}的资料</b><p>${esc(p.meta)} · ${esc(p.headline)}</p></div><span class="profile-caret">${state.profile === k ? '当前' : '切换'}</span></button>`).join(''),
    '<button data-action="close">取消</button>');
}
function dlgSettings() {
  openDialog('小肾宝', '设置', `<div class="cfg-tabs" role="tablist">
  <button role="tab" aria-selected="true" data-action="cfg-tab" data-tab="ws">资料目录</button><button role="tab" aria-selected="false" data-action="cfg-tab" data-tab="parse">文档解析</button><button role="tab" aria-selected="false" data-action="cfg-tab" data-tab="kb">临床数据库</button></div>
  <div class="cfg-block" style="margin-top:16px" data-tab="ws"><h3>工作区资料目录</h3><div class="path-row"><code>~/Documents/RenalPalWorkspace（演示值）</code><button class="soft">选择…</button></div>
  <p class="small-note">患者数据只存入你明确选择的目录；工作台不把资料上传云端。</p></div>
  <div class="cfg-block" style="margin-top:12px" data-tab="parse" hidden><h3>文档解析（MinerU）</h3><div class="token-row"><code class="masked">MINERU_TOKEN 已配置（掩码：mr-****）</code></div>
  <p class="small-note">Token 只存本机 .secrets/（mode 600）；解析结果永远是候选，核对后才入档。</p></div>
  <div class="cfg-block" style="margin-top:12px" data-tab="kb" hidden><h3>2026 临床数据库</h3><div class="path-row"><code>kidney_cancer_trials_2026.sqlite · 721 条（CDE 363 + CTV 358）</code></div>
  <p class="small-note">离线快照；8 个肾癌关键词宽口径检索，标题明确含肾癌 / RCC 表述的 68 条，其余为宽检索带入的生物等效性研究、肾功能 / 肾病 / 移植 / 尿路上皮等非肾癌表述与实体瘤早期试验（记录只有标题级字段，无法逐条判定适应症，不剔除、如实说明）。ChiCTR 在线与 ICTRP 两通道本轮采集失败，未计入，覆盖未知。</p></div>`, '<button class="primary" data-action="close">完成</button>');
}
function dlgAbout() {
  openDialog('小肾宝', '关于', `<div class="about"><div class="brand no-mark" style="zoom:2.2"></div><div class="about-meta">
    <div class="about-ver"><b>v${APP_INFO.version}</b>${pill(APP_INFO.channelLabel, 'violet')}</div>
    <dl><div><dt>构建</dt><dd>${APP_INFO.build}</dd></div><div><dt>形态</dt><dd>交互原型（单机多文件）· 全部患者数据为模拟</dd></div>
    <div><dt>数据</dt><dd>2026 临床试验：真实登记摘录（CDE / CTV 通道，宽口径检索 721 条 / 标题明确含肾癌 / RCC 表述 68 条），状态未核实</dd></div>
    <div><dt>家族</dt><dd>小 X 宝家族 · RenalPal 小肾宝</dd></div></dl></div></div>`, '<button class="primary" data-action="close">关闭</button>');
}
function dlgHelp() {
  openDialog('小肾宝', '原型操作说明', `<div class="cfg-block">顶栏「AI 对话」按钮打开右侧<b>原生会话挂载位</b>（可 × 隐藏、窄 / 标准 / 宽三档）。「整理本页要点」生成发送前可读的提示词；「模拟回复自检」演示文本层红线扫描。</div>
  <div class="cfg-block" style="margin-top:12px">「化验与指标」「看板」里的数值卡<b>轻点翻面</b>看参考区间；分类记录（症状原话、定性结果）不翻面、不连线。「化验与指标 · 一图秀」左侧可勾选指标、拖动缩放。</div>
  <div class="cfg-block" style="margin-top:12px">左上角头像可切换<b>两个演示档案</b>：周先生（62 岁 · 左肾透明细胞癌双肺转移 · 一线靶免第 6 周期）、陈女士（58 岁 · 右肾 2.6 cm 小肿块 · 主动监测）。两条路径的页签内容不同，空态是刻意的。</div>
  <div class="cfg-block" style="margin-top:12px">主动监测的大小按报告原文并列，<b>不连线、不算 mm/年、不设阈值</b>；IMDC 分层只记录医生判定的原文，产品不打分。</div>`, '<button class="primary" data-action="close">知道了</button>');
}
function dlgExport() {
  const p = P();
  const md = ['# 复诊准备（演示导出）', '', `档案：${p.name}（${p.meta}）`, '', '## 事实区（已核对）',
    ...p.rhythm.map(r => `- ${r[0]}：${r[1]}（${r[2]}）`),
    ...(p.lines.length ? p.lines.map(l => `- 治疗线 ${l[0]}：${l[1]}（${l[3]} 起）`) : []),
    ...(p.as.length ? p.as.map(a => `- 主动监测 ${a[0]} ${a[1]}：${a[2]}（${a[4]}）`) : []),
    '', '## 想问的事 / 我的看法（不是医生结论）', '- （按页面勾选结果导出；私密条目默认不含）', '', '> 本文件由工作台整理，不构成医疗建议。'].join('\n');
  openDialog('小肾宝', '导出编辑（Markdown）', `
    <textarea id="export-edit" aria-label="导出内容，可直接编辑" style="width:100%;min-height:320px;font:12px/1.7 ui-monospace,SFMono-Regular,monospace;padding:12px;border:1px solid #d8e0ea;border-radius:10px;background:#fff;color:#213139;resize:vertical">${esc(md)}</textarea>
    <p class="small-note">直接在上方编辑；「我的看法」区永远带「不是医生结论」标注。保存到资料目录的是编辑后的全文。</p>`,
    '<button class="soft" data-action="close">取消</button><button class="primary" data-action="export-save">保存到资料目录</button>');
}

/* ---------------- render root ---------------- */
/* 数字刷动：渲染后从 0 滚动到目标值（easeOutCubic，650ms；reduced-motion 直接显示终值） */
function animateCountups(root) {
  if (!root || typeof root.querySelectorAll !== 'function' || typeof requestAnimationFrame !== 'function') return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const DUR = 650;
  root.querySelectorAll('[data-countup]').forEach((el) => {
    const target = parseFloat(el.dataset.countup);
    if (!isFinite(target)) return;
    const dec = el.dataset.dec === undefined ? 1 : +el.dataset.dec;
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / DUR);
      const ease = 1 - Math.pow(1 - k, 3);
      el.textContent = (target * ease).toFixed(dec);
      if (k < 1) requestAnimationFrame(step); else el.textContent = target.toFixed(dec);
    };
    el.textContent = (0).toFixed(dec);
    requestAnimationFrame(step);
  });
}

function render() {
  const p = P();
  $('#nav').innerHTML = PAGES.map(([id, label, ic]) => {
    const count = id === 'trials' ? TRIALS.length : null;
    return `<button class="nav-button" data-nav="${id}" ${state.view === id ? 'aria-current="page"' : ''}>${icon(ic)}<span>${esc(label)}</span>${count ? `<span class="nav-count">${count}</span>` : ''}</button>`;
  }).join('');
  $('#breadcrumb').textContent = PAGES.find(x => x[0] === state.view)[1];
  $('#profile-name').textContent = `${p.name}的资料`;
  $('#profile-meta').textContent = p.meta;
  $('#profile-avatar').textContent = p.name[0];
  $('#main').innerHTML = (VIEWS[state.view] || vDashboard)();
  $('#main').classList.remove('page-enter');
  animateCountups($('#main'));
  renderAgent();
  if (state.agentOpen) $('#agent-body').dataset.built = ''; // 换页后重建挂载位提示
}

/* ---------------- events ---------------- */
document.addEventListener('click', (e) => {
  const nav = e.target.closest('[data-nav]');
  if (nav) { state.view = nav.dataset.nav; location.hash = state.view; render(); $('#main').focus({ preventScroll: true }); window.scrollTo(0, 0); return; }
  const sub = e.target.closest('[data-sub]');
  if (sub) { state.sub[state.view] = +sub.dataset.sub; render(); return; }
  const pick = e.target.closest('[data-pick]');
  if (pick) {
    const k = pick.dataset.pick;
    if (pick.checked) {
      if (state.sel.length >= 4) { pick.checked = false; toast('最多同时看 4 个指标；取消一个再加。'); return; }
      if (!state.sel.includes(k)) state.sel.push(k);
    } else {
      if (state.sel.length === 1) { pick.checked = true; toast('至少留一个指标。'); return; }
      state.sel = state.sel.filter(x => x !== k);
    }
    render(); return;
  }
  const pp = e.target.closest('[data-pick-profile]');
  if (pp) { state.profile = pp.dataset.pickProfile; state.sel = defaultSel(pp.dataset.pickProfile); state.pin = null; closeDialog(); render(); toast(`已切换到 ${P().name}的资料（演示）`); return; }
  const card = e.target.closest('.mcard[data-mcard]');
  if (card && !card.dataset.static) { flipCard(card.dataset.mcard); return; }
  const act = e.target.closest('[data-action]')?.dataset.action;
  if (!act) return;
  const map = {
    profiles: dlgProfiles, settings: dlgSettings, about: dlgAbout, help: dlgHelp,
    close: closeDialog, 'open-store': () => toast('资料目录已激活（演示）'),
    'go-sub': (el) => { const v = el.dataset.view; if (!v || !VIEWS[v]) return; state.view = v; state.sub[v] = +(el.dataset.subI || 0); location.hash = v; render(); },
    source: (el) => {
      const d = el.dataset.doc ? DOCS[state.profile].find((x) => x.id === el.dataset.doc) : null;
      const line = d ? `${d.fileName || d.name}${d.size ? ` · ${fmtSize(d.size)}` : ''}（${d.date}）` : el.dataset.source || '';
      openDialog('小肾宝', '原文出处', `<p style="font-size:12.5px">${esc(line)}</p><p class="small-note">原件存放在你选的资料目录 imports/ 下；工作区不改动原文，也不替你解释它。</p>`, '<button class="primary" data-action="close">关闭</button>');
    },
    'pick-file': () => { const inp = $('#file-picker'); if (inp && typeof inp.click === 'function') inp.click(); else toast('当前浏览器不支持选择本机文件'); },
    'export-save': () => {
      const ta = $('#export-edit');
      const txt = ta ? ta.value.trim() : '';
      if (!txt) { toast('导出内容是空的；先填一点内容再保存。'); return; }
      const docs = DOCS[state.profile];
      docs.unshift({ id: 'ex' + Date.now().toString(36), name: `复诊准备 · ${P().name} · ${todayISO()}`, fileName: `复诊准备-${todayISO()}.md`, size: new Blob([txt]).size, date: todayISO(), type: '其他', status: '待核对', note: '生成文件 · 由导出创建，可在草稿里核对' });
      closeDialog();
      toast('已保存到资料目录 exports/（演示）；在「影像与报告 · 资料整理」可见');
    },
    'load-report': () => {
      if (state.parsing) return;
      if (state.loaded[state.profile]) { toast('模拟报告已载入，没有重复新增'); return; }
      state.parsing = true; state.parseError = false; render();
      setTimeout(() => {
        DOCS[state.profile].push({ id: 'dx' + state.profile, name: '复查记录 · 新模拟报告', date: '2026-10-18', type: '其他', status: '待核对' });
        CANDS[state.profile].push({ id: 'cx' + state.profile, name: '下次影像评估安排', value: '2027-01 前后（示例，以医生安排为准）', source: '复查记录 · 新模拟报告 · 第 1 页', status: 'candidate' });
        state.loaded[state.profile] = true; state.parsing = false;
        if (state.view === 'imaging') render();
        toast('解析完成：候选已放入「影像与报告 · 资料整理」');
      }, 900);
    },
    'parse-fail': () => {
      const d = DOCS[state.profile].find((x) => x.id === state.lastUpload);
      if (d) d.status = '解析失败';
      state.parseError = true; render();
      toast(d ? `「${d.name}」解析失败：未产生候选，原件保留，可重试` : '模拟解析失败：未产生候选，原件保留');
    },
    retry: () => { state.parseError = false; toast('模拟重试完成；原件始终保留'); render(); },
    candidate: (el) => {
      const c = CANDS[state.profile].find((x) => x.id === el.dataset.id);
      if (!c) return;
      openDialog('小肾宝', '核对这一项内容',
        `<div class="notice">核对表示「转录已逐字检查过」，不等于医学审核。</div>
        <label style="display:block;margin-top:10px"><span class="form-label">${esc(c.name)}</span><input id="cand-input" style="width:100%" value="${esc(c.value)}" maxlength="160"></label>
        <p class="small-note">来源：${esc(c.source)}。暂时不确定就保留待核对状态，不会丢。</p>`,
        `<button class="soft" data-action="close">现在先不核对</button><button class="primary" data-action="cand-save" data-id="${esc(c.id)}">接受这条记录</button>`);
    },
    'cand-save': (el) => {
      const c = CANDS[state.profile].find((x) => x.id === el.dataset.id);
      const v = $('#cand-input') ? $('#cand-input').value.trim() : '';
      if (c && v) { c.value = v; c.status = 'accepted'; }
      closeDialog(); render(); toast('已接受：写入演示数据库（record + 事实表），候选留版本不覆盖');
    },
    'add-review-question': () => {
      const q = state.profile === 'A'
        ? '请帮我核实：基因 / PD-L1 检测要不要补做，以及下次影像评估的范围（胸部还是全身）。'
        : '请帮我核实：AS 节奏要不要按「稳定满一年再评估」，以及这次增大 1 mm 要不要紧。';
      state.questions = state.questions || [];
      if (!state.questions.includes(q)) state.questions.push(q);
      render(); toast('已加入复诊准备的问题清单');
    },
    'add-viewpoint': () => toast('感受会记为「一条信息」，标注不是医生结论'),
    'export-review': dlgExport,
    'save-trial': (el) => { const id = el.closest('[data-action]').dataset.id ?? el.dataset.id; if (state.saved.includes(id)) { state.saved = state.saved.filter(x => x !== id); } else state.saved.push(id); render(); },
    'ask-trial': (el) => { const id = el.closest('[data-action]').dataset.id ?? el.dataset.id; const t = TRIALS.find(x => x.id === id); state.questions = state.questions || []; const q = `${t.id}：入组条件是否包含我的分期与既往治疗？`; if (!state.questions.includes(q)) state.questions.push(q); render(); toast('已加入入组问题清单'); },
    range: (el) => { state.range = el.dataset.range; render(); },
    toggle: (el) => { state.toggles[el.dataset.key] = !state.toggles[el.dataset.key]; render(); },
    pin: (el) => { state.pin = { code: el.dataset.code, date: el.dataset.date }; render(); },
    unpin: () => { state.pin = null; render(); },
    zoom: () => {},
    agent: () => { state.agentOpen = !state.agentOpen; renderAgent(); },
    'agent-open': () => { state.agentOpen = true; renderAgent(); toast('AI 对话面板已打开；× 只是收起，不会结束会话'); },
    'agent-build': agentBuild,
    'agent-demo': agentDemo
  };
  if (act === 'agent-size') { state.agentSize = e.target.closest('[data-action]').dataset.size; renderAgent(); return; }
  if (act === 'cfg-tab') {
    const el = e.target.closest('[data-action]');
    document.querySelectorAll('.cfg-tabs [role=tab]').forEach((b) => b.setAttribute('aria-selected', String(b === el)));
    document.querySelectorAll('.cfg-block[data-tab]').forEach((b) => { b.hidden = b.dataset.tab !== el.dataset.tab; });
    return;
  }
  if (map[act]) map[act](e.target.closest('[data-action]'));
});
document.addEventListener('input', (e) => {
  if (e.target.matches('[data-action="zoom"]')) { const sib = e.target.nextElementSibling; if (sib) sib.textContent = e.target.value + '%'; }
  if (e.target.matches('[data-action="records-search"]')) {
    state.query = e.target.value;
    const wrap = $('#docs-table'); if (wrap) wrap.innerHTML = docsTable();
  }
});
document.addEventListener('change', (e) => {
  if (e.target && e.target.id === 'file-picker') { ingestFiles(e.target.files); e.target.value = ''; return; }
  const el = e.target.closest('[data-action]');
  if (el && el.dataset.action === 'zoom') { state.zoom = Number(el.value); render(); }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && $('#dialog').open) { closeDialog(); return; }
  const card = e.target.closest && e.target.closest('.mcard[data-mcard]:not([data-static])');
  if (card && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); flipCard(card.dataset.mcard); }
});
/* 字号三档循环（DEV-REQUIREMENTS §二：基础层 1 / 1.15 / 1.32）。
   原型组件字号是逐页调优的固定 px，本按钮只切 body --font 基础层；
   完整 calc(NNpx * var(--tz)) 乘法体系属开发版（M6）落地项，见 DEV-REQUIREMENTS §二本体注解。 */
$('#font-toggle').addEventListener('click', () => {
  const order = ['', 'large', 'xl'];
  const cur = order.findIndex((c) => document.body.classList.contains(c));
  const next = order[(cur + 1) % order.length];
  document.body.classList.remove('large', 'xl');
  if (next) document.body.classList.add(next);
  $('#font-toggle').setAttribute('aria-pressed', String(next !== ''));
  $('#font-toggle').title = next === 'xl' ? '字号：特大（再点回正常）' : '字号：正常 / 大字 / 特大';
});
window.addEventListener('hashchange', () => { const v = location.hash.slice(1); if (v && v !== state.view && VIEWS[v]) { state.view = v; render(); } });

const initialHash = location.hash.slice(1);
if (VIEWS[initialHash]) state.view = initialHash;
render();
