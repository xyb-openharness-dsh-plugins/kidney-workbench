# 开发计划（DEV-PLAN）· 肾癌 v0.1

> 里程碑只认这一份。状态：⏳ 未开始 / ▶ 进行中 / ✅ 完成（留痕）。
> 流程：starter `prompts/ZERO-TO-DEV.md` v1.2；阶段 1.6 明确停下来等 G1 确认。

| 里程碑 | 内容 | 出口判据 | 状态 |
| --- | --- | --- | --- |
| M0 | starter init（150 文件，dsh-wb-cli 1.5.0 rev 900a613）+ 接线前置修复（cordis config.root）+ git init | `npm run check` 退出码 0 | ✅ dd1411d |
| M1 | 调研 + DIFF-MATRIX + PATIENT-FLOW + SCENARIOS + USER-RESEARCH + DEV-REQUIREMENTS | 六份文档在 `docs/`；差异化 ≥3 条且与基准同名 ≤70% | ✅ 本轮 |
| M2 | schema 0001 设计 + freeze-contract | 四契约落地；`check:schema` 过；sha256 入合同 | ▶ |
| M3 | 临床试验采集（在线通道）+ CLINICAL-DATA-2026 | 三处条数一致；逐来源终态 | ▶ |
| M4 | 演示数据 + HTML demo（prototypes/v0.2） | 四必查件 + 窄宽 probe 0 问题 | ✅ 本轮 |
| M5 | 独立评审（DESIGN-REVIEW） | 13 项检验单；P0=0 | ✅ 本轮（修订记录见 DESIGN-REVIEW §六） |
| **G1** | **交第一次确认，停下等签认** | 用户原话留痕 SIGNOFF | ⏳ 待用户 |
| M6 | 开发版移植（dsh 七件 + public + 检查链） | `npm run check` 全绿 + parity | ⏳ 未授权 |
| M7 | 装机验证（V2/V3） | 宿主信号 + 真机闭环 | ⏳ 未授权 |
| M8 | 建私有仓 + push + BACKLOG 回流 | remote SSH；组织四件套同步 | ⏳ 未授权 |

## 阶段 1.6 要交的东西（G1 前备齐）

demo 打开方式（file:// 路径）/ 关键页截图 / DIFF-MATRIX 三行摘要 / CLINICAL-DATA 覆盖与缺口 /
指南三层各自做到哪（G1 出处 ✅ 计划 / G2 节奏 ⏸ 视 demo / G3 分级 ❌ 首版不做）/ 本轮明确未做清单。

## 已知风险

1. 无访谈——场景全假设，G1 拍的是「范围」不是「需求已核实」。
2. CSCO 2025 只有公开摘录——出处卡只能到小节，页码待核。
3. 中国获批药物清单未逐条核——界面出现的每个药名都要标「获批状态未核实」。
   **2026-10-24 已落地**：`prototypes/v0.2/app.js` 治疗线序卡与用药周期表下方各加一条获批状态未核实说明
   （点名本档案演示用药帕博利珠单抗、阿昔替尼），文案写「以医嘱与药品说明书为准」，不写任何获批结论。
   临床研究页的试验标题里的药名属于登记原文摘录，与该风险无关（登记 ≠ 获批）。
4. 泌尿族两仓都是 🟡 脚手架，没有可直接继承的家族基线文件——schema 参照 gastric（消化样板）。

## M4 落地记录（2026-10-24）

- **页数与 DIFF-MATRIX 的账**：DIFF-MATRIX 定 10 个一级页 / 33 个二级页签；实际交付 **11 个一级页 / 34 个二级页签**。两处 +1：
  ① 加「临床研究」一级页（3 页签）——R4 采集的 721 条登记摘录与演示数据 10 条不放页面就孤儿了；
  ② 「影像与报告」从 2 页签加到 3 页签——资料整理流（上传 → 解析 → 核对 → 入库）收在该页第 3 页签，
  不单开一级页（家族 records 页是引擎不是内容页，塞进一级页会挤掉肾癌差异化页面）。
  看板的「今日一页 / 待办 / 最近记录」按页内分区实现（gastric 同款），不占页签数。
- **探针数字**（`scripts/probe-proto.mjs`，Chrome headless，file:// 直开）：
  70 个 (view, sub) × 档案组合全走查；aria-selected 全部落在点击的页签；同页页签内容指纹互异；
  `documentElement.scrollWidth > innerWidth` 0 处（桌面 + 400px 窄宽）；禁词 0；必现句 9 条 × 2 档案全中；
  一图秀：3 序列 / 17 点 / 末点标签 3、归一化水印在、事件竖虚线上端全部止于 CY0-10、分类指标（hfsr）0 连线 0 点；
  指标卡翻转 aria-pressed false→true；档案切换 A→B 正常，B 的 treatment 空态文案在；AI 面板开合与提示词边界正常；0 JS 错误。
- **顺带修的家族模板 bug**：`.top-actions` 基础规则 `flex:0 0 auto` 在 ≤900px 只加 `flex-wrap:wrap` 不收窄，
  窄屏顶栏操作区按 max-content 撑到 388px、body 横向溢出 4px。media 查询里补 `flex:0 1 auto;min-width:0`（样式表内有注释）。
  此 bug 大概率同存于 gastric / thyroid 等仓，建议回流时同步。
- 截图 10 张在 `docs/shots/`（G1 与 README 用）。

## M5 独立评审与修订记录（2026-10-24）

- 独立子代理评审（与主线隔离）：13 项检验单 **P0=0 / P1=3 / P2=9**，总体判断「修订后签」。
  报告全文 + 逐条处理证据见 `docs/DESIGN-REVIEW.md` §三（问题清单）与 §六（修订记录）。
- 修订批次全链复跑结果（退出码全 0）：`demo:data`（25 指标 / 95 数据点 / 10 试验）→
  `check:schema` ✓ → `check:demo` ✓（21 表 / 158 列）→ `probe:proto` ok=true
  （70 页签 / 0 禁词 / 0 溢出 / 单点断言过 / 10 截图）→ `npm run check` ✓（2 条 starter warnings 同前）。
- **`npm run audit` 22/30 通过 · 8 失败（已知，M6 结构件，G1 范围外）**：`lib/version.js`、`lib/layout.js`、
  `customFrame:true`、检查链缺单测/版本一致/schema/文案红线四项、`test/` 无用例。
  按 README 纪律「新项目 audit 必然有 fail，那是待办清单」——这 8 条即 M6 第一周待办，
  交付/装机前必须清零。**不在 G1 前补**：补了就等于把 M6 的活提前干，且 G1 可能改变页面范围。
- 家族回流建议（本轮发现，记入LESSONS 或回流清单）：① `.top-actions` 窄宽 bug（见 M4 记录）；
  ② fork 清理时注意采集脚本的 manifest 条目名（thyroid→kidney 教训：错名只在重跑时才写进 manifest，
  静态检查发现不了，要靠 hash 与实文件比对）。

## 阶段 1.6 交付物清单（G1 材料包）

| 材料 | 位置 |
| --- | --- |
| demo 打开方式 | README「打开演示」（file:// 直开，无需服务） |
| 关键页截图 | `docs/shots/` 10 张 |
| 差异化三行摘要 | DIFF-MATRIX §一 6 条种子 + §三 刻意不同 5 条 |
| 采集覆盖与缺口 | CLINICAL-DATA-2026 §2 终态表 + §3 五条缺口（含 721 宽检索分层） |
| 指南三层 | G1 出处 ✅（机构+版本+小节）/ G2 节奏 ⏸（CSCO §7 原文引用，demo 已用）/ G3 分级 ❌ 首版不做 |
| 明确未做清单 | DEV-REQUIREMENTS §四 8 条 + README「明确未做」 |
| 待拍板范围问题 | DIFF-MATRIX §四 决策点 1–8（7/8 为 M4 新增两条） |
| 评审与修订证据 | DESIGN-REVIEW 全文 + §六 修订记录 |
