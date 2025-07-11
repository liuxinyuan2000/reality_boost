async function testNetworkLatency() {
  console.log('🌐 网络延迟测试...\n');

  const testUrls = [
    { name: 'DeepSeek API', url: 'https://api.deepseek.com/v1/chat/completions' },
    { name: 'OpenAI API', url: 'https://api.openai.com/v1/chat/completions' },
    { name: 'Vercel Edge', url: 'https://reality-note.vercel.app/api/ai-chat' },
    { name: 'Local Dev', url: 'http://localhost:3000/api/ai-chat' }
  ];

  for (const test of testUrls) {
    console.log(`📡 测试 ${test.name}...`);
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(test.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: 'hi' }],
          max_tokens: 10
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const time = Date.now() - startTime;
      console.log(`✅ ${test.name}: ${time}ms (状态: ${response.status})`);
    } catch (error) {
      const time = Date.now() - startTime;
      console.log(`❌ ${test.name}: ${time}ms (错误: ${error.message})`);
    }
  }

  console.log('\n📊 延迟分析:');
  console.log('- DeepSeek API: 网络延迟 + AI处理时间');
  console.log('- Vercel部署: 香港→美国→DeepSeek');
  console.log('- 国内服务器: 香港→国内→DeepSeek');
  console.log('- 本地开发: 本地→DeepSeek');
}

testNetworkLatency().catch(console.error); 