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
    .limit(20); // 取最近20条

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
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超时

  try {
    const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${kimiKey}`,
      },
      body: JSON.stringify({
        model: 'moonshot-v1-32k',
        messages: [
          { 
            role: 'system', 
            content: '你是一个基于用户历史笔记的AI助手。请仔细分析用户的笔记内容，结合互联网的信息和笔记中的信息来回答用户的问题。回答要根据问题来判断需不需要体现对用户历史记录的理解，不要直接引用笔记内容。' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500
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
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('⏰ Kimi API 调用超时');
      throw new Error('AI服务响应超时，请稍后重试');
    }
    console.error('❌ Kimi API 调用异常:', error instanceof Error ? error.message : '未知错误');
    throw error;
  }
}

// 处理@提及的文件夹引用
async function processMentionedFolders(mentions: any[], userId: string) {
  if (!mentions || mentions.length === 0) {
    return '';
  }

  const contextParts = [];
  
  for (const mention of mentions) {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/folder-content?folderId=${mention.folderId}&requesterId=${userId}`
      );
      
      if (response.ok) {
        const data = await response.json();
        contextParts.push(
          `\n\n## 引用：${data.folder.owner.username} 的「${data.folder.name}」文件夹内容：\n${data.contextContent}`
        );
      }
    } catch (error) {
      console.error('获取文件夹内容失败:', error);
    }
  }
  
  return contextParts.join('');
}

export async function POST(req: NextRequest) {
  const { userId, message, location, mentions } = await req.json();
  if (!userId || !message) {
    return NextResponse.json({ error: '缺少 userId 或 message' }, { status: 400 });
  }

  try {
    // 获取相关笔记
    const notesText = await getRelevantNotes(userId, message);

    // 处理@提及的文件夹
    const mentionedContext = await processMentionedFolders(mentions || [], userId);

    // 构建更丰富的上下文
    let contextParts = [];
    
    if (notesText) {
      contextParts.push(`用户的历史笔记：\n${notesText}`);
    }
    
    if (mentionedContext) {
      contextParts.push(mentionedContext);
    }
    
    const context = contextParts.join('\n\n');

    // 改进的 prompt，支持好友文件夹引用
    const prompt = mentions && mentions.length > 0 
      ? `用户在对话中引用了好友的文件夹内容作为参考。请基于用户自己的历史笔记和引用的好友文件夹内容来回答问题。

${context || '暂无参考内容'}

用户当前问题：${message}

请综合考虑用户自己的历史记录和引用的好友内容来回答，要自然地体现对这些信息的理解和关联。回答控制在200字以内。`
      : `基于用户的历史笔记内容，回答用户的问题。

${context || '暂无历史笔记'}

用户当前问题：${message}

请基于用户的历史笔记内容来回答，体现对用户过去记录的理解。回答要自然、有针对性，控制在150字以内。`;
    
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
      notesCount: notesText ? notesText.split('\n').length : 0,
      mentionsCount: mentions ? mentions.length : 0,
      hasMentions: !!(mentions && mentions.length > 0)
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