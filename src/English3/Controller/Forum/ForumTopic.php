<?php
/**
 * Created by IntelliJ IDEA.
 * User: denny
 * Date: 7/27/17
 * Time: 10:19 AM
 */

namespace English3\Controller\Forum;


use English3\Controller\Utility;
use Symfony\Component\HttpFoundation\JsonResponse;

class ForumTopic
{
    private static $MAX_TOPIC_MESSAGE_DISPLAY = 50;
    public static function loadTopics($pageId){
        $forum = new Forum();
        $forumUserSettings = $forum->loadUserSettingsFromPage($pageId,$_SESSION['USER']['ID']);
        $forumSettings = $forum->loadSettingsFromPage($pageId);

        $data = Utility::getInstance()->fetch(self::$queryLoadTopics,['pageId'=>$pageId]);
        $topics = array_map(function($row){
            $row['lastPost'] = [
                'author'=>$row['fname'] . ' ' . $row['lname'],
                'time'=>$row['lastActivityTime']
            ];
            $row['message'] = html_entity_decode(self::stripHtmlTags($row['message']));
            if(strlen($row['message']>self::$MAX_TOPIC_MESSAGE_DISPLAY)){
                $row['shortText'] = substr($row['message'],0,self::$MAX_TOPIC_MESSAGE_DISPLAY);
            }else{
                $row['shortText'] = $row['message'];
            }
            $row['shortText'] = htmlspecialchars_decode($row['shortText']);
            $row['unread'] = $row['replies'];
            return $row;
        },$data);

        $forumId = $forum->getForumIdFromPage($pageId);
        if($forumUserSettings['track_reading']){
            foreach ($topics as &$topic){
                $unreadReplies = self::topicUnreadCount($topic['id'],$_SESSION['USER']['ID']);
                $topic['isNeverRead'] = $unreadReplies === -1;
                $topic['unread'] = $unreadReplies>=0?$unreadReplies:$topic['replies'];
                if($forumUserSettings['isTeacher'] && boolval($topic['is_deleted'])){
                    $forumSettings['hasArchive'] = true;
                }
            }
        }
        $notifications = new ForumNotifications();
        $notifications->checkAndUpdateSubscriber($forumId,$_SESSION['USER']['ID']);
        if($forumSettings['type']=='one_post'){
            $forumUserSettings['hasPosted'] = boolval(Utility::getInstance()->fetchOne("SELECT id FROM forum_posts where forumid = :id and rootid = 0 and userId=:userId",[
                'id'=>$forumId,
                'userId'=>$_SESSION['USER']['ID']
            ]));
        }
        return new JsonResponse([
            'topics'=>$topics,
            'settings'=>$forumUserSettings,
            'forumId'=>$forumId,
            'forumSettings'=>$forumSettings,
            'forumName'=>Utility::getInstance()->fetchOne("SELECT name from pages where id = ".$pageId)
        ]);
    }
    private static function stripHtmlTags($html){
        global $PATHS;
        require_once($PATHS->app_path.'/lib/simple_html_dom.php');
        $html = str_get_html($html);
        return $html->plaintext;
    }
    public static function loadTopic($id,$return = false,$archive=false){
        $data = Utility::getInstance()->fetch(
            self::$queryLoadTopic,
                ['id'=>$id,'userId'=>$_SESSION['USER']['ID']]);
        $forumId = $data[0]['forumid'];
        $settings = new ForumSettings($forumId);
        $settings->load();
        $settings->loadUserSettings($_SESSION['USER']['ID']);
        if($settings->data['type']=='q_a'){

            if(!($settings->userData['isTeacher'] || self::hasPosted($id))){
                $settings->data['hasNotPosted'] = true;
                $data = [$data[0]];
            }
        }

        ForumPost::markAsRead($_SESSION['USER']['ID'],$id);
        $notifications = new ForumNotifications();
        $notifications->updateSubscriber($forumId,$_SESSION['USER']['ID']);

        foreach($data as &$row){
            $row['canEdit'] = $row['userid'] == $_SESSION['USER']['ID'];
            if(intval(@$settings->data['limit_editing_time'])>0){
                $row['canEdit'] = (time() - strtotime($row['time'])) < intval(@$settings->data['limit_editing_time'])*60;
            }
            $row['canDelete'] = $settings->userData['isTeacher'] || ($settings->userData['canDelete'] && $row['canEdit']);
            $row['time'] = date('m-d-Y h:i a',strtotime($row['time']));
            if(boolval($row['is_deleted']) && $settings->userData['isTeacher'] ){
                $settings->data['hasArchive'] = true;
            }
        }
        if($return){
            return Utility::buildTree($data)[$id];
        }
        return new JsonResponse(['posts'=>Utility::buildTree($data)[$id],'settings'=>$settings->data,
            'userSettings'=>$settings->userData]);
    }
    private static function hasPosted($id){
        return boolval(Utility::getInstance()->fetchOne(self::$queryHasPostedToTopic,
            ['userId'=>$_SESSION['USER']['ID'],'id'=>$id]));
    }

    public static function topicUnreadCount($id,$userId){
        if(!Utility::getInstance()->fetchOne("SELECT userid FROM forum_post_read WHERE postrootid = :id and userid = :userId",['id'=>$id,'userId'=>$userId])){
            return -1;
        }
        return intval(Utility::getInstance()->fetchOne(self::$queryUnreadCount,['id'=>$id,'userId'=>$userId]));
    }

    private static $queryUnreadCount = <<<SQL
    SELECT sum(if(fr.userid is null or fr.last_read < fp.created,1,0)) FROM forum_posts fp
    left join forum_post_read fr on fr.userid = :userId and (fr.postrootid = fp.rootid)
    where (fp.rootid = :id) and fp.userid != :userId
SQL;

    private static $queryLoadTopics = <<<SQL
    SELECT fp.*,
    u.fname,u.lname,if(lp.modified < '2000-01-01',lp.created,lp.modified) as lastActivityTime
    FROM forum_posts fp
     JOIN forum_posts lp on lp.id = fp.last_postid
     JOIN forums f on f.id = fp.forumid
     JOIN users u on u.id = lp.userid
     JOIN pages p on p.id = f.pageid
     WHERE f.pageid = :pageId and fp.parentid = 0;
SQL;

    private static $queryLoadTopic = <<<SQL
    SELECT fp.*,
    concat(u.fname,' ',u.lname) as author,
    if(fp.modified < '2000-01-01',fp.created,fp.modified) as time,
    if(fr.last_read is null,'2000-01-01',fr.last_read) as last_read,
    f.pageid
     FROM forum_posts fp
     join forums f on fp.forumid = f.id
    JOIN users u on u.id = fp.userid
    left join forum_post_read fr on (fr.postrootid = fp.id or fr.postrootid = fp.rootid) and fr.userid = :userId
     WHERE (fp.id = :id or fp.rootid = :id );
SQL;
    private static $queryHasPostedToTopic = <<<SQL
    SELECT id FROM forum_posts WHERE userid = :userId and rootid = :id limit 1
SQL;

}