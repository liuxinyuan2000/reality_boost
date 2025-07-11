async function testKimiCorrect() {
  console.log('🔍 测试正确的 Kimi API 配置...\n');

  const kimiKey = 'sk-ZI2mRiT2Ev3fl3A1lbVG1f8j1Umw9XmX6UVBVz7E9RPSAavV';

  // 测试不同的配置
  const configs = [
    {
      name: 'Moonshot API',
      url: 'https://api.moonshot.cn/v1/chat/completions',
      body: {
        model: 'moonshot-v1-8k',
        messages: [
          { role: 'user', content: '你好' }
        ],
        temperature: 0.5,
        max_tokens: 100
      }
    },
    {
      name: 'Kimi API (简化)',
      url: 'https://kimi.moonshot.cn/v1/chat/completions',
      body: {
        model: 'moonshot-v1-8k',
        messages: [
          { role: 'user', content: '你好' }
        ],
        temperature: 0.5,
        max_tokens: 100
      }
    }
  ];

  for (const config of configs) {
    console.log(`📡 测试 ${config.name}...`);
    const startTime = Date.now();
    
    try {
      const response = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${kimiKey}`,
        },
        body: JSON.stringify(config.body)
      });

      const data = await response.json();
      const time = Date.now() - startTime;
      
      console.log(`✅ 响应时间: ${time}ms`);
      console.log(`📊 状态码: ${response.status}`);
      console.log(`📄 回复: ${data.choices?.[0]?.message?.content || data.error || '无回复'}`);
      
      if (response.ok) {
        console.log(`✅ ${config.name} 工作正常！`);
        return config;
      }
    } catch (error) {
      console.log(`❌ ${config.name} 失败: ${error.message}`);
    }
    
    console.log('');
  }

  return null;
}

testKimiCorrect().then((workingConfig) => {
  if (workingConfig) {
    console.log('\n🎉 找到可用的配置:', workingConfig.name);
  } else {
    console.log('\n❌ 没有找到可用的Kimi配置');
  }
}).catch(console.error); 