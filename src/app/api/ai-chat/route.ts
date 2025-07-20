import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../supabaseClient';

interface Location { lat: number; lng: number }
interface Poi { name: string; type: string; address: string; distance?: string }

interface Note {
  content: string;
  created_at: string;
}

// 获取附近POI信息（针对AI对话优化）
async function fetchNearbyPOIsFull(location: Location): Promise<Poi[]> {
  const AMAP_KEY = process.env.AMAP_KEY;
  if (!AMAP_KEY || !location || !location.lat || !location.lng) return [];
  
  const locationStr = `${location.lng},${location.lat}`;
  // 扩大搜索范围，包含更多类型
  const types = '110000|050000|070000|060000|080000|120000|130000|140000|150000|160000|170000|180000|190000'; 
  const url = `https://restapi.amap.com/v3/place/around?key=${AMAP_KEY}&location=${locationStr}&radius=2000&types=${types}&offset=15&extensions=all`;
  
  console.log('[AI-CHAT] AMAP fetch url:', url);
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Reality-Note/1.0'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!resp.ok) {
      console.error('[AI-CHAT] AMAP HTTP错误:', resp.status, resp.statusText);
      return [];
    }
    
    const amapData = await resp.json();
    console.log('[AI-CHAT] AMAP 响应:', JSON.stringify(amapData).substring(0, 500));
    
    if (amapData.status === '1' && Array.isArray(amapData.pois)) {
      // 优先保留有用的POI类型
      const filteredPois = amapData.pois.filter((poi: any) => {
        const type = poi.type || '';
        const name = poi.name || '';
        
        // 优先关键词
        const priorityKeywords = [
          '公园', '广场', '景点', '博物馆', '美术馆', '艺术馆', '展览馆', '文化',
          '餐厅', '咖啡', '奶茶', '商场', '购物', '超市', '百货',
          '地铁', '公交', '车站', '医院', '银行', '学校', '大学'
        ];
        
        // 排除不相关的
        const excludeKeywords = [
          '停车', '维修', '洗车', '加油', '厕所', '垃圾'
        ];
        
        const hasExclude = excludeKeywords.some(keyword => 
          type.includes(keyword) || name.includes(keyword)
        );
        
        const hasPriority = priorityKeywords.some(keyword => 
          type.includes(keyword) || name.includes(keyword)
        );
        
        return !hasExclude && (hasPriority || poi.distance < 1000); // 1公里内或优先地点
      });
      
      return filteredPois.slice(0, 10).map((poi: any) => ({
        name: poi.name,
        type: poi.type,
        address: poi.address || '',
        distance: poi.distance ? `${Math.round(poi.distance)}米` : undefined
      }));
    }
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      console.error('[AI-CHAT] AMAP 请求超时');
    } else {
      console.error('[AI-CHAT] 获取POI失败:', e);
    }
  }
  return [];
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
    
    // 添加位置信息和附近POI
    let locationInfo = '';
    if (location && location.lat && location.lng) {
      locationInfo = `\n\n用户当前位置：纬度 ${location.lat}，经度 ${location.lng}`;
      console.log('[AI-CHAT] 用户分享了位置信息:', location);
      
      // 获取附近POI信息
      try {
        const nearbyPOIs = await fetchNearbyPOIsFull(location);
        if (nearbyPOIs.length > 0) {
                     const poiInfo = nearbyPOIs.map((poi: Poi, index: number) => 
             `${index + 1}. ${poi.name}（${poi.type}，距离约${poi.distance || '未知'}）`
           ).join('\n');
          locationInfo += `\n\n附近地点信息：\n${poiInfo}`;
          console.log('[AI-CHAT] 获取到附近POI:', nearbyPOIs.length, '个');
        }
      } catch (error) {
        console.error('[AI-CHAT] 获取附近POI失败:', error);
      }
    }
    
    const context = contextParts.join('\n\n') + locationInfo;

    // 改进的 prompt，支持好友文件夹引用和位置信息
    const hasLocationInfo = location && location.lat && location.lng;
    const hasMentions = mentions && mentions.length > 0;
    
    const prompt = hasLocationInfo || hasMentions
      ? `用户在对话中${hasLocationInfo ? '分享了位置信息' : ''}${hasLocationInfo && hasMentions ? '并' : ''}${hasMentions ? '引用了好友的文件夹内容' : ''}作为参考。请基于用户自己的历史笔记${hasLocationInfo ? '、位置信息' : ''}${hasMentions ? '和引用的好友文件夹内容' : ''}来回答问题。

${context || '暂无参考内容'}

用户当前问题：${message}

请综合考虑所有提供的信息来回答${hasLocationInfo ? '，如果位置信息相关，可以提供基于地理位置的建议' : ''}，要自然地体现对这些信息的理解和关联。回答控制在200字以内。`
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