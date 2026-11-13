const common = {
  questionCount: 5, baseScore: 100, maxTime: 60, incorrectCost: 20,
  hintCost: 5, unmaskHintCost: 10, rerollCostBase: 10,
  noHintBonus: 20, noRerollBonus: 10, comboBonusMultiplier: 5, isReverse: false,
};

export const gameModes = {
  normal: { name: 'ノーマル', description: '総合スコアを競う、基本的なモードです。', settings: { ...common } },
  timeattack: { name: 'タイムアタック', description: '問題をどれだけ早くクリアできるかを競うモードです。', settings: { ...common, maxTime: 999 } },
  survival: { name: 'サバイバル', description: '持ち時間60秒からスタートし、どれだけ長く生き延びられるかを競うモードです。', settings: { ...common, questionCount: 999, baseScore: 50, timeCap: 80, noHintBonus: 10, noRerollBonus: 5, comboBonusMultiplier: 0 } },
  practice: { name: '練習', description: 'スコアや時間を気にせず、心ゆくまで練習できるモードです。', settings: { ...common, questionCount: 999, baseScore: 0, incorrectCost: 0, hintCost: 0, unmaskHintCost: 0, rerollCostBase: 0 } },
};

export const defaultGlobalSettings = { fetchBatchSize: 20, fetchAttempts: 3 };
export const settingFields = [
  ['questionCount', '問題数', 1, 999],
  ['baseScore', '基礎スコア', 1, 10000],
  ['maxTime', '最大時間 (秒)', 1, 3600],
  ['incorrectCost', '不正解ペナルティ', 0, 1000],
  ['hintCost', 'ヒントコスト', 0, 1000],
  ['unmaskHintCost', '伏せ字削減コスト', 0, 1000],
  ['rerollCostBase', 'リロールコスト', 0, 1000],
];
