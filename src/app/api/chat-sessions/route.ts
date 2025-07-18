import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../supabaseClient';

// GET - 获取用户的AI对话会话列表
export async function GET(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: sessions, error } = await supabase
      .from('chat_sessions')
      .select(`
        *,
        categories (
          id, name, color, icon
        )
      `)
      .eq('user_id', user.id)
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('Error fetching chat sessions:', error);
      return NextResponse.json({ error: 'Failed to fetch chat sessions' }, { status: 500 });
    }

    return NextResponse.json({ sessions: sessions || [] });
  } catch (error) {
    console.error('Chat sessions GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - 创建新的AI对话会话
export async function POST(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, is_private, category_id } = body;

    // 验证必填字段
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Session name is required' }, { status: 400 });
    }

    if (name.trim().length > 100) {
      return NextResponse.json({ error: 'Session name too long' }, { status: 400 });
    }

    // 检查会话名称是否已存在
    const { data: existingSession } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', name.trim())
      .single();

    if (existingSession) {
      return NextResponse.json({ error: 'Session name already exists' }, { status: 409 });
    }

    // 创建新会话
    const { data: newSession, error: insertError } = await supabase
      .from('chat_sessions')
      .insert({
        name: name.trim(),
        description: description || null,
        is_private: is_private || false,
        category_id: category_id || null,
        user_id: user.id
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating chat session:', insertError);
      return NextResponse.json({ error: 'Failed to create chat session' }, { status: 500 });
    }

    return NextResponse.json({ session: newSession }, { status: 201 });
  } catch (error) {
    console.error('Chat sessions POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - 更新AI对话会话
export async function PUT(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, description, is_private, category_id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // 验证会话所有权
    const { data: existingSession, error: fetchError } = await supabase
      .from('chat_sessions')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingSession || existingSession.user_id !== user.id) {
      return NextResponse.json({ error: 'Session not found or access denied' }, { status: 404 });
    }

    // 如果更新名称，检查是否与其他会话冲突
    if (name && name.trim() !== '') {
      const { data: conflictSession } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', name.trim())
        .neq('id', id)
        .single();

      if (conflictSession) {
        return NextResponse.json({ error: 'Session name already exists' }, { status: 409 });
      }
    }

    // 更新会话
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (is_private !== undefined) updateData.is_private = is_private;
    if (category_id !== undefined) updateData.category_id = category_id;

    const { data: updatedSession, error: updateError } = await supabase
      .from('chat_sessions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating chat session:', updateError);
      return NextResponse.json({ error: 'Failed to update chat session' }, { status: 500 });
    }

    return NextResponse.json({ session: updatedSession });
  } catch (error) {
    console.error('Chat sessions PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - 删除AI对话会话
export async function DELETE(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // 验证会话所有权
    const { data: existingSession, error: fetchError } = await supabase
      .from('chat_sessions')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingSession || existingSession.user_id !== user.id) {
      return NextResponse.json({ error: 'Session not found or access denied' }, { status: 404 });
    }

    // 删除会话（级联删除消息）
    const { error: deleteError } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting chat session:', deleteError);
      return NextResponse.json({ error: 'Failed to delete chat session' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Chat sessions DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 