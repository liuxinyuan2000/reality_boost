-- ==============================================
-- Reality Note AI Chat Categories System Setup
-- AI对话会话使用现有的categories分类系统
-- 可以直接在Supabase SQL编辑器中运行
-- ==============================================

-- 1. 创建chat_sessions表（AI对话会话）- 使用现有categories分类
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL, -- 关联到现有分类表
    description TEXT, -- 会话描述
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, name) -- 确保用户的会话名称唯一
);

-- 2. 创建chat_messages表（AI对话消息）
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. 为相关表创建索引
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_category_id ON chat_sessions(category_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated_at ON chat_sessions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- 4. 创建函数：为新用户自动创建默认AI对话会话
CREATE OR REPLACE FUNCTION create_default_chat_sessions()
RETURNS trigger AS $$
DECLARE
    daily_category_id UUID;
    work_category_id UUID;
    diary_category_id UUID;
    creative_category_id UUID;
BEGIN
    -- 获取用户的默认分类ID
    SELECT id INTO daily_category_id FROM categories WHERE user_id = NEW.id AND name = '日常随想' LIMIT 1;
    SELECT id INTO work_category_id FROM categories WHERE user_id = NEW.id AND name = '工作学习' LIMIT 1;
    SELECT id INTO diary_category_id FROM categories WHERE user_id = NEW.id AND name = '私人日记' LIMIT 1;
    SELECT id INTO creative_category_id FROM categories WHERE user_id = NEW.id AND name = '灵感创意' LIMIT 1;
    
    -- 为新用户创建默认AI对话会话，关联到对应分类
    INSERT INTO chat_sessions (name, user_id, description, category_id, is_private) VALUES
    ('通用助手', NEW.id, '日常问题和通用对话', daily_category_id, false),
    ('学习伙伴', NEW.id, '学习、研究和知识探讨', work_category_id, false),
    ('创意工坊', NEW.id, '创意思考和头脑风暴', creative_category_id, false),
    ('私人顾问', NEW.id, '私密问题和个人咨询', diary_category_id, true);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 修改现有触发器：确保在创建默认分类后再创建默认会话
DROP TRIGGER IF EXISTS on_auth_user_created_create_chat_sessions ON auth.users;
CREATE TRIGGER on_auth_user_created_create_chat_sessions
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_default_chat_sessions();

-- 6. 启用Row Level Security (RLS)
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- 7. 创建chat_sessions表的RLS策略
-- 用户只能查看自己的会话（包括考虑分类隐私）
CREATE POLICY "Users can view own chat sessions" ON chat_sessions
    FOR SELECT USING (
        auth.uid() = user_id 
        AND (
            category_id IS NULL 
            OR EXISTS (
                SELECT 1 FROM categories 
                WHERE categories.id = chat_sessions.category_id 
                AND categories.user_id = auth.uid()
            )
        )
    );

-- 用户只能插入自己的会话
CREATE POLICY "Users can insert own chat sessions" ON chat_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 用户只能更新自己的会话
CREATE POLICY "Users can update own chat sessions" ON chat_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- 用户只能删除自己的会话
CREATE POLICY "Users can delete own chat sessions" ON chat_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- 8. 创建chat_messages表的RLS策略
-- 用户只能查看自己会话的消息
CREATE POLICY "Users can view own chat messages" ON chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_sessions 
            WHERE chat_sessions.id = chat_messages.session_id 
            AND chat_sessions.user_id = auth.uid()
        )
    );

-- 用户只能插入自己会话的消息
CREATE POLICY "Users can insert own chat messages" ON chat_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_sessions 
            WHERE chat_sessions.id = chat_messages.session_id 
            AND chat_sessions.user_id = auth.uid()
        )
    );

-- 用户只能更新自己会话的消息
CREATE POLICY "Users can update own chat messages" ON chat_messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM chat_sessions 
            WHERE chat_sessions.id = chat_messages.session_id 
            AND chat_sessions.user_id = auth.uid()
        )
    );

-- 用户只能删除自己会话的消息
CREATE POLICY "Users can delete own chat messages" ON chat_messages
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM chat_sessions 
            WHERE chat_sessions.id = chat_messages.session_id 
            AND chat_sessions.user_id = auth.uid()
        )
    );

-- 9. 创建更新时间戳的触发器
CREATE OR REPLACE FUNCTION update_chat_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    -- 更新会话的最后消息时间
    UPDATE chat_sessions 
    SET last_message_at = timezone('utc'::text, now()),
        updated_at = timezone('utc'::text, now())
    WHERE id = NEW.session_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. 为chat_messages表添加更新会话时间戳的触发器
DROP TRIGGER IF EXISTS update_chat_session_on_message ON chat_messages;
CREATE TRIGGER update_chat_session_on_message
    AFTER INSERT ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_session_timestamp();

-- 11. 为chat_sessions表添加更新时间戳触发器
DROP TRIGGER IF EXISTS update_chat_sessions_updated_at ON chat_sessions;
CREATE TRIGGER update_chat_sessions_updated_at
    BEFORE UPDATE ON chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- AI对话分类系统设置完成！
-- 现在AI对话和笔记共享同一套分类系统
-- ==============================================

-- 验证安装：查询一下表结构
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('chat_sessions', 'chat_messages') 
    AND table_schema = 'public'
ORDER BY table_name, ordinal_position; 