<?php
/**
 * Created by IntelliJ IDEA.
 * User: denny
 * Date: 7/27/17
 * Time: 10:13 AM
 */

namespace English3\Controller\Forum;


use English3\Controller\Utility;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class ForumNotifications
{

    public function load($classId){
        if(!$pageId = $this->useForum($classId)){
            return new Response('{}');
        }
        $n = Utility::getInstance()->fetch($this->queryLoadNotifications,['classId'=>$classId,
            'userId'=>$_SESSION['USER']['ID']]);
        return new JsonResponse([
            'useForum'=>true,
            'firstPageId'=>$pageId,
            'notifications'=>$n
        ]);
    }
    public function updateForSubscribers($forumId){
        $forumSettings = new ForumSettings($forumId);
        $mode = $forumSettings->load()['subscription_mode'];

        if($mode=='disabled'){
            return [];
        }
        $possibleSubscriberIds = Utility::getInstance()->fetch($this->queryPossibleSubscribers,['id'=>$forumId]);
        $updated = [];
        foreach($possibleSubscriberIds as $user){
            if($didUpdate = $this->checkAndUpdateSubscriber($forumId,$user['userid'],$mode,$forumSettings)){
                $updated[]=$user['userid'];
            }

        }
        return $updated;
    }
    public function checkAndUpdateSubscriber($forumId,$userId,$mode = null,$forumSettings=null){
        if(!$forumSettings){
            $forumSettings = new ForumSettings($forumId);
        }
        if(!$mode){
            $mode = $forumSettings->load()['subscription_mode'];
        }
        if($mode=='forced'){
            $this->updateSubscriber($forumId,$userId);
            return true;
        }
        $userSettings = $forumSettings->loadUserSettings($userId);
        if($userSettings['subscribe']){
            $this->updateSubscriber($forumId,$userId);
            return true;
        }
        return false;
    }
    public function updateSubscriber($forumId,$userId){
        Utility::getInstance()->reader->delete('forum_notifications',[
            'userid'=>$userId,
            'forumid'=>$forumId
        ]);
        $d = Utility::getInstance()->fetchRow($this->queryForumNewPostsCount,['id'=>$forumId,'userId'=>$userId]);
        if(intval($d['count'])){
            Utility::getInstance()->reader->insert('forum_notifications',[
                'userid'=>$userId,
                'forumid'=>$forumId,
                'notification'=> $d['count']. " new posts on " . $d['title']
            ]);
        }
    }
    private function useForum($classId){
        return intval(Utility::getInstance()->fetchOne($this->queryCheckUseForum,['id'=>$classId]));
    }

    private $queryCheckUseForum = <<<SQL
    SELECT p.id FROM forums f
    join pages p on f.pageid = p.id
    where f.classid = :id limit 1
SQL;
    private $queryPossibleSubscribers = <<<SQL
    SELECT distinct userid  from (SELECT userid FROM user_classes uc join forums f on f.classid = uc.classid WHERE 
    f.id = :id
    UNION
    SELECT userid from forum_user_settings where forumid = :id and setting="subscribe" and value=1) a
SQL;
    private $queryForumNewPostsCount = <<<SQL
    SELECT count(*) as count,f.title from forums f 
    join forum_posts fp on f.id = fp.forumid
    left join forum_post_read fr on (fr.postrootid = fp.id or fr.postrootid = fp.rootid) and fr.userid = :userId
    where if(fr.last_read is null, 1,fr.last_read < fp.created) and fp.userid != :userId and f.id = :id
SQL;
    private $queryLoadNotifications = <<<SQL
    SELECT n.*,f.pageid,p.unitid from forum_notifications n 
    join forums f on n.forumid = f.id
    join pages p on p.id = f.pageid
    where f.classid = :classId and n.userid = :userId
SQL;



}
