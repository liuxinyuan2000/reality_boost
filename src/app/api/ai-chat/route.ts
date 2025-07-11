import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../supabaseClient';

interface Note {
  content: string;
  created_at: string;
}

// 智能选择相关笔记（简化版：直接取最近10条）
async function getRelevantNotes(userId: string, message: string) {
  const { data: notes, error } = await supabase
    .from('notes')
    .select('content, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10); // 取最近10条

  console.log('[AI-CHAT] getRelevantNotes userId:', userId, 'message:', message);
  if (error) {
    console.error('[AI-CHAT] 查询notes出错:', error);
  }
  console.log('[AI-CHAT] 查到的notes:', notes);

  if (error || !notes) {
    return '';
  }

  // 直接返回最近10条笔记，不做相关性匹配
  console.log('[AI-CHAT] 直接使用最近10条notes:', notes);
  return notes.map((n: Note) => n.content).join('\n');
}

// 快速本地响应（作为备选）
function getQuickResponse(message: string) {
  const quickResponses = {
    '你好': '你好！有什么可以帮你的吗？',
    '天气': '今天天气不错，适合出门走走。',
    '工作': '工作要劳逸结合，注意休息。',
    '学习': '学习是一个持续的过程，加油！',
    '吃饭': '记得按时吃饭，保持健康。',
    '睡觉': '早点休息，明天会更好。'
  };

  for (const [key, response] of Object.entries(quickResponses)) {
    if (message.includes(key)) {
      return response;
    }
  }
  
  return '我理解你的想法，继续加油！';
}

// 调用Kimi API (Moonshot)
async function callKimiAPI(prompt: string) {
  const kimiKey = process.env.KIMI_API_KEY;
  if (!kimiKey) {
    console.error('缺少 KIMI_API_KEY 环境变量');
    throw new Error('缺少 Kimi API Key');
  }

  console.log('🔑 使用 Kimi API Key:', kimiKey.substring(0, 10) + '...');
  console.log('📝 Prompt:', prompt.substring(0, 100) + '...');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8秒超时

  try {
    const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${kimiKey}`,
      },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        messages: [
          { 
            role: 'system', 
            content: '你是一个基于用户历史笔记的AI助手。请仔细分析用户的笔记内容，结合笔记中的信息来回答用户的问题。回答要体现对用户历史记录的理解，但不要直接引用笔记内容。' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 200
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
    console.log('✅ Kimi API 成功响应');
    return data.choices?.[0]?.message?.content || 'Kimi 没有返回内容';
  } catch (error) {
    console.error('❌ Kimi API 调用异常:', error instanceof Error ? error.message : '未知错误');
    throw error;
  }
}

export async function POST(req: NextRequest) {
  const { userId, message, location } = await req.json();
  if (!userId || !message) {
    return NextResponse.json({ error: '缺少 userId 或 message' }, { status: 400 });
  }

  try {
    // 获取相关笔记
    const notesText = await getRelevantNotes(userId, message);

    // 改进的 prompt，更明确地指导 AI 基于笔记回答
    const prompt = `基于用户的历史笔记内容，回答用户的问题。\n\n用户的历史笔记：\n${notesText || '暂无历史笔记'}\n\n用户当前问题：${message}\n\n请基于用户的历史笔记内容来回答，体现对用户过去记录的理解。回答要自然、有针对性，控制在150字以内。`;
    console.log('[AI-CHAT] 最终发给AI的prompt:', prompt);

    const startTime = Date.now();
    let reply: string;
    let apiUsed: string = 'Kimi';

    try {
      reply = await callKimiAPI(prompt);
    } catch (error) {
      console.error('Kimi API 错误:', error);
      reply = getQuickResponse(message);
      apiUsed = 'Local Fallback';
    }

    const responseTime = Date.now() - startTime;

    return NextResponse.json({ 
      reply,
      apiUsed,
      responseTime,
      fallback: apiUsed === 'Local Fallback',
      notesCount: notesText ? notesText.split('\n').length : 0
    });

  } catch (error) {
    console.error('AI聊天错误:', error);
    const quickReply = getQuickResponse(message);
    return NextResponse.json({ 
      reply: quickReply,
      apiUsed: 'Local Fallback',
      responseTime: 0,
      fallback: true
    });
  }
} 