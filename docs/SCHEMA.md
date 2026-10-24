# 数据主体—关系—表 · 肾癌 v0.1

日期：2026-10-24。权威文件：`schema/0001_initial.sql`（结构，sha256 见 `schema/freeze-contract.md`）+ 本文件（语义与边界）。
**改结构只能新增 `0002_*.sql`**；本文件随结构变更同步。

## 1. 表清单（21 张）

### 1.1 家族通用（8）

| 表 | 记什么 | 边界 |
| --- | --- | --- |
| `subjects` | 档案头（姓名/性别/年龄/一句话/路径/心态）+ 每节标题列 | 一节一个 `*_title` 列，缺列 `check:columns` 会红 |
| `metrics` | 指标字典（名称/单位/类/色/小数位/kind/参考区间 band_low·band_high） | 参考区间可空；**缺上限时分级返回 needsUln，不借通用上限** |
| `metric_points` | 指标数值点（v_num / v_text 二选一，缺值 NULL） | NULL ≠ 0 ≠ 「阴性」；复合主键裸 SELECT 必须 `ORDER BY rowid` |
| `events` | 事件轴（确诊/手术/方案开始…） | 无 ord 列，按 rowid；只画竖虚线，不做判读 |
| `rhythm` | 随访与监测节奏的**引用原文** + 参考节点 | 节点=起点+k×间隔；不发提醒、不排计划 |
| `cycles` | 治疗周期（IO 输注/TKI 周期起止） | 日期骨架，不是疗效判定 |
| `viewpoints` | 看法（原话） | **全表无 is_conclusion 列**（契约①） |
| `trials` | 试验登记摘录 | 登记 ≠ 有效 ≠ 可入组；页面带免责 |

### 1.2 事实四层（3）

| 表 | 层 | 边界 |
| --- | --- | --- |
| `documents` | 原件 | 导入的文件；sha256/rel_path 等列 0002 再补（MinerU 链路 M6+） |
| `candidate_fields` | 候选 | 解析待核对；**不许并进 metric_points**（契约④） |
| `demo_meta` | 演示元信息 | 只 demo 用 |

### 1.3 肾癌专属（10）

| 表 | 记什么 | 场景 | 关键边界 |
| --- | --- | --- | --- |
| `pathology_rows` | 病理条目（分型/分级/肉瘤样/切缘/坏死） | S01/S02 | kind='row'/'gap' 两态；未检测写「未检测」不写「阴性」 |
| `staging_rows` | TNM 分期原文 | S03 | 无分期计算列；「分期」字样不用于分型语境 |
| `surgery_rows` | 手术方式+日期+机构 | S05 | kind 六选一；无术式优劣字段 |
| `contra_rows` | 对侧肾/孤立肾/CKD 原文 | S07 | 「未记录」与「正常」必须可分（契约②） |
| `as_rows` | AS 影像（日期/方式/大小原文） | S08 | **无 size_delta / growth 列**——不算生长速度 |
| `lines_rows` | 治疗线序（线别/方案/起止） | S10 | 换方案=新增行（契约③）；无方案优劣字段 |
| `imdc_rows` | IMDC 分层原文（医生判定） | S11 | **无 score 列**——产品不打分；六项标准原文并列 |
| `symptom_rows` | 副作用症状+照抄的 CTCAE 原文 | S13 | 列名 ctcae_text 不叫 grade；与同日化验并置不并轴 |
| `genetics_rows` | 遗传与家系成员检测状态 | S04 | private 默认 1；导出白名单不含本表 |
| `question_rows` | 就诊问题+医生回答原文 | S09/S13 | 产品不生成答案；这是「问医生」出口的落点 |

## 2. 关系

```
subjects 1─n metric_points / events / rhythm / cycles / viewpoints
subjects 1─n pathology_rows / staging_rows / surgery_rows / contra_rows
subjects 1─n as_rows / lines_rows / imdc_rows / symptom_rows / genetics_rows / question_rows
subjects 1─n documents / candidate_fields / trials(demo) / demo_meta(demo)
metrics   (profile_key, key) ── metric_points.metric_key    # 复合主键，注意 ORDER BY rowid
```

## 3. 四契约验收（逐条可验）

| 契约 | 落点 | 怎么验 |
| --- | --- | --- |
| ① 看法恒不为结论 | `viewpoints` 无 `is_conclusion` 列 | `grep is_conclusion schema/` 为空 |
| ② 空 ≠ 阴性 | `metric_points.v_num` NULL；`genetics_rows.status`='na'；`as_rows.size_text` 可空 | 单测：留空存 NULL、明确「没有」存「没有」，两者可区分 |
| ③ 更正只新增版本 | `as_rows` / `lines_rows` 只 INSERT | 单测：同日两条并存，ord 递增 |
| ④ 事实四层不合并 | documents / candidate_fields / metric_points / events 四张独立表 | 候选表的行数不进 metric_points（导出/读模型断言） |

## 4. ×ULN 与分级契约

- `metrics.band_low/band_high` 存**化验单自带**的参考区间，可空；
- 缺上限 → `needsUln`（界面虚线徽章「需参考上限」），**不借成人通用上限**；
- 单位不对 → `needsUnit`（「请按毫秒填写」式提示），不替用户换算；
- 三种「没有级别」界面可区分：正常（无徽章）/ 缺上限（虚线徽章）/ 单位待确认（虚线徽章）。
- **首版（G1 范围）只做「对照」不做「分级」**：CTCAE 分级模块（dsh/ctcae.js）列入 M6+，
  阈值表以 `assets/reference/ctcae/` 的 PDF 为准，冲突时改代码（starter docs/23）。

## 5. 演示数据（唯一来源）

`demo/build-demo-data.mjs` 同时产出 `demo/demo-data.sqlite` 与 `prototypes/v0.2/demo-data.js`；
被 import 时只返回 `buildDemoProfiles()` 纯数据，不碰磁盘。2 档案 × 6 个月窗口。
`npm run check:columns` 执行本迁移后与 js 逐列比对。

## 6. 隐私与导出（M6 落地，先记边界）

- `genetics_rows.private` 默认 1；导出白名单不含本表、不含 `viewpoints`（照 attr/家族做法，
  私密层「按构造排除」而不是「读了再过滤」）。
- 资料目录由用户显式选定；主目录/桌面/下载根目录一律拒绝，不替用户猜。
