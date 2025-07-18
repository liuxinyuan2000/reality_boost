-- 创建分类表
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  color TEXT DEFAULT '#007AFF', -- 分类颜色
  icon TEXT DEFAULT '📁', -- 分类图标
  is_private BOOLEAN DEFAULT false, -- 是否私有
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 确保同一用户的分类名称唯一
  CONSTRAINT unique_user_category UNIQUE (user_id, name)
);

-- 修改 notes 表，添加分类字段
ALTER TABLE notes 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_is_private ON categories(is_private);
CREATE INDEX IF NOT EXISTS idx_notes_category_id ON notes(category_id);
CREATE INDEX IF NOT EXISTS idx_notes_is_private ON notes(is_private);
CREATE INDEX IF NOT EXISTS idx_notes_user_category ON notes(user_id, category_id);

-- 为每个用户创建默认分类的函数
CREATE OR REPLACE FUNCTION create_default_categories(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  -- 插入默认分类
  INSERT INTO categories (user_id, name, color, icon, is_private) VALUES
    (user_uuid, '日常随想', '#007AFF', '💭', false),
    (user_uuid, '工作学习', '#34C759', '📚', false),
    (user_uuid, '私人日记', '#FF9500', '📝', true),
    (user_uuid, '灵感创意', '#AF52DE', '💡', false)
  ON CONFLICT (user_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器函数，为新用户自动创建默认分类
CREATE OR REPLACE FUNCTION create_user_default_categories()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_default_categories(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS trigger_create_default_categories ON users;
CREATE TRIGGER trigger_create_default_categories
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_default_categories();

-- 为现有用户创建默认分类
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM users LOOP
    PERFORM create_default_categories(user_record.id);
  END LOOP;
END $$; 