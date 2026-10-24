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
| M5 | 独立评审（DESIGN-REVIEW） | 13 项检验单；P0=0 | ⏳ |
| **G1** | **交第一次确认，停下等签认** | 用户原话留痕 SIGNOFF | ⏳ |
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
