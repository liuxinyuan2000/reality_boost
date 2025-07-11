async function testKimiEndpoints() {
  console.log('🔍 测试不同的 Kimi API 端点...\n');

  const kimiKey = 'sk-ZI2mRiT2Ev3fl3A1lbVG1f8j1Umw9XmX6UVBVz7E9RPSAavV';
  const testMessage = '你好';

  const endpoints = [
    {
      name: 'Chat Messages',
      url: 'https://kimi.moonshot.cn/api/chat-messages',
      body: {
        messages: [{ role: 'user', content: testMessage }],
        model: 'moonshot-v1-8k',
        stream: false,
        temperature: 0.5,
        max_tokens: 100
      }
    },
    {
      name: 'Chat Completions',
      url: 'https://kimi.moonshot.cn/v1/chat/completions',
      body: {
        model: 'moonshot-v1-8k',
        messages: [{ role: 'user', content: testMessage }],
        temperature: 0.5,
        max_tokens: 100
      }
    },
    {
      name: 'API Chat',
      url: 'https://kimi.moonshot.cn/api/chat',
      body: {
        messages: [{ role: 'user', content: testMessage }],
        model: 'moonshot-v1-8k',
        stream: false,
        temperature: 0.5,
        max_tokens: 100
      }
    }
  ];

  for (const endpoint of endpoints) {
    console.log(`📡 测试 ${endpoint.name}...`);
    const startTime = Date.now();
    
    try {
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${kimiKey}`,
        },
        body: JSON.stringify(endpoint.body)
      });

      const data = await response.json();
      const time = Date.now() - startTime;
      
      console.log(`✅ 响应时间: ${time}ms`);
      console.log(`📊 状态码: ${response.status}`);
      console.log(`📄 回复: ${data.choices?.[0]?.message?.content || data.message || '无回复'}`);
      
      if (response.ok) {
        console.log(`✅ ${endpoint.name} 工作正常！`);
        break;
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name} 失败: ${error.message}`);
    }
    
    console.log('');
  }
}

testKimiEndpoints().catch(console.error); 