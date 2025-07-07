import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../supabaseClient';

interface Note {
  content: string;
}

// 新增：查找周边地标/设施
async function getNearbyPlaces(lat: number, lon: number) {
  // Nominatim: 查找500米内10个地标
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
  const res = await fetch(url, { headers: { 'User-Agent': 'RealityNote/1.0' } });
  const data = await res.json();
  let address = data.display_name || '';

  // 查找周边POI
  const nearbyUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&extratags=1&limit=8&bounded=1&viewbox=${lon-0.005},${lat+0.005},${lon+0.005},${lat-0.005}`;
  const poiRes = await fetch(nearbyUrl, { headers: { 'User-Agent': 'RealityNote/1.0' } });
  const poiData = await poiRes.json();
  // 只取有name的POI
  const pois = poiData.filter((p: any) => p.display_name).map((p: any) => p.display_name.split(',')[0]).slice(0, 8);
  return { address, pois };
}

export async function POST(req: NextRequest) {
  const { userId, message, location } = await req.json();
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

  const notesText = notes?.map((n: Note) => n.content).join('\n') || '';

  // 新增：拼接地理context
  let geoContext = '';
  if (location && location.lat && location.lng) {
    try {
      const { address, pois } = await getNearbyPlaces(location.lat, location.lng);
      geoContext = `\n你现在所在位置：${address || `${location.lat},${location.lng}`}`;
      if (pois && pois.length > 0) {
        geoContext += `\n你附近有这些地标/设施：${pois.join('、')}。`;
      }
      geoContext += '\n请结合你的位置和周边环境，给出更有现实感的建议。';
    } catch (e) {
      geoContext = `\n（定位信息获取失败，但你的位置为：${location.lat},${location.lng}）`;
    }
  }

  // 构造 prompt
  const prompt = `以下是我的所有笔记：\n${notesText}\n${geoContext}\n现在我想和你聊聊：${message}\n请结合我的所有笔记和现实环境来回答。`;

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
        { role: 'system', content: '你是一个善于结合用户历史笔记和现实地理环境进行对话的AI助手。' },
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