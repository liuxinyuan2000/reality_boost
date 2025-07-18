import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../supabaseClient";

// GET: 获取用户当前主题
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: '缺少用户ID' }, { status: 400 });
  }

  try {
    // 获取用户当前激活的主题
    const { data: currentTheme, error: currentError } = await supabase
      .from('user_outing_themes')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (currentError) {
      console.error('获取当前主题失败:', currentError);
      return NextResponse.json({ error: '获取当前主题失败' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      currentTheme
    });

  } catch (error) {
    console.error('获取主题时发生错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// POST: 设置用户主题
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, themeName, themeDescription, duration } = body;

    if (!userId || !themeName) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    // 先将之前的主题设为非激活状态
    const { error: deactivateError } = await supabase
      .from('user_outing_themes')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (deactivateError) {
      console.error('取消激活之前主题失败:', deactivateError);
      return NextResponse.json({ error: '取消激活之前主题失败' }, { status: 500 });
    }

    // 计算过期时间（默认4小时）
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (duration || 4));

    // 创建新主题
    const { data: newTheme, error: createError } = await supabase
      .from('user_outing_themes')
      .insert({
        user_id: userId,
        theme_name: themeName,
        theme_description: themeDescription,
        is_active: true,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('创建主题失败:', createError);
      return NextResponse.json({ error: '创建主题失败' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      theme: newTheme
    });

  } catch (error) {
    console.error('设置主题时发生错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// DELETE: 取消当前主题
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: '缺少用户ID' }, { status: 400 });
    }

    // 将当前激活主题设为非激活状态
    const { error } = await supabase
      .from('user_outing_themes')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      console.error('取消主题失败:', error);
      return NextResponse.json({ error: '取消主题失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('取消主题时发生错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
} 