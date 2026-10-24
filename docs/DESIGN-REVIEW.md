# 设计独立审查记录（DESIGN-REVIEW）· 肾癌（RCC）G1 设计包 + G2 原型

状态：**已完成一轮独立审查（2026-10-24）。总体判断：修订后签。** 自审与独立模型审查分开记录，本表即独立模型审查轮。

| 轮次 | 阶段/文档版本或hash | 实际模型/推理档位/审查Agent | 时间与输入范围 | 发现及优先级 | 建议/讨论项 | 用户决定与修改证据 | 未解决项 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R1 | G1 设计包（DEV-REQUIREMENTS v0.1 + DIFF-MATRIX + SCENARIOS S01–S14 + PATIENT-FLOW + USER-RESEARCH H1–H6 + CLINICAL-DATA-2026 + SCHEMA 21 表/冻结合同）+ G2 原型 prototypes/v0.2/（app.js sha256 前缀 `b792fb7720260d0b`，复跑核对一致）；git HEAD `e7ae969` | 独立子代理（与设计主线隔离） | 2026-10-24；输入=上列全部文档与源码 + schema/0001_initial.sql + demo/build-demo-data.mjs + research/kidney-cancer 721 条语料全文分析 + scripts/probe-proto.mjs 独立复跑 + npm run check / check:schema / check:demo + docs/shots 抽看 8 张 | P0×0 / P1×3 / P2×9（见 §三） | 见 §三"建议"列与 §五缺口 | 待用户（本表 R1 行空置，签认后回填） | P1 三条 + P2 九条 + §五缺口清单 |

评审重点：用户任务证据、专业视角偏差、场景取舍、完整闭环、AI 解释价值、分期、来源时效和主体/隐私。记录高优先级问题，而非只给"通过"。本表只审设计方案，不代表发布已授权、包已安装、Desktop 已加载或市场已收录（分别见 `docs/RELEASE.md`、`docs/ACCEPTANCE.md`、`docs/10-MARKET-PUBLISHING.md`）。

---

## 一、审查范围与元信息

- **元信息**：评审人=独立子代理（与设计主线隔离）；日期 2026-10-24；git HEAD 短哈希 `e7ae969`。审查依据 = 家族 13 项检验单 + 专项 fork 残留扫描。
- **自验复跑数字**（全部由本审查独立执行，非引用构建方自报）：
  - `scripts/probe-proto.mjs`（无头 Chrome，file:// 直开，约 30 秒）：**ok=true**。tabs=70（11 一级 × 页签 × 2 档案全走查）；navButtons=11；jsErrors=0；networkFailures=0；overflow=0；ariaMismatch=0；禁词 0（10 词 × 70 组合）；必现句缺失 0（9 条 × 2 档案）；同页指纹互异 0 冲突；窄宽 400px 溢出 0；一图秀 3 序列 / 17 点 / 末点标签 3 / 归一化水印在 / 事件竖虚线 3 条全部止于 CY0-10 / 分类指标（hfsr）0 连线 0 点；指标卡翻转 aria-pressed false→true；档案切换 周先生↔陈女士正常且 B 的 treatment 空态文案在；AI 面板开合正常、提示词含品牌与边界句、模拟回复禁词命中 0；截图 10 张。
  - `npm run check`：staticPass=true（2 条 warnings：cordis patch 的 config.root 未在 Config 声明、peer 范围需另行核验）。
  - `npm run check:schema`：✓ 冻结合同通过（1 个迁移文件，哈希一致）。
  - `npm run check:demo`：✓ 21 表 / 158 列，生成器与 schema 列名/顺序/类型/主键全部一致。
  - `research/kidney-cancer/`：manifest.recordCount=721 = jsonl 721 行 = sqlite `trials` 721 行（source_statuses 48 = manifest 48），三处条数一致属实。
- **审读件**：docs/DEV-REQUIREMENTS-2026-10-24.md、DIFF-MATRIX.md、SCENARIOS.md、PATIENT-FLOW.md、USER-RESEARCH.md、CLINICAL-DATA-2026.md、SCHEMA.md、DEV-PLAN.md；schema/freeze-contract.md、schema/0001_initial.sql；prototypes/v0.2/{index.html,app.js,demo-data.js,style.css}（全量）；demo/build-demo-data.mjs、scripts/fetch-kidney-trials-2026.mjs、scripts/probe-proto.mjs；research/kidney-cancer/{manifest.json,trials-2026.jsonl,kidney_cancer_trials_2026.sqlite}；README.md、CHANGELOG.md；docs/shots/ 抽看 8 张（dashboard-main-A、monitor-影像与大小-B、tox-副作用记录-A、labs-一图秀-A、trials-2026 线索-A、imaging-资料整理-A、tumor-分型档案-A、renal-肾功能趋势-A）。
- **说明**：docs/DESIGN-SESSION.md / SIGNOFF-*.md 不存在——G1 尚未签认，属阶段正常状态，不计缺口（见 §五第 1 条）。探针复跑会重写 docs/shots/ 10 张截图（源码未变，内容等价）。

## 二、13 项检验逐条结果

| # | 检验 | 判定 | 证据（落点文件） |
| --- | --- | --- | --- |
| ① | 医生任务冒充患者 | **PASS** | SCENARIOS S01–S14 每条以患者困惑起头（"看不懂 / 心慌 / 不知算不算大事 / 想记住"），动作是记录·解释·准备问医生；原型无任何分级/判读工具：无 TNM 计算器（staging_rows 无计算列，schema L143-151）、IMDC 只记医生判定无打分 UI（app.js L519-522）、as_rows 无 size_delta/growth 列（schema L180-189）、影像页明示"工作台不解读影像"（L644）；看板任务卡全是患者动作（L368-378）；无 Bosniak/CTCAE 判读器 |
| ② | 证据成立性（0 访谈标注 + 引用抽查） | **WARN** | 0 访谈五处如实声明（USER-RESEARCH L3-4 头注 + §三 L95"六条假设全悬空"；SCENARIOS L3"全部〔待访谈核实〕"；PATIENT-FLOW L4；DEV-REQUIREMENTS L69"场景清单不得当已确认需求"）。引用抽查：**IMDC 六项与 Heng 2009 JCO 原文一致**（六因素 KPS<80% / 距确诊<1年 / Hb<LLN / 校正钙>ULN / PLT>ULN / NEU>ULN + 0/1–2/≥3 分组准确，app.js L522、demo-data imdc 行），标注"原文引用"；**CSCO 2025 全程标注"公开摘录 · 小节页码待核"**（L382/423/433/498/522/562 + demo rhythm guideline 字段），未写成"原件已取得"；USER-RESEARCH L7"未取得中文指南原件，页码全部待核"口径诚实。**但**：721 条采集语料被称作"肾癌相关临床试验登记摘录"（app.js L721 notice、L921 设置弹窗、CLINICAL-DATA §1）——本审查全文分析 jsonl：按标题仅 **91/721（12.6%）**含肾癌关键词，**25 条明确为其他瘤种**（边缘区淋巴瘤 / 三阴性乳腺癌 / 胶质母细胞瘤 / 膀胱灌注 / 非小细胞肺癌 / 肝癌 / 胰腺癌 / 前列腺癌 / 白血病），149 条为药物生物等效性研究；CLINICAL-DATA §3 已知缺口未披露语料过宽 → **P1-2** |
| ③ | 解释价值 vs 记录本 | **PASS** | 解释件实存且带机构+版本+小节：「分期是什么」（AJCC 第 8 版 · TNM 三字母 · c/p 之别，app.js L423-426）、「分级是什么」（WHO/ISUP 1–4 级，L433-436）、术式词表六种（PN/RN/消融/活检，L457-461）、「怎么看这些数」（对照不判读 / 趋势≠疗效 / 缺值不是 0，L626-630）、CSCO §7 AS 节奏原文引用（L496-498）、一图秀八类指标口径角标 CAT_TAG（L192-201）——不是只有记录本 |
| ④ | 营养/心理完整度 | **PASS（附注）** | 营养是**有据的刻意最小化**：不设营养支持页、不给食谱，理由写进 DIFF-MATRIX §三（"肾癌无特定饮食处方证据，设页=暗示有处方"）与页面文案（L690-692）——与食管癌刻意相反，不许统一掉；心理有看法记录位（viewpoints，A 4 条 / B 3 条 demo 数据）+ 想对家人说 + 默认私密 notice（L696-701）。附注：活动页仅一行事实+口径（L693-695）、出行与资源四行全"未记录"占位（L702-708，病友组织未核实已如实标注）——占位级内容属 G1 范围可接受，M5+ 补可核实资源 |
| ⑤ | 四核心模块完整 | **PASS** | 病情整理→imaging·资料整理（上传→解析→确认指标→入库四步流 + 候选三态 + "事实四层"说明，app.js L761-781，截图确认）；指标检测→labs 三页签 + renal 肾功能趋势 + tox 血压/甲功/尿蛋白五页签；一图秀→labs·一图秀（探针：3 序列/17 点/末点标签/归一化水印/竖线止于 CY0-10/分类不连线）；临床治疗及试验→treatment 三页签 + tox + trials 三页签（"线索不是推荐"常驻，L721） |
| ⑥ | 双主体（患者/照护者代记、私密分级） | **WARN** | 私密分级到位：`genetics_rows.private DEFAULT 1`（schema L229）+ 导出白名单不含本表与 viewpoints（SCHEMA §6"按构造排除"）+ 界面三处声明（L442 遗传页 / L697 情绪页 / L668 复诊摘要）+ demo genetics 数据带 private=1 与"家属口述（非检测）"来源标注。**但**：照护者代记无落点——schema 无 author/caregiver 列、原型无代记徽章、两个演示档案均为患者本人；仅 app.js L701 一句文案"照护者可以代记"；延后说明只在 USER-RESEARCH 轴 6（caregiver_rows 属 0002+），未进 DEV-REQUIREMENTS §四"明确未做"清单，G1 用户拍范围时看不到 → **P2-9** |
| ⑦ | 范围适当性（11 页 34 页签 vs 文档 10 页 33 页签） | **WARN（正向）** | DEV-PLAN「M4 落地记录」对 +1 的解释**成立**：①「临床研究」一级页接住 R4 采集的 721 条与演示 10 条（不放页面就孤儿）；②「资料整理」收进 imaging 第三页签不新开一级页（家族 records 页是引擎不是内容页）；看板三分区按页内分区实现。**但账没对平**：DIFF-MATRIX §二 把看板「今日一页/待办/最近记录」列在"二级页签"列（合计 33），DEV-PLAN 又说看板三分区"不占页签数"——两处口径自相矛盾；按真实页签 DIFF-MATRIX 实为 30 个，实际交付 34 = 30 + 临床研究 3 + 资料整理 1，与 M4"两处 +1"的表述对不上；且 DEV-REQUIREMENTS R1（"10 个一级页 × 33 个二级页签"）、DIFF-MATRIX §二、PATIENT-FLOW 页面树（仍列 10 页、漏临床研究）三处未同步；「临床研究独立成页」未进 DIFF-MATRIX §四 G1 决策点，属构建方单方决定 → **P2-2**（G1 应追认或回退） |
| ⑧ | 医学来源时效 | **WARN** | CSCO 摘录页码待核全程如实（app.js L382/423/433/498/522/562 + demo rhythm 字段）；试验状态"未核实"常驻（每卡 pill L720 + notice L721 + 设置 L921 + AI 上下文 L855 + 关于 L928）；家庭血压节奏诚实标注"工作台建议节奏（非指南内容）"（demo A rhythm 第 3 行）是亮点。**但**：DEV-PLAN 已知风险 3 承诺"界面出现的每个药名都要标『获批状态未核实』"，原型中帕博利珠单抗/阿昔替尼（app.js L509/541/546 + demo-data lines/cycles）**无任何获批状态标注**——自订规则未执行 → **P1-3** |
| ⑨ | S→F→A 同源（含孤儿页签） | **WARN** | S01–S14 ↔ 页签 ↔ 原型内容 **14/14 有落点**，验收列逐条对得上（未回报 pill / IMDC 原句上屏 / 不算 mm-年 / ctcae 不叫 grade / 出口问医生，探针 REQUIRED 9 条 × 2 档案全中）；探针 70 组合 aria-selected 全部正确、同页指纹互异。**但 7 个二级页签无编号场景经过**：life×4（饮食与体重/活动/情绪与照护者/出行与资源）+ trials×3（2026 线索/已收藏/入组问题）——依据在 USER-RESEARCH 轴 5/6/9/10 与 PATIENT-FLOW 页面树，不在 S 层（页面树还漏了临床研究页）。另：轴 1 产物「Bosniak 分级」在原型无落点；SCENARIOS 一图秀断言「单点写『只有 1 次记录，暂不连线』」未实现（demo 无单点数值序列触发，chartSVG 单点只画点无文案）→ **P2-3** |
| ⑩ | 假设不冒充事实 | **PASS** | H1–H6 节级标注"全部〔待访谈核实〕"（USER-RESEARCH §二头注）+ §三"六条假设全悬空"；场景层三处声明（SCENARIOS L3 / PATIENT-FLOW L4 / DEV-REQUIREMENTS L69）；无"已确认需求"表述。与 ② 同源的 721 语料口径问题单列 P1-2，不涉及假设冒充 |
| ⑪ | 差异化真实性（抽 2 条 vs 膀胱/甲状腺） | **PASS** | 抽查三条全部**真进表结构与界面**，非文案层：**AS 影像并列**——as_rows 无 size_delta/growth 列（schema L180-189）+ 界面"原文并列 · 不算 mm/年"（app.js L490-492，B 档案 2.6cm/27mm/27mm/28mm 四行并列无连线无差值，截图确认）+ 探针必现句"不算生长速度"；**IMDC 不打分**——imdc_rows 无 score 列（schema L195-204）+ 界面"产品不打分""IMDC 是预后模型，不是预测工具"（L519-522）+ demo 只记"中危（医生判定）"；**肾功能轨道**——renal 三页签 + contra_rows（孤立肾/CKD 原文，"未记录与正常必须能分开"）+ Cr/eGFR 基线点并列（截图确认）。同名率 4/10=40% ≤70%；"刻意不同"五条（营养不设页 / 三词三页签 / 不算速度 / 不打分 / 并置不并轴）均有落点 |
| ⑫ | 红线 | **PASS** | 界面无第③层判断句：本审查自扫 17 个判断词（恶化/该手术/预后/高危/中危/低危/复发/治愈/严重/偏高低等）全部命中否定语境或原文引用（如"没有『恶化/下降』字样"L467、"不设『该手术了』的阈值"L492）；探针 10 禁词 × 70 组合 0 命中。未检测≠阴性三落点齐：genetics 四态 +"未检测不写成阴性"（L442）、up_qual"报告写阴性才记阴性，没查就不记"（demo-data note）、病理 gap"未回报" pill（L417-419）。ctcae_text 不叫 grade（schema L206-207 + 界面说明 L554）。「这一句需要问你的医生」出口在（L678，探针必现）+ 两处变体（L467/L492）。AI 提示词边界句在（L863"不是医疗建议…不要求工作台外推结论" + mockReply 免责，探针 promptHasBoundary=true）。FORBIDDEN 词表在（L843 + agentDemo 自检，replyHits=0）。附注：app.js 内层 8 词 < 探针 10 词（少"自动分级/风险评分"）→ **P2-5** |
| ⑬ | 交互门槛抽查 | **WARN** | 页签按 state.sub 分流：探针 70/70 aria-selected 正确 ✓；指标卡翻面：探针 false→true ✓；上传流四步：flowSteps 四步 + ingestFiles 全流程 + 解析失败保留原件可重试（截图 imaging-资料整理-A 确认）✓；导出两区不合并：dlgExport 事实区 / 问题与看法两区 + "私密条目默认不含"（L943）+ 复诊摘要排除心理感受（L668）✓。**字号三档未落地**：DEV-REQUIREMENTS §二要求 `--tz` 1/1.15/1.32 三档 + calc 乘法体系，原型只有大/正常两档（style.css L21 `--font` 15px/17px，比例≈1.13）→ **P2-1**。附注：AI 面板"窄"档无对应 CSS（`.work-grid.agent-open` 固定 380px，narrow 与 std 同宽）；拖拽/splitter/键盘精度/localStorage 夹取未实现且需求文档未标阶段 → **P2-6** |

**专项检查 · fork 残留扫描：FAIL（轻度，一处用户可见）**

- `prototypes/v0.2/style.css` L48：`.brand.no-mark::before{content:"胃"}`——**胃癌 fork 残留直接上屏**：侧栏品牌标渲染「胃」字（docs/shots 8 张截图全部可见，红底方标 + 「小肾宝」），关于弹窗（dlgAbout 用 `.brand.no-mark` zoom:2.2）同害；index.html L8 favicon 用的是正确的「肾」（UTF-8 `%E8%82%BE`）——CSS 字标与 favicon 自相矛盾，应改「肾」。**这是本轮唯一用户可见残留 → P1-1。**
- `prototypes/v0.2/style.css` L2 注释「品牌色系沿用淋巴瘤 → 小畅宝的家族骨架」、L4「与肠癌完全一致」、L169 `/* ---------- deauville ---------- */`（淋巴瘤疗效评估标准命名，`.dv-row/.dv` 正被 monitor·影像与大小使用）——注释/命名级残留，非用户可见。
- `prototypes/v0.2/style.css` 另有约 23 个家族脚手架死类（app.js/index.html/demo-data.js 零引用）：`.dv-scale/.milestone/.ww-hero/.topic-card/.flag-list/.stat-band/.chart-tip/.form-grid/.about-logo/.stat-tile/.check-row` 等——非癌种特异，不误导用户，但属死代码。
- `scripts/fetch-kidney-trials-2026.mjs` L15-16 用法示例写成 `node scripts/fetch-thyroid-trials-2026.mjs`（2 处）——甲状腺残留，docstring 级。
- `scripts/fetch-kidney-trials-2026.mjs` L239：`manifest.files['thyroid_cancer_trials_2026.sqlite'] = …`——**脚本级甲状腺残留**：磁盘实文件为 `kidney_cancer_trials_2026.sqlite`（哈希 `97307baf…` 与该文件一致，仅条目名错），每次重跑都会把错名写进 manifest.json；R4「manifest=jsonl=sqlite 三处一致」在文件名维度对不上（计数维度一致）。
- `research/kidney-cancer/trials-2026.jsonl`：30 行标题为其他瘤种（淋巴瘤/乳腺癌/胶质瘤/膀胱等）——原始采集语料被宽检索词带入，**演示选样 10 条全部为肾癌登记（已逐条核）**；此问题归证据口径 P1-2，不计 fork 残留。
- 判定为**可接受（家族规范层跨癌种举例 / 结构母版 / 必需对照）**：schema/0001_initial.sql L10「与样板（胃癌）的差异」与 L23「乳腺『四点位』在本病种无对应物」；app.js L4/L93、demo/build-demo-data.mjs L12-17 同款胃癌结构母版注释（允许同构不允许同文）；demo-data.js 的 PD-L1/KPS/TSH（肾癌正当内容：IMDC 六项之 KPS、基因检测 gap、TKI 甲减语境）；DIFF-MATRIX §二「膀胱同名?」列（差异化矩阵的必需基准）；CLINICAL-DATA L26「与甲状腺癌采集同日同现象」（采集方法论注记）；docs/01–31、prompts/ 等 starter 脚手架命中（家族规范层，非本项目交付物）。
- **死样式提示**（thyroid 轮同类教训）：本轮死样式以家族通用件为主，唯一癌种特异命名是 deauville 段；清理时与 L2/L4 注释一并处理。

## 三、问题清单（P0–P2，均带落点文件）

**P0（红线违规/证据造假级）：0 条。**
（本轮未发现：界面无第③层判断句、0 访谈与引用口径诚实（除 P1-2 语料标签外）、未检测≠阴性三落点齐、四契约入表结构属实、探针禁词 0 命中。）

**P1（签认前必须处理）**

| # | 问题 | 落点 | 建议 |
| --- | --- | --- | --- |
| P1-1 | 品牌字标「胃」上屏：style.css `.brand.no-mark::before` 渲染胃癌字符，侧栏与关于弹窗用户可见；与 index.html favicon 的「肾」矛盾 | prototypes/v0.2/style.css L48；prototypes/v0.2/index.html L8；docs/shots/ 全部 8 张 | `content:"胃"` → `content:"肾"`；修后重跑 probe 截图核对；同时在 G1 材料包确认品牌标最终形态（CSS 字标 vs assets/brand/xyb-logo.png，见 §五第 9 条） |
| P1-2 | 721 条语料被称为「肾癌相关临床试验登记摘录」，实为宽检索命中：按标题仅 91/721（12.6%）与肾癌相关，25 条明确其他瘤种（淋巴瘤/乳腺癌/胶质瘤/膀胱癌/肺癌/肝癌/胰腺癌/前列腺癌/白血病），149 条为生物等效性研究；CLINICAL-DATA §3 已知缺口未披露语料过宽；该数字用户可见于 trials 页 notice 与设置弹窗 | prototypes/v0.2/app.js L721、L921、L855；docs/CLINICAL-DATA-2026.md §1–§3；research/kidney-cancer/trials-2026.jsonl（全文分析）；scripts/fetch-kidney-trials-2026.mjs L34-42（QUERIES） | 二选一：① 对语料加肾癌关键词过滤（标题含 肾/renal/kidney/RCC）后重报三处数字并重跑采集；② 保留语料但改写口径——notice 改为「以肾癌关键词宽检索采集的登记命中（含其他瘤种与生物等效性研究）；演示选样 10 条均为肾癌登记」，CLINICAL-DATA §3 补第 4 条缺口「宽检索导致语料含非肾癌条目，演示层已选样」。无论哪版，「登记状态未核实」纪律保持不变 |
| P1-3 | NMPA 承诺未执行：DEV-PLAN 已知风险 3 写明「界面出现的每个药名都要标『获批状态未核实』」，原型药名（帕博利珠单抗/阿昔替尼）无任何标注 | docs/DEV-PLAN.md L28；prototypes/v0.2/app.js L509、L541、L546；prototypes/v0.2/demo-data.js（lines/cycles） | 二选一：① 在线序/方案档案/周期表药名处加「获批状态未核实」pill 或脚注；② 修订 DEV-PLAN 风险条为「演示档案药名来自患者本人医嘱原文，属事实记录不涉产品推荐，豁免标注；产品主动列药时才需标注」并请用户在 G1 确认。两边不能一边承诺一边不做 |

**P2（修订项，可与 G1/G2 同批处理）**

| # | 问题 | 落点 |
| --- | --- | --- |
| P2-1 | 字号三档未按 DEV-REQUIREMENTS §二落地：要求 `--tz` 1/1.15/1.32 + `calc(NNpx * var(--tz))` + SVG 文字不随档位；原型只有 15/17px 两档（body.large），无三档体系 | docs/DEV-REQUIREMENTS-2026-10-24.md §二 L25；prototypes/v0.2/style.css L21；prototypes/v0.2/index.html L32 |
| P2-2 | 范围账三处不同步且口径矛盾：DEV-REQUIREMENTS R1 写「10 页 × 33 页签」、DIFF-MATRIX §二列 10 页（把看板三分区列进页签列合计 33）、PATIENT-FLOW 页面树漏「临床研究」页；DEV-PLAN M4 称「两处 +1」与 DIFF-MATRIX 的 33 口径对不上（真实页签口径：30 + 3 + 1 = 34）；「临床研究独立成页」未进 G1 决策点 | docs/DEV-REQUIREMENTS-2026-10-24.md R1 L11、D2 L80；docs/DIFF-MATRIX.md §二 L19-33、§四 L45-52；docs/PATIENT-FLOW.md 页面树 L50-63；docs/DEV-PLAN.md M4 L33-37 |
| P2-3 | 孤儿页签 7 个无编号场景经过（life×4、trials×3），依据在疾病轴与页面树而非 S 层；轴 1 产物「Bosniak 分级」无原型落点；一图秀断言「单点写『只有 1 次记录，暂不连线』」未实现（demo 无触发，chartSVG 单点静默画点） | docs/SCENARIOS.md（S01–S14 全表 + 一图秀断言 L23-28）；docs/USER-RESEARCH.md 轴 1 L14-15、轴 5/6/9/10；prototypes/v0.2/app.js L331（`s.pts.length > 1 ? … : ''`） |
| P2-4 | fork 清理尾巴：style.css L2/L4/L169 注释与 deauville 命名 + 约 23 个死类；fetch 脚本 L15-16 用法示例写 thyroid；fetch 脚本 L239 把 manifest 文件条目名写成 thyroid_cancer_trials_2026.sqlite（脚本级，重跑即复发） | prototypes/v0.2/style.css L2、L4、L169；scripts/fetch-kidney-trials-2026.mjs L15-16、L239；research/kidney-cancer/manifest.json files 段 |
| P2-5 | 禁词表两套口径：app.js 内层 FORBIDDEN 8 词 < 探针 10 词（少「自动分级」「风险评分」）——AI 自检覆盖面小于走查层，建议词表单一来源 | prototypes/v0.2/app.js L843；scripts/probe-proto.mjs L43 |
| P2-6 | AI 面板三档 widths 只兑现两档：「窄」无对应 CSS（narrow 与 std 同宽 380px）；拖拽/splitter/键盘同精度/localStorage 夹取/窄容器抽屉 ≤420px 均未实现，DEV-REQUIREMENTS §二未标注这些属 M6 项 | prototypes/v0.2/style.css L444-446；docs/DEV-REQUIREMENTS-2026-10-24.md §二 L22 |
| P2-7 | README 仍为脚手架模板文案（「尚未实现真实业务」与已交付 M4 矛盾；引用不存在的 docs/BRIEF.md、SPEC.md、TASKS.md、PROTOTYPE-REVIEW.md）；CHANGELOG 未记 M1–M4 | README.md L5、L9；CHANGELOG.md（仅 starter 0.1.0 一条） |
| P2-8 | demo B 节奏表「胸部 CT · 同上节奏」超出所引 CSCO §7 密切监测（T1a）原文范围（该原文针对腹部影像），建议标注「按腹部节奏类推（页码待核）」或删该行 | prototypes/v0.2/demo-data.js（B.rhythm 第 2 行） |
| P2-9 | 「照护者代记」双主体延后未进 DEV-REQUIREMENTS §四「明确未做」清单（仅在 USER-RESEARCH 轴 6 与 app.js L701 文案）——G1 拍范围时用户看不到首版不含作者身份列 | docs/USER-RESEARCH.md 轴 6 L52；docs/DEV-REQUIREMENTS-2026-10-24.md §四 L66-73；prototypes/v0.2/app.js L701 |

## 四、总体判断：**修订后签**

- **G1（业务流程签认）**：医学底座质量高于家族前几轮——红线句全部上屏且入表结构（imdc 无 score 列、as_rows 无 growth 列、ctcae_text 不叫 grade、viewpoints 无 is_conclusion 列）、0 访谈五处诚实声明、IMDC/CSCO 引用口径如实、IMDC 六项与 Heng 2009 原文一致、四种路径随访节奏引用原文不排计划。**前提**：① 处理 P1-2（721 语料口径）与 P1-3（药名标注落地或承诺修订）——两条都是证据诚实问题，是家族命根；② P1-1 品牌字分钟级修复；③ 范围 11 页 / 34 页签由用户逐条拍板：「临床研究」独立成页追认或回退、「资料整理」归 imaging 第三页签追认、看板三分区口径统一（P2-2）。修完可在 DESIGN-SESSION/SIGNOFF 留痕签认。
- **G2（HTML 签认）**：红线实现层可背书——探针独立复跑全绿且构建方自报数字逐项复现（70 页签 / 0 禁词 / 0 溢出 / 一图秀四必查件 / 翻面 / 档案切换 / AI 边界），双档案空态诚实，导出两区不合并。**前提**：P1-1 清零、P2-1 字号三档落地（或写明原型层偏离理由）、P2-4 fork 清理归零（含 manifest 条目名，防重跑复发）、P2-2 文档同步。G1 未签认前不进入任何生产代码（22 号闸口顺序）。

## 五、缺口（如实保留，不阻断探索）

1. **G1 签认留痕未建**：DESIGN-SESSION.md / SIGNOFF-*.md 不存在，DEV-PLAN G1 行 ⏳；G2 材料先行属「待审」状态而非既成事实（阶段正常）。
2. **0 真实访谈**：H1–H6 全悬空，S01–S14 为假设；6–10 个中国家庭访谈回填前不得当已确认需求（文档纪律已立）。
3. **中文指南原件未取得**：CSCO 2025 肾癌分册仅公开摘录（页码待核）、AJCC 第 8 版页码待核、WHO/ISUP 出处待核——「任一未取得前不写按最新指南设计」纪律已立，须逐项销号。
4. **中国获批药物清单未逐条核实**（NMPA）：NCCN/EAU 列的不等于中国获批（与 P1-3 同源）。
5. **试验采集覆盖缺口**：ChiCTR 与 ICTRP 两通道 FAILED（721 不能称「中国肾癌试验全量」）、单来源 200 条上限、离线语料无肾癌覆盖——已在 CLINICAL-DATA §3 如实列出；语料过宽问题见 P1-2。
6. **schema/draft 未建**（Phase1 允许）：T 断言（无 risk_level 计算列 / 超声无判读列）、三出口单测、check-wording 词族、CTCAE 阈值表均留 M5/M6 兑现——本审查只能在原型层 + 0001 表结构层背书。
7. **支持资源/病友组织未核实**：出行与资源四行占位、中国患者组织可触达性待核实；「不推荐医院/机构/不排名」纪律已在界面。
8. **照护者代记（作者身份列）延后 0002+**：USER-RESEARCH 轴 6 已注明，但未进 G1 范围文档（P2-9）。
9. **品牌资产待拍板**：`assets/brand/xyb-logo.png` 为家族通用青绿吉祥物，与 D1 绛莓红 #A3455C 品牌色不一致；原型未引用该图（用 CSS 字标，即 P1-1 处）——品牌标最终形态（字标/吉祥物/色）需 G1 决定；localStorage 键前缀、消息类型等 M5 移植项在册。
10. **`npm run check` 2 条 warnings 未清**：cordis patch 的 config.root 未在 Config 声明（需确认服务端真的读它）、peer 范围与 API 签名需装机前另行核验——属 M6/M7 事项。

---

## 六、修订记录（R1 问题逐条处理，2026-10-24 回填）

处理原则：P1 三条全部按建议执行；P2 九条中 P2-1/P2-2/P2-3/P2-4/P2-5/P2-6/P2-7/P2-8/P2-9 全部落地，
每条附可复跑证据。**以下修订都发生在同一工作日内、同一版本（0.2.0），G1 签认前完成。**
修订后 app.js sha256 前缀 `27da4d1eeb5e7787`（R1 审的是 `b792fb7720260d0b`）。

| # | 处理 | 落点（文件） | 复跑证据 |
| --- | --- | --- | --- |
| P1-1 | `.brand.no-mark::before` 内容「胃」→「肾」，与 favicon 一致 | style.css | probe 截图 10 张重出，docs/shots/ 覆盖；无「胃」字符残留（grep 0 命中） |
| P1-2 | 取建议 ②（保留语料改口径）。**先自数再改**：721 条按标题分层为严格肾癌词 68 / 宽词带入非肾癌表述 31 / 生物等效性 149 / 其余 473；演示 10 条逐条核对均在 68 内。notice、设置弹窗、AI 上下文、关于弹窗四处改写；CLINICAL-DATA §3 补缺口 3、§5 收紧选样范围 | app.js（notice/settings/About/PAGE_CONTEXT）；docs/CLINICAL-DATA-2026.md | 分层数字可用 `node -e` 对 trials-2026.jsonl 复数（脚本内正则已写在修订说明）；探针 required 全过 |
| P1-3 | 取建议 ①：治疗线序卡与用药周期表下方各加获批状态未核实说明（点名演示用药帕博利珠单抗、阿昔替尼）；DEV-PLAN 风险 3 补落地记录；试验标题里的药名属登记原文，与该风险无关已注明 | app.js（vTreatment/vTox）；docs/DEV-PLAN.md | probe 70 组合走查含这两页；禁词 0 |
| P2-1 | 字号三态：CSS `body.large/xl` 改 `calc(15px * 1.15/1.32)`；按钮三态循环 normal→large→xl；DEV-REQUIREMENTS §二 补原型落地范围注解（组件级乘法体系属 M6） | style.css / index.html / app.js / DEV-REQUIREMENTS | probe 无回归；窄宽 0 溢出 |
| P2-2 | 范围账四份同步：DEV-REQUIREMENTS R1/D2 改写为「DIFF-MATRIX 定 10×33，交付 11×34」并附算式；DIFF-MATRIX §二 加对账块 + §四 补决策点 7/8；PATIENT-FLOW 页面树加对账段；DEV-PLAN M4 算式原文保留 | DEV-REQUIREMENTS / DIFF-MATRIX / PATIENT-FLOW / DEV-PLAN | 文档互引一致（30 + 3 + 1 = 34 两处算式相同） |
| P2-3 | ① Bosniak 解释卡落「影像与报告 · 影像时间轴」（只解释不判读，出处 1986 首版/2019 更新，页码待核）；② 单点文案落 sparkline + chartSVG 两处；③ demo B 加单点指标 TSH（AS 路径体检查过一次）；④ SCENARIOS 补孤儿页签对照表（7 页签依据收口，不新编场景号） | app.js（vImaging/sparkline/chartSVG）；demo/build-demo-data.mjs；docs/SCENARIOS.md | 探针新增 single/sparkSingle 断言：note=true / dots=1 / lines=0 / flipped=true，全过 |
| P2-4 | fetch 脚本用法示例与 manifest 条目名 thyroid→kidney（含磁盘 manifest.json 条目名原地修正，哈希未变）；CSS 死规则 45 条清理、deauville 注释改名、头部注释改「家族骨架（结构母版为胃癌工作台）」——CSS 部分在修订批次前已完成 | scripts/fetch-kidney-trials-2026.mjs；research/kidney-cancer/manifest.json；style.css | `grep -rn thyroid scripts/ manifest.json style.css` = 0 命中；style.css 34339 B（fork 清理前 36542，后又加窄档与字号注释） |
| P2-5 | app.js FORBIDDEN 补「自动分级 / 风险评分」与探针 10 词对齐 | app.js | 两处词表 diff 为空；agentDemo 自检计数变 10 |
| P2-6 | `.work-grid.agent-narrow.agent-open` 300px CSS + renderAgent 加 class；DEV-REQUIREMENTS §二 补注解（拖拽/键盘/localStorage 属 M6） | style.css / app.js / DEV-REQUIREMENTS | 三档按钮 aria-pressed 与 grid class 同步（renderAgent 同一函数） |
| P2-7 | README 全量重写（目的/人群/独特价值/功能清单/打开方式/诚实口径/明确未做/PR 与脚手架/截图/感谢）；CHANGELOG 补 0.2.0（M1–M5 全记录）；VERSION/package.json/app.js 三处 0.1.0→0.2.0 | README.md / CHANGELOG.md / VERSION / package.json / app.js | `npm run check` 版本一致通过；check-workbench-package staticPass |
| P2-8 | demo B 胸部 CT 节奏行改「同上节奏（按腹部节奏类推）」，来源列写明 CSCO §7 该段原文针对腹部影像、胸部未单列 | demo/build-demo-data.mjs | demo:data 重跑生成；B 档案 review 随访日历页可见 |
| P2-9 | DEV-REQUIREMENTS §四 补「照护者代记延后 M6」与「AI 面板拖拽未做」两条 | DEV-REQUIREMENTS | §四 现有 8 条未做项 |
| （附） | 检查链全链复跑：demo:data（25 指标/95 数据点/10 试验）→ check:schema ✓ → check:demo ✓（21 表/158 列）→ probe:proto ok=true（70 页签/0 禁词/0 溢出/单点断言过）→ npm run check ✓（2 条 starter warnings 同前） | — | 上述命令退出码全部 0 |
| （附） | `npm run audit` 22/30 通过 · 8 失败：lib/version.js、lib/layout.js、customFrame、check 链四项（单测/版本一致/schema/文案红线）、test 用例——全部属 M6 结构件，G1 范围外，已记入 DEV-PLAN 待办 | docs/DEV-PLAN.md | audit 输出原样贴存 |

**遗留（转 G1 拍板，不阻断签认流程）**：① 范围两问（临床研究独立成页、资料整理页签）见 DIFF-MATRIX §四 决策点 7/8；
② 品牌标最终形态（CSS 字标 vs assets/brand/xyb-logo.png）见 §五第 9 条；③ §五 其余缺口（访谈/指南原件/NMPA/两通道/照护者身份列）原样保留。
