-- 简化的好友系统 - 只包含好友关系功能

-- 好友关系表
CREATE TABLE IF NOT EXISTS friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'accepted', -- 简化为直接接受，不需要pending状态
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- 确保每对用户只有一个好友关系记录，且user1_id < user2_id
  CONSTRAINT unique_friendship UNIQUE (user1_id, user2_id),
  CONSTRAINT check_different_users CHECK (user1_id != user2_id),
  CONSTRAINT check_user_order CHECK (user1_id < user2_id)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_friendships_user1 ON friendships(user1_id);
CREATE INDEX IF NOT EXISTS idx_friendships_user2 ON friendships(user2_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);
CREATE INDEX IF NOT EXISTS idx_friendships_created_at ON friendships(created_at DESC); 