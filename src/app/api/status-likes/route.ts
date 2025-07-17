import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../supabaseClient";

// GET: 获取用户状态的点赞信息
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUserId = searchParams.get('targetUserId');
  const currentUserId = searchParams.get('currentUserId');

  if (!targetUserId) {
    return NextResponse.json({ error: '缺少targetUserId参数' }, { status: 400 });
  }

  try {
    // 获取总点赞数
    const { count, error: countError } = await supabase
      .from('status_likes')
      .select('*', { count: 'exact', head: true })
      .eq('target_user_id', targetUserId);

    if (countError) {
      console.error('获取点赞数失败:', countError);
      return NextResponse.json({ error: '获取点赞数失败' }, { status: 500 });
    }

    // 如果提供了currentUserId，检查当前用户是否已点赞
    let hasLiked = false;
    if (currentUserId) {
      const { data: likeData, error: likeError } = await supabase
        .from('status_likes')
        .select('id')
        .eq('liker_id', currentUserId)
        .eq('target_user_id', targetUserId)
        .maybeSingle();

      if (likeError) {
        console.error('检查点赞状态失败:', likeError);
        return NextResponse.json({ error: '检查点赞状态失败' }, { status: 500 });
      }

      hasLiked = !!likeData;
    }

    return NextResponse.json({ 
      likeCount: count || 0, 
      hasLiked 
    });

  } catch (error) {
    console.error('获取点赞信息时发生错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// POST: 点赞或取消点赞
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { likerId, targetUserId } = body;

    if (!likerId || !targetUserId) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    if (likerId === targetUserId) {
      return NextResponse.json({ error: '不能给自己点赞' }, { status: 400 });
    }

    // 首先检查是否已经点赞
    const { data: existingLike, error: checkError } = await supabase
      .from('status_likes')
      .select('id')
      .eq('liker_id', likerId)
      .eq('target_user_id', targetUserId)
      .maybeSingle();

    if (checkError) {
      console.error('检查点赞状态失败:', checkError);
      return NextResponse.json({ error: '检查点赞状态失败' }, { status: 500 });
    }

    if (existingLike) {
      // 如果已经点赞，则取消点赞
      const { error: deleteError } = await supabase
        .from('status_likes')
        .delete()
        .eq('id', existingLike.id);

      if (deleteError) {
        console.error('取消点赞失败:', deleteError);
        return NextResponse.json({ error: '取消点赞失败' }, { status: 500 });
      }

      return NextResponse.json({ success: true, action: 'unliked' });
    } else {
      // 如果未点赞，则添加点赞
      const { data, error: insertError } = await supabase
        .from('status_likes')
        .insert({
          liker_id: likerId,
          target_user_id: targetUserId
        })
        .select()
        .single();

      if (insertError) {
        console.error('点赞失败:', insertError);
        return NextResponse.json({ error: '点赞失败' }, { status: 500 });
      }

      return NextResponse.json({ success: true, action: 'liked', like: data });
    }

  } catch (error) {
    console.error('处理点赞时发生错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
} 