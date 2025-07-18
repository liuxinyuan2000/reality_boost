import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../supabaseClient";

// GET: 获取用户的好友及其公开文件夹
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: '缺少userId参数' }, { status: 400 });
  }

  try {
    // 获取用户的好友列表
    const { data: friendships, error: friendError } = await supabase
      .from('friendships')
      .select(`
        *,
        user1:users!friendships_user1_id_fkey(id, username),
        user2:users!friendships_user2_id_fkey(id, username)
      `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .eq('status', 'accepted');

    if (friendError) {
      console.error('获取好友列表失败:', friendError);
      return NextResponse.json({ error: '获取好友列表失败' }, { status: 500 });
    }

    // 提取好友ID列表
    const friendIds: string[] = [];
    const friendsMap: { [key: string]: { id: string, username: string } } = {};

    friendships?.forEach(friendship => {
      const friendId = friendship.user1_id === userId ? friendship.user2_id : friendship.user1_id;
      const friend = friendship.user1_id === userId ? friendship.user2 : friendship.user1;
      
      friendIds.push(friendId);
      friendsMap[friendId] = friend;
    });

    if (friendIds.length === 0) {
      return NextResponse.json({ 
        friends: [],
        message: '暂无好友'
      });
    }

    // 获取所有好友的公开文件夹
    const { data: folders, error: folderError } = await supabase
      .from('categories')
      .select('*')
      .in('user_id', friendIds)
      .eq('is_private', false)
      .order('name', { ascending: true });

    if (folderError) {
      console.error('获取文件夹失败:', folderError);
      return NextResponse.json({ error: '获取文件夹失败' }, { status: 500 });
    }

    // 组织数据结构
    const friendsWithFolders = friendIds.map(friendId => {
      const friend = friendsMap[friendId];
      const friendFolders = folders?.filter(folder => folder.user_id === friendId) || [];
      
      return {
        id: friend.id,
        username: friend.username,
        folders: friendFolders.map(folder => ({
          id: folder.id,
          name: folder.name,
          icon: folder.icon,
          color: folder.color,
          notesCount: 0 // 后续可以优化添加笔记数量
        }))
      };
    });

    return NextResponse.json({ 
      friends: friendsWithFolders.filter(friend => friend.folders.length > 0),
      totalCount: friendsWithFolders.length
    });

  } catch (error) {
    console.error('获取好友文件夹时发生错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
} 