/* 小肾宝 RenalPal · 疾病概要数据（36 号）
 * 口径：docs/DISEASE-PRIMER.md；规范：starter docs/36-DISEASE-PRIMER.md。
 * 全部内容属第 ② 层（解释）：只写定义、文件、指南列举过的手段、已发生的变化。
 * 任何「你该怎么办」的判断都不在这里，固定出口是「这一句需要问你的医生」。
 *
 * 本癌种三条硬口径（docs/USER-RESEARCH.md、docs/DIFF-MATRIX.md）：
 *   ① 分型 / 分期 / 分级是三个词，三页分开，界面不混用；
 *   ② CSCO 2025 只有公开摘录，未取得原件，页码待核；
 *   ③ 中国获批药物清单未逐条核实——NCCN/EAU 列的不等于中国获批。
 */
window.DISEASE_PRIMER = {
  brand: '小肾宝 RenalPal',
  name: '肾癌',
  en: 'Renal Cell Carcinoma（RCC）',
  updated: '2026-10-25',
  sections: [
    {
      id: 'definition',
      title: '定义',
      intro: '肾癌是起源于肾脏的恶性肿瘤，病理类型以透明细胞癌最常见。'
        + '「分型 / 分期 / 分级」是三个词：分型说是什么癌，分期说长到哪了，分级说显微镜下的级别——本台三页分开记录，界面不混用。',
      points: [
        '分型看病理：透明细胞癌、乳头状、嫌色细胞等，命名口径按 WHO / ISUP 分类（本项目出处待核，版本未核实）。',
        '分级看显微镜：病理报告常用 WHO / ISUP 1–4 级，另记肉瘤样分化；本台照报告原文，不换算、不合并。',
        '分期看 TNM（AJCC 第 8 版口径）：T1a ≤4cm、T1b 4–7cm、T2a 7–10cm、T2b >10cm、T3a 肾静脉或肾周脂肪、T3b 膈下 IVC、T3c 膈上 IVC、T4 侵透筋膜。',
        '常见起点是体检超声 / CT 偶然发现「肾占位」；囊性病变按 Bosniak 分级评估，本台只记原值。',
        '遗传与家系：VHL 等遗传性肾癌需定期查其他器官，本台只记筛查安排与结果，不推断遗传概率。',
        '本台不判断「是不是癌」——那是病理与医生的领域。'
      ],
      sources: [
        { org: 'AJCC', doc: 'Cancer Staging Manual, 8th ed.（肾章节）', version: '第 8 版（年份未核实）', original: false, page: '页码待核' },
        { org: 'WHO / ISUP', doc: '泌尿系统肿瘤分类与病理分级', version: '版本未核实', original: false, page: '页码待核' },
        { org: 'CSCO', doc: 'CSCO《常见恶性肿瘤诊疗指南 2025》肾癌分册', version: '2025 版', original: false, page: '页码待核' }
      ]
    },
    {
      id: 'evidence',
      title: '医学资料规范和指南情况',
      intro: '这台工作台里出现的每一条「该查什么、该怎么分期」，都应能追到下面某一份文件。'
        + '本项目只取得 CSCO 2025 肾癌分册的公开摘录，其余都没有原件——表格里照实写，不假装看过。',
      table: {
        head: ['机构', '文件', '版本 / 年份', '原件', '本台的用途'],
        rows: [
          ['CSCO', 'CSCO《常见恶性肿瘤诊疗指南 2025》肾癌分册', '2025 版', '未取得原件（仅公开摘录）', '外科治疗（§4）与随访节奏（§7）的原文引用；页码待核'],
          ['AJCC', 'Cancer Staging Manual, 8th ed.（肾章节）', '第 8 版（年份未核实）', '未取得原件', 'TNM 分期口径'],
          ['WHO / ISUP', '泌尿系统肿瘤分类与病理分级', '版本未核实', '未取得原件', '分型与 1–4 级分级的命名口径'],
          ['NCCN', 'NCCN Guidelines · Kidney Cancer', '版本未核实', '未取得原件', '范围参照；NCCN 列的不等于中国获批'],
          ['EAU', 'EAU Guidelines on Renal Cell Carcinoma', '版本未核实', '未取得原件', '范围参照；与 NCCN 并列，不合并']
        ]
      },
      points: [
        '指南给的是「通常怎么做」，不是「你该怎么做」。版本号必须写清：同一份指南隔一年，条目会变。',
        'CSCO 2025 只有公开摘录，页码全部待核；CUA / 国家癌症中心各版本存在多个二手说法且互相矛盾，本项目不采用。',
        '中国获批药物清单未逐条核实：NCCN / EAU 列的不等于中国获批，本台不据此写药物清单。',
        '分型、分期、分级各自来源单列，不在本表里做换算。'
      ],
      sources: [
        { org: 'CSCO', doc: 'CSCO《常见恶性肿瘤诊疗指南 2025》肾癌分册', version: '2025 版', original: false, page: '页码待核' },
        { org: 'AJCC', doc: 'Cancer Staging Manual, 8th ed.（肾章节）', version: '第 8 版（年份未核实）', original: false, page: '页码待核' },
        { org: 'WHO / ISUP', doc: '泌尿系统肿瘤分类与病理分级', version: '版本未核实', original: false, page: '页码待核' },
        { org: 'NCCN', doc: 'NCCN Guidelines · Kidney Cancer', version: '版本未核实', original: false, page: '页码待核' },
        { org: 'EAU', doc: 'EAU Guidelines on Renal Cell Carcinoma', version: '版本未核实', original: false, page: '页码待核' }
      ]
    },
    {
      id: 'landscape',
      title: '目前治疗全景概要',
      intro: '下面按期别与线序列出指南里出现过的手段类别。这是「世界上大致有哪些办法」的地图，不是给你排的先后顺序，'
        + '也不含任何剂量、疗程与适用条件——那些必须由医生按分型、分期、分级与肾功能决定。',
      groups: [
        {
          label: '局限期（T1–T2，可以考虑手术）',
          points: [
            '肾部分切除（PN）：被列出，保留肾单位；解剖或功能性孤立肾、慢性肾病合并肾癌、双肾癌、VHL 等情形属于其明确适应情形。',
            '根治性肾切除（RN）：被列出；选 PN 还是 RN，按肿瘤位置、大小与肾功能由医生判断。',
            '消融：RFA / 冷冻被列为不能手术或特定情形下的选项。',
            '主动监测（AS）：小肿块、特定情形下被列为一种路径；本台按影像原文并列大小，不连线、不算 mm/年、不设阈值。'
          ]
        },
        {
          label: '局部晚期 / 晚期',
          points: [
            '靶向治疗：TKI 等靶向药被列出，具体药物是否在国内获批、是否在医保内，需要单独核实。',
            '免疫检查点抑制剂：单用或与靶向联合的方案被列出。',
            '联合治疗：靶向 + 免疫的联合方案在指南里单列；本台只记方案名称与起止，不比较优劣。',
            '临床研究：指南把「参加登记良好的临床试验」列为一项正式选项，而不是最后手段。'
          ]
        },
        {
          label: '术后 / 消融 / 主动监测的随访',
          points: [
            'PN / RN 后 T1–2：前 2 年每 6 个月，然后每年（CSCO §7）。',
            'RN 后 T3–4：前 2 年每 3 个月，然后每 6 个月至 5 年，然后每年。',
            '消融 / 密切监测 T1a：前 2 年每 3 个月，然后每 6 个月，5 年后每年。',
            'IV 期全身治疗：治疗前基线，之后每 6–12 周影像评估。'
          ]
        },
        {
          label: '贯穿全程的两件事',
          points: [
            '肾功能轨道：Cr / eGFR 与术前基线并列，孤立肾 / 双侧 / CKD 按原文标记；本台不判断「肾功能还好 / 差了」。',
            '副作用与遗传筛查：症状原话与同日血压 / 甲功 / 尿蛋白并置、不并轴；VHL 等遗传性肾癌的其他器官筛查只记安排。'
          ]
        }
      ],
      points: [
        '以上是文献与指南里列出的手段，按病期与线序排列，不代表任何一项适合你。选哪一个，这一句需要问你的医生。'
      ],
      sources: [
        { org: 'CSCO', doc: 'CSCO《常见恶性肿瘤诊疗指南 2025》肾癌分册', version: '2025 版', original: false, page: '页码待核' },
        { org: 'NCCN', doc: 'NCCN Guidelines · Kidney Cancer', version: '版本未核实', original: false, page: '页码待核' },
        { org: 'EAU', doc: 'EAU Guidelines on Renal Cell Carcinoma', version: '版本未核实', original: false, page: '页码待核' }
      ]
    },
    {
      id: 'trend',
      title: '发展趋势',
      intro: '这一段只写已经发生的事：哪份文件换了版本、哪一年出版。'
        + '不写预测，不做评价，也不给任何倾向；本项目未采集肾癌在研登记，因此也不列登记数字。',
      points: [
        '2025 年：CSCO《常见恶性肿瘤诊疗指南 2025》肾癌分册出版；本项目仅取得公开摘录，未取得原件，页码待核。',
        'AJCC 第 8 版：肾癌 TNM 分期采用第 8 版口径；本项目只引用版本号，出版年份与页码未核实。',
        'WHO / ISUP 分级：病理报告采用 1–4 级口径；本项目出处待核，版本未核实。'
      ],
      sources: [
        { org: 'CSCO', doc: 'CSCO《常见恶性肿瘤诊疗指南 2025》肾癌分册', version: '2025 版', original: false, page: '页码待核' },
        { org: 'AJCC', doc: 'Cancer Staging Manual, 8th ed.（肾章节）', version: '第 8 版（年份未核实）', original: false, page: '页码待核' },
        { org: 'WHO / ISUP', doc: '泌尿系统肿瘤分类与病理分级', version: '版本未核实', original: false, page: '页码待核' }
      ]
    }
  ]
}
