import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../supabaseClient';

export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  if (!userId) {
    return NextResponse.json({ success: false, error: '缺少用户ID' }, { status: 400 });
  }

  // 获取用户最近的20条笔记
  const { data: notes, error } = await supabase
    .from('notes')
    .select('content')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ success: false, error: '获取笔记失败' }, { status: 500 });
  }

  const notesText = notes?.map((n: any) => n.content).join('\n') || '';

  // 构造GPT-4o prompt
  const prompt = `你是一位善于用简洁有趣的标签总结用户状态的算命先生。请根据以下用户最近的笔记内容，生成10-20个能细节反映用户当前状态但不泄露隐私的标签。标签可以是情绪、兴趣、生活状态、玄学词汇、网络流行语等，要求：
- 不要出现具体人名、地名、公司名等隐私信息
- 每个标签不超过8个字
- 标签要有细节感，能体现用户的真实状态，但不要和笔记相似或者有关键词重叠
- 标签内容要适合年轻人，易于传播
- 只返回JSON数组，如：["标签1", "标签2", ...]，不要输出任何解释、前后缀、代码块、注释等多余内容，只能输出纯JSON数组

用户笔记：\n${notesText}`;

  // 调用OpenAI API
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ success: false, error: '缺少 OpenAI API Key' }, { status: 500 });
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: '你是一个善于用标签总结用户状态的AI助手。' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 400,
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  // 调试输出AI原始返回内容
  console.log('AI返回内容:', data.choices?.[0]?.message?.content);
  if (!response.ok) {
    return NextResponse.json({ success: false, error: 'OpenAI API 调用失败', detail: data }, { status: 500 });
  }

  let tags: string[] = [];
  try {
    tags = JSON.parse(data.choices?.[0]?.message?.content || '[]');
  } catch {
    tags = [];
  }

  // 返回标签数组
  return NextResponse.json({ success: true, tags: tags.map(t => ({ text: t })) });
} 