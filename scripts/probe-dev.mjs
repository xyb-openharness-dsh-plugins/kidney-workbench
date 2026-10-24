#!/usr/bin/env node
/**
 * 开发版（public/ + dsh/）无头实测（M6 自验）。
 *
 * 与 `probe-proto.mjs`（原型，file://）的分工：那份验的是 34 个页签的渲染与契约，
 * 这份验的是**开发版多出来的那半条链路**——真服务、真接口、真数据：
 *  - dev-server 起得来，/health 与 /bootstrap 回的是库里的东西；
 *  - 页面从 bootstrap 拿到数据（不是回退到离线演示），state.dataSource === 'api'；
 *  - 档案切换后界面跟着换人（读模型与前端字典对齐的证据）；
 *  - 一级页 11 个、二级页签 34 个与原型账一致；
 *  - 0 个 console error、0 个加载失败、桌面与 400px 都不横向溢出；
 *  - 截图 2 张进 docs/shots/。
 *
 * 用法：node scripts/probe-dev.mjs；退出码 0/1。依赖本机 Chrome。
 */
import { mkdirSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchChrome, stopChrome, sleep } from './cdp.mjs';
import { Workbench } from '../dsh/workbench.js';
import { startWorkbenchServer } from '../dsh/server.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SHOTS = join(ROOT, 'docs', 'shots');
mkdirSync(SHOTS, { recursive: true });
const CDP_PORT = Number(process.env.RENAL_DEV_CDP_PORT || 9364);

const problems = [];
const notes = [];

const tmp = mkdtempSync(join(homedir(), '.xyb-kid-dev-'));
const workbench = await Workbench.open(join(tmp, 'workspace'));
const { server, url } = await startWorkbenchServer({ port: 0, workbench });

/* ---------- 1) 接口层 ---------- */
const health = await (await fetch(new URL('/api/kidney/health', url))).json();
if (!health.ok) problems.push(`/health 不健康：${JSON.stringify(health)}`);
const boot = await (await fetch(new URL('/api/kidney/bootstrap', url))).json();
if (Object.keys(boot.profiles || {}).length !== 2) problems.push(`bootstrap 档案数不是 2：${Object.keys(boot.profiles || {}).length}`);
if ((boot.trials || []).length !== 10) problems.push(`bootstrap 试验数不是 10：${(boot.trials || []).length}`);
notes.push(`接口：/health ok=${health.ok} · /bootstrap ${Object.keys(boot.profiles).length} 档案 / ${boot.trials.length} 试验`);

/* ---------- 2) 页面层 ---------- */
const { chrome, cdp, sock, userDataDir } = await launchChrome({ port: CDP_PORT, userDataPrefix: '.xyb-renal-dev-' });
try {
  await cdp.send('Page.navigate', { url });
  await sleep(700);
  for (let i = 0; i < 60; i += 1) {
    const ready = await cdp.eval("document.querySelectorAll('#nav .nav-button').length");
    if (ready >= 11) break;
    await sleep(200);
  }

  const info = await cdp.eval(`(() => ({
    title: document.title,
    dataSource: (typeof state !== 'undefined') ? state.dataSource : 'NO_STATE',
    brand: document.querySelector('.brand strong')?.textContent || '',
    pages: (typeof PAGES !== 'undefined') ? PAGES.length : -1,
    subTotal: (typeof SUBPAGES !== 'undefined') ? Object.values(SUBPAGES).reduce((a, s) => a + s.length, 0) : -1,
    banner: document.querySelector('[role=alert]')?.textContent?.slice(0, 80) || '',
    navButtons: document.querySelectorAll('#nav .nav-button').length,
    hasMain: !!document.getElementById('main'),
  }))()`);

  if (info.dataSource !== 'api') problems.push(`页面没吃到真数据：dataSource=${info.dataSource}（应为 api）`);
  if (info.pages !== 11) problems.push(`一级页不是 11：${info.pages}`);
  if (info.subTotal !== 34) problems.push(`二级页签合计不是 34：${info.subTotal}`);
  if (info.navButtons !== 11) problems.push(`导航按钮不是 11：${info.navButtons}`);
  if (!info.hasMain) problems.push('缺少 #main 容器');
  if (info.banner) problems.push(`出现了数据连接横幅（说明没连上）：${info.banner}`);
  notes.push(`页面：dataSource=${info.dataSource} · ${info.pages} 一级页 / ${info.subTotal} 页签 · 品牌「${info.brand}」`);

  /* 档案切换：A → B 后界面要换人（读模型与前端字典对齐的证据） */
  const before = await cdp.eval("(document.getElementById('main').innerText || '').slice(0, 3000)");
  await cdp.eval("(() => { state.profile = 'B'; render(); })()");
  await sleep(200);
  const after = await cdp.eval("(document.getElementById('main').innerText || '').slice(0, 3000)");
  /* 看板页不一定显示姓名（显示的是 headline），所以认 B 的特征句而不是姓名。 */
  const bMark = /陈女士|2\.6 cm|主动监测/.test(String(after));
  if (before === after) problems.push('切到档案 B 后界面没变');
  if (!bMark) problems.push('切到档案 B 后看不到 B 的特征内容（陈女士 / 2.6 cm / 主动监测）');
  notes.push(`档案切换 A→B：${before !== after && bMark ? '正常（界面换人）' : '异常'}`);
  await cdp.eval("(() => { state.profile = 'A'; render(); })()");

  /* 溢出：桌面 + 400px */
  const deskOverflow = await cdp.eval('document.documentElement.scrollWidth > window.innerWidth');
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 400, height: 900, deviceScaleFactor: 1, mobile: true });
  await sleep(500);
  const narrowOverflow = await cdp.eval('document.documentElement.scrollWidth > window.innerWidth');
  await cdp.send('Emulation.clearDeviceMetricsOverride');
  await sleep(200);
  if (deskOverflow) problems.push('桌面宽度横向溢出');
  if (narrowOverflow) problems.push('400px 窄宽横向溢出');
  notes.push(`溢出：桌面 ${deskOverflow ? '有' : '无'} · 400px ${narrowOverflow ? '有' : '无'}`);

  /* 截图两张 */
  const shots = [
    ['dev-dashboard-A', "(() => { state.profile = 'A'; state.view = 'dashboard'; render(); })()"],
    ['dev-labs-chart-A', "(() => { state.profile = 'A'; state.view = 'labs'; state.sub.labs = '一图秀'; render(); })()"],
  ];
  for (const [name, setup] of shots) {
    await cdp.eval(setup);
    await sleep(350);
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    writeFileSync(join(SHOTS, `${name}.png`), Buffer.from(data, 'base64'));
  }
  notes.push(`截图 ${shots.length} 张 → docs/shots/`);

  if (cdp.errors.length) problems.push(`console 错误 ${cdp.errors.length} 条：${cdp.errors.slice(0, 3).join(' | ')}`);
  if (cdp.badResponses.length) problems.push(`加载失败 ${cdp.badResponses.length} 条：${cdp.badResponses.slice(0, 3).join(' | ')}`);
  notes.push(`console 错误 ${cdp.errors.length} · 加载失败 ${cdp.badResponses.length}`);
} finally {
  await stopChrome({ chrome, sock, userDataDir });
  try { server.close(); } catch { /* 已关 */ }
  try { workbench.close(); } catch { /* 同上 */ }
  try { rmSync(tmp, { recursive: true, force: true }); } catch { /* 同上 */ }
}

console.log('— 开发版无头实测 —');
for (const n of notes) console.log('  ·', n);
if (problems.length) {
  console.error(`\n✗ ${problems.length} 项不通过：`);
  for (const p of problems) console.error('  -', p);
  process.exit(1);
}
console.log('\n✓ 开发版无头实测通过（真服务 + 真数据 + 34 页签账 + 0 错误 + 0 溢出）');
