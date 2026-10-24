# 变更记录

只增不删；每条写清"改了什么 + 为什么 + 用户可见结果"。版本号与 VERSION、package.json 三处必须一致。

## 0.3.0 — 2026-10-25

**M6 开发版移植（G1 签认后）· 包版本 0.3.0**

- **dsh 服务端六件**：`store.js`（母版复制）/ `demo.js`（调生成器 `seedDatabase()`，
  **不写第二份 INSERT**）/ `readmodels.js`（21 表还原成原型档案形状，parity 逐字段一致）/
  `routes.js`（最小四路由，前缀 `/api/kidney`）/ `server.js` / `workbench.js` / `index.js`
  （root 可选 → 内存演示库、开库前建目录、懒重试、数据源代理、鉴权在 handler 层）。
  为什么：原型是 file:// 单页，装进 Desktop 必须有一条真服务链路。用户可见：工作台里能读写本机资料库。
- **public/ 前端**：style.css 逐字节复制；index.html 改四处（noindex / title / description / 顶部状态条）；
  app.js 五处定点替换（数据层 fetch bootstrap + 离线回退、版本随 VERSION、启动异步化、
  一图秀默认指标按档案重算、AI 提示词走 `kid:agent-draft` 交给外壳填草稿）。
  为什么：与原型共用同一份渲染代码，否则 70 个页签探针的账要重算一遍。用户可见：界面与原型一致，数据来自本机。
- **lib 三件 + src/client.js**：`lib/version.js`（VERSION 生成）/ `lib/layout.js`（customFrame=true、
  业务区 left 0.65、会话 0.25–0.45）/ `lib/client.js`（由 `src/client.js` 注入生成，品牌字标「肾」、
  主色 #A3455C、消息名 kid:agent-draft）。用户可见：Desktop 里有顶栏 AI 按钮、可拖分栏。
- **检查链 3 步 → 9 步**：版本同源、语法、schema 冻结、文案红线（肾癌专属：Bosniak 判读 / IMDC 打分 /
  生长速度 / 该手术了阈值 / 分期判定 / 调药建议）、列一致、单测、包检查。用户可见：无（质量闸）。
- **单测 33 项**：store 10（parity + 幂等 + 四契约在 schema 上真的落住）、api 9（真服务 + 路径穿越 +
  资料目录拒绝清单）、client 7（ModuleLoader 形态 + apiBase 双形态）、ui-parity 7（原型每行都在 +
  新增函数白名单 + style.css 逐字节）。用户可见：无（质量闸）。
- **probe:dev 无头实测**：真服务 + 真数据（`dataSource=api`）、11 一级页 / 34 页签、档案切换界面换人、
  0 console 错误、0 加载失败、桌面与 400px 均无横向溢出、截图 2 张。用户可见：无（质量闸）。
- **版本 0.2.0 → 0.3.0**：原型快照冻结在 0.2.0（check-version 钉住），开发版跟 VERSION 走。

## 0.2.0 — 2026-10-24

**M1–M4 首次交付 + M5 独立评审修订（G1 前）**

- **M1 调研六件套**：USER-RESEARCH（0 访谈，六条假设全悬空并标注）、SCENARIOS（S01–S14）、
  PATIENT-FLOW（三条路径 + 页面树反推）、DIFF-MATRIX（与膀胱/甲状腺对照，同名率 4/10）、
  CLINICAL-DATA 口径、DEV-REQUIREMENTS 强约束。为什么：肾癌的差异化种子（分型/肾功能/AS/IMDC/副作用）
  必须先落文档再动代码。用户可见：无（文档层）。
- **M2 schema 冻结**：`schema/0001_initial.sql` 21 表 + 冻结合同。四契约入表结构：
  viewpoints 无 is_conclusion 列（看法恒不为结论）；空 ≠ 阴性（genetics 四态、病理 gap 未回报）；
  更正只新增版本；事实四层不合并。肾癌专属：imdc_rows 无 score 列、as_rows 无 size_delta/growth 列、
  副作用存 ctcae_text 不叫 grade。用户可见：无（数据层）。
- **M3 试验采集**：unified-trial-mcp 在线通道，8 关键词 × 每源上限 200，CDE 363 + CTV 358 = 721 条，
  manifest=jsonl=sqlite 三处一致；ChiCTR 与 ICTRP 两通道 FAILED 如实记录。用户可见：「临床研究」页线索。
- **M4 演示数据 + HTML demo**：`demo/build-demo-data.mjs` 唯一数据源（2 档案 / 24 指标 / 94 数据点 /
  10 条试验，重跑字节稳定）；`prototypes/v0.2/` 11 个一级页 / 34 个二级页签，从 gastric 基底改写
  （肾癌数据层与页面树）；无头探针 70 (页签 × 档案) 组合全走查通过。用户可见：可 file:// 打开的完整原型。
- **M5 独立评审修订**（子代理隔离评审，13 项检验单：P0=0 / P1×3 / P2×9，全部处理）：
  ① 品牌字标「胃」→「肾」；② 721 语料口径诚实化（自数分层 68/31/149/473 写进 notice、设置弹窗、
  AI 上下文、CLINICAL-DATA §3）；③ 药名获批状态未核实标注落地（治疗线序 + 用药周期表）；
  ④ 字号三态循环（正常/大字/特大）；⑤ 范围账四份文档同步 + G1 决策点补 2 条；
  ⑥ Bosniak 解释卡（轴 1 产物落点）；⑦ 单点「只有 1 次记录，暂不连线」（sparkline + chartSVG +
  demo B 单点指标 TSH + 探针断言）；⑧ fetch 脚本甲状腺残留与 manifest 条目名修正；
  ⑨ 禁词表两套口径统一为 10 词；⑩ AI 面板窄档 300px CSS + class；
  ⑪ README 重写（目的/人群/差异/功能清单/边界/PR 与脚手架/感谢）+ 版本 0.1.0→0.2.0；
  ⑫ demo B 胸部 CT 节奏标注「按腹部节奏类推」；⑬ 照护者代记与 AI 拖拽进「明确未做」。

## 0.1.0 — 2026-10-24

- 由社区脚手架 dsh-wb-cli@1.5.0 (900a613) 初始化，仅有注册骨架与健康接口，无业务功能。
