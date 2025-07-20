import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../supabaseClient';
// 高德API调用辅助
interface Location { lat: number; lng: number }
interface Poi { name: string; type: string; address: string }
async function fetchNearbyPOIs(location: Location | null): Promise<Poi[]> {
  const AMAP_KEY = process.env.AMAP_KEY;
  if (!AMAP_KEY || !location || !location.lat || !location.lng) return [];
  const locationStr = `${location.lng},${location.lat}`;
  // 专注吃喝玩乐：风景名胜|餐饮服务|生活服务|购物服务|体育休闲服务|商务住宅
  const types = '110000|050000|070000|060000|080000|120000'; 
  const url = `https://restapi.amap.com/v3/place/around?key=${AMAP_KEY}&location=${locationStr}&radius=3000&types=${types}&offset=15`;
  console.log('[DEBUG] AMAP fetch url:', url);
  try {
    // 添加超时控制 - 增加到10秒
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
    
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Reality-Note/1.0'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!resp.ok) {
      console.error('[AMAP] HTTP错误:', resp.status, resp.statusText);
      return [];
    }
    
    const amapData = await resp.json();
    console.log('[DEBUG] AMAP raw response:', JSON.stringify(amapData));
    if (amapData.status === '1' && Array.isArray(amapData.pois)) {
      // 专门筛选吃喝玩乐相关的POI
      const filteredPois = amapData.pois.filter((poi: any) => {
        const type = poi.type || '';
        const name = poi.name || '';
        
        console.log('[DEBUG] 检查POI:', name, '类型:', type);
        
        // 首先严格排除不想要的类型
        const excludeKeywords = [
          '住宅', '小区', '公寓', '写字楼', '办公', '楼盘',
          '医院', '诊所', '药店', '卫生', '医疗',
          '银行', '保险', '证券', 'ATM', '金融',
          '加油', '停车', '洗车', '维修', '汽车',
          '政府', '派出所', '法院', '工商', '税务', '机关',
          '学校', '幼儿园', '培训', '教育'
        ];
        
        // 如果包含排除关键词，直接过滤掉
        const hasExcludeKeyword = excludeKeywords.some(keyword => 
          type.includes(keyword) || name.includes(keyword)
        );
        
        if (hasExcludeKeyword) {
          console.log('[DEBUG] 排除POI:', name, '原因: 包含排除关键词');
          return false;
        }
        
        // 然后检查是否包含我们想要的关键词
        const includeKeywords = [
          '餐厅', '咖啡', '奶茶', '茶饮', '火锅', '烧烤', '日料', '西餐', '中餐', '小吃', '甜品', '美食',
          '酒吧', 'KTV', '电影院', '影院', '剧院', '演出', '音乐厅', '娱乐',
          '商场', '购物', '百货', '超市', 'mall', '广场',
          '公园', '景点', '博物馆', '美术馆', '艺术馆', '展览馆', '文化', '图书馆', '书店',
          '健身', '游泳', '瑜伽', '台球', '棋牌', '网吧', '游戏', '运动',
          '温泉', '按摩', 'SPA', '美容', '理发', '休闲',
          '酒店', '民宿', '青旅', '宾馆'
        ];
        
        const hasIncludeKeyword = includeKeywords.some(keyword => 
          type.includes(keyword) || name.includes(keyword)
        );
        
        if (hasIncludeKeyword) {
          console.log('[DEBUG] 保留POI:', name, '类型:', type);
          return true;
        } else {
          console.log('[DEBUG] 排除POI:', name, '原因: 不包含目标关键词');
          return false;
        }
      });
      
      return filteredPois.slice(0, 5).map((poi: any) => ({
        name: poi.name,
        type: poi.type,
        address: poi.address
      }));
    }
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      console.error('[COMMON-TOPICS] AMAP 请求超时，将生成通用话题');
    } else {
      console.error('[COMMON-TOPICS] 获取地标失败:', e);
    }
  }
  return []; // 返回空数组，让AI生成通用话题
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
    // 并行获取两个用户的笔记、用户信息、主题和附近POI
    const [currentUserNotes, targetUserNotes, currentUser, targetUser, 
      currentUserTheme, targetUserTheme, nearbyPOIs
    ] = await Promise.all([
      supabase
        .from('notes')
        .select('content')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(15),
      supabase
        .from('notes')
        .select('content')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(15),
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
      supabase
        .from('user_outing_themes')
        .select('theme_name, theme_description')
        .eq('user_id', currentUserId)
        .eq('is_active', true)
        .maybeSingle(),
      supabase
        .from('user_outing_themes')
        .select('theme_name, theme_description')
        .eq('user_id', targetUserId)
        .eq('is_active', true)
        .maybeSingle(),
      fetchNearbyPOIs(location)
    ]);

    // 检查用户是否存在
    const currentUserExists = currentUser?.data && !currentUser.error;
    const targetUserExists = targetUser?.data && !targetUser.error;
    
    // 检查用户是否有笔记
    const currentUserHasNotes = currentUserNotes?.data && currentUserNotes.data.length > 0 && !currentUserNotes.error;
    const targetUserHasNotes = targetUserNotes?.data && targetUserNotes.data.length > 0 && !targetUserNotes.error;

    const currentNotesText = currentUserHasNotes ? currentUserNotes.data?.map((n: any) => n.content).join('\n') || '' : '';
    const targetNotesText = targetUserHasNotes ? targetUserNotes.data?.map((n: any) => n.content).join('\n') || '' : '';
    
    // 处理用户主题信息
    const currentTheme = currentUserTheme?.data;
    const targetTheme = targetUserTheme?.data;
    
    let themeInfo = '';
    if (currentTheme || targetTheme) {
      themeInfo = '\n当前出门主题信息：\n';
      if (currentTheme) {
        themeInfo += `${currentUser?.data?.username || '用户1'}设置了主题："${currentTheme.theme_name}"（${currentTheme.theme_description}）\n`;
      }
      if (targetTheme) {
        themeInfo += `${targetUser?.data?.username || '用户2'}设置了主题："${targetTheme.theme_name}"（${targetTheme.theme_description}）\n`;
      }
      themeInfo += '请重点关注这些主题，生成相关的话题建议。\n';
    }
    
    let localInfo = '';
    if (Array.isArray(nearbyPOIs) && nearbyPOIs.length > 0) {
      localInfo = '你们附近有这些热门地标/活动（含类型和地址）：\n' + nearbyPOIs.map((p, idx) => `${idx+1}. ${p.name}（${p.type}，${p.address}）`).join('\\n');
      console.log('[DEBUG] nearbyPOIs:', nearbyPOIs);
      console.log('[DEBUG] localInfo for prompt:', localInfo);
    }

    // 根据用户状态构造不同的AI提示
    let prompt = '';
    let systemPrompt = '';

    if (!currentUserExists || !targetUserExists) {
      // 一方或双方未注册
      const existingUser = currentUserExists ? currentUser : targetUser;
      const existingUserNotes = currentUserExists ? currentNotesText : targetNotesText;
      const existingUsername = existingUser?.data?.username || '用户';
      
      systemPrompt = '你是一个善于分析用户兴趣和推荐个性化话题、互动和体验的AI助手。请基于用户的笔记内容，为其推荐适合的话题、互动和体验。';
      
      prompt = `请像一个很懂人、很会玩的朋友，基于以下用户的历史笔记内容，深度分析TA的兴趣、性格、表达风格，然后给出3个新奇、好玩、个性化的建议。每个建议包含：
- title：一句有趣的标题
- insight：你发现的有趣细节/性格特点/兴趣倾向（比如"从你的笔记里看出你很喜欢观察生活中的小细节"）
- suggestion：好玩的话题/互动/体验建议（可以是聊天话题、游戏互动、本地体验等）
- source：一句话说明推荐原因（如"你在笔记中表现出xxx，这个很适合你"）

要求：
- 建议要均衡分布：包含有趣的话题讨论、好玩的互动游戏、新奇的体验活动
- 话题类：可以是深度聊天、趣味问答、故事分享等
- 互动类：可以是小游戏、角色扮演、创意挑战等  
- 体验类：可以是本地探索、新技能尝试、创意活动等
- 洞察要有创意、有脑洞、有点"懂你"的感觉，让人觉得"被看见"
- 不要输出任何代码块、注释或多余内容，只返回如下JSON格式：

{
  "topics": [
    {
      "title": "有趣标题",
      "insight": "有趣的洞察/性格特点/兴趣倾向",
      "suggestion": "好玩的话题/互动/体验建议",
      "source": "推荐原因说明"
    }
  ]
}

${themeInfo}${localInfo}

${existingUsername}的笔记：
${existingUserNotes || '暂无笔记'}`;

    } else if (!currentUserHasNotes && !targetUserHasNotes) {
      // 双方都没有笔记
      systemPrompt = '你是一个善于推荐话题、互动和体验的AI助手。请基于用户的地理位置，推荐适合的话题、互动和体验。';
      
      prompt = `请像一个很懂人、很会玩的朋友，基于用户当前的地理位置和附近真实地标/活动，给出3个新奇、好玩、适合新用户的建议。每个建议包含：
- title：一句有趣的标题
- insight：为什么推荐这个建议（比如"这是一个很适合新用户探索的话题"）
- suggestion：好玩的话题/互动/体验建议（可以是聊天话题、游戏互动、本地体验等）
- source：一句话说明推荐原因（如"这里很适合初次体验"）

要求：
- 建议要均衡分布：包含有趣的话题讨论、好玩的互动游戏、新奇的体验活动
- 话题类：可以是深度聊天、趣味问答、故事分享等
- 互动类：可以是小游戏、角色扮演、创意挑战等  
- 体验类：可以是本地探索、新技能尝试、创意活动等
- 不要输出任何代码块、注释或多余内容，只返回如下JSON格式：

{
  "topics": [
    {
      "title": "有趣标题",
      "insight": "为什么推荐这个建议",
      "suggestion": "好玩的话题/互动/体验建议",
      "source": "推荐原因说明"
    }
  ]
}

${themeInfo}${localInfo}

用户信息：
${currentUser?.data?.username || '用户1'} 和 ${targetUser?.data?.username || '用户2'} 都是新用户，还没有笔记记录。`;

    } else {
      // 正常情况：双方都有笔记或至少一方有笔记
      systemPrompt = '你是一个善于分析用户兴趣和生成共同话题、互动和体验的AI助手。请基于用户的笔记内容，找出可能的共同话题、互动和体验。';
      
      prompt = `请像一个很懂人、很会玩的朋友，基于以下两位用户的历史笔记内容，深度分析TA们的兴趣、性格、表达风格和潜在联系，发现TA们自己都没意识到的有趣细节、反差、习惯或隐藏的共同点。然后给出3个新奇、好玩、个性化的建议。每个建议包含：
- title：一句有趣的标题
- insight：你发现的有趣细节/联系/反差（比如"你们都喜欢在笔记里自问自答，其实都挺会自娱自乐"）
- suggestion：好玩的话题/互动/体验建议（可以是聊天话题、游戏互动、本地体验等）
- source：一句话说明推荐原因（如"你们都在笔记中表现出xxx，但可能没意识到"）

要求：
- 建议要均衡分布：包含有趣的话题讨论、好玩的互动游戏、新奇的体验活动
- 话题类：可以是深度聊天、趣味问答、故事分享等
- 互动类：可以是小游戏、角色扮演、创意挑战等  
- 体验类：可以是本地探索、新技能尝试、创意活动等
- 洞察要有创意、有脑洞、有点"懂你"的感觉，让人觉得"被看见"
- 不要输出任何代码块、注释或多余内容，只返回如下JSON格式：

{
  "topics": [
    {
      "title": "有趣标题",
      "insight": "有趣的洞察/联系/反差",
      "suggestion": "好玩的话题/互动/体验建议",
      "source": "推荐原因说明"
    }
  ]
}

${themeInfo}${localInfo}

${currentUser?.data?.username || '用户1'}的笔记：
${currentNotesText || '暂无笔记'}

${targetUser?.data?.username || '用户2'}的笔记：
${targetNotesText || '暂无笔记'}`;
    }

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
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时

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
            { 
              role: 'system', 
              content: systemPrompt
            },
            { role: 'user', content: prompt },
          ],
          max_tokens: 1500,
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
            // 根据情况提供不同的默认话题
            if (!currentUserExists || !targetUserExists) {
              topics = [
                {
                  title: "探索新地方",
                  insight: "你正在开始使用Reality Note记录生活，这是一个很好的习惯。",
                  suggestion: "可以先去附近的公园或咖啡店，记录下今天的感受和发现。",
                  source: "新用户很适合从简单的记录开始"
                }
              ];
            } else if (!currentUserHasNotes && !targetUserHasNotes) {
              topics = [
                {
                  title: "一起探索",
                  insight: "你们都是新用户，可以一起开始记录生活的旅程。",
                  suggestion: "可以一起去附近的地方探索，互相分享各自的发现和感受。",
                  source: "新用户很适合结伴体验"
                }
              ];
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
        } else {
          // 根据情况提供不同的默认话题
          if (!currentUserExists || !targetUserExists) {
            topics = [
              {
                title: "探索新地方",
                insight: "你正在开始使用Reality Note记录生活，这是一个很好的习惯。",
                suggestion: "可以先去附近的公园或咖啡店，记录下今天的感受和发现。",
                source: "新用户很适合从简单的记录开始"
              }
            ];
          } else if (!currentUserHasNotes && !targetUserHasNotes) {
            topics = [
              {
                title: "一起探索",
                insight: "你们都是新用户，可以一起开始记录生活的旅程。",
                suggestion: "可以一起去附近的地方探索，互相分享各自的发现和感受。",
                source: "新用户很适合结伴体验"
              }
            ];
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
      }

      return NextResponse.json({ 
        success: true, 
        topics,
        currentUser: currentUser?.data?.username,
        targetUser: targetUser?.data?.username,
        currentUserExists,
        targetUserExists,
        currentUserHasNotes,
        targetUserHasNotes
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