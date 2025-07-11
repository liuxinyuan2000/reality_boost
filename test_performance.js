const fetch = require('node-fetch');

async function testPerformance() {
  console.log('🚀 开始性能测试...\n');

  const baseUrl = 'http://localhost:3000/api';
  const userId = 'troy'; // 使用现有用户

  // 测试AI聊天API
  console.log('📝 测试AI聊天API...');
  const startTime1 = Date.now();
  
  try {
    const chatResponse = await fetch(`${baseUrl}/ai-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        message: '你好，今天天气怎么样？',
        location: { lat: 22.3193, lng: 114.1694 } // 香港坐标
      })
    });
    
    const chatData = await chatResponse.json();
    const chatTime = Date.now() - startTime1;
    
    console.log(`✅ AI聊天响应时间: ${chatTime}ms`);
    console.log(`📄 回复内容: ${chatData.reply?.substring(0, 50)}...`);
  } catch (error) {
    console.log(`❌ AI聊天测试失败: ${error.message}`);
  }

  // 测试标签生成API
  console.log('\n🏷️ 测试标签生成API...');
  const startTime2 = Date.now();
  
  try {
    const tagsResponse = await fetch(`${baseUrl}/generate-tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    
    const tagsData = await tagsResponse.json();
    const tagsTime = Date.now() - startTime2;
    
    console.log(`✅ 标签生成响应时间: ${tagsTime}ms`);
    console.log(`🏷️ 生成标签数量: ${tagsData.tags?.length || 0}`);
  } catch (error) {
    console.log(`❌ 标签生成测试失败: ${error.message}`);
  }

  // 测试共同话题生成API
  console.log('\n💬 测试共同话题生成API...');
  const startTime3 = Date.now();
  
  try {
    const topicsResponse = await fetch(`${baseUrl}/generate-common-topics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        currentUserId: userId, 
        targetUserId: userId 
      })
    });
    
    const topicsData = await topicsResponse.json();
    const topicsTime = Date.now() - startTime3;
    
    console.log(`✅ 共同话题生成响应时间: ${topicsTime}ms`);
    console.log(`💬 生成话题数量: ${topicsData.topics?.length || 0}`);
  } catch (error) {
    console.log(`❌ 共同话题生成测试失败: ${error.message}`);
  }

  console.log('\n🎉 性能测试完成！');
}

// 运行测试
testPerformance().catch(console.error); 