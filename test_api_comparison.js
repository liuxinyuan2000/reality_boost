async function testAPIComparison() {
  console.log('🔍 API性能对比测试...\n');

  const baseUrl = 'http://localhost:3000/api';
  const userId = 'troy';
  const testMessage = '你好，今天天气怎么样？';

  // 测试DeepSeek
  console.log('🔵 测试 DeepSeek API...');
  const deepseekStart = Date.now();
  
  try {
    const deepseekResponse = await fetch(`${baseUrl}/ai-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        message: testMessage,
        useKimi: false
      })
    });
    
    const deepseekData = await deepseekResponse.json();
    const deepseekTime = Date.now() - deepseekStart;
    
    console.log(`✅ DeepSeek 响应时间: ${deepseekTime}ms`);
    console.log(`📄 回复: ${deepseekData.reply?.substring(0, 50)}...`);
    console.log(`🔧 使用的API: ${deepseekData.apiUsed}`);
    console.log(`⏱️ 实际响应时间: ${deepseekData.responseTime}ms`);
  } catch (error) {
    console.log(`❌ DeepSeek 测试失败: ${error.message}`);
  }

  // 等待2秒
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 测试Kimi
  console.log('\n🟡 测试 Kimi API...');
  const kimiStart = Date.now();
  
  try {
    const kimiResponse = await fetch(`${baseUrl}/ai-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        message: testMessage,
        useKimi: true
      })
    });
    
    const kimiData = await kimiResponse.json();
    const kimiTime = Date.now() - kimiStart;
    
    console.log(`✅ Kimi 响应时间: ${kimiTime}ms`);
    console.log(`📄 回复: ${kimiData.reply?.substring(0, 50)}...`);
    console.log(`🔧 使用的API: ${kimiData.apiUsed}`);
    console.log(`⏱️ 实际响应时间: ${kimiData.responseTime}ms`);
  } catch (error) {
    console.log(`❌ Kimi 测试失败: ${error.message}`);
  }

  console.log('\n📊 性能对比总结:');
  console.log('- DeepSeek: 美国服务器，可能网络延迟较高');
  console.log('- Kimi: 国内服务器，网络延迟较低');
  console.log('- 建议: 根据实际测试结果选择更快的API');
}

testAPIComparison().catch(console.error); 