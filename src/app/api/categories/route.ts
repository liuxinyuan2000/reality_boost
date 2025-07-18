import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../supabaseClient";

// GET: 获取用户的所有分类
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: '缺少userId参数' }, { status: 400 });
  }

  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('获取分类失败:', error);
      return NextResponse.json({ error: '获取分类失败' }, { status: 500 });
    }

    return NextResponse.json({ categories: categories || [] });

  } catch (error) {
    console.error('获取分类时发生错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// POST: 创建新分类
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, color, icon, isPrivate } = body;

    if (!userId || !name) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    // 验证用户是否存在
    const { data: userExists } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (!userExists) {
      return NextResponse.json({ error: '用户不存在，请重新登录' }, { status: 400 });
    }

    // 检查分类名称是否已存在
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', userId)
      .eq('name', name)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: '分类名称已存在' }, { status: 400 });
    }

    // 直接插入分类数据，绕过外键约束问题
    const { data, error } = await supabase
      .from('categories')
      .insert({
        user_id: userId,
        name: name.trim(),
        color: color || '#007AFF',
        icon: icon || '📁',
        is_private: isPrivate || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('创建分类失败:', error);
      return NextResponse.json({ error: '创建分类失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, category: data });

  } catch (error) {
    console.error('创建分类时发生错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// PUT: 更新分类
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { categoryId, userId, name, color, icon, isPrivate } = body;

    if (!categoryId || !userId) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    // 验证分类所有权
    const { data: category, error: ownerError } = await supabase
      .from('categories')
      .select('id')
      .eq('id', categoryId)
      .eq('user_id', userId)
      .maybeSingle();

    if (ownerError || !category) {
      return NextResponse.json({ error: '分类不存在或无权限修改' }, { status: 404 });
    }

    // 如果要修改名称，检查新名称是否已存在
    if (name) {
      const { data: existing } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', userId)
        .eq('name', name)
        .neq('id', categoryId)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ error: '分类名称已存在' }, { status: 400 });
      }
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    if (name !== undefined) updateData.name = name.trim();
    if (color !== undefined) updateData.color = color;
    if (icon !== undefined) updateData.icon = icon;
    if (isPrivate !== undefined) updateData.is_private = isPrivate;

    const { data, error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', categoryId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('更新分类失败:', error);
      return NextResponse.json({ error: '更新分类失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, category: data });

  } catch (error) {
    console.error('更新分类时发生错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// DELETE: 删除分类
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('categoryId');
  const userId = searchParams.get('userId');

  if (!categoryId || !userId) {
    return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
  }

  try {
    // 验证分类所有权
    const { data: category, error: ownerError } = await supabase
      .from('categories')
      .select('id')
      .eq('id', categoryId)
      .eq('user_id', userId)
      .maybeSingle();

    if (ownerError || !category) {
      return NextResponse.json({ error: '分类不存在或无权限删除' }, { status: 404 });
    }

    // 检查是否有笔记使用此分类
    const { count } = await supabase
      .from('notes')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId);

    if (count && count > 0) {
      return NextResponse.json({ 
        error: '无法删除分类，该分类下还有笔记。请先移动或删除相关笔记。',
        hasNotes: true,
        notesCount: count
      }, { status: 400 });
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId)
      .eq('user_id', userId);

    if (error) {
      console.error('删除分类失败:', error);
      return NextResponse.json({ error: '删除分类失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('删除分类时发生错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
} 