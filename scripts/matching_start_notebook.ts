/**
 * マッチングAPI起動用テストノートブック
 * TypeScriptでの対話的テストスクリプト
 */

const cosineSimilarity = (a: number[], b: number[]): number => {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

const profileToText = (profile: {
  personality_type: string | null;
  idea_status: string | null;
  desired_role_in_team: string | null;
  self_introduction_comment: string | null;
}): string => {
  return [
    profile.personality_type,
    profile.idea_status,
    profile.desired_role_in_team,
    profile.self_introduction_comment,
  ]
    .filter(Boolean)
    .join(' ');
};

// --- セル 1: プロフィールテキスト結合テスト ---
// テスト用プロフィールサンプル
const profileA = {
  personality_type: 'INTJ',
  idea_status: 'Active',
  desired_role_in_team: 'Developer',
  self_introduction_comment: '私はコーディングが好きです。',
};
const profileB = {
  personality_type: 'ENTP',
  idea_status: 'Inactive',
  desired_role_in_team: 'Designer',
  self_introduction_comment: 'デザインが得意です。',
};

console.log('--- profileToText 結果 ---');
console.log('Profile A Text:', profileToText(profileA));
console.log('Profile B Text:', profileToText(profileB));

// --- セル 2: コサイン類似度テスト ---
const vecA = [1, 2, 3];
const vecB = [2, 4, 6];
console.log('--- cosineSimilarity 結果 ---');
console.log('Cosine Similarity (A, B):', cosineSimilarity(vecA, vecB));

// --- セル 3: API エンドポイント呼び出しテスト ---
// 以下コメントアウトを外して、ローカル開発サーバー (localhost:3000) 起動後に実行してください。
// import fetch from 'node-fetch';
// (async () => {
//   const res = await fetch('http://localhost:3000/api/matching/start', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ userId: 1, desired_role_in_team: 'Developer' }),
//   });
//   const data = await res.json();
//   console.log('--- API Response ---');
//   console.dir(data, { depth: null });
// })();
