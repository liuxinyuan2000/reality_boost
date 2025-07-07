import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../supabaseClient';

export async function POST(req: NextRequest) {
  const { currentUserId, targetUserId } = await req.json();
  
  if (!currentUserId || !targetUserId) {
    return NextResponse.json({ 
      success: false, 
      error: '缺少用户ID参数' 
    }, { status: 400 });
  }

  try {
    // 获取当前用户的笔记
    const { data: currentUserNotes, error: currentError } = await supabase
      .from('notes')
      .select('content')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: true });

    if (currentError) {
      return NextResponse.json({ 
        success: false, 
        error: '获取当前用户笔记失败' 
      }, { status: 500 });
    }

    // 获取目标用户的笔记
    const { data: targetUserNotes, error: targetError } = await supabase
      .from('notes')
      .select('content')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: true });

    if (targetError) {
      return NextResponse.json({ 
        success: false, 
        error: '获取目标用户笔记失败' 
      }, { status: 500 });
    }

    // 获取用户信息
    const { data: currentUser } = await supabase
      .from('users')
      .select('username')
      .eq('id', currentUserId)
      .single();

    const { data: targetUser } = await supabase
      .from('users')
      .select('username')
      .eq('id', targetUserId)
      .single();

    const currentNotesText = currentUserNotes?.map((n: any) => n.content).join('\n') || '';
    const targetNotesText = targetUserNotes?.map((n: any) => n.content).join('\n') || '';

    // 构造AI提示
    const prompt = `分析两个用户的笔记内容，找出他们可能的共同话题和兴趣点。\n\n${currentUser?.username || '用户1'}的笔记：\n${currentNotesText || '暂无笔记'}\n\n${targetUser?.username || '用户2'}的笔记：\n${targetNotesText || '暂无笔记'}\n\n请分析这两位用户的笔记内容，找出3-5个可能的共同话题或兴趣点。每个话题应该：\n1. 基于两位用户的笔记内容，主语直接用用户名\n2. 具有实际讨论价值\n3. 能够促进用户之间的交流\n4. 不透露用户发的具体信息，可以比较隐晦地表达\n\n请以JSON格式返回，格式如下：\n{\n  "topics": [\n    {\n      "title": "话题标题",\n      "description": "话题描述",\n      "reasoning": "为什么认为这是共同话题"\n    }\n  ]\n}`;

    // 调用OpenAI API
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        success: false, 
        error: '缺少 OpenAI API Key' 
      }, { status: 500 });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { 
            role: 'system', 
            content: '你是一个善于分析用户兴趣和生成共同话题的AI助手。请基于用户的笔记内容，找出可能的共同话题。' 
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ 
        success: false, 
        error: 'OpenAI API 调用失败',
        details: data
      }, { status: response.status });
    }

    const aiResponse = data.choices?.[0]?.message?.content || '';
    
    // 尝试解析JSON响应
    let topics = [];
    try {
      const parsed = JSON.parse(aiResponse);
      topics = parsed.topics || [];
    } catch (e) {
      // 如果JSON解析失败，返回默认话题
      topics = [
        {
          title: "笔记分享",
          description: "你们都在使用Reality Note记录想法，可以分享各自的笔记心得",
          reasoning: "基于你们都使用相同的笔记应用"
        }
      ];
    }

    return NextResponse.json({ 
      success: true, 
      topics,
      currentUser: currentUser?.username,
      targetUser: targetUser?.username
    });

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: '生成共同话题时发生错误',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
} 