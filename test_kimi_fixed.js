async function testKimiFixed() {
  console.log('🔍 测试修复后的 Kimi API...\n');

  const kimiKey = 'sk-ZI2mRiT2Ev3fl3A1lbVG1f8j1Umw9XmX6UVBVz7E9RPSAavV';

  try {
    const startTime = Date.now();
    
    const response = await fetch('https://kimi.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${kimiKey}`,
      },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        messages: [
          { role: 'system', content: '你是一个简洁的AI助手。请用简短的话回答用户问题。' },
          { role: 'user', content: '你好，今天天气怎么样？' }
        ],
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
    
    if (response.ok) {
      console.log('✅ Kimi API 工作正常！');
    } else {
      console.log('❌ Kimi API 调用失败');
    }
  } catch (error) {
    console.log(`❌ Kimi API 测试失败: ${error.message}`);
  }
}

testKimiFixed().catch(console.error); 