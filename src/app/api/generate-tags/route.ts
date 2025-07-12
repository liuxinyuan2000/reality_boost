import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../supabaseClient';

export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  if (!userId) {
    return NextResponse.json({ success: false, error: '缺少用户ID' }, { status: 400 });
  }

  try {
    console.log('🏷️ 开始生成标签，用户ID:', userId);

    // 获取用户最近的15条笔记
    const { data: notes, error } = await supabase
      .from('notes')
      .select('content')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(15);

    if (error) {
      console.error('❌ 获取笔记失败:', error);
      return NextResponse.json({ success: false, error: '获取笔记失败' }, { status: 500 });
    }

    const notesText = notes?.map((n: any) => n.content).join('\n') || '';
    console.log('📝 获取到笔记数量:', notes?.length || 0);

    // 如果没有笔记，返回默认标签
    if (!notesText.trim()) {
      console.log('📝 用户暂无笔记，返回默认标签');
      return NextResponse.json({ 
        success: true, 
        tags: [
          { text: '新用户' },
          { text: '开始记录' },
          { text: '探索中' }
        ] 
      });
    }

    // 构造Kimi prompt
    const prompt = `你是一位善于用简洁有趣的标签总结用户状态的AI助手。请根据以下用户最近的笔记内容，生成8-12个能细节反映用户当前状态但不泄露隐私的标签。

要求：
- 不要出现具体人名、地名、公司名等隐私信息
- 每个标签不超过8个字
- 标签要有细节感，能体现用户的真实状态
- 标签内容要适合年轻人，易于传播
- 只返回JSON数组，如：["标签1", "标签2", ...]，不要输出任何解释、前后缀、代码块、注释等多余内容

用户笔记：
${notesText}

请生成标签：`;

    // 调用Kimi API
    const apiKey = process.env.KIMI_API_KEY;
    if (!apiKey) {
      console.error('❌ 缺少 KIMI_API_KEY 环境变量');
      return NextResponse.json({ success: false, error: '缺少 Kimi API Key' }, { status: 500 });
    }

    console.log('🔑 使用 Kimi API Key:', apiKey.substring(0, 10) + '...');
    console.log('📝 Prompt 长度:', prompt.length);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20秒超时

    try {
      const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'moonshot-v1-32k',
          messages: [
            { role: 'system', content: '你是一个善于用标签总结用户状态的AI助手。请只返回JSON数组格式的标签。' },
            { role: 'user', content: prompt },
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('📊 Kimi API 响应状态:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Kimi API 错误:', response.status, errorData);
        throw new Error(`Kimi API 调用失败: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content;
      
      console.log('✅ Kimi API 成功响应');
      console.log('📄 AI 原始返回内容:', aiResponse);

      if (!aiResponse) {
        throw new Error('AI 没有返回内容');
      }

      let tags: string[] = [];
      try {
        // 尝试解析 JSON
        tags = JSON.parse(aiResponse);
        
        // 确保 tags 是数组
        if (!Array.isArray(tags)) {
          throw new Error('AI 返回的不是数组格式');
        }
        
        // 过滤掉空字符串和无效标签
        tags = tags.filter(tag => typeof tag === 'string' && tag.trim().length > 0);
        
        console.log('🏷️ 解析成功，标签数量:', tags.length);
      } catch (parseError) {
        console.error('❌ JSON 解析失败:', parseError);
        console.log('📄 尝试解析的内容:', aiResponse);
        
        // 如果解析失败，尝试从文本中提取标签
        const fallbackTags = extractTagsFromText(aiResponse);
        tags = fallbackTags;
        console.log('🔄 使用备选解析，标签数量:', tags.length);
      }

      // 如果没有标签，返回默认标签
      if (tags.length === 0) {
        tags = ['探索者', '记录生活', '新开始'];
      }

      return NextResponse.json({ 
        success: true, 
        tags: tags.map(t => ({ text: t })),
        debug: {
          notesCount: notes?.length || 0,
          aiResponse: aiResponse.substring(0, 200) + '...'
        }
      });

    } catch (apiError) {
      clearTimeout(timeoutId);
      console.error('❌ Kimi API 调用异常:', apiError);
      
      // 返回默认标签
      return NextResponse.json({ 
        success: true, 
        tags: [
          { text: '探索者' },
          { text: '记录生活' },
          { text: '新开始' }
        ],
        fallback: true
      });
    }

  } catch (error) {
    console.error('❌ 标签生成错误:', error);
    return NextResponse.json({ 
      success: false, 
      error: '标签生成失败，请稍后重试',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// 从文本中提取标签的备选方法
function extractTagsFromText(text: string): string[] {
  const tags: string[] = [];
  
  // 尝试匹配方括号中的内容
  const bracketMatch = text.match(/\[(.*?)\]/);
  if (bracketMatch) {
    const content = bracketMatch[1];
    const items = content.split(',').map(item => item.trim().replace(/['"]/g, ''));
    tags.push(...items.filter(item => item.length > 0 && item.length <= 8));
  }
  
  // 尝试匹配引号中的内容
  const quoteMatches = text.match(/"([^"]+)"/g);
  if (quoteMatches) {
    const items = quoteMatches.map(match => match.replace(/"/g, ''));
    tags.push(...items.filter(item => item.length > 0 && item.length <= 8));
  }
  
  return tags.slice(0, 8); // 最多返回8个标签
} 