async function testTimeout() {
  console.log('⏱️ 测试超时机制...\n');

  const baseUrl = 'http://localhost:3000/api';
  const userId = 'troy';

  // 测试快速响应
  console.log('🚀 测试快速响应...');
  const startTime1 = Date.now();
  
  try {
    const response1 = await fetch(`${baseUrl}/ai-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        message: '你好',
      })
    });
    
    const data1 = await response1.json();
    const time1 = Date.now() - startTime1;
    
    console.log(`✅ 响应时间: ${time1}ms`);
    console.log(`📄 回复: ${data1.reply}`);
    console.log(`🔄 是否使用备选: ${data1.fallback ? '是' : '否'}`);
    console.log(`📝 备注: ${data1.note || '无'}`);
  } catch (error) {
    console.log(`❌ 测试失败: ${error.message}`);
  }

  // 测试超时触发
  console.log('\n⏰ 测试超时触发...');
  const startTime2 = Date.now();
  
  try {
    const response2 = await fetch(`${baseUrl}/ai-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        message: '请给我一个很长的回答，包含很多细节和例子',
      })
    });
    
    const data2 = await response2.json();
    const time2 = Date.now() - startTime2;
    
    console.log(`✅ 响应时间: ${time2}ms`);
    console.log(`📄 回复: ${data2.reply}`);
    console.log(`🔄 是否使用备选: ${data2.fallback ? '是' : '否'}`);
    console.log(`📝 备注: ${data2.note || '无'}`);
  } catch (error) {
    console.log(`❌ 测试失败: ${error.message}`);
  }

  console.log('\n🎉 超时测试完成！');
}

testTimeout().catch(console.error); 