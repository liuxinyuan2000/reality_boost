import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../supabaseClient";

// GET: 获取用户的好友列表
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: '缺少userId参数' }, { status: 400 });
  }

  try {
    // 查询用户作为user1的好友关系
    const { data: friendships1, error: error1 } = await supabase
      .from('friendships')
      .select('user2_id, created_at')
      .eq('user1_id', userId)
      .eq('status', 'accepted');

    // 查询用户作为user2的好友关系
    const { data: friendships2, error: error2 } = await supabase
      .from('friendships')
      .select('user1_id, created_at')
      .eq('user2_id', userId)
      .eq('status', 'accepted');

    if (error1 || error2) {
      console.error('获取好友关系失败:', error1 || error2);
      return NextResponse.json({ error: '获取好友列表失败' }, { status: 500 });
    }

    // 收集所有好友ID
    const friendIds: string[] = [];
    friendships1?.forEach(f => friendIds.push(f.user2_id));
    friendships2?.forEach(f => friendIds.push(f.user1_id));

    if (friendIds.length === 0) {
      return NextResponse.json({ friends: [] });
    }

    // 获取好友用户信息
    const { data: friends, error: friendsError } = await supabase
      .from('users')
      .select('id, username')
      .in('id', friendIds);

    if (friendsError) {
      console.error('获取好友信息失败:', friendsError);
      return NextResponse.json({ error: '获取好友信息失败' }, { status: 500 });
    }

    return NextResponse.json({ friends: friends || [] });

  } catch (error) {
    console.error('获取好友列表时发生错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// POST: 添加好友（直接成为好友，无需确认）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentUserId, targetUserId } = body;

    if (!currentUserId || !targetUserId) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    if (currentUserId === targetUserId) {
      return NextResponse.json({ error: '不能添加自己为好友' }, { status: 400 });
    }

    // 确保user1_id < user2_id的顺序
    const user1Id = currentUserId < targetUserId ? currentUserId : targetUserId;
    const user2Id = currentUserId < targetUserId ? targetUserId : currentUserId;

    // 检查是否已经是好友
    const { data: existing } = await supabase
      .from('friendships')
      .select('id')
      .eq('user1_id', user1Id)
      .eq('user2_id', user2Id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: '已经是好友了' }, { status: 400 });
    }

    // 创建新的好友关系（直接为accepted状态）
    const { data, error } = await supabase
      .from('friendships')
      .insert({
        user1_id: user1Id,
        user2_id: user2Id,
        status: 'accepted'
      })
      .select()
      .single();

    if (error) {
      console.error('添加好友失败:', error);
      return NextResponse.json({ error: '添加好友失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, friendship: data });

  } catch (error) {
    console.error('添加好友时发生错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// DELETE: 删除好友关系
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const currentUserId = searchParams.get('currentUserId');
    const targetUserId = searchParams.get('targetUserId');

    if (!currentUserId || !targetUserId) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    // 确保user1_id < user2_id的顺序
    const user1Id = currentUserId < targetUserId ? currentUserId : targetUserId;
    const user2Id = currentUserId < targetUserId ? targetUserId : currentUserId;

    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('user1_id', user1Id)
      .eq('user2_id', user2Id);

    if (error) {
      console.error('删除好友失败:', error);
      return NextResponse.json({ error: '删除好友失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('删除好友时发生错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
} 