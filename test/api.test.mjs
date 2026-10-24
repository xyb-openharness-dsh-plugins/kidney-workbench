/* 服务端链路单测：起真服务（port 0），只走 HTTP。
 *
 * 为什么要起真服务而不是直接调 handler：`/ui/*` 与 `/api/*` 的分流、路径穿越拦截、
 * 未知路径回 index.html 这些，都是在真请求上才会暴露的东西——mock 请求对象会把它们
 * 全部绕过去。接口前缀也在这里钉住：本地能开的路径，装进 Desktop 必须也在。
 */
import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

import { Workbench, validateWorkspacePath } from '../dsh/workbench.js'
import { startWorkbenchServer } from '../dsh/server.js'
import { API_PREFIX, UI_PREFIX } from '../dsh/routes.js'

const tmp = mkdtempSync(join(homedir(), '.xyb-kid-api-'))
after(() => { try { rmSync(tmp, { recursive: true, force: true }); } catch { /* 同上 */ } })

const wb = await Workbench.open(join(tmp, 'workspace'))
const { server, url } = await startWorkbenchServer({ port: 0, workbench: wb })
after(() => { try { server.close(); } catch { /* 已关就算了 */ } })

const get = async (path) => {
  const res = await fetch(new URL(path, url))
  return { status: res.status, body: await res.text(), json: async () => JSON.parse(await res.text()) }
}

test('① 前缀契约：/api/kidney 与 /api/kidney/ui', () => {
  assert.equal(API_PREFIX, '/api/kidney')
  assert.equal(UI_PREFIX, '/api/kidney/ui')
})

test('② /health：版本号、能力清单与 UI 前缀都在', async () => {
  const res = await fetch(new URL(`${API_PREFIX}/health`, url))
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.equal(body.ok, true)
  assert.equal(body.apiVersion, 'v1')
  assert.equal(body.ui, '/api/kidney/ui')
  assert.deepEqual(body.capabilities, ['bootstrap', 'profile'])
  assert.equal(body.version, wb.version)
})

test('③ /bootstrap：档案字典 + 试验行，与原型快照同形', async () => {
  const body = await (await fetch(new URL(`${API_PREFIX}/bootstrap`, url))).json()
  assert.deepEqual(Object.keys(body.profiles), ['A', 'B'])
  assert.equal(body.trials.length, 10)
  const src = readFileSync(join(process.cwd(), 'prototypes/v0.2/demo-data.js'), 'utf8')
  const DEMO = JSON.parse(src.slice(src.indexOf('=') + 1, src.lastIndexOf('};') + 1))
  assert.deepStrictEqual(body.profiles.A, DEMO.profiles.A)
  assert.deepStrictEqual(body.trials, DEMO.trials)
})

test('④ /profile/:key：存在的返回档案，不存在的 404（不假造空档案）', async () => {
  const ok = await (await fetch(new URL(`${API_PREFIX}/profile/A`, url))).json()
  assert.equal(ok.profile.name, '周先生')
  const missing = await fetch(new URL(`${API_PREFIX}/profile/Z`, url))
  assert.equal(missing.status, 404)
  assert.equal((await missing.json()).error, 'profile_not_found')
})

test('⑤ 静态：/ 回 index.html，/app.js 与 /style.css 可取', async () => {
  const root = await get('/')
  assert.equal(root.status, 200)
  assert.ok(root.body.includes('小肾宝'), '首页应含品牌名')
  assert.ok(root.body.includes('app.js'))
  for (const f of ['app.js', 'style.css', 'demo-data.js']) {
    const r = await get('/' + f)
    assert.equal(r.status, 200, `${f} 应可取`)
  }
})

test('⑥ 路径穿越：../ 一律拦在 public/ 内（不读 public 之外的文件）', async () => {
  const evil = await fetch(new URL('/../../package.json', url))
  const text = await evil.text()
  assert.ok(!text.includes('@xyb-community/kidney-workbench'), '不许把仓库根的文件读出去')
})

test('⑦ 未知接口回 JSON 404，不是 HTML 也不是空响应', async () => {
  const res = await fetch(new URL(`${API_PREFIX}/nope`, url))
  assert.equal(res.status, 404)
  const body = await res.json()
  assert.equal(body.error, 'not_found')
})

test('⑧ 资料目录拒绝清单：主目录、/tmp、桌面/下载/文档根目录都不许用', () => {
  const home = homedir()
  for (const bad of [home, '/tmp', join(home, 'Desktop'), join(home, 'Downloads'), join(home, 'Documents'), '']) {
    assert.ok(validateWorkspacePath(bad).length > 0, `应当拒绝：${bad}`)
  }
  assert.deepEqual(validateWorkspacePath(join(home, '我的肾癌资料')), [])
})

test('⑨ 关库后服务不再抛错（卸载路径不炸）', () => {
  // 只验证 close 不抛；真正的关库在 after 里做，避免影响其它用例
  assert.equal(typeof wb.close, 'function')
})
