-- チーム関連テーブルの作成

-- コースステップテーブル
CREATE TABLE IF NOT EXISTS course_steps (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  start_date DATE,
  end_date DATE,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- チームテーブル
CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  course_step_id INTEGER NOT NULL REFERENCES course_steps(id),
  name VARCHAR(100) NOT NULL,
  project_name VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(course_step_id, name)
);

-- チームメンバーシップテーブル
CREATE TABLE IF NOT EXISTS team_memberships (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  role_in_team VARCHAR(50),
  joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(team_id, user_id, joined_at)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_teams_course_step ON teams(course_step_id);
CREATE INDEX IF NOT EXISTS idx_team_memberships_team ON team_memberships(team_id);
CREATE INDEX IF NOT EXISTS idx_team_memberships_user ON team_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_team_memberships_current ON team_memberships(team_id, user_id) WHERE left_at IS NULL;

-- サンプルデータ挿入
INSERT INTO course_steps (name, start_date, end_date, description) VALUES
('2024 Spring Web Dev Course', '2024-04-01', '2024-06-30', '春期Webアプリケーション開発コース'),
('2024 Summer AI/ML Course', '2024-07-01', '2024-09-30', '夏期AI・機械学習コース'),
('2024 Fall Mobile Dev Course', '2024-10-01', '2024-12-31', '秋期モバイルアプリ開発コース')
ON CONFLICT (name) DO NOTHING;

-- 更新日時の自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_course_steps_updated_at BEFORE UPDATE ON course_steps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_memberships_updated_at BEFORE UPDATE ON team_memberships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
