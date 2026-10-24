# 开发计划（DEV-PLAN）· 肾癌 v0.1

> 里程碑只认这一份。状态：⏳ 未开始 / ▶ 进行中 / ✅ 完成（留痕）。
> 流程：starter `prompts/ZERO-TO-DEV.md` v1.2；阶段 1.6 明确停下来等 G1 确认。

| 里程碑 | 内容 | 出口判据 | 状态 |
| --- | --- | --- | --- |
| M0 | starter init（150 文件，dsh-wb-cli 1.5.0 rev 900a613）+ 接线前置修复（cordis config.root）+ git init | `npm run check` 退出码 0 | ✅ dd1411d |
| M1 | 调研 + DIFF-MATRIX + PATIENT-FLOW + SCENARIOS + USER-RESEARCH + DEV-REQUIREMENTS | 六份文档在 `docs/`；差异化 ≥3 条且与基准同名 ≤70% | ✅ 本轮 |
| M2 | schema 0001 设计 + freeze-contract | 四契约落地；`check:schema` 过；sha256 入合同 | ▶ |
| M3 | 临床试验采集（在线通道）+ CLINICAL-DATA-2026 | 三处条数一致；逐来源终态 | ▶ |
| M4 | 演示数据 + HTML demo（prototypes/v0.2） | 四必查件 + 窄宽 probe 0 问题 | ⏳ |
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
