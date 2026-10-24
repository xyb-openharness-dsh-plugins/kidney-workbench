/* 读模型：库 → 前端档案形状。
 *
 * **契约**：`getProfile(db, key)` 返回的对象必须与 `prototypes/v0.2/demo-data.js` 里
 * 同名档案**逐字段一致**（test/store.test.mjs 用 deepStrictEqual 钉住）。这条不是洁癖：
 * 前端 34 个页签是在原型上过一遍探针的，读模型只要改一个字段名，探针过的那 70 个组合
 * 就全都不算数了。
 *
 * 三条易踩（家族踩过）：
 * 1. node:sqlite 返回的行是 null-prototype 对象，`deepStrictEqual` 会判它不等于普通对象，
 *    所以每一行都 `({...r})` 摊平一次；
 * 2. 复合主键表裸 `SELECT *` 按索引字母序返回，必须显式 `ORDER BY rowid`
 *    （metrics 是 (profile_key, key) 复合主键）；
 * 3. `events` 没有 ord 列，按 rowid 升序——与插入顺序一致，也就是生成器写下来的顺序。
 *
 * 只读：本文件没有任何 INSERT/UPDATE。更正只新增版本（契约③），改数据请改生成器重跑。
 */

import { AGENT_PANE } from '../lib/layout.js';

/** 摊平 null-prototype 行，并按 ord（无 ord 用 rowid）升序。 */
function rows(db, sql, ...args) {
  return db.prepare(sql).all(...args).map((r) => ({ ...r }));
}

function count(db, table) {
  return Number(db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get()?.n || 0);
}

/** 档案清单（侧栏切换用）：[{ id, name }]。 */
export function listSubjects(db) {
  return rows(db, 'SELECT profile_key, name FROM subjects ORDER BY rowid')
    .map((r) => ({ id: r.profile_key, name: r.name }));
}

/** 单个指标：band 还原成 [low, high]，两端都缺才是 null（×ULN 契约：上限未引入就是 null）。 */
function metricOf(db, key, m) {
  const points = rows(db, 'SELECT d, v_num, v_text, src FROM metric_points WHERE profile_key = ? AND metric_key = ? ORDER BY ord, rowid', key, m.key)
    .map((p) => ({ d: p.d, v: p.v_num === null ? p.v_text : p.v_num, src: p.src }));
  return {
    key: m.key,
    name: m.name,
    unit: m.unit,
    cat: m.cat,
    color: m.color,
    dec: m.dec,
    kind: m.kind,
    band: m.band_low === null && m.band_high === null ? null : [m.band_low, m.band_high],
    note: m.note,
    points,
  };
}

/**
 * 单个档案。库里没有这个 key 时返回 null（路由层据此回 404，不假造空档案）。
 * 私密字段（genetics 的 private）**照原样带出**：过滤在前端 sharedOnly 一处做。
 */
export function getProfile(db, key) {
  const s = db.prepare('SELECT * FROM subjects WHERE profile_key = ?').get(key);
  if (!s) return null;
  const sub = { ...s };

  const metrics = rows(db, 'SELECT * FROM metrics WHERE profile_key = ? ORDER BY rowid', key)
    .map((m) => metricOf(db, key, m));

  return {
    name: sub.name,
    sex: sub.sex,
    age: sub.age,
    meta: sub.meta,
    headline: sub.headline,
    stage: sub.stage,
    mindset: sub.mindset,
    dash_keys: JSON.parse(sub.dash_keys || '[]'),
    path: JSON.parse(sub.path || '[]'),
    activity: sub.activity,
    familyTalk: sub.family_talk,
    titles: {
      pathology: sub.pathology_title,
      staging: sub.staging_title,
      surgery: sub.surgery_title,
      contra: sub.contra_title,
      as: sub.as_title,
      lines: sub.lines_title,
      imdc: sub.imdc_title,
      tox: sub.tox_title,
      genetics: sub.genetics_title,
      rhythm: sub.rhythm_title,
      question: sub.question_title,
    },
    pathology: rows(db, 'SELECT kind, a, b, d, institution FROM pathology_rows WHERE profile_key = ? ORDER BY ord, rowid', key).map((r) => [r.kind, r.a, r.b, r.d, r.institution]),
    staging: rows(db, 'SELECT d, tnm, system, source, note FROM staging_rows WHERE profile_key = ? ORDER BY ord, rowid', key).map((r) => [r.d, r.tnm, r.system, r.source, r.note]),
    surgery: rows(db, 'SELECT d, kind, extent, recon, institution, note FROM surgery_rows WHERE profile_key = ? ORDER BY ord, rowid', key).map((r) => [r.d, r.kind, r.extent, r.recon, r.institution, r.note]),
    contra: rows(db, 'SELECT d, item, value, src FROM contra_rows WHERE profile_key = ? ORDER BY ord, rowid', key).map((r) => [r.d, r.item, r.value, r.src]),
    as: rows(db, 'SELECT d, method, size_text, location, institution, src FROM as_rows WHERE profile_key = ? ORDER BY ord, rowid', key).map((r) => [r.d, r.method, r.size_text, r.location, r.institution, r.src]),
    lines: rows(db, 'SELECT line_no, name, detail, start, end, status, src FROM lines_rows WHERE profile_key = ? ORDER BY ord, rowid', key).map((r) => [r.line_no, r.name, r.detail, r.start, r.end, r.status, r.src]),
    imdc: rows(db, 'SELECT d, level, criteria, doctor, institution, note FROM imdc_rows WHERE profile_key = ? ORDER BY ord, rowid', key).map((r) => [r.d, r.level, r.criteria, r.doctor, r.institution, r.note]),
    cycles: rows(db, 'SELECT name, date, drugs, status, done FROM cycles WHERE profile_key = ? ORDER BY ord, rowid', key).map((r) => [r.name, r.date, r.drugs, r.status, r.done === 1]),
    tox: rows(db, 'SELECT d, symptom, ctcae_text, note FROM symptom_rows WHERE profile_key = ? ORDER BY ord, rowid', key).map((r) => [r.d, r.symptom, r.ctcae_text, r.note]),
    genetics: rows(db, 'SELECT member, relation, finding, status, institution, d, private FROM genetics_rows WHERE profile_key = ? ORDER BY ord, rowid', key).map((r) => [r.member, r.relation, r.finding, r.status, r.institution, r.d, r.private]),
    questions: rows(db, 'SELECT d, q, asked, answer FROM question_rows WHERE profile_key = ? ORDER BY ord, rowid', key).map((r) => [r.d, r.q, r.asked, r.answer]),
    rhythm: rows(db, 'SELECT item, freq, guideline, next FROM rhythm WHERE profile_key = ? ORDER BY ord, rowid', key).map((r) => [r.item, r.freq, r.guideline, r.next]),
    viewpoints: rows(db, 'SELECT d, mood, text FROM viewpoints WHERE profile_key = ? ORDER BY ord, rowid', key).map((r) => [r.d, r.mood, r.text]),
    metrics,
    events: rows(db, 'SELECT d, label FROM events WHERE profile_key = ? ORDER BY rowid', key).map((r) => ({ d: r.d, label: r.label })),
    docs: rows(db, 'SELECT id, name, date, type, status FROM documents WHERE profile_key = ? ORDER BY ord, rowid', key).map((r) => ({ id: r.id, name: r.name, date: r.date, type: r.type, status: r.status })),
    candidates: rows(db, 'SELECT id, name, value, source, status FROM candidate_fields WHERE profile_key = ? ORDER BY ord, rowid', key).map((r) => ({ id: r.id, name: r.name, value: r.value, source: r.source, status: r.status })),
  };
}

/** 试验演示行：真实登记摘录，登记状态不是入组资格（页面必须带免责，见 app.js 的 notice）。 */
function listTrials(db) {
  return rows(db, 'SELECT nct_id, title, phase, status, sponsor, url FROM trials ORDER BY rowid')
    .map((r) => ({ id: r.nct_id, title: r.title, phase: r.phase, status: r.status, sponsor: r.sponsor, url: r.url }));
}

/** demo_meta 的 k/v → 对象（免责声明与统计，前端可显示来源，不用于判读）。 */
function readMeta(db) {
  const out = {};
  for (const r of rows(db, 'SELECT k, v FROM demo_meta ORDER BY rowid')) out[r.k] = r.v;
  return out;
}

/**
 * 前端启动要的那一份：档案字典 + 试验行 + 版本 + 面板参数。
 * `profiles` 是**字典**（A/B 为键），与 demo-data.js 同形——前端那段建索引的循环
 * 因此可以原样复用，不必为"原型 / 开发版"写两套数据层。
 */
export function bootstrap(db, { version, build } = {}) {
  const profiles = {};
  for (const s of listSubjects(db)) profiles[s.id] = getProfile(db, s.id);
  return {
    version,
    build,
    meta: readMeta(db),
    profiles,
    trials: listTrials(db),
    agent: { available: true, mode: 'dev-mount' },
    layout: { agentPane: AGENT_PANE },
    counts: {
      subjects: count(db, 'subjects'),
      metrics: count(db, 'metrics'),
      points: count(db, 'metric_points'),
      trials: count(db, 'trials'),
    },
  };
}
