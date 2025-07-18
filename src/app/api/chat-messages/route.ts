import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../supabaseClient';

// GET - 获取指定会话的消息历史
export async function GET(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // 验证会话所有权
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('user_id')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session || session.user_id !== user.id) {
      return NextResponse.json({ error: 'Session not found or access denied' }, { status: 404 });
    }

    // 获取消息历史
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching chat messages:', error);
      return NextResponse.json({ error: 'Failed to fetch chat messages' }, { status: 500 });
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (error) {
    console.error('Chat messages GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - 添加新消息到会话
export async function POST(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { session_id, role, content } = body;

    // 验证必填字段
    if (!session_id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    if (!role || !['user', 'assistant', 'system'].includes(role)) {
      return NextResponse.json({ error: 'Valid role is required' }, { status: 400 });
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    // 验证会话所有权
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('user_id')
      .eq('id', session_id)
      .single();

    if (sessionError || !session || session.user_id !== user.id) {
      return NextResponse.json({ error: 'Session not found or access denied' }, { status: 404 });
    }

    // 添加消息
    const { data: newMessage, error: insertError } = await supabase
      .from('chat_messages')
      .insert({
        session_id,
        role,
        content: content.trim()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating chat message:', insertError);
      return NextResponse.json({ error: 'Failed to create chat message' }, { status: 500 });
    }

    return NextResponse.json({ message: newMessage }, { status: 201 });
  } catch (error) {
    console.error('Chat messages POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - 删除指定会话的所有消息（清空对话历史）
export async function DELETE(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { session_id } = body;

    if (!session_id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // 验证会话所有权
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('user_id')
      .eq('id', session_id)
      .single();

    if (sessionError || !session || session.user_id !== user.id) {
      return NextResponse.json({ error: 'Session not found or access denied' }, { status: 404 });
    }

    // 删除所有消息
    const { error: deleteError } = await supabase
      .from('chat_messages')
      .delete()
      .eq('session_id', session_id);

    if (deleteError) {
      console.error('Error deleting chat messages:', deleteError);
      return NextResponse.json({ error: 'Failed to delete chat messages' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Chat messages DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 