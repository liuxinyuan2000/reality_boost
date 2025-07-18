-- 创建 users 表格
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建 notes 表格
CREATE TABLE IF NOT EXISTS notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户出门主题表
CREATE TABLE user_outing_themes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  theme_name VARCHAR(100) NOT NULL, -- 主题名称，如"咖啡探店"、"学习讨论"等
  theme_description TEXT, -- 主题描述
  is_active BOOLEAN DEFAULT true, -- 是否为当前激活主题
  expires_at TIMESTAMP WITH TIME ZONE, -- 主题过期时间
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username); 

-- 创建索引
CREATE INDEX idx_user_outing_themes_user_id ON user_outing_themes(user_id);
CREATE INDEX idx_user_outing_themes_active ON user_outing_themes(user_id, is_active); 