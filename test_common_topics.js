import fetch from 'node-fetch';

// 两个测试用户ID（请替换为实际存在且有笔记的用户ID）
const currentUserId = '2ca7b3ea-382b-4409-aaeb-932ea1e45afc'; // troy123
const targetUserId = '2bd56afb-14bd-45fe-b70e-0407a34c4ae6'; // troy

async function testGenerateCommonTopics() {
  console.log('🧪 测试生成共同话题接口...\n');

  try {
    const response = await fetch('http://localhost:3000/api/generate-common-topics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentUserId, targetUserId })
    });
    const data = await response.json();
    console.log('API 返回内容:', JSON.stringify(data, null, 2));
    if (!data.success) {
      console.error('❌ 生成共同话题失败:', data.error, data.details || '');
    } else {
      console.log('✅ 生成共同话题成功!');
      if (data.topics && data.topics.length > 0) {
        data.topics.forEach((topic, i) => {
          console.log(`  ${i + 1}. ${topic.title} - ${topic.description}`);
        });
      } else {
        console.log('⚠️  没有生成任何话题');
      }
    }
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

testGenerateCommonTopics(); 