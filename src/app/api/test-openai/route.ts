import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ 
      success: false, 
      error: '缺少 OpenAI API Key' 
    }, { status: 500 });
  }

  try {
    // 测试OpenAI API连接 - 使用最少的token
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'user', content: 'Hi' },
        ],
        max_tokens: 10,
        temperature: 0,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ 
        success: false, 
        error: 'OpenAI API 调用失败',
        details: data,
        status: response.status
      }, { status: response.status });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'OpenAI API Key 工作正常！',
      response: data.choices?.[0]?.message?.content || '无响应内容',
      model: data.model,
      usage: data.usage
    });

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: '测试过程中发生错误',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
} 