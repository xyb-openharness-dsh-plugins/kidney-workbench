# 临床数据（CLINICAL-DATA）· 肾癌 2026

日期：2026-10-24。工具：unified-trial-mcp v0.3.1（`~/Downloads/unified_search_trials`，MCP stdio 入口）。
采集脚本：`scripts/fetch-kidney-trials-2026.mjs`（`--dry-run` 支持；同口径重跑条数可复现）。
资料包：`research/kidney-cancer/`（manifest.json / trials-2026.jsonl / kidney_cancer_trials_2026.sqlite）。

## 1. 总量与一致性

| 口径 | 数 |
| --- | --- |
| manifest.recordCount | **721** |
| jsonl 行数 | 721 |
| sqlite `trials` 行数 | 721 |
| 合并前记录数 | 721（无跨来源同登记号重复） |
| bySource | chinadrugtrials 363 · ctv 358 |

一致性断言在脚本末尾硬编码：三处不一致直接 `process.exit(1)`。本次通过。

## 2. 逐来源终态（如实记录，不粉饰）

| 来源 | 终态 | 说明 |
| --- | --- | --- |
| `chinadrugtrials`（CDE） | SUCCESS | 中文检索词命中（肾癌 35 / 肾细胞癌 120 / 肾透明细胞癌 8 / 转移性 345 条并入） |
| `ctv`（ClinicalTrials.gov 深度索引） | SUCCESS | 英文检索词命中（RCC 200 / renal cancer 200 / kidney cancer 142 / mRCC 345 条并入，单来源上限 200 生效） |
| `xyb_chinadrugtrials_archive` | SUCCESS / NO_RESULTS | 胰腺癌归档通道在线，但肾癌查询无命中 |
| `chictr_online`（ChiCTR 实时） | **FAILED** | 在线通道故障（与甲状腺癌采集同日同现象）；**未取得 ChiCTR 数据** |
| `ictrp`（WHO ICTRP） | **FAILED** | 同上；**未取得 ICTRP 数据** |
| `chictr_pancreatic_archive` | NEEDS_SETUP | 离线语料仅胰腺癌覆盖，肾癌**无离线语料**，按「未配置」终态如实记录 |
| `ctv_index` 离线 | 未使用 | 同上 |

## 3. 已知缺口（不许写成「已查过」）

1. **ChiCTR 与 WHO ICTRP 两个通道 FAILED**：中国登记的试验可能只在这两个库里有，
   本次资料包**不能**称为「中国肾癌试验全量」。修好通道后应按同口径重跑。
2. **单来源 200 条上限**：`metastatic renal cell carcinoma` 命中 345 条但只取回 200，
   后续通道同理——manifest 的 perSourceLimit 记着这件事。
3. **宽口径检索带入大量非肾癌记录（2026-10-24 自数补录）**：8 个关键词的宽检索共 721 条，
   逐条自数标题后分层为——标题明确含肾癌 / RCC 表述 **68 条**；肾功能 / 肾病 / 移植 /
   尿路上皮等非肾癌表述 31 条；标题为生物等效性研究 149 条；其余 473 条为实体瘤早期
   试验、其他瘤种试验等。登记记录只有标题级字段（无适应症字段），**无法逐条判定适应症**，
   因此不做剔除、原样保留，但在界面 notice 与设置弹窗里如实写明这个分层。
   换言之：721 是「宽检索命中量」，不是「肾癌试验量」，文档与界面都不许写成后者。
4. **离线语料无肾癌覆盖**：自建语料按 `docs/corpus-lifecycle.md` 流程另做，不算本轮缺口已补。
5. **未做医学核对**：本资料包是登记信息摘录，**没有**任何疗效/安全性整理。

## 4. 诚实边界（三条，界面与文档通用）

- **登记 ≠ 有效 ≠ 安全 ≠ 可入组**；状态一律写「登记状态，未核实」。
- 「0 条结果」必须带该来源自己的覆盖声明，绝不把「没查到」写成「不存在」。
- 试验标题是登记标题的原文或摘要，**不做临床价值排序**、不做「哪个更好」比较。

## 5. 演示层用法（G1 范围）

`prototypes/v0.2/demo-data.js` 的 `trials` 数组只放**摘录的演示行**（从 721 条里选样），
全量资料包不进前端快照（字节数与时效都不适合）。选样原则写在生成器注释里：
覆盖晚期一线（IO+IO / IO+TKI）、辅助治疗、消融、AS 四类语境即可，不追求全。

选样范围 2026-10-24 收紧为：**只从 §3 自数出的 68 条「标题明确含肾癌 / RCC 表述」里选**，
10 条演示行逐条核对过标题，全部落在这 68 条内；生物等效性、其他瘤种、实体瘤早期
试验一律不进演示层。界面 notice 同步写明 68 / 721 的分层，不把宽检索命中量说成肾癌试验量。
