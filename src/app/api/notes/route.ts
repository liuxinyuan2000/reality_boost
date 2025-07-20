import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../supabaseClient';

// GET - 获取用户笔记
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = searchParams.get('limit');

    if (!userId) {
      return NextResponse.json({ error: '缺少用户ID' }, { status: 400 });
    }

    // 构建查询
    let query = supabase
      .from('notes')
      .select('id, content, created_at, user_id, category_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // 如果指定了限制数量
    if (limit) {
      const limitNum = parseInt(limit);
      if (!isNaN(limitNum)) {
        query = query.limit(limitNum);
      }
    }

    const { data: notes, error } = await query;

    if (error) {
      console.error('获取笔记失败:', error);
      return NextResponse.json({ error: '获取笔记失败' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      notes: notes || []
    });

  } catch (error) {
    console.error('Notes API 错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// POST - 创建新笔记
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, content, categoryId, isPrivate } = body;

    if (!userId || !content?.trim()) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    // 插入笔记
    const { data: note, error } = await supabase
      .from('notes')
      .insert({
        user_id: userId,
        content: content.trim(),
        category_id: categoryId || null,
        is_private: isPrivate || false
      })
      .select()
      .single();

    if (error) {
      console.error('创建笔记失败:', error);
      return NextResponse.json({ error: '创建笔记失败' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      note
    });

  } catch (error) {
    console.error('创建笔记错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// DELETE - 删除笔记
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('noteId');
    const userId = searchParams.get('userId');

    if (!noteId || !userId) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    // 验证笔记所有权并删除
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', userId);

    if (error) {
      console.error('删除笔记失败:', error);
      return NextResponse.json({ error: '删除笔记失败' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: '笔记删除成功'
    });

  } catch (error) {
    console.error('删除笔记错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
} 