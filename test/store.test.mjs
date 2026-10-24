/* 数据层单测。
 *
 * 三条主线：迁移与播种的**幂等**、读模型与原型快照的**逐字段一致（parity）**、
 * 四契约在 schema 上真的落住了（不是只在文档里写着）。
 *
 * parity 这条最关键：前端 34 个页签是在原型上过探针的，读模型只要挪一个字段，
 * 那 70 个组合就全都不算数——所以这里用 deepStrictEqual 钉死，不允许"差不多"。
 */
import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, mkdtempSync, rmSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { openDatabase, migrate, close } from '../dsh/store.js'
import { seedDemo, hasDemoData } from '../dsh/demo.js'
import { getProfile, listSubjects, bootstrap } from '../dsh/readmodels.js'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** 原型快照：parity 的比对基准（生成器产物，勿手改）。 */
const src = readFileSync(join(ROOT, 'prototypes/v0.2/demo-data.js'), 'utf8')
const DEMO = JSON.parse(src.slice(src.indexOf('=') + 1, src.lastIndexOf('};') + 1))

const tmp = mkdtempSync(join(homedir(), '.xyb-kid-test-'))
after(() => { try { rmSync(tmp, { recursive: true, force: true }); } catch { /* 清不掉不影响结果 */ } })

function freshDb() {
  const db = openDatabase(':memory:')
  migrate(db)
  seedDemo(db)
  return db
}

function columns(db, table) {
  return db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name)
}

test('① 迁移幂等：第二次跑不再执行任何文件，表数不变', () => {
  const db = openDatabase(':memory:')
  const first = migrate(db)
  assert.ok(first.applied.length >= 1, '首次迁移应当执行 0001')
  const second = migrate(db)
  assert.deepEqual(second.executed, [], '第二次迁移不应再执行任何文件')
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map((r) => r.name)
  assert.equal(tables.length, 22, `业务表 21 张 + schema_migrations 台账，实际 ${tables.length}：${tables.join(',')}`)
  close(db)
})

test('② 播种幂等：库里已有档案时不重复写入', () => {
  const db = openDatabase(':memory:')
  migrate(db)
  assert.equal(hasDemoData(db), false)
  const first = seedDemo(db)
  assert.equal(first.skipped, false)
  assert.equal(first.subjects, 2)
  const second = seedDemo(db)
  assert.equal(second.skipped, true, '已有档案时必须整批跳过，绝不能把演示数据塞进用户的库')
  close(db)
})

test('③ parity：库里读出的档案与原型 demo-data.js 逐字段一致', () => {
  const db = freshDb()
  for (const key of ['A', 'B']) {
    assert.deepStrictEqual(getProfile(db, key), DEMO.profiles[key], `档案 ${key} 与原型不一致`)
  }
  assert.deepStrictEqual(listSubjects(db), [{ id: 'A', name: '周先生' }, { id: 'B', name: '陈女士' }])
  close(db)
})

test('④ bootstrap 形状：档案字典 + 试验行 + 面板参数，试验与原型逐字段一致', () => {
  const db = freshDb()
  const b = bootstrap(db, { version: '0.2.0', build: '2026-10-25' })
  assert.equal(b.version, '0.2.0')
  assert.deepEqual(Object.keys(b.profiles), ['A', 'B'])
  assert.deepStrictEqual(b.trials, DEMO.trials, '试验行与原型不一致')
  assert.equal(b.trials.length, 10)
  assert.equal(b.layout.agentPane.default, 0.35)
  assert.equal(b.counts.metrics, 25)
  assert.equal(b.counts.points, 95)
  close(db)
})

test('⑤ 契约① 看法恒不为结论：viewpoints 表没有 is_conclusion 列', () => {
  const db = freshDb()
  const cols = columns(db, 'viewpoints')
  assert.ok(!cols.includes('is_conclusion'), 'viewpoints 不许有 is_conclusion 列（不是默认 0，是没有）')
  close(db)
})

test('⑥ 肾癌两条硬约束：as_rows 不算生长速度、imdc_rows 不打分', () => {
  const db = freshDb()
  const asCols = columns(db, 'as_rows')
  for (const banned of ['size_delta', 'growth', 'growth_rate']) {
    assert.ok(!asCols.includes(banned), `as_rows 不许有 ${banned} 列（产品不算生长速度）`)
  }
  const imdcCols = columns(db, 'imdc_rows')
  for (const banned of ['score', 'criteria_met', 'risk_score']) {
    assert.ok(!imdcCols.includes(banned), `imdc_rows 不许有 ${banned} 列（产品不打分）`)
  }
  close(db)
})

test('⑦ 契约② 空 ≠ 阴性：缺值存 NULL，读出来不是 0 也不是"阴性"', () => {
  const db = freshDb()
  // metrics 的主键列叫 key（不是 metric_key，那是 metric_points 的列），别想当然
  const rows = db.prepare('SELECT key, band_low, band_high FROM metrics WHERE profile_key = ? AND band_high IS NULL').all('A')
  assert.ok(rows.length > 0, '应当存在上限未引入的指标（×ULN 契约：上限不能借）')
  const egfr = getProfile(db, 'A').metrics.find((m) => m.key === 'egfr')
  assert.deepEqual(egfr.band, [90, null], 'eGFR 的上限必须是 null，不能拿成人通用上限凑')
  close(db)
})

test('⑧ 事实四层不合并：documents / candidate_fields / metric_points / events 四表并存且各自独立', () => {
  const db = freshDb()
  for (const t of ['documents', 'candidate_fields', 'metric_points', 'events']) {
    const n = db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n
    assert.ok(n > 0, `${t} 不应为空`)
  }
  const p = getProfile(db, 'A')
  assert.equal(p.docs.length, 6)
  assert.equal(p.candidates.length, 2)
  assert.ok(p.candidates.every((c) => !p.docs.some((d) => d.id === c.id)), '候选与原件不许并在一起')
  close(db)
})

test('⑨ 不存在的档案返回 null（路由据此回 404，不假造空档案）', () => {
  const db = freshDb()
  assert.equal(getProfile(db, 'Z'), null)
  close(db)
})

test('⑩ 文件库也能开：工作区目录 + 迁移 + 播种 + 重开沿用', () => {
  const file = join(tmp, 'xyb-kidney.sqlite')
  const db = openDatabase(file)
  migrate(db)
  seedDemo(db)
  close(db)
  const again = openDatabase(file)
  const m = migrate(again)
  assert.deepEqual(m.executed, [], '重开已播种的库不应重复迁移')
  assert.equal(hasDemoData(again), true)
  assert.deepStrictEqual(getProfile(again, 'B').as.length, 4, 'B 的 AS 影像 4 条')
  close(again)
})
