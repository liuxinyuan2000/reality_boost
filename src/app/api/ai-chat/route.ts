import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../supabaseClient';

export async function POST(req: NextRequest) {
  const { userId, message } = await req.json();
  if (!userId || !message) {
    return NextResponse.json({ error: '缺少 userId 或 message' }, { status: 400 });
  }

  // 拉取历史 note
  const { data: notes, error } = await supabase
    .from('notes')
    .select('content')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: '获取笔记失败' }, { status: 500 });
  }

  const notesText = notes?.map((n: any) => n.content).join('\n') || '';

  // 构造 prompt
  const prompt = `以下是我的所有笔记：\n${notesText}\n\n现在我想和你聊聊：${message}\n请结合我的所有笔记来回答。`;

  // 调用 OpenAI API
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: '缺少 OpenAI API Key' }, { status: 500 });
  }

  const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: '你是一个善于结合用户历史笔记进行对话的AI助手。' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 500,
    }),
  });

  const openaiData = await openaiRes.json();
  if (!openaiRes.ok) {
    console.error('OpenAI API error:', openaiData);
    return NextResponse.json({ error: 'OpenAI API 调用失败', detail: openaiData }, { status: 500 });
  }

  const reply = openaiData.choices?.[0]?.message?.content || 'AI 没有返回内容';
  return NextResponse.json({ reply });
} 