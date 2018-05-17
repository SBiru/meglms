<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 3/16/17
 * Time: 5:48 PM
 */

namespace English3\Controller\Posts;


use English3\Controller\Utility;
use Symfony\Component\HttpFoundation\JsonResponse;

class PostViews {
    private $postId;
    public function __construct($postId){
        $this->postId = $postId;
    }
    public function newVisualization($postId){
        Utility::getInstance()->calcLoggedIn();
        $this->postId = $postId;
        $fromUserId = $_SESSION['USER']['ID'];

        return new JsonResponse(['affected'=>boolval($this->addSeenBy($fromUserId))]);
    }

    private function addSeenBy($userId){
        $owner = Utility::getInstance()->fetchOne($this->queryGetPostOwner,['postid'=>$this->postId]);
        if($owner==$userId){
            return false;
        }
        return Utility::getInstance()->insert($this->queryInsertSeen,['userid'=>$userId,'postid'=>$this->postId]);
    }
    public function getViews($postId){
        return new JsonResponse(Utility::getInstance()->fetch($this->queryGetPostViews,['postid'=>$postId]));
    }
    public function countViews(){
        return count(Utility::getInstance()->fetch($this->queryGetPostViews,['postid'=>$this->postId]));
    }
    private $queryInsertSeen = <<<SQL
    INSERT IGNORE INTO post_views (postid,userid) values (:postid,:userid)
SQL;
    private $queryGetPostOwner = <<<SQL
    SELECT userid FROM posts WHERE id = :postid
SQL;
    private $queryGetPostViews = <<<SQL
    SELECT
    u.fname,
    u.lname,
    u.country,
    um.meta_value as profilePicture
    from post_views pv join users u on u.id = pv.userid
    left join user_meta um on u.id = um.userid and um.meta_key='profile_picture'
    WHERE pv.postid = :postid
SQL;

}