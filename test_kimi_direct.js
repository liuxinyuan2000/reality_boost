async function testKimiDirect() {
  console.log('🔍 直接测试 Kimi API...\n');

  const kimiKey = 'sk-ZI2mRiT2Ev3fl3A1lbVG1f8j1Umw9XmX6UVBVz7E9RPSAavV';

  try {
    const startTime = Date.now();
    
    const response = await fetch('https://kimi.moonshot.cn/api/chat-messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${kimiKey}`,
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: '你好，今天天气怎么样？' }
        ],
        model: 'moonshot-v1-8k',
        stream: false,
        temperature: 0.5,
        max_tokens: 100
      })
    });

    const data = await response.json();
    const time = Date.now() - startTime;
    
    console.log(`✅ Kimi API 响应时间: ${time}ms`);
    console.log(`📄 回复: ${data.choices?.[0]?.message?.content || '无回复'}`);
    console.log(`📊 状态码: ${response.status}`);
    console.log(`🔧 模型: ${data.model || '未知'}`);
  } catch (error) {
    console.log(`❌ Kimi API 测试失败: ${error.message}`);
  }
}

testKimiDirect().catch(console.error); 