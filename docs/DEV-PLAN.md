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
| **G1** | **交第一次确认，停下等签认** | 用户原话留痕 SIGNOFF | ✅ 2026-10-25（原话「确认G1 ok，继续后续开发」，签认范围见下节） |
| M6 | 开发版移植（dsh 六件 + public + 检查链） | `npm run check` 全绿 + parity | ✅ 2026-10-25（v0.3.0；见下节） |
| M7 | 装机验证（V2/V3） | 宿主信号 + 真机闭环 | ⏳ 未授权 |
| M8 | 建私有仓 + push + BACKLOG 回流 | remote SSH；组织四件套同步 | ⏳ 未授权 |

## M6 落地记录（2026-10-25 · v0.3.0）

**形态**：`prototypes/v0.2/`（G1 签认的视觉基准）派生出 `public/`，`dsh/` 从 25 行骨架长成六件，lib 补三件，
检查链从 3 步补到 9 步，单测 33 项。版本号 0.2.0 → 0.3.0（原型快照冻结在 0.2.0，由 `check-version` 钉住）。

| 件 | 做法 |
| --- | --- |
| `dsh/store.js` | 母版（thyroid）整体复制，零业务、零改动 |
| `dsh/demo.js` | **不写第二份 INSERT**——调生成器的 `seedDatabase(db)`；只管"什么时候种"（库里已有档案就整批跳过） |
| `dsh/readmodels.js` | 21 张表还原成原型档案形状；`bootstrap.profiles` 用**字典**（A/B 为键），与 demo-data.js 同形，前端那段建索引的循环因此能原样复用 |
| `dsh/routes.js` | 最小四路由：`/health`、`/bootstrap`、`/profile/:key`、`/ui/*`；前缀 `/api/kidney`；MinerU 导入三条路由不留空占位（对应的 parse/settings 不在本仓） |
| `dsh/server.js` / `workbench.js` | 母版复制；`DB_FILE = xyb-kidney.sqlite` |
| `dsh/index.js` | 母版结构（root 可选 → 内存演示库；开库前 recursive 建目录；懒重试 1s 防抖；数据源代理用 getter；鉴权在 handler 层） |
| `public/` | style.css 逐字节复制；index.html 改四处（robots / title / description / 顶部状态条）；app.js **五处定点替换**（数据层 fetch bootstrap + 离线回退、版本随 VERSION、启动异步化、默认指标按档案重算、AI 提示词走 `kid:agent-draft` 交给外壳） |
| `lib/version.js` / `lib/layout.js` / `lib/client.js` | 生成物；`src/client.js` 是源码（改客户端改 src 再 `build:client`）。面板 `customFrame=true` / left / 0.65 / 会话 0.25–0.45 |
| `test/` | 33 项：store 10（含 parity、幂等、四契约在 schema 上的落点）、api 9（真服务 + 路径穿越 + 拒绝清单）、client 7（ModuleLoader 形态 + apiBase 双形态）、ui-parity 7（原型每行都在 + 新增函数白名单 + style.css 逐字节） |

**两条刻意的选择**（都可能被质疑，留个理由）：

1. **INSERT 只有一份**。母版 thyroid 的 `dsh/demo.js` 有 400 行自己的 INSERT。肾癌 21 张表再抄一遍就是两处漂移源
   （schema 与生成器已经是一对镜像了，不能再来第三份）。所以生成器导出 `seedDatabase(db)`，播种只调它。
2. **bootstrap 的 profiles 是字典不是数组**。原型 `DATA.profiles` 就是 `{A, B}`，用字典能让前端建索引的循环
   原样复用；数组方案会逼着前端为"原型 / 开发版"写两套数据层。代价是单测比对方式改成 `getProfile(db,'A')` vs `DEMO.profiles.A`。

**复跑证据**：`npm run check` 全绿（10 处版本同源 + 33 文件语法 + schema 冻结 + 文案红线 0 越界 + 列一致 + 33 单测 + 包检查 staticPass）；
`npm run audit` 33/33；`npm run probe:dev` 通过（真服务：`/health ok=true`、`/bootstrap` 2 档案 10 试验；页面 `dataSource=api`、
11 一级页 / 34 页签、档案切换 A→B 界面换人、0 console 错误、0 加载失败、桌面与 400px 均无横向溢出、截图 2 张）。

## G1 签认记录（2026-10-25）

| 项 | 内容 |
| --- | --- |
| 签认人 | samqin123（会话内） |
| 原话 | 「确认G1 ok，继续后续开发」 |
| 日期 | 2026-10-25 |
| 签认前版本 | v0.2.0，提交 `72786a6`（M5 修订批次） |
| 签认的范围 | ① 11 个一级页 / 34 个二级页签（含「临床研究」独立成页、「资料整理」收在影像页第 3 页签）；② DIFF-MATRIX §四 决策点 1–8 按原型现状收下；③ 721=宽检索命中量的分层口径、药名「获批状态未核实」标注方式 |
| 签认的性质 | 拍的是**范围**，不是「需求已核实」——无访谈，场景仍全假设（风险 1 未解除） |
| 授权 | M6 开发版移植、M7 装机、M8 建仓与回流 |

签认依据的材料包：demo（`prototypes/v0.2/index.html`，file:// 直开）、`docs/shots/` 10 张截图、
DIFF-MATRIX §一/§三 差异化、CLINICAL-DATA-2026 §2/§3 覆盖与缺口、DESIGN-REVIEW 全文 + §六 修订记录、
DEV-REQUIREMENTS §四 明确未做 8 条。

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
