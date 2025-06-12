-- コースステップ名をStep 1, 2, 3に更新

-- 既存データを削除
DELETE FROM team_memberships;
DELETE FROM teams;
DELETE FROM course_steps;

-- 新しいコースステップデータを挿入
INSERT INTO course_steps (name, start_date, end_date, description) VALUES
('Step 1', '2024-04-01', '2024-06-30', '基礎学習ステップ'),
('Step 2', '2024-07-01', '2024-09-30', '応用学習ステップ'),
('Step 3', '2024-10-01', '2024-12-31', '実践学習ステップ');

-- サンプルチームデータ
INSERT INTO teams (course_step_id, name, project_name) VALUES
(1, 'Team Alpha', '学習管理システム'),
(1, 'Team Gamma', 'タスク管理アプリ'),
(2, 'Team Beta', 'AIチャットボット'),
(2, 'Team Delta', 'レコメンドシステム'),
(3, 'Team Epsilon', 'モバイルアプリ'),
(3, 'Team Zeta', 'Webサービス');

-- サンプルメンバーシップデータ（ユーザーテーブルが存在する場合）
-- INSERT INTO team_memberships (team_id, user_id, role_in_team, joined_at) VALUES
-- (1, 1, 'Tech Lead', '2024-04-15 10:00:00'),
-- (1, 2, 'Designer', '2024-04-15 10:00:00'),
-- (2, 1, 'Developer', '2024-07-10 10:00:00'),
-- (2, 3, 'PM', '2024-07-10 10:00:00');
