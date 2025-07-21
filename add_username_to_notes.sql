-- 第一步：在notes表中添加username字段
ALTER TABLE notes 
ADD COLUMN username VARCHAR(255);

-- 第二步：从users表更新现有记录的username
UPDATE notes 
SET username = users.username 
FROM users 
WHERE notes.user_id = users.id;

-- 第三步：为新记录创建触发器函数，自动填充username
CREATE OR REPLACE FUNCTION set_note_username()
RETURNS TRIGGER AS $$
BEGIN
    -- 当插入新记录时，自动从users表获取username
    SELECT username INTO NEW.username 
    FROM users 
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 第四步：创建触发器，在插入notes时自动设置username
DROP TRIGGER IF EXISTS trigger_set_note_username ON notes;
CREATE TRIGGER trigger_set_note_username
    BEFORE INSERT ON notes
    FOR EACH ROW
    EXECUTE FUNCTION set_note_username();

-- 第五步：创建触发器函数，当users表的username更新时同步更新notes表
CREATE OR REPLACE FUNCTION sync_username_to_notes()
RETURNS TRIGGER AS $$
BEGIN
    -- 当users表的username更新时，同步更新notes表中对应的username
    UPDATE notes 
    SET username = NEW.username 
    WHERE user_id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 第六步：创建触发器，在users表username更新时同步到notes表
DROP TRIGGER IF EXISTS trigger_sync_username_to_notes ON users;
CREATE TRIGGER trigger_sync_username_to_notes
    AFTER UPDATE OF username ON users
    FOR EACH ROW
    EXECUTE FUNCTION sync_username_to_notes();

-- 验证数据是否正确更新
SELECT n.id, n.content, n.username, u.username as user_username
FROM notes n
JOIN users u ON n.user_id = u.id
LIMIT 10; 