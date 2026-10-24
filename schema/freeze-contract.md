# 迁移冻结合同（小肾宝 RenalPal）

`schema/` 下的迁移一旦对外发布就不许再改：改历史迁移 = 两台机器的库结构不一样 = 数据不可复现。
本文件记每个迁移文件的 sha256，由 `scripts/check-schema.mjs` 逐条比对（`npm run check:schema`）。

要改结构：**新增** `NNNN_name.sql`，并把新文件与哈希追加到下表的末尾。改旧文件会被检查拦下。

| 文件 | sha256 | 说明 |
| --- | --- | --- |
| `0001_initial.sql` | aef92296cad14ef7b8195b78ae7fcc14ed9f274323a7ee9c826288043175370e | 首版 21 张表：家族通用 8 张（subjects / metrics / metric_points / events / rhythm / cycles / viewpoints / trials）+ 事实四层 3 张（documents / candidate_fields / demo_meta）+ 肾癌专属 10 张（pathology_rows / staging_rows / surgery_rows / contra_rows / as_rows / lines_rows / imdc_rows / symptom_rows / genetics_rows / question_rows） |

## 冻结的含义（三条，缺一不可）

1. **不许改字节**：0001 的 sha256 记在这里，改一个字符 `check:schema` 就红。
2. **只增不改**：加表加列一律新增 `0002_*.sql`；加列用 `ALTER TABLE ... ADD COLUMN`，
   不加 NOT NULL、不给默认值（现有行的既有数据不会被新约束打死）。
3. **表数同步**：本文件、`docs/SCHEMA.md`、`demo/build-demo-data.mjs` 三处的表清单必须一致；
   `check:schema` 只验哈希，表数与列一致性由 `check:columns` 验。

## 已知的、刻意不做的（不是漏做）

- **`viewpoints` 没有 `is_conclusion` 列**——契约①「看法恒不为结论」靠表结构保证，不靠默认值。
- **`imdc_rows` 没有 score 列**——契约「产品不打分」靠表结构保证；IMDC 分层只记医生给的原文。
- **`as_rows` 没有 size_delta / growth 列**——「不算生长速度、不设手术阈值」靠表结构保证。
- **`symptom_rows.ctcae_text` 不叫 grade**——CTCAE 分级只存用户照抄的原文，不是产品判定的级别。
- **没有「处理建议」类列**（任何表）——建议性字段一律不进 schema；文案红线另有 `check:wording` 把着界面层。
- **`genetics_rows.private` 默认 1**——照护与遗传信息属私密层；导出白名单（dsh/export.js，M6 建）不含本表。
