<?php
namespace English3\Controller\Forum\grader;

use English3\Controller\Utility;

class ForumGraderCalculatorSQL{
    public function savePostGrade($postId,$grade,$message=''){
        Utility::getInstance()->reader->executeUpdate($this->querySavePostGrade,[
            'postId'=>$postId,
            'grade'=>$grade,
            'message'=>$message,
            'teacherId'=>$_SESSION['USER']['ID']
        ]);
    }
    public function saveForumGrade($forumId,$userId,$grade,$message=''){
        Utility::getInstance()->reader->executeUpdate($this->querySaveForumGrade,[
            'forumId'=>$forumId,
            'grade'=>$grade,
            'message'=>$message,
            'userId'=>$userId,
            'teacherId'=>$_SESSION['USER']['ID']
        ]);
    }
    public function setGradeToAllPosts($forumId,$userId,$grade){
        Utility::getInstance()->reader->executeUpdate($this->querySaveAllPostsGrade,[
            'forumId'=>$forumId,
            'grade'=>$grade,
            'userId'=>$userId,
            'teacherId'=>$_SESSION['USER']['ID']
        ]);
    }
    public function getForumAvg($forumId,$userId){
        return Utility::getInstance()->fetchOne($this->queryGetForumAvg,[
            'forumId'=>$forumId,
            'userId'=>$userId
        ]);
    }
    public function getForumCount($forumId,$userId){
        return intval(Utility::getInstance()->fetchOne($this->queryCountStudentPosts,[
            'forumId'=>$forumId,
            'userId'=>$userId
        ]));
    }
    public function getForumGrade($forumId,$userId){
        return intval(Utility::getInstance()->fetchOne('SELECT grade FROM forum_grade where studentid = :userId and forumid = :forumId',[
            'forumId'=>$forumId,
            'userId'=>$userId
        ]));
    }
    private $querySavePostGrade = <<<SQL
    INSERT INTO forum_posts_grade (postid,studentid,teacherid,modified,grade,message)
    select id,userid,:teacherId,now(),:grade,:message from forum_posts where id = :postId
    on duplicate key update modified = values(modified), teacherid = values(teacherid),
    grade = values(grade),message = values(message);
    
SQL;
    private $querySaveAllPostsGrade = <<<SQL
    INSERT INTO forum_posts_grade (postid,studentid,teacherid,modified,grade)
    select id,userid,:teacherId,now(),:grade from forum_posts 
    where forumid = :forumId and userid = :userId and rootid>0 
    on duplicate key update modified = values(modified), teacherid = values(teacherid),
    grade = values(grade);
    
SQL;
    private $querySaveForumGrade = <<<SQL
    INSERT INTO forum_grade (forumid,studentid,teacherid,modified,grade,message)
    select :forumId,:userId,:teacherId,now(),:grade,:message
    on duplicate key update modified = values(modified), teacherid = values(teacherid),
    grade = values(grade),message = values(message);
    
SQL;
    private $queryGetForumAvg = <<<SQL
    SELECT avg(g.grade) from forum_posts fp
    join forum_posts_grade g on g.postid = fp.id
    where fp.userid = :userId and fp.forumid = :forumId
SQL;
    private $queryCountStudentPosts = <<<SQL
    SELECT count(*) from forum_posts fp
    where fp.userid = :userId and fp.forumid = :forumId and fp.rootid>0
SQL;
}