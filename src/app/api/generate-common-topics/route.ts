import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../supabaseClient';
// 高德API调用辅助
interface Location { lat: number; lng: number }
interface Poi { name: string; type: string; address: string }
async function fetchNearbyPOIs(location: Location | null): Promise<Poi[]> {
  const AMAP_KEY = process.env.AMAP_KEY;
  if (!AMAP_KEY || !location || !location.lat || !location.lng) return [];
  const locationStr = `${location.lng},${location.lat}`;
  const types = '110000|120000|050000'; // 景点|展览|美食
  const url = `https://restapi.amap.com/v3/place/around?key=${AMAP_KEY}&location=${locationStr}&radius=2000&types=${types}&offset=5`;
  console.log('[DEBUG] AMAP fetch url:', url);
  try {
    const resp = await fetch(url);
    const amapData = await resp.json();
    console.log('[DEBUG] AMAP raw response:', JSON.stringify(amapData));
    if (amapData.status === '1' && Array.isArray(amapData.pois)) {
      return amapData.pois.map((poi: any) => ({
        name: poi.name,
        type: poi.type,
        address: poi.address
      }));
    }
  } catch (e) {
    console.error('[AMAP] 获取地标失败:', e);
  }
  return [];
}

export async function POST(req: NextRequest) {
  const { currentUserId, targetUserId, location } = await req.json(); // location 可能为 { lat, lng } 或 null
  console.log('[DEBUG] 接收到 location:', location);
  
  if (!currentUserId || !targetUserId) {
    return NextResponse.json({ 
      success: false, 
      error: '缺少用户ID参数' 
    }, { status: 400 });
  }

  try {
    // 并行获取两个用户的笔记
    const [currentUserNotes, targetUserNotes, currentUser, targetUser
      , nearbyPOIs
    ] = await Promise.all([
      supabase
        .from('notes')
        .select('content')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('notes')
        .select('content')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('users')
        .select('username')
        .eq('id', currentUserId)
        .single(),
      supabase
        .from('users')
        .select('username')
        .eq('id', targetUserId)
        .single(),
      fetchNearbyPOIs(location)
    ]);

    if (currentUserNotes.error) {
      console.error('[COMMON-TOPICS] 获取当前用户笔记失败:', currentUserNotes.error);
      return NextResponse.json({ 
        success: false, 
        error: '获取当前用户笔记失败' 
      }, { status: 500 });
    }

    if (targetUserNotes.error) {
      console.error('[COMMON-TOPICS] 获取目标用户笔记失败:', targetUserNotes.error);
      return NextResponse.json({ 
        success: false, 
        error: '获取目标用户笔记失败' 
      }, { status: 500 });
    }

    const currentNotesText = currentUserNotes.data?.map((n: any) => n.content).join('\n') || '';
    const targetNotesText = targetUserNotes.data?.map((n: any) => n.content).join('\n') || '';
    let localInfo = '';
    if (Array.isArray(nearbyPOIs) && nearbyPOIs.length > 0) {
      localInfo = '你们附近有这些热门地标/活动（含类型和地址）：\n' + nearbyPOIs.map((p, idx) => `${idx+1}. ${p.name}（${p.type}，${p.address}）`).join('\\n');
      console.log('[DEBUG] nearbyPOIs:', nearbyPOIs);
      console.log('[DEBUG] localInfo for prompt:', localInfo);
    }

    // 构造AI提示
    const prompt = `请像一个很懂人、很会玩的朋友，基于以下两位用户的历史笔记内容，深度分析他们的兴趣、性格、表达风格和潜在联系，发现他们自己都没意识到的有趣细节、反差、习惯或隐藏的共同点。然后结合他们当前的地理位置和附近真实地标/活动，给出5个新奇、好玩、个性化的本地生活建议。每个建议包含：
- title：一句有趣的标题
- insight：你发现的有趣细节/联系/反差（比如“你们都喜欢在笔记里自问自答，其实都挺会自娱自乐”）
- suggestion：结合本地生活的好玩建议/任务/体验（如“你们可以一起去xxx公园玩角色扮演，体验自娱自乐的乐趣”）
- source：一句话说明推荐原因（如“你们都在笔记中表现出xxx，但可能没意识到”）

要求：
- 洞察要有创意、有脑洞、有点“懂你”的感觉，让人觉得“被看见”
- 建议要结合附近真实地标/活动，具体到地标/店名
- 建议要新奇、好玩、能让两个人一起体验或比拼
- 不要输出任何代码块、注释或多余内容，只返回如下JSON格式：

{
  "topics": [
    {
      "title": "有趣标题",
      "insight": "有趣的洞察/联系/反差",
      "suggestion": "结合本地生活的好玩建议/任务/体验",
      "source": "推荐原因说明"
    }
  ]
}

${localInfo}

${currentUser?.data?.username || '用户1'}的笔记：
${currentNotesText || '暂无笔记'}

${targetUser?.data?.username || '用户2'}的笔记：
${targetNotesText || '暂无笔记'}`;

    // 调用Kimi API（带超时）
    const apiKey = process.env.KIMI_API_KEY;
    if (!apiKey) {
      console.error('[COMMON-TOPICS] 缺少 KIMI_API_KEY 环境变量');
      return NextResponse.json({ 
        success: false, 
        error: '缺少 Kimi API Key' 
      }, { status: 500 });
    }

    console.log('[COMMON-TOPICS] KIMI_API_KEY 前10:', apiKey.substring(0, 10));
    console.log('[COMMON-TOPICS] prompt:', prompt.substring(0, 200));

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
          model: 'moonshot-v1-8k',
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
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('[COMMON-TOPICS] Kimi API 响应状态:', response.status);

      const rawText = await response.text();
      console.log('[COMMON-TOPICS] Kimi API 原始响应:', rawText.substring(0, 500));

      if (!response.ok) {
        console.error('[COMMON-TOPICS] Kimi API 错误:', response.status, rawText);
        return NextResponse.json({ 
          success: false, 
          error: 'Kimi API 调用失败',
          details: rawText
        }, { status: response.status });
      }

      let data;
      try {
        data = JSON.parse(rawText);
      } catch (e) {
        console.error('[COMMON-TOPICS] Kimi API 响应 JSON 解析失败:', e, rawText);
        return NextResponse.json({ 
          success: false, 
          error: 'Kimi API 响应 JSON 解析失败',
          details: rawText
        }, { status: 500 });
      }

      const aiResponse = data.choices?.[0]?.message?.content || '';
      let topics = [];
      try {
        let parsed = aiResponse.trim();
        // 去除 BOM
        if (parsed.charCodeAt(0) === 0xFEFF) {
          parsed = parsed.slice(1);
        }
        // 去除 markdown 代码块包裹
        parsed = parsed.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '').trim();
        parsed = JSON.parse(parsed);
        if (typeof parsed === 'string') {
          parsed = JSON.parse(parsed);
        }
        if (Array.isArray(parsed.topics)) {
          topics = parsed.topics;
        } else {
          throw new Error('topics 不是数组');
        }
      } catch (e) {
        // 容错：用正则提取 "topics": [ ... ] 里的内容
        console.error('[COMMON-TOPICS] 解析AI话题失败:', e, aiResponse);
        const cleaned = aiResponse.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '');
        const match = cleaned.match(/"topics"\s*:\s*(\[[\s\S]*?\])/);
        if (match) {
          try {
            topics = JSON.parse(match[1]);
          } catch (e2) {
            console.error('[COMMON-TOPICS] 正则提取topics再次解析失败:', e2, match[1]);
            topics = [
              {
                title: "笔记分享",
                insight: "你们都在用Reality Note记录生活，说明都很重视自我表达。",
                suggestion: "可以互相分享一条最近的笔记，聊聊各自的记录习惯。",
                source: "你们都在用同一个笔记应用"
              }
            ];
          }
        } else {
          topics = [
            {
              title: "笔记分享",
              insight: "你们都在用Reality Note记录生活，说明都很重视自我表达。",
              suggestion: "可以互相分享一条最近的笔记，聊聊各自的记录习惯。",
              source: "你们都在用同一个笔记应用"
            }
          ];
        }
      }

      return NextResponse.json({ 
        success: true, 
        topics,
        currentUser: currentUser?.data?.username,
        targetUser: targetUser?.data?.username
      });

    } catch (error) {
      clearTimeout(timeoutId);
      console.error('[COMMON-TOPICS] Kimi API 调用异常:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Kimi API 调用异常',
        details: error instanceof Error ? error.message : '未知错误'
      }, { status: 500 });
    }

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({ 
        success: false, 
        error: '请求超时，请稍后重试' 
      }, { status: 408 });
    }
    console.error('[COMMON-TOPICS] 生成共同话题时发生错误:', error);
    return NextResponse.json({ 
      success: false, 
      error: '生成共同话题时发生错误',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
} 