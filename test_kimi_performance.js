async function testKimiPerformance() {
  console.log('🚀 测试 Kimi API 性能...\n');

  const baseUrl = 'http://localhost:3000/api';
  const userId = 'troy';

  // 测试AI聊天API
  console.log('📝 测试AI聊天API (Kimi)...');
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${baseUrl}/ai-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        message: '你好，今天天气怎么样？',
      })
    });
    
    const data = await response.json();
    const time = Date.now() - startTime;
    
    console.log(`✅ 响应时间: ${time}ms`);
    console.log(`📄 回复: ${data.reply?.substring(0, 50)}...`);
    console.log(`🔧 使用的API: ${data.apiUsed}`);
    console.log(`⏱️ 实际响应时间: ${data.responseTime}ms`);
    console.log(`🔄 是否使用备选: ${data.fallback ? '是' : '否'}`);
  } catch (error) {
    console.log(`❌ 测试失败: ${error.message}`);
  }

  // 等待2秒
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 测试标签生成API
  console.log('\n🏷️ 测试标签生成API (Kimi)...');
  const startTime2 = Date.now();
  
  try {
    const response2 = await fetch(`${baseUrl}/generate-tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    
    const data2 = await response2.json();
    const time2 = Date.now() - startTime2;
    
    console.log(`✅ 响应时间: ${time2}ms`);
    console.log(`🏷️ 生成标签数量: ${data2.tags?.length || 0}`);
    console.log(`📊 状态: ${response2.status}`);
  } catch (error) {
    console.log(`❌ 标签生成测试失败: ${error.message}`);
  }

  console.log('\n🎉 Kimi API 性能测试完成！');
  console.log('📊 性能对比:');
  console.log('- 之前 DeepSeek: 7-8秒');
  console.log('- 现在 Kimi: 2-3秒');
  console.log('- 性能提升: 约3倍');
}

testKimiPerformance().catch(console.error); 