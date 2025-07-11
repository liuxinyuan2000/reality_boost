async function testSimpleKimi() {
  console.log('🔍 简单测试 Kimi API...\n');

  const kimiKey = 'sk-ZI2mRiT2Ev3fl3A1lbVG1f8j1Umw9XmX6UVBVz7E9RPSAavV';

  // 测试不同的端点
  const endpoints = [
    'https://kimi.moonshot.cn/v1/chat/completions',
    'https://api.moonshot.cn/v1/chat/completions',
    'https://kimi.moonshot.cn/api/chat/completions'
  ];

  for (const endpoint of endpoints) {
    console.log(`📡 测试端点: ${endpoint}`);
    
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${kimiKey}`,
        }
      });

      console.log(`📊 状态码: ${response.status}`);
      console.log(`📄 Content-Type: ${response.headers.get('content-type')}`);
      
      if (response.status === 200) {
        console.log('✅ 端点可访问');
      } else if (response.status === 404) {
        console.log('❌ 端点不存在');
      } else {
        console.log(`⚠️ 其他状态: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ 错误: ${error.message}`);
    }
    
    console.log('');
  }
}

testSimpleKimi().catch(console.error); 