/* 小肾宝 RenalPal · 演示数据生成器（唯一数据源）
   产出：demo/demo-data.sqlite（可 SQL 查询）+ prototypes/v0.2/demo-data.js（原型只读数据层）
   原则：全部患者数据为虚构模拟；试验表为真实登记摘录（CDE 通道，状态未核实）。
   运行：node demo/build-demo-data.mjs —— 改数据只改这里，两个产物一起重生成。

   两种用法：
   1. 直接跑（CLI）：写上面两个产物，行为与以前完全一致；
   2. 被 import：只拿到 `buildDemoProfiles()` 返回的纯数据，一个字节都不碰磁盘
      —— 开发版的 `dsh/demo.js` 靠它把演示档案写进本机 sqlite，
      因此"演示数据"仍然只有这一份定义，不会长出第二个数据源。

   与样板（胃癌）的结构差异，改前先看：
   - 胃癌的 molecular / perioperative / meal_log / dumping / supplement / peritoneal /
     endoscopy / hp 八块换成肾癌的 pathology / staging / surgery / contra / as / lines /
     imdc / symptom / genetics / question 十块；
   - **没有肿瘤标志物**（肾癌无常规血清标志物）；指标字典换成肾功能（Cr/eGFR）、
     血象（IMDC 六项里的 Hb/PLT/NEU）、生化（ALT/AST/TBIL）、甲功（TSH/FT4，
     靶向治疗期间常查）、尿蛋白（TKI 语境）、血压（靶向副作用监测）；
   - 两个档案各走一条主路径：A = 晚期 mRCC 一线 IO+TKI（线序/IMDC/副作用）；
     B = 小肿块主动监测 AS（影像大小并列/节奏引用/空态诚实）。
     抽血节点和数值走势各写各的，不能共用一份数组。 */
import { DatabaseSync } from 'node:sqlite';
import { writeFileSync, realpathSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const P2 = join(ROOT, 'prototypes/v0.2');

/* ---------- 基础数据 ---------- */
const pts = (arr) => arr.map(([d, v, src]) => ({ d, v, src }));
const CAT_COLOR = {
  肾功能: '#8c3a4a', 血象: '#a3455c', 生化: '#9a6410', 电解质: '#2f6f66',
  甲功: '#2a7f8c', 尿液: '#33608f', 体征: '#6b4c8c', 治疗毒性: '#c2551f',
};
const cat = (c) => ({ cat: c, color: CAT_COLOR[c] });
/* 按指标 key 独立配色：一图秀最多 4 条同屏，必须靠色相区分。
   原则：肾功能走绛莓红系（品牌同源），血象同色系深浅拉开，生化金、甲功青、
   尿液蓝、体征紫——同屏最常见的组合（Cr/eGFR/Hb/血压）跨色相拉开。 */
const KEY_COLOR = {
  cr: '#8c3a4a', egfr: '#b85c6e',
  hgb: '#a3455c', plt: '#c97b8a', neu: '#7e2f3d', wbc: '#c2687f',
  alt: '#9a6410', ast: '#b07c2a', tbil: '#8a5510',
  ca2: '#2f6f66',
  tsh: '#2a7f8c', ft4: '#5b9aa6',
  uacr: '#33608f', up_qual: '#5d84a8',
  bp_sys: '#6b4c8c', bp_dia: '#8c6baa',
  wt: '#7c5cbf',
  hfsr: '#c2551f', fatigue: '#b35a1e', diarrhea: '#d0784a',
};

/* 公共指标：A、B 各写一组。两档时间跨度相同（2026-04-20 → 2026-10-18），
   但临床路径不同——A 是"穿刺确诊 → 晚期一线 IO+TKI → 周期监测"，
   B 是"体检发现 → AS 观察 → 每季影像 + 基础化验"，抽血节点各写各的。 */
const labsA = () => [
  { key: 'cr', name: '肌酐（Cr）', unit: 'μmol/L', dec: 0, band: [59, 104], note: '不同医院参考区间不合并；本档案参考区间取市第一医院化验单', ...cat('肾功能'), points: pts([
    ['2026-04-20', 78, '穿刺前评估'], ['2026-05-06', 84, '一线第 1 周期前'], ['2026-06-17', 91, '周期 3 前'],
    ['2026-07-29', 88, '周期 5 前'], ['2026-08-19', 86, '周期 6 前'], ['2026-10-20', 83, '复诊']]) },
  { key: 'egfr', name: 'eGFR（CKD-EPI）', unit: 'mL/min/1.73m²', dec: 0, band: [90, null], note: '低于参考下限时怎么处理由医生定；本台只并列数值', ...cat('肾功能'), points: pts([
    ['2026-04-20', 92, '穿刺前评估'], ['2026-05-06', 86, '一线第 1 周期前'], ['2026-06-17', 80, '周期 3 前'],
    ['2026-07-29', 82, '周期 5 前'], ['2026-08-19', 84, '周期 6 前'], ['2026-10-20', 85, '复诊']]) },
  { key: 'hgb', name: '血红蛋白', unit: 'g/L', dec: 0, band: [130, 175], note: 'IMDC 六项之一；不同医院参考区间不合并', ...cat('血象'), points: pts([
    ['2026-04-20', 128, '穿刺前评估'], ['2026-05-06', 124, '一线第 1 周期前'], ['2026-06-17', 121, '周期 3 前'],
    ['2026-07-29', 119, '周期 5 前'], ['2026-08-19', 122, '周期 6 前'], ['2026-10-20', 125, '复诊']]) },
  { key: 'plt', name: '血小板', unit: '10⁹/L', dec: 0, band: [125, 350], note: 'IMDC 六项之一', ...cat('血象'), points: pts([
    ['2026-04-20', 212, '穿刺前评估'], ['2026-05-06', 205, '一线第 1 周期前'], ['2026-06-17', 218, '周期 3 前'],
    ['2026-07-29', 226, '周期 5 前'], ['2026-08-19', 231, '周期 6 前'], ['2026-10-20', 224, '复诊']]) },
  { key: 'neu', name: '中性粒细胞', unit: '10⁹/L', dec: 2, band: [1.8, 6.3], note: 'IMDC 六项之一', ...cat('血象'), points: pts([
    ['2026-04-20', 3.9, '穿刺前评估'], ['2026-05-06', 3.7, '一线第 1 周期前'], ['2026-06-17', 4.1, '周期 3 前'],
    ['2026-07-29', 3.8, '周期 5 前'], ['2026-08-19', 4.4, '周期 6 前'], ['2026-10-20', 4.0, '复诊']]) },
  { key: 'ca2', name: '校正钙', unit: 'mmol/L', dec: 2, band: [2.11, 2.52], note: 'IMDC 六项之一；上限取该院化验单', ...cat('电解质'), points: pts([
    ['2026-04-20', 2.31, '穿刺前评估'], ['2026-05-06', 2.34, '一线第 1 周期前'], ['2026-07-29', 2.38, '周期 5 前'],
    ['2026-10-20', 2.35, '复诊']]) },
  { key: 'alt', name: 'ALT', unit: 'U/L', dec: 0, band: [9, 50], note: '靶向/免疫期间的肝监测', ...cat('生化'), points: pts([
    ['2026-04-20', 26, '穿刺前评估'], ['2026-06-17', 34, '周期 3 前'], ['2026-08-19', 41, '周期 6 前'],
    ['2026-10-20', 33, '复诊']]) },
  { key: 'ast', name: 'AST', unit: 'U/L', dec: 0, band: [15, 40], note: '同上', ...cat('生化'), points: pts([
    ['2026-04-20', 22, '穿刺前评估'], ['2026-06-17', 27, '周期 3 前'], ['2026-08-19', 31, '周期 6 前'],
    ['2026-10-20', 26, '复诊']]) },
  { key: 'tbil', name: '总胆红素', unit: 'μmol/L', dec: 1, band: [3.4, 20.5], note: '同上', ...cat('生化'), points: pts([
    ['2026-04-20', 12.6, '穿刺前评估'], ['2026-08-19', 14.2, '周期 6 前'], ['2026-10-20', 13.1, '复诊']]) },
  { key: 'tsh', name: 'TSH', unit: 'mIU/L', dec: 2, band: [0.27, 4.2], note: 'TKI 常见甲减；CSCO 2025 §7 全身治疗随访含甲功', ...cat('甲功'), points: pts([
    ['2026-05-06', 2.15, '一线第 1 周期前'], ['2026-07-29', 6.8, '周期 5 前'], ['2026-08-19', 8.4, '周期 6 前'],
    ['2026-10-20', 7.9, '复诊']]) },
  { key: 'ft4', name: 'FT4', unit: 'pmol/L', dec: 1, band: [12, 22], note: '同上', ...cat('甲功'), points: pts([
    ['2026-05-06', 16.2, '一线第 1 周期前'], ['2026-08-19', 11.4, '周期 6 前'], ['2026-10-20', 11.8, '复诊']]) },
  { key: 'uacr', name: '尿白蛋白肌酐比（UACR）', unit: 'mg/g', dec: 1, band: [0, 30], note: 'TKI 蛋白尿语境；按该院化验单参考区间', ...cat('尿液'), points: pts([
    ['2026-05-06', 12.4, '一线第 1 周期前'], ['2026-07-29', 46.8, '周期 5 前'], ['2026-08-19', 52.3, '周期 6 前'],
    ['2026-10-20', 38.6, '复诊']]) },
  { key: 'bp_sys', name: '收缩压（家庭自测）', unit: 'mmHg', dec: 0, band: [90, 139], note: '家庭血压计早晨自测；TKI 高血压语境', ...cat('体征'), points: pts([
    ['2026-05-04', 128, '用药前'], ['2026-06-15', 138, '周期 3 期间'], ['2026-07-27', 149, '周期 5 期间'],
    ['2026-08-17', 152, '周期 6 期间'], ['2026-10-18', 141, '最近']]) },
  { key: 'bp_dia', name: '舒张压（家庭自测）', unit: 'mmHg', dec: 0, band: [60, 89], note: '同上', ...cat('体征'), points: pts([
    ['2026-05-04', 82, '用药前'], ['2026-06-15', 86, '周期 3 期间'], ['2026-07-27', 92, '周期 5 期间'],
    ['2026-08-17', 94, '周期 6 期间'], ['2026-10-18', 88, '最近']]) },
  { key: 'wt', name: '体重', unit: 'kg', dec: 1, band: null, note: '按同一台体重秤记录', ...cat('体征'), points: pts([
    ['2026-04-20', 71.5, '穿刺前'], ['2026-06-17', 70.8, '周期 3 前'], ['2026-08-19', 70.2, '周期 6 前'],
    ['2026-10-20', 70.6, '复诊']]) },
  /* 分类记录：症状原话（CTCAE 语境照抄医生原话，不是产品判级） */
  { key: 'hfsr', name: '手足皮肤反应', unit: '', dec: null, kind: 'grade', band: null, note: '只记录你的原话与医生查房原话，不做分级判断', ...cat('治疗毒性'), points: pts([
    ['2026-05-20', '指尖发红，碰热水明显', '周期 2 后自查'], ['2026-06-25', '医生查房原话：1 级，继续观察', '周期 3 后查房'],
    ['2026-08-10', '脱皮范围到指腹，按压不痛', '周期 6 后自查']]) },
  { key: 'fatigue', name: '乏力', unit: '', dec: null, kind: 'grade', band: null, note: '只记录你的原话', ...cat('治疗毒性'), points: pts([
    ['2026-05-28', '输注后两天只想躺着', '周期 2 后'], ['2026-07-30', '爬三楼要歇一次', '周期 5 后'],
    ['2026-10-18', '周期之间那两周还好', '最近']]) },
  { key: 'diarrhea', name: '腹泻', unit: '', dec: null, kind: 'grade', band: null, note: '只记录次数与你的原话', ...cat('治疗毒性'), points: pts([
    ['2026-06-25', '每日 2–3 次稀便', '周期 3 后'], ['2026-08-10', '每日 1–2 次', '周期 6 后']]) },
];

const labsB = () => [
  { key: 'cr', name: '肌酐（Cr）', unit: 'μmol/L', dec: 0, band: [45, 84], note: '女性参考区间（市第一医院化验单）；不同医院不合并', ...cat('肾功能'), points: pts([
    ['2026-04-21', 58, '体检发现后评估'], ['2026-07-21', 57, '半年复查'], ['2026-10-13', 59, '最近']]) },
  { key: 'egfr', name: 'eGFR（CKD-EPI）', unit: 'mL/min/1.73m²', dec: 0, band: [90, null], note: '只并列数值，不判断好坏', ...cat('肾功能'), points: pts([
    ['2026-04-21', 98, '体检发现后评估'], ['2026-07-21', 99, '半年复查'], ['2026-10-13', 97, '最近']]) },
  { key: 'uacr', name: '尿白蛋白肌酐比（UACR）', unit: 'mg/g', dec: 1, band: [0, 30], note: 'AS 期间的常规监测项之一', ...cat('尿液'), points: pts([
    ['2026-04-21', 8.2, '基线'], ['2026-10-13', 9.6, '最近']]) },
  { key: 'up_qual', name: '尿蛋白（定性）', unit: '', dec: null, kind: 'qual', band: null, note: '照抄尿常规报告原文；报告写"阴性"才记阴性，没查就不记', ...cat('尿液'), points: pts([
    ['2026-04-21', '阴性（报告原文）', '尿常规'], ['2026-10-13', '阴性（报告原文）', '尿常规']]) },
  { key: 'bp_sys', name: '收缩压（家庭自测）', unit: 'mmHg', dec: 0, band: [90, 139], note: '家庭血压计早晨自测', ...cat('体征'), points: pts([
    ['2026-04-21', 118, '基线'], ['2026-07-21', 122, '半年复查'], ['2026-10-13', 120, '最近']]) },
  { key: 'wt', name: '体重', unit: 'kg', dec: 1, band: null, note: '按同一台体重秤记录', ...cat('体征'), points: pts([
    ['2026-04-21', 56.2, '基线'], ['2026-07-21', 56.0, '半年复查'], ['2026-10-13', 56.1, '最近']]) },
];

/* ---------- 档案 A：晚期 mRCC，一线 IO+TKI（路径 A：一次真实就诊） ---------- */
const PROFILE_A = {
  meta: { name: '周先生', sex: '男', age: 62, meta: '62 岁 · 左肾透明细胞癌 · 双肺转移', headline: '晚期肾癌一线靶免治疗第 6 周期',
    stage: 'cT1bN0M1（双肺转移）', mindset: '手脚脱皮和血压最烦人；数值想留着复诊时逐条问医生。',
    dash_keys: ['cr', 'hgb', 'bp_sys'], path: ['左肾肿块', '穿刺活检', '透明细胞癌', '双肺转移', '一线 IO+TKI'],
    activity: '治疗间期能散步 20 分钟；输注当天乏力。', familyTalk: '想把肺上的结节和治疗线序讲给儿子听一次。' },
  titles: { pathology: '病理与分型', staging: '分期记录', surgery: '诊断与手术记录', contra: '对侧肾与基础肾',
    as: '主动监测影像', lines: '治疗线序', imdc: '危险度分层（医生判定）', tox: '副作用与症状', genetics: '家系肾相关记录',
    rhythm: '监测与随访节奏', question: '想问医生的问题' },
  pathology: [
    ['row', '组织学分型', '左肾透明细胞癌（ccRCC）', '2026-04-24', '市第一医院病理科'],
    ['row', 'WHO/ISUP 分级', '2 级', '2026-04-24', '市第一医院病理科'],
    ['row', '肉瘤样分化', '未见', '2026-04-24', '市第一医院病理科'],
    ['gap', '基因 / PD-L1 检测', '未检测；用药前是否补做由医生定', '', ''],
  ],
  staging: [['2026-04-22', 'cT1bN0M1（双肺转移）', 'AJCC 第 8 版', '胸腹增强 CT 2026-04-22', '临床分期；未经术后病理确认']],
  surgery: [['2026-04-20', '活检', 'CT 引导下左肾肿块穿刺活检（穿刺 2 针）', '—', '市第一医院介入科', '门诊完成，当日回家']],
  contra: [['2026-04-20', '对侧肾状态', '右肾形态与功能未见异常（超声原文摘录）', '泌尿外科超声 2026-04-20'],
    ['2026-04-20', '慢性肾病', '否认慢性肾脏病史', '门诊记录 2026-04-20']],
  as: [],
  lines: [[1, '帕博利珠单抗 + 阿昔替尼（一线）', 'IO + VEGFR-TKI：每 3 周静脉输注 + 每日口服', '2026-05-06', '', '进行中', '市第一医院肿瘤内科医嘱 2026-05-06']],
  imdc: [['2026-05-06', '中危（医生判定）',
    'IMDC 六项：KPS<80% / 距确诊<1 年 / 血红蛋白<正常下限 / 校正钙>正常上限 / 血小板>正常上限 / 中性粒细胞>正常上限；0 项低危、1–2 项中危、≥3 项高危（Heng 2009, J Clin Oncol）',
    '李医生', '市第一医院肿瘤内科', 'IMDC 是预后模型，不是预测工具；分层由医生判定，本工作台不打分']],
  cycles: [
    ['第 1 周期', '2026-05-06', '帕博利珠单抗 + 阿昔替尼', '已完成', true],
    ['第 2 周期', '2026-05-27', '帕博利珠单抗 + 阿昔替尼', '已完成', true],
    ['第 3 周期', '2026-06-17', '帕博利珠单抗 + 阿昔替尼', '已完成', true],
    ['第 4 周期', '2026-07-08', '帕博利珠单抗 + 阿昔替尼', '已完成', true],
    ['第 5 周期', '2026-07-29', '帕博利珠单抗 + 阿昔替尼', '已完成', true],
    ['第 6 周期', '2026-08-19', '帕博利珠单抗 + 阿昔替尼', '已完成', true],
    ['第 7 周期', '2026-11-04', '视 10-28 影像评估结果', '待定', false]],
  tox: [
    ['2026-05-20', '指尖发红，碰热水明显', '—', '周期 2 后自查'],
    ['2026-06-25', '手脚皮肤反应', '医生查房原话：1 级（CTCAE v5.0），继续观察', '周期 3 后查房'],
    ['2026-06-25', '腹泻', '每日 2–3 次稀便', '周期 3 后'],
    ['2026-08-10', '脱皮范围到指腹，按压不痛', '—', '周期 6 后自查'],
    ['2026-07-30', '乏力', '自述「爬三楼要歇一次」', '周期 5 后'],
  ],
  genetics: [['哥哥', '兄弟', '2024 年体检超声：右肾囊肿，未进一步检查', 'ok', '外院体检中心', '2024-11', 1]],
  questions: [
    ['2026-06-25', '手脚脱皮要不要减量？', 1, '医生：1 级不减量，加强护肤、观察；加重再复诊'],
    ['2026-08-19', '血压药和靶向药要分开吃吗？', 0, ''],
    ['2026-10-20', '下次影像评估做胸部还是全身？', 0, ''],
  ],
  rhythm: [
    ['影像评估（可测量病灶 CT/MRI）', '系统治疗前基线，之后每 6–12 周', 'CSCO《常见恶性肿瘤诊疗指南 2025》肾癌分册 §7 随访（小节页码待核）', '下次：2026-10-28 前后'],
    ['血常规 + 血生化 + 尿常规 + 甲功', '每周期前', '同上', '下次：2026-11-04 周期前'],
    ['家庭血压自测', '每周固定 2 个早晨', '工作台建议节奏（非指南内容）', '—'],
  ],
  viewpoints: [
    ['2026-06-02', '怕副作用怕过怕肿瘤', '手脚开始脱皮那天，先想到的是"要不要停药"。'],
    ['2026-07-10', '累但撑得住', '周期之间那两周状态最好，想趁能走多走走。'],
    ['2026-08-19', '等评估结果', '每次影像前一周都睡不好。'],
    ['2026-05-06', '确诊那天', '从"肾上长个东西"到"晚期癌症"，只用了两周。'],
  ],
  events: [
    { d: '2026-04-20', label: '穿刺活检' },
    { d: '2026-04-22', label: '胸腹 CT：双肺转移' },
    { d: '2026-04-24', label: '病理回报' },
    { d: '2026-05-06', label: '一线开始' },
    { d: '2026-05-27', label: '周期 2' },
    { d: '2026-06-17', label: '周期 3' },
    { d: '2026-07-08', label: '周期 4' },
    { d: '2026-07-29', label: '周期 5' },
    { d: '2026-08-19', label: '周期 6' },
  ],
  docs: [
    { id: 'd1', name: '泌尿外科超声 · 双肾', date: '2026-04-20', type: '影像', status: '已核对' },
    { id: 'd2', name: '胸腹增强 CT', date: '2026-04-22', type: '影像', status: '已核对' },
    { id: 'd3', name: '病理报告 · 穿刺', date: '2026-04-24', type: '病理', status: '已核对' },
    { id: 'd4', name: '肿瘤内科医嘱 · 一线方案', date: '2026-05-06', type: '门诊', status: '已核对' },
    { id: 'd5', name: '血常规 · 周期 6 前', date: '2026-08-19', type: '检验', status: '已核对' },
    { id: 'd6', name: '甲功 · 周期 6 前', date: '2026-08-19', type: '检验', status: '待核对' },
  ],
  candidates: [
    { id: 'c1', name: '一线方案用药顺序', value: '帕博利珠单抗（静脉，每 3 周）+ 阿昔替尼（口服，每日）', source: '肿瘤内科医嘱 · 第 1 页', status: 'accepted' },
    { id: 'c2', name: '10-28 影像评估结论', value: '报告未回', source: '待 10-28 检查后归档', status: 'candidate' },
  ],
};

/* ---------- 档案 B：小肿块主动监测 AS（路径 C：一次复查） ---------- */
const PROFILE_B = {
  meta: { name: '陈女士', sex: '女', age: 58, meta: '58 岁 · 右肾小肿块 · 主动监测', headline: '体检发现的 2.6 cm 肾肿块，选择先观察',
    stage: 'cT1a（影像，未经病理）', mindset: '医生说可以先看，但每次拍片前我还是紧张。',
    dash_keys: ['cr', 'egfr', 'uacr'], path: ['体检超声', '增强 CT 确认', '多学科讨论', '主动监测（AS）'],
    activity: '日常步行为主；拍片前一周会睡不好。', familyTalk: '女儿陪我去的医院，想让她也知道节奏。' },
  titles: { pathology: '病理与分型', staging: '分期记录', surgery: '诊断与手术记录', contra: '对侧肾与基础肾',
    as: '主动监测影像', lines: '治疗线序', imdc: '危险度分层（医生判定）', tox: '副作用与症状', genetics: '家系肾相关记录',
    rhythm: '监测与随访节奏', question: '想问医生的问题' },
  pathology: [['gap', '组织学分型', '未穿刺活检；AS 路径暂无组织学诊断', '', ''],
    ['gap', 'WHO/ISUP 分级', '无病理标本，无法分级', '', '']],
  staging: [['2026-05-12', 'cT1a（临床，影像）', 'AJCC 第 8 版', '增强 CT 2026-05-12', '未经病理确认']],
  surgery: [],
  contra: [['2026-05-12', '对侧肾状态', '左肾未见异常（CT 原文摘录）', '增强 CT 2026-05-12'],
    ['2026-05-12', '慢性肾病', '否认', '门诊记录 2026-05-12']],
  as: [
    ['2026-04-21', '超声', '2.6 cm', '右肾中极', '体检中心', '体检超声报告'],
    ['2026-05-12', 'CT（增强）', '27 mm', '右肾中极外生性', '市第一医院', '增强 CT 报告原文'],
    ['2026-08-12', '超声', '27 mm', '右肾中极', '市第一医院', '复查超声报告'],
    ['2026-10-12', 'CT（增强）', '28 mm', '右肾中极外生性', '市第一医院', '增强 CT 报告原文'],
  ],
  lines: [],
  imdc: [],
  cycles: [],
  tox: [],
  genetics: [['母亲', '母亲', '已故；生前高血压，无肾病史', 'na', '家属口述（非检测）', '', 1]],
  questions: [
    ['2026-08-12', '这半年大小没怎么变，可以拉长间隔吗？', 1, '医生：按指南节奏来；稳定满一年再评估'],
    ['2026-10-12', '这次大了一毫米，要紧吗？', 0, ''],
  ],
  rhythm: [
    ['腹部 CT/MRI 或超声', '开始前 2 年每 3 个月 1 次，然后每 6 个月 1 次，5 年后每年 1 次', 'CSCO《常见恶性肿瘤诊疗指南 2025》肾癌分册 §7 随访 · 密切监测（T1a）（小节页码待核）', '下次：2027-01-12 前后'],
    ['胸部 CT', '同上节奏', '同上', '下次：2027-01-12 前后'],
    ['血常规 / 尿常规 / 肾功能', '随影像节点', '同上（随访内容含实验室检查）', '下次：2027-01-12 前后'],
  ],
  viewpoints: [
    ['2026-05-12', '松了口气又悬着', '不用手术很高兴，但"先看着"总觉得心里没底。'],
    ['2026-08-12', '拍片前紧张', '前一晚总会想"万一长大了怎么办"。'],
    ['2026-10-12', '有点慌', '大了一毫米；医生说不必紧张，但我还是想记下来。'],
  ],
  events: [
    { d: '2026-04-21', label: '体检超声' },
    { d: '2026-05-12', label: '增强 CT 确认' },
    { d: '2026-06-10', label: 'MDT：建议 AS' },
    { d: '2026-08-12', label: 'AS 复查超声' },
    { d: '2026-10-12', label: 'AS 复查 CT' },
  ],
  docs: [
    { id: 'd1', name: '体检超声报告', date: '2026-04-21', type: '影像', status: '已核对' },
    { id: 'd2', name: '增强 CT 报告', date: '2026-05-12', type: '影像', status: '已核对' },
    { id: 'd3', name: 'MDT 记录 · 建议 AS', date: '2026-06-10', type: '其他', status: '已核对' },
    { id: 'd4', name: '复查超声报告', date: '2026-08-12', type: '影像', status: '已核对' },
    { id: 'd5', name: '复查增强 CT 报告', date: '2026-10-12', type: '影像', status: '待核对' },
  ],
  candidates: [
    { id: 'c1', name: 'AS 节奏原文', value: '密切监测（T1a）：前 2 年每 3 个月 1 次，然后每 6 个月 1 次，5 年后每年 1 次', source: 'CSCO 2025 肾癌分册 §7 随访（小节页码待核）', status: 'accepted' },
    { id: 'c2', name: '10-12 CT 结论', value: '28 mm，较 05-12 的 27 mm 增大 1 mm（原文摘录）', source: '复查增强 CT 报告 · 第 1 页', status: 'needs_review' },
  ],
};

/* 组装档案（公共指标按档案复制，避免交叉污染） */
function assemble(P, labs) {
  const metrics = labs().map((m) => ({ ...m, color: KEY_COLOR[m.key] || m.color, band: m.band ?? null }));
  return { ...P.meta, titles: P.titles, pathology: P.pathology, staging: P.staging, surgery: P.surgery,
    contra: P.contra, as: P.as, lines: P.lines, imdc: P.imdc, cycles: P.cycles, tox: P.tox,
    genetics: P.genetics, questions: P.questions, rhythm: P.rhythm, viewpoints: P.viewpoints,
    metrics, events: P.events, docs: P.docs, candidates: P.candidates,
    activity: P.meta.activity, familyTalk: P.meta.familyTalk };
}

/* 试验演示行：来自 research/kidney-cancer/（721 条真实登记摘录，CDE + CTV 通道）。
   选样覆盖四类语境：晚期一线（IO+IO / IO+TKI）、辅助治疗、二线及以后、局限/AS 相关。
   标题为登记标题原文摘录；phase 从标题括注；状态一律"登记状态，未核实"。 */
const TRIAL_ROWS = [
  ['CTR20220530', '帕博利珠单抗联合 Belzutifan（MK-6482）及仑伐替尼，或 MK-1308A 联合仑伐替尼在一线 ccRCC 的有效性研究', 'Ⅲ 期', '中国医学科学院肿瘤医院'],
  ['CTR20263290', '依沃西单抗联合卡度尼利单抗或伊匹木单抗治疗晚期肾癌的 II 期临床研究', 'Ⅱ 期', '登记页见原文'],
  ['CTR20251703', 'BL-B01D1 联合 TKI 双药（不联合或联合帕博利珠单抗）治疗局部晚期或转移性肾癌患者的 II 期临床研究', 'Ⅱ 期', '登记页见原文'],
  ['CTR20222029', '呋喹替尼联合信迪利单抗治疗晚期肾癌的 II/III 期临床研究', 'Ⅱ/Ⅲ 期', '登记页见原文'],
  ['CTR20220945', 'Belzutifan 联合帕博利珠单抗作为肾细胞癌（RCC）辅助治疗的 III 期研究', 'Ⅲ 期', '登记页见原文'],
  ['CTR20180072', '纳武利尤单抗联合伊匹木单抗对比安慰剂治疗局限性肾细胞癌的研究', 'Ⅲ 期', '登记页见原文'],
  ['CTR20131447', '培唑帕尼辅助治疗对术后肾细胞癌的有效性和安全性研究', '登记页见原文', '登记页见原文'],
  ['CTR20132930', '阿昔替尼治疗转移性肾细胞癌的研究', '登记页见原文', '登记页见原文'],
  ['CTR20130847', '评价 RAD001（依维莫司）二线治疗 mRCC 患者有效性和安全性的 II 期试验', 'Ⅱ 期', '登记页见原文'],
  ['CTR20261875', 'WGI-0301 联合纳武利尤单抗在晚期肝细胞癌及肾细胞癌患者中的安全性、耐受性与有效性研究', 'Ⅰ 期', '登记页见原文'],
].map(([id, title, phase, sponsor]) => ({ id, title, phase, status: '登记状态，未核实', sponsor, url: 'https://www.chinadrugtrials.org.cn/clinicaltrials.searchlistdetail.dhtml' }));

const DATA = {
  profiles: { A: assemble(PROFILE_A, labsA), B: assemble(PROFILE_B, labsB) },
  trials: TRIAL_ROWS,
};

/* ---------- 纯数据出口（不碰磁盘） ---------- */

/** 演示档案的纯数据：`{ profiles: {A, B}, trials, meta }`。开发版播种与两个产物都从这里取。 */
export function buildDemoProfiles() {
  return { profiles: DATA.profiles, trials: DATA.trials, meta: buildMeta() };
}

/** demo_meta 的内容：一段免责声明 + 几条统计，落进 sqlite 的 demo_meta 表。 */
function buildMeta() {
  return [
    ['disclaimer', '全部患者数据为虚构模拟，仅供原型演示；trials 表为真实登记摘录（CDE/CTV 通道），登记状态未核实'],
    ['generated_at', new Date().toISOString()],
    ['source', 'demo/build-demo-data.mjs（唯一数据源）'],
    ['subjects', '2'],
    ['window', '2026-04-20..2026-10-18'],
    ['window_label', '演示数据覆盖 2026-04-20 → 2026-10-18（约 6 个月）'],
    ['metrics_rows', String(Object.values(DATA.profiles).reduce((a, p) => a + p.metrics.length, 0))],
    ['points_rows', String(Object.values(DATA.profiles).reduce((a, p) => a + p.metrics.reduce((b, m) => b + m.points.length, 0), 0))],
  ];
}

/** 只有 `node demo/build-demo-data.mjs` 才落盘；被 import 时不写任何东西。 */
function isDirectRun() {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return realpathSync(resolve(entry)) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

/* ---------- 产 1：SQLite ---------- */
function writeSqlite() {
  const db = new DatabaseSync(join(ROOT, 'demo/demo-data.sqlite'));
  db.exec(`
DROP TABLE IF EXISTS metric_points; DROP TABLE IF EXISTS metrics;
DROP TABLE IF EXISTS events; DROP TABLE IF EXISTS rhythm; DROP TABLE IF EXISTS cycles; DROP TABLE IF EXISTS lines_rows;
DROP TABLE IF EXISTS pathology_rows; DROP TABLE IF EXISTS staging_rows; DROP TABLE IF EXISTS surgery_rows;
DROP TABLE IF EXISTS contra_rows; DROP TABLE IF EXISTS as_rows; DROP TABLE IF EXISTS imdc_rows;
DROP TABLE IF EXISTS symptom_rows; DROP TABLE IF EXISTS genetics_rows; DROP TABLE IF EXISTS question_rows;
DROP TABLE IF EXISTS viewpoints; DROP TABLE IF EXISTS trials; DROP TABLE IF EXISTS subjects; DROP TABLE IF EXISTS demo_meta;
DROP TABLE IF EXISTS documents; DROP TABLE IF EXISTS candidate_fields;
/* 列与 schema/0001_initial.sql 逐条一致；改这里要同步改 schema，反之亦然——两边是同一套列的镜像。 */
CREATE TABLE subjects (profile_key TEXT PRIMARY KEY, name TEXT, sex TEXT, age INTEGER, meta TEXT, headline TEXT, stage TEXT, mindset TEXT, dash_keys TEXT, path TEXT, activity TEXT, family_talk TEXT, pathology_title TEXT, staging_title TEXT, surgery_title TEXT, contra_title TEXT, as_title TEXT, lines_title TEXT, imdc_title TEXT, tox_title TEXT, genetics_title TEXT, rhythm_title TEXT, question_title TEXT);
CREATE TABLE metrics (profile_key TEXT, key TEXT, name TEXT, unit TEXT, cat TEXT, color TEXT, dec INTEGER, kind TEXT, band_low REAL, band_high REAL, note TEXT, PRIMARY KEY(profile_key, key));
CREATE TABLE metric_points (profile_key TEXT, metric_key TEXT, d TEXT, v_num REAL, v_text TEXT, src TEXT, ord INTEGER, PRIMARY KEY(profile_key, metric_key, d, ord));
CREATE TABLE events (profile_key TEXT, d TEXT, label TEXT);
CREATE TABLE rhythm (profile_key TEXT, item TEXT, freq TEXT, guideline TEXT, next TEXT, ord INTEGER);
CREATE TABLE cycles (profile_key TEXT, name TEXT, date TEXT, drugs TEXT, status TEXT, done INTEGER, ord INTEGER);
CREATE TABLE lines_rows (profile_key TEXT, line_no INTEGER, name TEXT, detail TEXT, start TEXT, end TEXT, status TEXT, src TEXT, ord INTEGER);
CREATE TABLE pathology_rows (profile_key TEXT, kind TEXT, a TEXT, b TEXT, d TEXT, institution TEXT, ord INTEGER);
CREATE TABLE staging_rows (profile_key TEXT, d TEXT, tnm TEXT, system TEXT, source TEXT, note TEXT, ord INTEGER);
CREATE TABLE surgery_rows (profile_key TEXT, d TEXT, kind TEXT, extent TEXT, recon TEXT, institution TEXT, note TEXT, ord INTEGER);
CREATE TABLE contra_rows (profile_key TEXT, d TEXT, item TEXT, value TEXT, src TEXT, ord INTEGER);
CREATE TABLE as_rows (profile_key TEXT, d TEXT, method TEXT, size_text TEXT, location TEXT, institution TEXT, src TEXT, ord INTEGER);
CREATE TABLE imdc_rows (profile_key TEXT, d TEXT, level TEXT, criteria TEXT, doctor TEXT, institution TEXT, note TEXT, ord INTEGER);
CREATE TABLE symptom_rows (profile_key TEXT, d TEXT, symptom TEXT, ctcae_text TEXT, note TEXT, ord INTEGER);
CREATE TABLE genetics_rows (profile_key TEXT, member TEXT, relation TEXT, finding TEXT, status TEXT, institution TEXT, d TEXT, private INTEGER DEFAULT 1, ord INTEGER);
CREATE TABLE question_rows (profile_key TEXT, d TEXT, q TEXT, asked INTEGER, answer TEXT, ord INTEGER);
CREATE TABLE viewpoints (profile_key TEXT, d TEXT, mood TEXT, text TEXT, ord INTEGER);
CREATE TABLE trials (nct_id TEXT PRIMARY KEY, title TEXT, phase TEXT, status TEXT, sponsor TEXT, url TEXT);
CREATE TABLE demo_meta (k TEXT PRIMARY KEY, v TEXT);
CREATE TABLE documents (profile_key TEXT, id TEXT, name TEXT, date TEXT, type TEXT, status TEXT, ord INTEGER, PRIMARY KEY(profile_key, id));
CREATE TABLE candidate_fields (profile_key TEXT, id TEXT, name TEXT, value TEXT, source TEXT, status TEXT, ord INTEGER, PRIMARY KEY(profile_key, id));
CREATE INDEX idx_points ON metric_points(profile_key, metric_key);
`);
  for (const [k, p] of Object.entries(DATA.profiles)) {
    const t = p.titles || {};
    db.prepare(`INSERT INTO subjects
      (profile_key, name, sex, age, meta, headline, stage, mindset, dash_keys, path,
       activity, family_talk, pathology_title, staging_title, surgery_title, contra_title,
       as_title, lines_title, imdc_title, tox_title, genetics_title, rhythm_title, question_title)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(k, p.name, p.sex, p.age, p.meta, p.headline, p.stage, p.mindset,
        JSON.stringify(p.dash_keys), JSON.stringify(p.path),
        p.activity, p.familyTalk,
        t.pathology, t.staging, t.surgery, t.contra, t.as, t.lines, t.imdc, t.tox, t.genetics, t.rhythm, t.question);
    for (const m of p.metrics) {
      db.prepare('INSERT INTO metrics VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(k, m.key, m.name, m.unit, m.cat, m.color, m.dec, m.dec === null ? (m.kind || 'qual') : 'numeric', m.band ? m.band[0] : null, m.band ? m.band[1] : null, m.note);
      m.points.forEach((pt, i) => db.prepare('INSERT INTO metric_points VALUES (?,?,?,?,?,?,?)').run(k, m.key, pt.d, typeof pt.v === 'number' ? pt.v : null, typeof pt.v === 'number' ? null : pt.v, pt.src, i));
    }
    p.events.forEach(e => db.prepare('INSERT INTO events VALUES (?,?,?)').run(k, e.d, e.label));
    p.rhythm.forEach((r, i) => db.prepare('INSERT INTO rhythm VALUES (?,?,?,?,?,?)').run(k, r[0], r[1], r[2], r[3], i));
    p.cycles.forEach((c, i) => db.prepare('INSERT INTO cycles VALUES (?,?,?,?,?,?,?)').run(k, c[0], c[1], c[2], c[3], c[4] ? 1 : 0, i));
    p.lines.forEach((l, i) => db.prepare('INSERT INTO lines_rows VALUES (?,?,?,?,?,?,?,?,?)').run(k, l[0], l[1], l[2], l[3], l[4], l[5], l[6], i));
    p.pathology.forEach((r, i) => db.prepare('INSERT INTO pathology_rows VALUES (?,?,?,?,?,?,?)').run(k, r[0], r[1], r[2], r[3], r[4], i));
    p.staging.forEach((r, i) => db.prepare('INSERT INTO staging_rows VALUES (?,?,?,?,?,?,?)').run(k, r[0], r[1], r[2], r[3], r[4], i));
    p.surgery.forEach((r, i) => db.prepare('INSERT INTO surgery_rows VALUES (?,?,?,?,?,?,?,?)').run(k, r[0], r[1], r[2], r[3], r[4], r[5], i));
    p.contra.forEach((r, i) => db.prepare('INSERT INTO contra_rows VALUES (?,?,?,?,?,?)').run(k, r[0], r[1], r[2], r[3], i));
    p.as.forEach((r, i) => db.prepare('INSERT INTO as_rows VALUES (?,?,?,?,?,?,?,?)').run(k, r[0], r[1], r[2], r[3], r[4], r[5], i));
    p.imdc.forEach((r, i) => db.prepare('INSERT INTO imdc_rows VALUES (?,?,?,?,?,?,?,?)').run(k, r[0], r[1], r[2], r[3], r[4], r[5], i));
    p.tox.forEach((r, i) => db.prepare('INSERT INTO symptom_rows VALUES (?,?,?,?,?,?)').run(k, r[0], r[1], r[2], r[3], i));
    p.genetics.forEach((r, i) => db.prepare('INSERT INTO genetics_rows VALUES (?,?,?,?,?,?,?,?,?)').run(k, r[0], r[1], r[2], r[3], r[4], r[5], r[6] ?? 1, i));
    p.questions.forEach((r, i) => db.prepare('INSERT INTO question_rows VALUES (?,?,?,?,?,?)').run(k, r[0], r[1], r[2], r[3], i));
    p.viewpoints.forEach((v, i) => db.prepare('INSERT INTO viewpoints VALUES (?,?,?,?,?)').run(k, v[0], v[1], v[2], i));
    p.docs.forEach((d, i) => db.prepare('INSERT INTO documents VALUES (?,?,?,?,?,?,?)').run(k, d.id, d.name, d.date, d.type, d.status, i));
    p.candidates.forEach((c, i) => db.prepare('INSERT INTO candidate_fields VALUES (?,?,?,?,?,?,?)').run(k, c.id, c.name, c.value, c.source, c.status, i));
  }
  DATA.trials.forEach(t => db.prepare('INSERT INTO trials VALUES (?,?,?,?,?,?)').run(t.id, t.title, t.phase, t.status, t.sponsor, t.url));
  buildMeta().forEach(([k, v]) => db.prepare('INSERT INTO demo_meta VALUES (?,?)').run(k, v));
  db.close();
}

/* ---------- 产 2：原型数据层 ---------- */
function writePrototypeJs() {
  /* 只有 profiles 与 trials 进前端快照：meta 是给 sqlite 的统计信息，前端用不到，
     加进去会让 demo-data.js 的字节数每次运行都变（generated_at），原型快照不该这样。 */
  const js = '/* 由 demo/build-demo-data.mjs 生成；勿手改，改数据请改生成器后重新运行。 */\nwindow.DEMO_DATA = ' + JSON.stringify(DATA) + ';\n';
  writeFileSync(join(P2, 'demo-data.js'), js);
}

/* ---------- 只有被当作脚本直接运行时才落盘 ---------- */
if (isDirectRun()) {
  writeSqlite();
  writePrototypeJs();
  const nMetrics = Object.values(DATA.profiles).reduce((a, p) => a + p.metrics.length, 0);
  const nPoints = Object.values(DATA.profiles).reduce((a, p) => a + p.metrics.reduce((b, m) => b + m.points.length, 0), 0);
  console.log(`demo-data.sqlite + demo-data.js 生成完毕：2 档案 / ${nMetrics} 项指标 / ${nPoints} 个数据点 / ${DATA.trials.length} 条试验`);
}
