import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../supabaseClient";

// GET: 获取指定文件夹下的笔记内容
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const folderId = searchParams.get('folderId');
  const requesterId = searchParams.get('requesterId'); // 请求者ID，用于权限验证

  if (!folderId || !requesterId) {
    return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
  }

  try {
    // 首先验证文件夹信息和权限
    const { data: folder, error: folderError } = await supabase
      .from('categories')
      .select(`
        *,
        users!categories_user_id_fkey(id, username)
      `)
      .eq('id', folderId)
      .single();

    if (folderError || !folder) {
      return NextResponse.json({ error: '文件夹不存在' }, { status: 404 });
    }

    // 检查文件夹是否为公开
    if (folder.is_private) {
      return NextResponse.json({ error: '无法访问私密文件夹' }, { status: 403 });
    }

    // 验证请求者和文件夹所有者是否为好友关系
    if (folder.user_id !== requesterId) {
      const { data: friendship, error: friendError } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(user1_id.eq.${requesterId},user2_id.eq.${folder.user_id}),and(user1_id.eq.${folder.user_id},user2_id.eq.${requesterId})`)
        .eq('status', 'accepted')
        .maybeSingle();

      if (friendError || !friendship) {
        return NextResponse.json({ error: '无权限访问该文件夹' }, { status: 403 });
      }
    }

    // 获取文件夹下的所有公开笔记
    const { data: notes, error: notesError } = await supabase
      .from('notes')
      .select('id, content, created_at')
      .eq('category_id', folderId)
      .eq('is_private', false)
      .order('created_at', { ascending: false })
      .limit(20); // 限制最多20条笔记，避免上下文过长

    if (notesError) {
      console.error('获取笔记失败:', notesError);
      return NextResponse.json({ error: '获取笔记失败' }, { status: 500 });
    }

    // 计算总字符数，确保不超过合理限制
    const maxContextLength = 4000; // 约4000字符的上下文限制
    let totalLength = 0;
    const contextNotes = [];

    for (const note of notes || []) {
      if (totalLength + note.content.length > maxContextLength) {
        break;
      }
      contextNotes.push(note);
      totalLength += note.content.length;
    }

    // 格式化为上下文字符串
    const contextContent = contextNotes
      .map(note => `${note.content}`)
      .join('\n\n');

    return NextResponse.json({
      folder: {
        id: folder.id,
        name: folder.name,
        icon: folder.icon,
        color: folder.color,
        owner: {
          id: folder.users.id,
          username: folder.users.username
        }
      },
      contextContent,
      notesCount: contextNotes.length,
      totalNotesCount: notes?.length || 0,
      characterCount: totalLength
    });

  } catch (error) {
    console.error('获取文件夹内容时发生错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
} 