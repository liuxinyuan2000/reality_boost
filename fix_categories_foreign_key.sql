-- 修复categories表的外键引用
-- 将外键从auth.users改为users表

-- 1. 首先删除现有的外键约束
ALTER TABLE categories 
DROP CONSTRAINT IF EXISTS categories_user_id_fkey;

-- 2. 重新添加正确的外键约束，指向我们的users表
ALTER TABLE categories 
ADD CONSTRAINT categories_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 3. 验证修复结果
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'categories'
    AND kcu.column_name = 'user_id'; 