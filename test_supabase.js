const { createClient } = require('@supabase/supabase-js');

// 使用与前端相同的配置
const supabaseUrl = 'https://jkgtctfmndsqounskejk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprZ3RjdGZtbmRzcW91bnNrZWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMDk2OTksImV4cCI6MjA2Nzc4NTY5OX0.H-ijKsBtaSZ9qJdO5vglRbzYM6vunzlK-KNwBtAJDeY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabase() {
  console.log('🧪 开始测试 Supabase 数据保存...\n');

  // 测试用户ID（使用用户提供的UUID）
  const testUserId = '2ca7b3ea-382b-4409-aaeb-932ea1e45afc';

  try {
    // 1. 测试插入笔记
    console.log('📝 测试插入笔记...');
    const { data: insertData, error: insertError } = await supabase
      .from('notes')
      .insert([
        { 
          user_id: testUserId, 
          content: '这是一条测试笔记 - ' + new Date().toISOString() 
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.error('❌ 插入笔记失败:', insertError);
      return;
    }

    console.log('✅ 插入笔记成功:', insertData);

    // 2. 测试查询笔记
    console.log('\n📖 测试查询笔记...');
    const { data: queryData, error: queryError } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', testUserId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (queryError) {
      console.error('❌ 查询笔记失败:', queryError);
      return;
    }

    console.log('✅ 查询笔记成功，找到', queryData.length, '条笔记:');
    queryData.forEach((note, index) => {
      console.log(`  ${index + 1}. ${note.content} (${note.created_at})`);
    });

    // 3. 测试用户表
    console.log('\n👤 测试用户表...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, created_at')
      .limit(5);

    if (usersError) {
      console.error('❌ 查询用户失败:', usersError);
    } else {
      console.log('✅ 查询用户成功，找到', users.length, '个用户:');
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.username} (${user.id})`);
      });
    }

    console.log('\n🎉 Supabase 测试完成！');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

// 运行测试
testSupabase(); 