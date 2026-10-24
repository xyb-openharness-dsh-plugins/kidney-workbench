/* 演示数据播种。
 *
 * 唯一数据源是 `demo/build-demo-data.mjs`：本文件只决定「什么时候种、种之前先问什么」，
 * **不新增、不改写任何数值**——界面上看到的每个演示数字都能在生成器里找到同一行。
 * INSERT 语句也共用生成器的 `seedDatabase()`，这里不写第二份（家族踩过两处 INSERT 漂移）。
 *
 * 播种时机：`migrate()` 之后、库里一个档案都没有时。库里已有档案就整批跳过——
 * 那说明用户已经在用自己的资料了，绝不能把演示数据塞进用户的库。
 */

import { seedDatabase } from '../demo/build-demo-data.mjs';

/** 库里有没有演示/真实档案（有任意一个 subject 就算有）。 */
export function hasDemoData(db) {
  const row = db.prepare('SELECT COUNT(*) AS n FROM subjects').get();
  return Number(row?.n || 0) > 0;
}

/**
 * 播种演示数据。
 * @returns {{skipped:boolean, subjects:number, metrics:number, points:number, trials:number}}
 */
export function seedDemo(db) {
  const before = { subjects: count(db, 'subjects'), metrics: count(db, 'metrics'), points: count(db, 'metric_points'), trials: count(db, 'trials') };
  if (hasDemoData(db)) return { skipped: true, ...before };

  seedDatabase(db);

  return {
    skipped: false,
    subjects: count(db, 'subjects'),
    metrics: count(db, 'metrics'),
    points: count(db, 'metric_points'),
    trials: count(db, 'trials'),
  };
}

function count(db, table) {
  const row = db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get();
  return Number(row?.n || 0);
}
