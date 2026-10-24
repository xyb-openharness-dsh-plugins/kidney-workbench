/* 原型 ↔ 开发版一致性（ui-parity）。
 *
 * 立场：`prototypes/v0.2/` 是 G1 签认过的视觉基准，`public/` 是从它派生出来的**同一份渲染代码**，
 * 只允许五处定点替换（数据从哪来 / 版本 / 启动顺序 / 默认指标重算 / AI 提示词出口）。
 * 一旦有人在 public/app.js 里顺手改了某个视图函数，原型上跑过的 70 个页签探针就不再作数
 * ——这条测试就是那道闸门：**原型里的每一行，开发版都必须还在**。
 *
 * 反过来（开发版有、原型没有）是允许的，但要落在白名单里，防止"开发版悄悄长出一套新逻辑"。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => readFileSync(join(ROOT, p), 'utf8')

const proto = read('prototypes/v0.2/app.js')
const pub = read('public/app.js')

/** 行集合（去空行与纯缩进行）。 */
const lines = (s) => new Set(s.split('\n').map((l) => l.trim()).filter(Boolean))

/** 开发版允许新增、原型里没有的函数（五处定点替换引入的）。 */
const NEW_FN_WHITELIST = [
  'deriveApiBase', 'apiBaseProblems', 'apiBase', 'applyData', 'loadBootstrap',
  'showBootBanner', 'buildIndexes', 'boot', 'applyHash',
]

const fns = (s) => [...new Set([...s.matchAll(/^\s*function\s+([A-Za-z0-9_]+)/gm)].map((m) => m[1]))]

test('① 原型里的每一行，开发版都必须还在（防止 public/app.js 被顺手改坏）', () => {
  const missing = [...lines(proto)].filter((l) => !lines(pub).has(l))
  /* 允许的差异：头注释（说明开发版身份）、APP_INFO 的 channel/channelLabel、
     数据层入口、AI 提示词出口、启动段——这些正是五处定点替换。 */
  /* 白名单逐条对应五处定点替换，外加它们必然带动的那几行（说明文字、state 末行、循环入口）。 */
  const allowed = [
    /^'use strict';$/,
    /^const D = window\.DEMO_DATA;$/,
    /^const TRIALS = D\.trials;$/,
    /^const PROFILES = \{\}, METRICS/,
    /^for \(const \[k, p\] of Object\.entries\(D\.profiles\)\) \{$/,
    /^const state = \{ view: 'dashboard'/,
    /^query: '', parsing: false/,
    /^state\.sel = /,
    /^const initialHash = location\.hash\.slice\(1\);$/,
    /^if \(VIEWS\[initialHash\]\) state\.view = initialHash;$/,
    /^render\(\);$/,
    /^function agentBuild\(\) \{$/,
    /^version: '/,
    /^channel: '/,
    /^channelLabel: '/,
    /^\/\* 小肾宝 RenalPal v0\.2\.0 — 交互原型/,
    /^不读写真实文件/,
    /^const APP_INFO = \{$/,
    /^slot\.innerHTML = /,
  ]
  const real = missing.filter((l) => !allowed.some((re) => re.test(l)))
  assert.deepEqual(real, [], `原型里有 ${real.length} 行在开发版中不见了（前 8 条）：\n${real.slice(0, 8).join('\n')}`)
})

test('② 开发版新增的函数必须落在白名单里', () => {
  const extra = fns(pub).filter((f) => !fns(proto).includes(f))
  const illegal = extra.filter((f) => !NEW_FN_WHITELIST.includes(f))
  assert.deepEqual(illegal, [], `开发版出现了白名单外的新函数：${illegal.join(', ')}`)
})

test('③ 五处定点替换都到位（少一处就不是开发版）', () => {
  const marks = [
    [/api\/kidney\/bootstrap/, '数据来自 bootstrap'],
    [/async function loadBootstrap/, '异步取数'],
    [/function buildIndexes/, '数据到达后重建索引'],
    [/async function boot\(\)/, '启动异步化'],
    [/kid:agent-draft/, 'AI 提示词交给外壳'],
    [/dataSource/, '数据源状态（api / demo / empty）'],
  ]
  for (const [re, why] of marks) assert.match(pub, re, `缺少：${why}`)
  assert.equal(/const D = window\.DEMO_DATA/.test(pub), false, '开发版不该再在顶层直接吃 DEMO_DATA')
})

test('④ 关键常量与原型逐字一致：PAGES / SUBPAGES / SUBTITLES / CAT_ORDER / 禁词表', () => {
  for (const name of ['PAGES', 'SUBPAGES', 'SUBTITLES', 'CAT_ORDER', 'FORBIDDEN']) {
    const grab = (s) => {
      const i = s.indexOf(`const ${name} = `)
      if (i < 0) return null
      const j = s.indexOf('\n', s.indexOf(';', i) === -1 ? i : s.indexOf(';', i))
      return s.slice(i, j)
    }
    assert.equal(grab(pub), grab(proto), `${name} 与原型不一致`)
  }
})

test('⑤ style.css 逐字节一致（改视觉先改原型，再同步）', () => {
  assert.equal(read('public/style.css'), read('prototypes/v0.2/style.css'))
})

test('⑥ index.html 只差四处：robots / title / description / 顶部状态条', () => {
  const a = read('prototypes/v0.2/index.html').split('\n')
  const b = read('public/index.html').split('\n')
  const onlyInProto = a.filter((l) => !b.includes(l))
  /* 允许的四处：title / robots / description / 顶部状态条；外加"版本号字面量"跟着 VERSION 走的
     两行（ver-chip 与页脚）——原型冻结在 v0.2.0，开发版跟 VERSION。 */
  const allowed = /^\s*(?:<title>|<div class="prototype-bar">|<button class="ver-chip"|<footer class="footer")/
  const illegal = onlyInProto.filter((l) => l.trim() && !allowed.test(l))
  assert.deepEqual(illegal, [], `index.html 出现了预期外的差异：\n${illegal.join('\n')}`)
  assert.ok(b.some((l) => l.includes('name="robots"')), '开发版必须带 noindex')
  assert.ok(b.some((l) => l.includes('name="description"')), '开发版必须带 description')
})

test('⑦ 离线回退用的 demo-data.js 两份字节一致（原型与开发版同一个演示数据）', () => {
  assert.equal(read('public/demo-data.js'), read('prototypes/v0.2/demo-data.js'))
})
