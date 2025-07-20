import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../supabaseClient';

// 高德API调用辅助
interface Location { lat: number; lng: number }
interface Poi { name: string; type: string; address: string }

async function fetchNearbyPOIs(location: Location | null): Promise<Poi[]> {
  const AMAP_KEY = process.env.AMAP_KEY;
  if (!AMAP_KEY || !location || !location.lat || !location.lng) {
    console.log('[GUEST-TOPICS] 跳过AMAP请求: 缺少API Key或位置信息');
    return [];
  }
  
  // 暂时禁用高德API，直接返回空数组，让AI生成通用话题
  console.log('[GUEST-TOPICS] 暂时跳过AMAP请求，使用通用话题生成');
  return [];
}

export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json();
    const { initiatorUserId, location } = body; // location 可能为 { lat, lng } 或 null
    
    if (!initiatorUserId) {
      return NextResponse.json({
        success: false,
        error: '缺少TA用户ID参数'
      }, { status: 400 });
    }

    // 获取TA的基本信息和笔记（用于分析兴趣方向）
    console.log('[GUEST-TOPICS] 开始为TA生成访客话题:', initiatorUserId);
    console.log('[GUEST-TOPICS] 接收到 location:', location);

    // 并行获取用户信息、笔记、主题和附近POI
    const [userData, notes, currentTheme, nearbyPOIs] = await Promise.all([
      supabase
        .from('users')
        .select('username')
        .eq('id', initiatorUserId)
        .single(),
      supabase
        .from('notes')
        .select('content, created_at')
        .eq('user_id', initiatorUserId)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('user_outing_themes')
        .select('theme_name, theme_description')
        .eq('user_id', initiatorUserId)
        .eq('is_active', true)
        .single(),
      fetchNearbyPOIs(location)
    ]);

    if (userData.error || !userData.data) {
      console.error('[GUEST-TOPICS] 获取TA信息失败:', userData.error);
      return NextResponse.json({
        success: false,
        error: 'TA用户不存在'
      }, { status: 404 });
    }

    let notesText = '';
    if (!notes.error && notes.data && notes.data.length > 0) {
      notesText = notes.data.map((note: any) => note.content).join('\n');
    }

    let themeInfo = '';
    if (currentTheme.data) {
      themeInfo = `TA当前出门主题：${currentTheme.data.theme_name}（${currentTheme.data.theme_description}）\n`;
    }

    let localInfo = '';
    if (Array.isArray(nearbyPOIs) && nearbyPOIs.length > 0) {
      localInfo = `\n\n【重要】你们附近有这些真实的地点，请在话题建议中具体提到其中几个：\n` + nearbyPOIs.map((p, idx) => `${idx+1}. ${p.name}（${p.address}）`).join('\n') + '\n请结合这些真实地点给出具体可行的建议！';
      console.log('[GUEST-TOPICS] nearbyPOIs:', nearbyPOIs);
      console.log('[GUEST-TOPICS] localInfo for prompt:', localInfo);
    }

    // 构造AI提示 - 重点是不泄露具体隐私内容，但要基于TA的兴趣生成话题
    const systemPrompt = '你是一个善于分析用户兴趣并推荐适合话题的AI助手。请基于TA用户的兴趣特征，为对方（未注册用户）推荐TA可能感兴趣的话题，但不要透露任何具体的个人信息或笔记内容。';
    
    const prompt = `请基于一个用户（TA）的兴趣特征，为初次见面的对方推荐3个该用户可能感兴趣的话题。要求：

1. 不能透露任何具体的个人信息、姓名、地点、具体事件等隐私内容
2. 只能基于兴趣类型、性格特点等抽象特征来推荐
3. 话题要展现TA的兴趣点，让对方了解可以聊什么
4. 适合初次见面的陌生人，有趣但不过于私人
5. 如果提供了附近地点信息，必须在建议中具体提到这些真实地点
6. 每个建议包含：
   - title：吸引人的话题标题
   - insight：基于TA兴趣特征的描述（如"TA喜欢记录生活的细节"）
   - suggestion：具体的聊天话题或活动建议
   - source：推荐理由（要通用化，不涉及具体内容）

返回JSON格式：
{
  "topics": [
    {
      "title": "话题标题",
      "insight": "TA的兴趣特征描述",
      "suggestion": "具体建议",
      "source": "推荐理由"
    }
  ]
}

TA用户特征分析（请基于以下内容提取兴趣方向，但不要在回复中透露具体内容）：
${themeInfo}
用户名：${userData.data.username}
${notesText ? `生活记录分析：${notesText.slice(0, 500)}` : '暂无生活记录'}${localInfo}

请生成TA可能感兴趣的话题推荐：`;

    // 调用Kimi API
    console.log('[GUEST-TOPICS] 调用Kimi API生成访客话题');
    const kimiResponse = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.KIMI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!kimiResponse.ok) {
      console.error('[GUEST-TOPICS] Kimi API调用失败:', kimiResponse.status);
      throw new Error('AI服务暂时不可用');
    }

    const kimiData = await kimiResponse.json();
    let aiResponse = kimiData.choices?.[0]?.message?.content || '';
    
    console.log('[GUEST-TOPICS] AI原始响应:', aiResponse);

    let topics = [];
    if (aiResponse) {
      try {
        // 清理响应并解析JSON
        let parsed = aiResponse.trim();
        // 去除 BOM
        if (parsed.charCodeAt(0) === 0xFEFF) {
          parsed = parsed.slice(1);
        }
        // 去除 markdown 代码块包裹
        parsed = parsed.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '').trim();
        
        const result = JSON.parse(parsed);
        if (Array.isArray(result.topics)) {
          topics = result.topics;
        }
      } catch (e) {
        console.error('[GUEST-TOPICS] 解析AI响应失败:', e);
        // 提供默认的访客话题（基于TA的兴趣）
        topics = [
          {
            title: "探索周边新去处",
            insight: `${userData.data.username} 喜欢记录生活，可能对新鲜事物很有好奇心`,
            suggestion: "可以一起去附近的公园、咖啡店或书店逛逛，分享各自的发现",
            source: "基于对方的记录习惯推荐"
          },
          {
            title: "聊聊兴趣爱好",
            insight: "经常记录生活的人通常有很多有趣的兴趣点",
            suggestion: "可以聊聊最近在关注什么、喜欢什么类型的电影或音乐",
            source: "了解彼此兴趣的好方式"
          },
          {
            title: "分享生活感悟",
            insight: "TA应该对生活有很多独特的思考和感悟",
            suggestion: "可以聊聊最近有什么新的体验或者有趣的发现",
            source: "从生活记录习惯推断的兴趣点"
          }
        ];
      }
    } else {
      // AI没有返回内容，使用默认话题
      topics = [
        {
          title: "探索有趣话题",
          insight: "TA可能对很多话题都感兴趣",
          suggestion: "可以聊聊各自的兴趣爱好、最近的发现或者有趣的体验",
          source: "通用的破冰话题"
        },
        {
          title: "分享生活体验",
          insight: "每个人都有独特的生活经历",
          suggestion: "可以聊聊最近去过的地方、尝试的新事物或者印象深刻的经历",
          source: "分享体验是拉近距离的好方式"
        },
        {
          title: "发现共同点",
          insight: "通过交流发现可能的共同兴趣",
          suggestion: "可以聊聊对当下热门话题的看法，或者各自的想法和观点",
          source: "寻找共同话题的方式"
        }
      ];
    }

    console.log('[GUEST-TOPICS] 最终生成的话题数量:', topics.length);

    return NextResponse.json({
      success: true,
      topics: topics.slice(0, 3) // 确保只返回3个话题
    });

  } catch (error) {
    console.error('[GUEST-TOPICS] 生成访客话题失败:', error);
    
    // 返回错误但提供默认话题
    return NextResponse.json({
      success: true,
      topics: [
        {
          title: "聊聊兴趣爱好",
          insight: "TA可能对很多有趣的话题都感兴趣",
          suggestion: "可以聊聊各自的兴趣爱好、最近在看的书或电影等",
          source: "这是一个很好的开场话题"
        },
        {
          title: "分享生活体验",
          insight: "TA应该有很多有趣的生活经历",
          suggestion: "可以聊聊最近去过的有趣地方，或者尝试过的新体验",
          source: "分享体验是拉近距离的好方式"
        },
        {
          title: "探讨共同话题",
          insight: "TA可能对当下的热门话题有自己的看法",
          suggestion: "可以聊聊最近的新闻、科技趋势或者社会话题",
          source: "通过讨论发现共同兴趣"
        }
      ]
    });
  }
} 