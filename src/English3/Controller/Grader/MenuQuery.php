<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 17.20.1
 * Time: 16:22
 */

namespace English3\Controller\Grader;


Class MenuQuery {

    public static function archiveMenu($menu_id,$class_id,$group_id){
        return sprintf("
		SELECT * FROM (%s) a order by name,position
		",self::archiveMenuActivities($menu_id,$class_id,$group_id));
    }
    public static function needGradeMenu($menu_id,$class_id,$group_id){
        return sprintf("
		SELECT * FROM (%s) a order by name,position
		",self::needGradeMenuActivities($menu_id,$class_id,$group_id));
    }

    private static function needGradeMenuActivities($menu_id,$class_id,$group_id){
        return self::replaceSelects(self::$menuSelects,self::needGradeMenuBase($class_id,$group_id));
    }
    public static function needGradeStudents($class_id,$group_id){
        return self::replaceSelects(self::studentSelects(),self::needGradeMenuBase($class_id,$group_id,null,true));
    }
    public static function needGradeActivitiesForStudent($class_id,$group_id,$user_id){
        return self::replaceSelects(self::activitiesForStudentSelects(),self::needGradeMenuBase($class_id,$group_id,$user_id));
    }
    private static function archiveMenuActivities($menu_id,$class_id,$group_id){
        return self::replaceSelects(self::$archiveMenuSelects,self::archiveMenuBase($menu_id,$class_id,$group_id));
    }
    public static function archiveStudents($menu_id,$class_id,$group_id){
        return self::replaceSelects(self::studentSelects(),self::archiveMenuBase($menu_id,$class_id,$group_id,null,true));
    }
    public static function archiveMenuActivitiesForStudent($menu_id,$class_id,$group_id,$user_id){
        return self::replaceSelects(self::activitiesForStudentSelects(),self::archiveMenuBase($menu_id,$class_id,$group_id,$user_id));
    }

    private static function studentSelects(){
        $studentSelect = "DISTINCT users.id as user_id, users.fname,users.lname,users.email";
        return [
            'posts'=>$studentSelect,
            'journal'=>$studentSelect,
            'quizzes'=>$studentSelect,
            'forum'=>$studentSelect
        ];
    }
    private static function activitiesForStudentSelects(){
        $studentSelect = "pages.id,units.id as unit_id";
        return [
            'posts'=>$studentSelect,
            'journal'=>$studentSelect,
            'quizzes'=>$studentSelect,
            'forum'=>$studentSelect
        ];
    }
    private static function replaceSelects($selects,$query){
        $query = str_replace("__select__posts__",$selects['posts'],$query);
        $query = str_replace("__select__journal__",$selects['journal'],$query);
        $query = str_replace("__select__quizzes__",$selects['quizzes'],$query);
        $query = str_replace("__select__forum__",$selects['forum'],$query);
        return $query;
    }
    private static function archiveMenuBase($menu_id,$class_id,$group_id,$user_id=null,$students=null){
        $query =  "
			SELECT __select__posts__
			  from classes
			  join units on units.courseid = classes.courseid
			  join pages on pages.unitid = units.id
			  join posts on posts.classid = classes.id and posts.pageid = pages.id
			  join user_classes uc on posts.classid=uc.classid and uc.userid = posts.userid and (uc.groupid='{$group_id}' or uc.groupid is null)
			  join users on users.id = posts.userid
			  LEFT JOIN grade_posts ON (grade_posts.post_id=posts.id)
			  LEFT JOIN class_assignments ON (class_assignments.class_id = classes.id) AND (class_assignments.page_id=pages.id)
			  where
			  classes.courseid={$menu_id}
			  AND (pages.layout = 'CONTENT' OR pages.layout = 'TIMED_REVIEW' OR pages.layout = 'JOURNAL')
			  AND (uc.groupid='{$group_id}' or uc.groupid is null)
				AND posts.is_teacher=0
				AND posts.is_deleted=0
				AND (pages.layout!='JOURNAL' or pages.journal_grading_type=0)
				AND (grade_posts.id IS NOT NULL or posts.id!=posts.postrootparentid)
				__where__user__
				GROUP BY pages.id,uc.groupid __group__user__
				UNION
					SELECT __select__journal__
					 from
					(select posts.id,pageid,userid,groupid,posts.created from posts
					join (select max(posts.id) id from posts
					join pages on posts.pageid = pages.id
					where posts.classid={$class_id}
					and pages.layout='JOURNAL'
					and pages.journal_grading_type=1
					and posts.is_teacher=0
					group by posts.pageid,posts.classid,posts.groupid,posts.userid)
					last_post on last_post.id=posts.id
					) last_post
					left join
					(select pageid,userid,groupid,gp.created from posts
					join pages on posts.pageid = pages.id
					left join grade_posts gp ON gp.post_id = posts.id
					where posts.classid={$class_id}
					and pages.layout='JOURNAL'
					and pages.journal_grading_type=1
					and posts.is_teacher=0
					and gp.id is not null) grade on grade.pageid=last_post.pageid and grade.userid=last_post.userid and (grade.groupid=last_post.groupid or (grade.groupid is null and last_post.groupid is null))
					JOIN users ON (last_post.userid=users.id)
					JOIN pages ON (pages.id=last_post.pageid)
					JOIN user_classes uc on users.id = uc.userid and uc.classid='{$class_id}'
					JOIN units ON (pages.unitid=units.id)
					LEFT JOIN class_assignments ca on last_post.pageid = ca.page_id
					where last_post.created<grade.created __where__user__
			  UNION
			  SELECT __select__quizzes__
				FROM quiz_responses
					join quiz_scores on quiz_responses.user_id=quiz_scores.user_id and quiz_responses.quiz_id=quiz_scores.quiz_id
					join users on quiz_scores.user_id = users.id
					join pages on quiz_responses.quiz_id = pages.id
					join units on pages.unitid = units.id
					join classes on units.courseid = classes.courseid
					join user_classes on users.id = user_classes.userid and user_classes.classid = classes.id
				WHERE
					classes.courseid={$menu_id}
					AND user_classes.is_student=1 and user_classes.is_teacher=0
					and (user_classes.groupid='{$group_id}' or user_classes.groupid is null)
					AND (pages.layout like '%QUIZ%' or pages.layout like '%SURVEY%') __where__user__
					group by pages.id __group__user__
              UNION
                  SELECT __select__forum__
					FROM pages
						join units on pages.unitid = units.id
						join classes on units.courseid = classes.courseid
						join users on 1 = 1
						join user_classes on users.id = user_classes.userid and user_classes.classid = classes.id
						join forums f on f.pageid = pages.id 
						join forum_posts fp on fp.forumid = f.id and fp.userid = users.id
						left join forum_posts_grade g on fp.id = g.postid 
					WHERE
						classes.id={$class_id}
						AND user_classes.is_student=1 and user_classes.is_teacher=0
						and (user_classes.groupid='{$group_id}' or user_classes.groupid is null)
						AND pages.layout = 'FORUM'
						AND pages.is_gradeable = 1
						AND fp.rootid > 0
						AND g.id is not null
						__where__user__
						group by pages.id __group__user__  
		";
        if($user_id){
            $query = str_replace('__where__user__',' and users.id = '.$user_id,$query);
        }else{
            $query = str_replace('__where__user__',''.$user_id,$query);
        }
        if($students){
            $query = str_replace('__group__user__',',users.id',$query);
        }else{
            $query = str_replace('__group__user__','',$query);
        }
        return $query;

    }
    private  static function needGradeMenuBase($class_id,$group_id,$user_id=null,$students=null){
        $query =  "SELECT * FROM (SELECT __select__posts__
                  FROM posts
                  JOIN users ON (posts.userid=users.id) JOIN pages ON (pages.id=posts.pageid)
                  JOIN user_classes uc on users.id = uc.userid and uc.classid='{$class_id}'
                  JOIN units ON (pages.unitid=units.id) LEFT JOIN grade_posts ON (grade_posts.post_id=posts.id)
                  LEFT JOIN class_assignments ca on posts.pageid = ca.page_id
                  WHERE (posts.classid={$class_id} AND posts.is_deleted=0) AND
                  grade_posts.id IS NULL AND
                  posts.is_teacher=0 AND
                  pages.is_gradeable=1 AND
                  (posts.id = posts.postrootparentid OR pages.layout='JOURNAL') AND
                  (pages.layout!='JOURNAL' or pages.journal_grading_type=0) AND
                  (uc.groupid = '{$group_id}' or uc.groupid is null) __where__user__
                  	GROUP BY posts.pageid,posts.classid,posts.groupid __group__user__
					UNION
					SELECT __select__journal__ from
					(select posts.id,pageid,userid,groupid,posts.created from posts
					join (select max(posts.id) id from posts
					join pages on posts.pageid = pages.id
					where posts.classid={$class_id}
					and pages.layout='JOURNAL'
					and pages.journal_grading_type=1
					and posts.is_teacher=0
					group by posts.pageid,posts.classid,posts.groupid,posts.userid)
					last_post on last_post.id=posts.id
					) last_post
					left join
					(select pageid,userid,groupid,gp.created from posts
					join pages on posts.pageid = pages.id
					left join grade_posts gp ON gp.post_id = posts.id
					where posts.classid={$class_id}
					and pages.layout='JOURNAL'
					and pages.journal_grading_type=1
					and posts.is_teacher=0
					and gp.id is not null) grade on grade.pageid=last_post.pageid and grade.userid=last_post.userid and (grade.groupid=last_post.groupid or (grade.groupid is null and last_post.groupid is null))
					JOIN users ON (last_post.userid=users.id)
					JOIN pages ON (pages.id=last_post.pageid)
					JOIN user_classes uc on users.id = uc.userid and uc.classid='{$class_id}'
					JOIN units ON (pages.unitid=units.id)
					LEFT JOIN class_assignments ca on last_post.pageid = ca.page_id
					where (last_post.created>grade.created or grade.created is null) __where__user__
                  UNION
                  SELECT __select__quizzes__
					FROM quiz_responses
						join quiz_scores on quiz_responses.user_id=quiz_scores.user_id and quiz_responses.quiz_id=quiz_scores.quiz_id
						join users on quiz_scores.user_id = users.id
						join pages on quiz_responses.quiz_id = pages.id
						join units on pages.unitid = units.id
						join classes on units.courseid = classes.courseid
						join user_classes on users.id = user_classes.userid and user_classes.classid = classes.id
					WHERE
						classes.id={$class_id}
						AND user_classes.is_student=1 and user_classes.is_teacher=0
						and (user_classes.groupid='{$group_id}' or user_classes.groupid is null)
						AND pages.layout like '%QUIZ%'
						AND if(pages.can_return=1 and quiz_scores.attempt_id = quiz_responses.attempt_id,quiz_scores.is_finished=1,1)
						AND is_correct = -1 __where__user__
						group by pages.id __group__user__
                  UNION
                  SELECT __select__forum__
					FROM pages
						join units on pages.unitid = units.id
						join classes on units.courseid = classes.courseid
						join users on 1 = 1
						join user_classes on users.id = user_classes.userid and user_classes.classid = classes.id
						join forums f on f.pageid = pages.id 
						join forum_posts fp on fp.forumid = f.id and fp.userid = users.id
						left join forum_posts_grade g on fp.id = g.postid 
					WHERE
						classes.id={$class_id}
						AND user_classes.is_student=1 and user_classes.is_teacher=0
						and (user_classes.groupid='{$group_id}' or user_classes.groupid is null)
						AND pages.layout = 'FORUM'
						AND pages.is_gradeable = 1
						AND fp.rootid > 0
						AND g.id is null
						__where__user__
						group by pages.id __group__user__) a  ";
        if($user_id){
            $query = str_replace('__where__user__',' and users.id = '.$user_id,$query);
        }else{
            $query = str_replace('__where__user__',''.$user_id,$query);
        }
		if($students){
			$query = str_replace('__group__user__',',users.id',$query);
		}else{
			$query = str_replace('__group__user__','',$query);
		}
        return $query;
    }
    private static $archiveMenuSelects = [
        'posts'=>"units.id, units.name, units.description, pages.id as 'page_id', pages.pagegroupid as 'header_id',
			  pages.layout, pages.name as 'pagename', pages.subtitle, pages.content, if(pages.layout = 'JOURNAL',count(distinct pages.id,posts.postrootparentid),count(pages.id)) as 'count_needing_grading',
			  class_assignments.id as 'class_assignment_id', class_assignments.points as 'max_points', pages.allow_video_post, pages.allow_text_post, pages.allow_upload_post, pages.allow_template_post,pages.position",
        'quizzes'=>"units.id, units.name, units.description, pages.id as 'page_id', pages.pagegroupid as 'header_id',
					pages.layout, pages.name as 'pagename', pages.subtitle, pages.content, count( distinct users.id,quiz_responses.attempt_id) as 'count_needing_grading',
					0 as 'class_assignment_id', 0 as 'max_points', pages.allow_video_post, pages.allow_text_post, pages.allow_upload_post, pages.allow_template_post,pages.position",
        'journal'=>"units.id, units.name, units.description, pages.id as 'page_id', pages.pagegroupid as 'header_id',
                  pages.layout, pages.name as 'pagename', pages.subtitle, pages.content, count(distinct pages.id,last_post.id) as 'count_needing_grading',
                  ca.id as 'class_assignment_id', ca.points as 'max_points', pages.allow_video_post, pages.allow_text_post, pages.allow_upload_post, pages.allow_template_post,pages.position",
        'forum'=>"units.id, units.name, units.description, pages.id as 'page_id', pages.pagegroupid as 'header_id',
                  pages.layout, pages.name as 'pagename', pages.subtitle, pages.content,1 as 'count_needing_grading',
                  0 as 'class_assignment_id', 10 as 'max_points', pages.allow_video_post, pages.allow_text_post, pages.allow_upload_post, pages.allow_template_post,pages.position"
    ];
    private static $menuSelects = [
        'posts'=>"units.id, units.name, units.description, pages.id as 'page_id', pages.pagegroupid as 'header_id',
                  pages.layout, pages.name as 'pagename', pages.subtitle, pages.content, count(distinct posts.id) as 'count_needing_grading',
                  ca.id as 'class_assignment_id', ca.points as 'max_points', pages.allow_video_post, pages.allow_text_post, pages.allow_upload_post, pages.allow_template_post,pages.position",
        'quizzes'=>"units.id, units.name, units.description, pages.id as 'page_id', pages.pagegroupid as 'header_id',
  						pages.layout, pages.name as 'pagename', pages.subtitle, pages.content, count(distinct users.id,quiz_responses.attempt_id) as 'count_needing_grading',
						0 as 'class_assignment_id', 0 as 'max_points', pages.allow_video_post, pages.allow_text_post, pages.allow_upload_post, pages.allow_template_post,pages.position",
        'journal'=>"units.id, units.name, units.description, pages.id as 'page_id', pages.pagegroupid as 'header_id',
                  pages.layout, pages.name as 'pagename', pages.subtitle, pages.content, count(distinct pages.id,last_post.id) as 'count_needing_grading',
                  ca.id as 'class_assignment_id', ca.points as 'max_points', pages.allow_video_post, pages.allow_text_post, pages.allow_upload_post, pages.allow_template_post,pages.position",
        'forum'=>"units.id, units.name, units.description, pages.id as 'page_id', pages.pagegroupid as 'header_id',
                  pages.layout, pages.name as 'pagename', pages.subtitle, pages.content,count(distinct pages.id) as 'count_needing_grading',
                  0 as 'class_assignment_id', 10 as 'max_points', pages.allow_video_post, pages.allow_text_post, pages.allow_upload_post, pages.allow_template_post,pages.position"
    ];
}