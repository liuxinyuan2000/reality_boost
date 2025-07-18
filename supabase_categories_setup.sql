-- ==============================================
-- Reality Note Categories System Setup
-- 可以直接在Supabase SQL编辑器中运行
-- ==============================================

-- 1. 创建categories表
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    color VARCHAR(7) DEFAULT '#3B82F6', -- 默认蓝色
    icon VARCHAR(50) DEFAULT '📁', -- 默认文件夹图标
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, name) -- 确保用户的分类名称唯一
);

-- 2. 为categories表创建索引
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

-- 3. 修改notes表，添加分类和隐私字段
ALTER TABLE notes 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

-- 4. 为notes表的新字段创建索引
CREATE INDEX IF NOT EXISTS idx_notes_category_id ON notes(category_id);
CREATE INDEX IF NOT EXISTS idx_notes_is_private ON notes(is_private);

-- 5. 创建函数：为新用户自动创建默认分类
CREATE OR REPLACE FUNCTION create_default_categories()
RETURNS trigger AS $$
BEGIN
    -- 为新用户创建默认分类
    INSERT INTO categories (name, user_id, color, icon, is_private) VALUES
    ('日常随想', NEW.id, '#3B82F6', '💭', false),
    ('工作学习', NEW.id, '#10B981', '📚', false),
    ('私人日记', NEW.id, '#EF4444', '📖', true),
    ('灵感创意', NEW.id, '#F59E0B', '💡', false);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 创建触发器：当新用户注册时自动创建默认分类
DROP TRIGGER IF EXISTS on_auth_user_created_create_categories ON auth.users;
CREATE TRIGGER on_auth_user_created_create_categories
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_default_categories();

-- 7. 启用Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 8. 创建categories表的RLS策略
-- 用户只能查看自己的分类
CREATE POLICY "Users can view own categories" ON categories
    FOR SELECT USING (auth.uid() = user_id);

-- 用户只能插入自己的分类
CREATE POLICY "Users can insert own categories" ON categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 用户只能更新自己的分类
CREATE POLICY "Users can update own categories" ON categories
    FOR UPDATE USING (auth.uid() = user_id);

-- 用户只能删除自己的分类
CREATE POLICY "Users can delete own categories" ON categories
    FOR DELETE USING (auth.uid() = user_id);

-- 9. 更新notes表的RLS策略（如果需要）
-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "Users can view notes with category privacy" ON notes;

-- 创建新的查看策略：考虑分类隐私设置
CREATE POLICY "Users can view notes with category privacy" ON notes
    FOR SELECT USING (
        -- 用户可以查看自己的所有笔记
        auth.uid() = user_id 
        OR 
        -- 或者查看其他用户的公开笔记（笔记本身是公开的，且分类也是公开的或没有分类）
        (
            is_private = false 
            AND (
                category_id IS NULL 
                OR 
                EXISTS (
                    SELECT 1 FROM categories 
                    WHERE categories.id = notes.category_id 
                    AND categories.is_private = false
                )
            )
        )
    );

-- 10. 创建更新时间戳的函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. 为categories表添加更新时间戳触发器
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 设置完成！
-- ==============================================

-- 验证安装：查询一下表结构
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('categories', 'notes') 
    AND table_schema = 'public'
ORDER BY table_name, ordinal_position; 