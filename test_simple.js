async function testSimple() {
  console.log('🚀 开始简单性能测试...\n');

  const baseUrl = 'http://localhost:3000/api';
  const userId = 'troy';

  // 测试AI聊天API
  console.log('📝 测试AI聊天API...');
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${baseUrl}/ai-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        message: '你好',
      })
    });
    
    const data = await response.json();
    const time = Date.now() - startTime;
    
    console.log(`✅ 响应时间: ${time}ms`);
    console.log(`📄 回复: ${data.reply?.substring(0, 50)}...`);
    console.log(`📊 状态: ${response.status}`);
  } catch (error) {
    console.log(`❌ 测试失败: ${error.message}`);
  }

  console.log('\n🎉 测试完成！');
}

// 运行测试
testSimple().catch(console.error); 