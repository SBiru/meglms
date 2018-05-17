<?php
namespace English3\Controller\Grader;

use English3\Controller\Organization\OrganizationController;
use English3\Controller\Posts\SiblingServerFinder;
use English3\Controller\Utility;

/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 17.16.1
 * Time: 15:52
 */

class GraderActivitySQL {
    public static function getPagePosts($classId,$pageId,$groupId=null,$inputSortOrder=false,$isArchive=false){
        return \English3\Controller\Utility::getInstance()->fetch(self::prepareSortOption($classId,$inputSortOrder,$isArchive),[
            'classId'=>$classId,
            'pageId'=>$pageId,
            'groupId'=>$groupId
        ]);
    }
    public static function getAllUserPosts($classId,$pageId,$userId,$groupId,$sortOrder){
        $sortOrder = self::getSortOrder($classId,$sortOrder);
        if($sortOrder == 'alphabet'){
            $sortOrder = "fname";
        }
        else{
            $sortOrder = "grade_posts.id,posts.id $sortOrder";
        }

        return \English3\Controller\Utility::getInstance()->fetch(self::$queryGetAllPosts.$sortOrder,[
            'classId'=>$classId,
            'pageId'=>$pageId,
            'groupId'=>$groupId,
            'userId'=>$userId
        ]);
    }
    private static function prepareSortOption($classId,$inputSortOrder=false,$isArchive=false){
        $sortOrder = self::getSortOrder($classId,$inputSortOrder);
        if($sortOrder == 'alphabet'){
            $sortOrder = "fname";
        }
        else{
            $sortOrder = "posts.id $sortOrder";
        }

        if($isArchive){
            return self::$queryGetPagePostsArchive.$sortOrder;
        }else{
            return self::$queryGetPagePostsNeedingGrade.$sortOrder;
        }
    }
    private static function getSortOrder($classId,$inputSortOrder){
        $sortOrder = $inputSortOrder?:OrganizationController::_getField(OrganizationController::_getOrgFromClassId($classId),'sort_posts_grader');;
        return $sortOrder=='desc'?$sortOrder:'';
    }

    public static function get_comments($postrootparentid)
    {
        $commentresult = Utility::getInstance()->fetchRow(self::$queryGetGradeComments,['postParentId'=>$postrootparentid]);
        return count($commentresult)?$commentresult:'';
    }
    public static function getchildren($tmp)
    {
        $children      = Utility::getInstance()->fetch(self::$queryGetChildren,['postId'=>$tmp->id]);
        $tmp->children = array();
        foreach ($children as $child) {
            SiblingServerFinder::checkIfThumbnailExists($child);
            $tmp->children[] = $child;
        }
        if(gettype($tmp->upload_url)!='array'){
            $tmp->upload_url = Utility::urlencodepath($tmp->upload_url);
        }
        if(gettype($tmp->upload_url)=='array'){
            $tmp->upload_file_name=json_decode($tmp->upload_file_name);
        }else{

            if($tmp->upload_url){
                $tmp->upload_url=[$tmp->upload_url];
                $tmp->upload_file_name=[$tmp->upload_file_name];
            }

        }
        $tmp->created   = date("n/j/Y g:i a", strtotime($tmp->created));
        //Golabs 2/2/2015 date will be easier to understand. no issues with formats.
        $tmp->created_d = date('d-M-Y', strtotime($tmp->created));
        SiblingServerFinder::checkIfThumbnailExists_stdClass($tmp);
        return $tmp;
    }

    private static $queryGetAllPosts = <<<SQL
    SELECT posts.id, posts.post_reply_id, posts.postrootparentid, posts.video_url, posts.video_thumbnail_url,
              posts.upload_url, posts.upload_file_name, posts.message, posts.is_private, posts.is_teacher, posts.created, users.id as 'user_id', users.fname, users.lname,users.email, units.description as 'unit_name',  pages.name as 'page_name',pages.id as 'pageId',
            pages.allow_video_post, pages.allow_text_post, pages.allow_upload_post, pages.allow_upload_only_post,pages.allow_template_post,pages.id as page_id,rubricid,ca.points as max_points,if(grade_posts.id is null,true,false) as needingGrade,
            teacher_post.id as update_id,
            grade_posts.grade,
            grade_posts.teacher_notes,
            teacher_post.message as grade_comments,pages.layout
                  FROM posts
                  JOIN users ON (posts.userid=users.id) JOIN pages ON (pages.id=posts.pageid)
                  JOIN user_classes uc on users.id = uc.userid and uc.classid=:classId
                  JOIN units ON (pages.unitid=units.id) LEFT JOIN grade_posts ON (grade_posts.post_id=posts.id)
                  LEFT JOIN posts teacher_post ON grade_posts.teacher_post_id = teacher_post.id
                  LEFT JOIN (select * from class_assignments group by page_id) ca on posts.pageid = ca.page_id
                  WHERE  (posts.pageid=:pageId AND posts.is_deleted=0 and posts.userid=:userId) AND
                  posts.is_teacher=0 AND
                  pages.is_gradeable=1 AND
                  (uc.groupid = :groupId or uc.groupid is null)
                  ORDER BY 

SQL;
    private static $queryGetPagePostsNeedingGrade = <<<SQL
    SELECT posts.id, posts.post_reply_id, posts.postrootparentid, posts.video_url, posts.video_thumbnail_url,
              posts.upload_url, posts.upload_file_name, posts.message, posts.is_private, posts.is_teacher, posts.created, users.id as 'user_id', users.fname, users.lname,users.email, units.description as 'unit_name',  pages.name as 'page_name',pages.id as 'pageId',
            pages.allow_video_post, pages.allow_text_post, pages.allow_upload_post, pages.allow_upload_only_post,pages.allow_template_post,pages.id as page_id,rubricid,ca.points as max_points,pages.layout
                  FROM posts
                  JOIN users ON (posts.userid=users.id) JOIN pages ON (pages.id=posts.pageid)
                  JOIN user_classes uc on users.id = uc.userid and uc.classid=:classId
                  JOIN units ON (pages.unitid=units.id) LEFT JOIN grade_posts ON (grade_posts.post_id=posts.id)
                  LEFT JOIN class_assignments ca on posts.pageid = ca.page_id
                  WHERE (posts.classid=:classId AND posts.pageid=:pageId AND posts.is_deleted=0) AND
                  grade_posts.id IS NULL AND
                  posts.is_teacher=0 AND
                  pages.is_gradeable=1 AND
                  posts.id = posts.postrootparentid AND
                  (uc.groupid = :groupId or uc.groupid is null)
                  GROUP BY posts.userid,posts.pageid,posts.groupid
                  ORDER BY 

SQL;
    private static $queryGetPagePostsArchive = <<<SQL
    SELECT posts.id, posts.post_reply_id, posts.postrootparentid, posts.video_url, posts.video_thumbnail_url,
                      posts.upload_url, posts.upload_file_name, posts.message, posts.is_private, posts.is_teacher,
                      posts.created, users.id as 'user_id', users.fname, users.lname, units.description as 'unit_name',
                      pages.allow_template_post,
                      pages.name as 'page_name',pages.id as 'pageId', grade_posts.teacher_notes,grade_posts.grade,pages.rubricid,
                      grade_posts.user_id as teacher_id, teachers.fname as teacher_fname, teachers.lname as teacher_lname,
                      pages.automatically_grade,ca.points as max_points,
                      sov.score as scoreOverride, sov.byUserId as overrideBy, sov.date as overrideOn,pages.layout
                      FROM posts
                      JOIN users ON (posts.userid=users.id)
                      JOIN user_classes uc on users.id = uc.userid and uc.classid=:classId
                      JOIN pages ON (pages.id=posts.pageid)
                      JOIN units ON (pages.unitid=units.id)
                      LEFT JOIN grade_posts ON (grade_posts.post_id=posts.id)
                      LEFT JOIN scores_overrides sov ON posts.pageid = sov.pageId and posts.userid = sov.userId
                      LEFT join users teachers on grade_posts.user_id = teachers.id
                      left join class_assignments ca on pages.id = ca.page_id
                      WHERE (posts.classid=:classId
                        AND posts.pageid=:pageId
                        AND posts.is_deleted=0)
                        AND (grade_posts.id IS NOT NULL or posts.id!=posts.postrootparentid)
                        AND (uc.groupid = :groupId or uc.groupid is null)
                        AND posts.is_teacher=0
                        AND pages.is_gradeable=1

                      GROUP BY posts.id
            ORDER BY 

SQL;
    private static $queryGetGradeComments = <<<SQL
        select message as grade_comments,id as update_id
          from posts
          WHERE postrootparentid = :postParentId AND
            is_teacher = 1 AND
            teacher_feedback = 0
        order by id desc limit 1
SQL;
    private static $queryGetChildren = <<<SQL
      select * from posts where postrootparentid = :postId and id != :postId AND is_deleted = 0  and video_thumbnail_url !='' order by id desc
SQL;

}