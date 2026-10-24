-- 0001_initial.sql · 小肾宝 RenalPal 肾癌工作台（slice 1）
--
-- 来源：`demo/build-demo-data.mjs` 里那份 CREATE TABLE 清单。列顺序与类型逐条照抄，
-- 保证生成器里的 INSERT 与本文件一一对应；改一处就要改两处。
--
-- 与生成器唯一的结构差异是刻意的，改前先看：
-- `schema_migrations` 是迁移台账，生成器不管它，只有 dsh/store.js 的 migrate() 用
-- CREATE TABLE IF NOT EXISTS 建（台账必须先于迁移存在，写在迁移里会"自己建自己"）。
--
-- 与样板（胃癌）的差异：胃癌的 molecular / perioperative_rows / meal_log / dumping_rows /
-- supplement_rows / peritoneal_rows / endoscopy_rows / hp_rows 八张表换成肾癌的
-- pathology_rows / staging_rows / surgery_rows / contra_rows / as_rows / lines_rows /
-- imdc_rows / symptom_rows / genetics_rows / question_rows 十张表；
-- 保留家族通用八张（subjects / metrics / metric_points / events / rhythm / cycles /
-- viewpoints / trials）+ 事实四层里的 documents / candidate_fields / demo_meta。
--
-- 排序：`events` 没有 ord 列（生成器原本就没写），读取时按 rowid 升序，与插入顺序一致；
-- 其余「一组多行」的表都按 ord 升序。**复合主键表裸 SELECT * 会按索引字母序返回，
-- 必须显式 ORDER BY rowid**（metrics 是 (profile_key, key) 复合主键，gastric 踩过一次）。
--
-- 四契约在本 schema 的落点（缺一不可，验收见 docs/SCHEMA.md §3）：
-- ① 看法恒不为结论：viewpoints 全表**没有 is_conclusion 列**——不是默认 0，是没有这一列；
-- ② 空 ≠ 阴性（肾癌落点）：乳腺「四点位」概念在本病种无对应物（肾是成对器官但不对称记录），
--    原则落在 genetics_rows.status（未检测 / 已检测分列）、as_rows.size_text（未记录 / 有原文分列）、
--    metric_points.v_num/v_text（缺值存 NULL，不存 0、不存 "阴性"）；
-- ③ 更正只新增版本：as_rows 每次影像是新行（旧行不动）；lines_rows 换方案是新行
--    （line_no 递增），**没有任何 UPDATE 路径**——读模型只 SELECT；
-- ④ 事实四层不合并：documents（原件）/ candidate_fields（候选）/ metric_points（已确认记录）/
--    events（事件轴）四张表各自独立，候选不许并进记录表。
--
-- ×ULN 契约：metrics 的 band_low/band_high 存**这张化验单自带的参考区间**，可空；
-- 分级时缺上限返回 needsUln，不拿成人通用上限凑倍数（"下限可以借，上限不能借"）。

CREATE TABLE subjects (
  profile_key       TEXT PRIMARY KEY,
  name              TEXT,
  sex               TEXT,
  age               INTEGER,
  meta              TEXT,
  headline          TEXT,
  stage             TEXT,
  mindset           TEXT,
  dash_keys         TEXT,
  path              TEXT,
  activity          TEXT,
  family_talk       TEXT,
  pathology_title   TEXT,
  staging_title     TEXT,
  surgery_title     TEXT,
  contra_title      TEXT,
  as_title          TEXT,
  lines_title       TEXT,
  imdc_title        TEXT,
  tox_title         TEXT,
  genetics_title    TEXT,
  rhythm_title      TEXT,
  question_title    TEXT
);

CREATE TABLE metrics (
  profile_key TEXT,
  key         TEXT,
  name        TEXT,
  unit        TEXT,
  cat         TEXT,
  color       TEXT,
  dec         INTEGER,
  kind        TEXT,
  band_low    REAL,
  band_high   REAL,
  note        TEXT,
  PRIMARY KEY (profile_key, key)
);

CREATE TABLE metric_points (
  profile_key TEXT,
  metric_key  TEXT,
  d           TEXT,
  v_num       REAL,
  v_text      TEXT,
  src         TEXT,
  ord         INTEGER,
  PRIMARY KEY (profile_key, metric_key, d, ord)
);

CREATE TABLE events (
  profile_key TEXT,
  d           TEXT,
  label       TEXT
);

-- 通用节奏表：随访与监测节奏的**引用原文**。freq 存指南原文，guideline 存出处
-- （机构+版本+小节；原件未取得前小节后不写页码）。next 是参考节点，不是计划、不发提醒。
CREATE TABLE rhythm (
  profile_key TEXT,
  item        TEXT,
  freq        TEXT,
  guideline   TEXT,
  next        TEXT,
  ord         INTEGER
);

-- 治疗周期：IO 输注日期 / TKI 周期起止。肾癌晚期每 6~12 周评估疗效，周期日期是骨架。
CREATE TABLE cycles (
  profile_key TEXT,
  name        TEXT,
  date        TEXT,
  drugs       TEXT,
  status      TEXT,
  done        INTEGER,
  ord         INTEGER
);

-- 治疗线序（SPEC S10）：换方案 = 新增行。line_no 递增，不覆盖旧行（契约③）。
-- 没有「方案优劣」字段，没有 score 列。
CREATE TABLE lines_rows (
  profile_key TEXT,
  line_no     INTEGER,
  name        TEXT,
  detail      TEXT,
  start       TEXT,
  end         TEXT,
  status      TEXT,
  src         TEXT,
  ord         INTEGER
);

-- 病理条目（SPEC S01/S02）：kind 两态——'row' 已核实的病理条目 / 'gap' 缺项。
-- 缺项单列，不与已核实条目混排；未检测不得补「阴性」。
-- a 取条目名（组织学分型 / WHO/ISUP 分级 / 肉瘤样分化 / 切缘状态 / 肿瘤坏死），b 取报告原文。
CREATE TABLE pathology_rows (
  profile_key TEXT,
  kind        TEXT,
  a           TEXT,
  b           TEXT,
  d           TEXT,
  institution TEXT,
  ord         INTEGER
);

-- 分期记录（SPEC S03）：TNM 原文照抄，system 记分期体系（AJCC 第 8 版）。
-- **没有分期计算列**——界面不出现「分期」字样用于分型语境（DIFF-MATRIX 决策 1）。
CREATE TABLE staging_rows (
  profile_key TEXT,
  d           TEXT,
  tnm         TEXT,
  system      TEXT,
  source      TEXT,
  note        TEXT,
  ord         INTEGER
);

-- 手术档案（SPEC S05）：kind 六选一（肾部分切除 / 根治性肾切除 / 消融-射频 /
-- 消融-冷冻 / 消融-微波 / 活检）。没有「术式优劣」字段。
CREATE TABLE surgery_rows (
  profile_key TEXT,
  d           TEXT,
  kind        TEXT,
  extent      TEXT,
  recon       TEXT,
  institution TEXT,
  note        TEXT,
  ord         INTEGER
);

-- 对侧肾与孤立肾记录（SPEC S07）：item 如「对侧肾状态」「孤立肾」「慢性肾病」。
-- value 存原文；「未记录」与「正常」必须能分开（契约②）。
CREATE TABLE contra_rows (
  profile_key TEXT,
  d           TEXT,
  item        TEXT,
  value       TEXT,
  src         TEXT,
  ord         INTEGER
);

-- 主动监测影像记录（SPEC S08）：一行一次影像，并列展示。
-- **没有 size_delta 列、没有 growth 列**——产品不算生长速度、不设「该手术了」阈值
-- （DEV-REQUIREMENTS 硬约束 23②；DIFF-MATRIX 决策 3）。
CREATE TABLE as_rows (
  profile_key TEXT,
  d           TEXT,
  method      TEXT,
  size_text   TEXT,
  location    TEXT,
  institution TEXT,
  src         TEXT,
  ord         INTEGER
);

-- IMDC 危险度分层（SPEC S11）：**只记录医生判定的分层原文**。
-- 表里**没有 score 列、没有 criteria_met 计数列**——这是刻意的：产品不打分，
-- IMDC 是预后模型不是预测工具（Heng 2009, JCO），这句话要上界面。
-- criteria 列存六项标准的原文引用（出处同上），不是患者的勾选结果。
CREATE TABLE imdc_rows (
  profile_key TEXT,
  d           TEXT,
  level       TEXT,
  criteria    TEXT,
  doctor      TEXT,
  institution TEXT,
  note        TEXT,
  ord         INTEGER
);

-- 副作用记录（SPEC S13）：ctcae_text 存**用户照抄的** CTCAE 分级原文（或医生原话），
-- 不是产品判定的级别——所以列名叫 ctcae_text 不叫 grade。
-- 症状与同日血压/甲功/尿蛋白在界面并置不并轴（DEV-REQUIREMENTS 硬约束 19）。
CREATE TABLE symptom_rows (
  profile_key TEXT,
  d           TEXT,
  symptom     TEXT,
  ctcae_text  TEXT,
  note        TEXT,
  ord         INTEGER
);

-- 遗传与家系（SPEC S04）：private 默认 1（私密层），与家族 family_rows 同口径。
-- status 四态：ok 已检测 / na 未检测 / warn 需关注 / pending 待出——未检测一律写「未检测」，
-- 不写「阴性」（契约②）。导出白名单不含本表。
CREATE TABLE genetics_rows (
  profile_key TEXT,
  member      TEXT,
  relation    TEXT,
  finding     TEXT,
  status      TEXT,
  institution TEXT,
  d           TEXT,
  private     INTEGER DEFAULT 1,
  ord         INTEGER
);

-- 就诊问题清单（S09/S13 出口）：用户自己的问题 + 医生回答的原文。
-- 产品不生成答案——「这一句需要问你的医生」的落点就是这张表。
CREATE TABLE question_rows (
  profile_key TEXT,
  d           TEXT,
  q           TEXT,
  asked       INTEGER,
  answer      TEXT,
  ord         INTEGER
);

CREATE TABLE viewpoints (
  profile_key TEXT,
  d           TEXT,
  mood        TEXT,
  text        TEXT,
  ord         INTEGER
);

-- 试验演示行：真实登记摘录。登记状态不是入组资格，页面必须带免责。
CREATE TABLE trials (
  nct_id   TEXT PRIMARY KEY,
  title    TEXT,
  phase    TEXT,
  status   TEXT,
  sponsor  TEXT,
  url      TEXT
);

CREATE TABLE demo_meta (
  k TEXT PRIMARY KEY,
  v TEXT
);

-- 事实四层之一：原件（导入的文件）。
CREATE TABLE documents (
  profile_key TEXT,
  id          TEXT,
  name        TEXT,
  date        TEXT,
  type        TEXT,
  status      TEXT,
  ord         INTEGER,
  PRIMARY KEY (profile_key, id)
);

-- 事实四层之一：候选（解析出来待核对的字段）。候选不许并进 metric_points（契约④）。
CREATE TABLE candidate_fields (
  profile_key TEXT,
  id          TEXT,
  name        TEXT,
  value       TEXT,
  source      TEXT,
  status      TEXT,
  ord         INTEGER,
  PRIMARY KEY (profile_key, id)
);

-- 迁移台账 schema_migrations 不在这里建：它由 dsh/store.js 的 migrate() 在跑任何迁移之前
-- 用 CREATE TABLE IF NOT EXISTS 建好（台账必须先于迁移存在，写在迁移里会"自己建自己"）。
-- 本文件只负责业务表。

CREATE INDEX idx_points ON metric_points (profile_key, metric_key);
