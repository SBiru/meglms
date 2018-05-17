<?php
namespace English3\Controller\Forum\grader;

use English3\Controller\Utility;

class ForumGraderSQL{
    public function needingGradeRawData($pageId){
        return Utility::getInstance()->fetch(
            $this->queryLoadStudentPosts.' and g.id is null',
            ['pageId'=>$pageId]);
    }
    public function archiveRawData($pageId,$studentId = null,$all=false){
        $query = $this->queryLoadStudentPosts;
        if($studentId){
            $query = str_replace('uc.is_student =','',$query);
        }
        return Utility::getInstance()->fetch(
            $query
                .($all?'':' and g.id is not null')
                .($studentId?' and uc.userid = '.$studentId:''),
            ['pageId'=>$pageId]);
    }
    public function needingGradeForClassRawData($classId){
        return Utility::getInstance()->fetch(
            $this->queryLoadStudentPostsForClass,
            ['classId'=>$classId]);
    }
    public function userTopicPosts($topicId,$userId,$all=true){
        return Utility::getInstance()->fetch(
            $this->queryLoadUserTopicPosts. ($all?'':' and g.id is null'),
                ['userId'=>$userId,'topicId'=>$topicId]);
    }
    public function studentGrade($pageId,$userId){
        return Utility::getInstance()->fetchRow(
            $this->queryGetStudentGradeInfo,
            ['userId'=>$userId,'pageId'=>$pageId]);
    }
    private $queryLoadStudentPosts = <<<SQL
    SELECT DISTINCT topics.title,topics.created,topics.id,fp.userid,u.fname,u.lname,fp.forumid FROM forum_posts fp
    join forum_posts topics on fp.rootid = topics.id
    join users u on fp.userid = u.id
    join forums f on fp.forumid = f.id
    join user_classes uc on f.classid = uc.classid and u.id = uc.userid
    left join forum_posts_grade g on g.postid = fp.id
    where uc.is_student = 1 and f.pageid = :pageId
SQL;
    private $queryLoadStudentPostsForClass = <<<SQL
    SELECT DISTINCT topics.title,topics.created,topics.id,fp.userid,u.fname,u.lname,fp.forumid FROM forum_posts fp
    join forum_posts topics on fp.rootid = topics.id
    join users u on fp.userid = u.id
    join forums f on fp.forumid = f.id
    join pages p on p.id = f.pageid
    join user_classes uc on f.classid = uc.classid and u.id = uc.userid
    left join forum_posts_grade g on g.postid = fp.id
    where uc.is_student = 1 and f.classid = :classId and g.id is null and p.is_gradeable =1 
SQL;
    private $queryLoadUserTopicPosts = <<<SQL
    SELECT fp.id,fp.userid,fp.message,fp.created as time,parent.message as parentMessage,g.grade,g.message as feedback  
    FROM 
    forum_posts fp
     join forum_posts parent on parent.id = fp.parentid
     left join forum_posts_grade g on g.postid = fp.id
    WHERE fp.userid = :userId and fp.rootid = :topicId
SQL;
    private $queryGetStudentGradeInfo = <<<SQL
    SELECT g.* from forum_grade g
    join forums f on g.forumid = f.id
    where f.pageid = :pageId and g.studentid = :userId
SQL;
}