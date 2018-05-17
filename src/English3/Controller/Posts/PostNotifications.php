<?php
namespace English3\Controller\Posts;
use English3\Controller\PageController;
use English3\Controller\PostsController;
use English3\Controller\Utility;

class PostNotifications {

    public static function sendStudentFeedbackIfNeeded($postId){
        $post = PostsController::_get(Utility::getInstance()->reader,$postId);
        if(boolval($post['is_private']) || boolval($post['is_teacher'])){return;}

    }
    private static function sendStudentFeedback($postId){

    }

    private static $queryGetPostInfo = <<<SQL
    SELECT p.id,

SQL;

}