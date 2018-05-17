<?php
/**
 * Created by IntelliJ IDEA.
 * User: denny
 * Date: 7/27/17
 * Time: 10:13 AM
 */

namespace English3\Controller\Forum;


use English3\Controller\Utility;
use English3\WebSocket\Message;
use English3\WebSocket\ServerMessager;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class ForumPost
{
    public static function markAsRead($userId,$postId){
        Utility::getInstance()->reader->executeUpdate(self::$queryMarkAsRead,['userId'=>$userId,'postId'=>$postId]);
//        return new JsonResponse('ok');
    }
    public static function savePost(Request $r){
        Utility::clearPOSTParams($r);
        $post = $r->request->all();
        if($post['pageId']){
            $post['forumid'] = Utility::getInstance()->fetchOne('SELECT id FROM forums where pageid = :pageId',['pageId'=>$post['pageId']]);
        }
        $post['parentid'] = $post['parentid']?:0;
        $post['rootid'] = $post['rootid']?:0;
        $post['userid'] = $post['userid']?:$_SESSION['USER']['ID'];
        $post['replies'] = $post['rootid']===0?0:null;
        Utility::getInstance()->reader->insert('forum_posts',[
            'forumid' => $post['forumid'],
            'parentid' => $post['parentid'],
            'rootid' => $post['rootid'],
            'userid' => $post['userid'],
            'title' => $post['title'],
            'message' => $post['message'],
            'replies' => $post['replies'],
            ]
        );
        $newId = Utility::getInstance()->reader->lastInsertId();
        if($post['rootid']===0){
            self::updateActivityTopic($post['forumid'],$newId);
        }else{
            self::updateActivityReply($post['rootid'],$newId);
        }
        $message = new Message('forumChanged',['id'=>$post['forumid']]);
        ServerMessager::sendSimpleMessage('/topic/server.forum',$message);
        ForumPost::markAsRead($_SESSION['USER']['ID'],$newId);
        return new JsonResponse($newId);
    }
    private static function updateActivityReply($topicId,$lastPostId){
        if($lastPostId){
            Utility::getInstance()->executeUpdate(
                self::$queryAddActivityReply,['topicId'=>$topicId,'lastPostId'=>$lastPostId]
            );
        }else{

        }
    }
    private static function updateActivityTopic($forumId,$lastPostId){
        if($lastPostId){
            Utility::getInstance()->executeUpdate(
                self::$queryAddActivityTopic,['lastPostId'=>$lastPostId]
            );
        }else{

        }
    }
    public static function editPost(Request $r){
        Utility::clearPOSTParams($r);
        $post = $r->request->all();
        Utility::getInstance()->reader->update('forum_posts',[
                'title' => $post['title'],
                'message' => $post['message'],
            ],
            ['id'=>$post['id']]
        );
        return new JsonResponse($post['id']);
    }
    public static function deletePost($id){
        Utility::getInstance()->reader->update('forum_posts',
            ['is_deleted'=>1],
            ['id'=>$id]
        );
        return 'ok';
    }
    public  static function getForumIdFromPostId($postId){
        return Utility::getInstance()->fetchOne('SELECT forumid from forum_posts where id = :id',['id'=>$postId]);
    }
    private static $queryMarkAsRead = <<<SQL
    insert into forum_post_read values (:postId,:userId,NOW())
    on duplicate key update last_read = NOW()
SQL;

    private static $queryAddActivityReply = <<<SQL
    UPDATE forums f 
    JOIN forum_posts fp on fp.forumid = f.id
    SET f.last_postid = :lastPostId, f.posts = f.posts + 1, fp.last_postid = :lastPostId, fp.replies = fp.replies + 1
    WHERE fp.id = :topicId
SQL;
private static $queryAddActivityTopic = <<<SQL
    UPDATE forums f 
    JOIN forum_posts fp on fp.forumid = f.id
    SET f.last_postid = :lastPostId, f.posts = f.posts + 1,f.topics = f.topics + 1,fp.last_postid = :lastPostId
    WHERE fp.id = :lastPostId
SQL;


}
