<?php
use English3\Controller\CloneController;
use English3\Controller\Organization\OrganizationController;
use English3\Controller\Utility;
use English3\Controller\VocabController;


class BaseSQL{
    public $DB;
    public $tablename;
    public function __construct(){
        global $DB;
        $this->DB = $DB;
    }
    public function query($query,$assoc = false){
        $result = $this->DB->mysqli->query($query);
        if ($this->DB->mysqli->errno>0) return false;
        $resp = array();
        if($assoc){
            while($row = $result->fetch_assoc()){
                $resp[] = $row;
            }
        }
        else{
            while($row = $result->fetch_object()){
                $resp[] = $row;
            }
        }
        return $resp;
    }
    public function query_noResult($query){
        $this->DB->mysqli->query($query);
        if ($this->DB->mysqli->errno>0) return false;
        return true;
    }
    public function query_ReturnId($query){
        $this->DB->mysqli->query($query);
        if ($this->DB->mysqli->errno>0) return false;
        return $this->DB->mysqli->insert_id;
    }
    public function fetch_one($query){
        $result = $this->query($query);
        if(count($result)==0) return false;
        return $result[0];
    }
    public function get_by_id($id){

        $query = "SELECT * FROM {$this->tablename} WHERE id={$id}";
        $row = $this->query($query);
        if($row && count($row)) $row = $row[0];
        return $row;
    }
}

class AssignmentsSQL extends BaseSQL{
    public function get_assignments_for_class_user($class_id,$user_id){

    }
    public function get_assignments_for_class($class_id){

    }
}

class CourseSQL extends BaseSQL {
    public function max_position($department_id){
        $query = "SELECT max(position) as 'max_position' FROM courses WHERE departmentid={$department_id}";
        return $this->query($query);
    }
    public function insert_course($department_id,$mysql_name,$mysql_description,$max_position,$mysql_native_language,$data){
        $query = "INSERT INTO courses(departmentid, name, description, position, is_active, native_language) VALUES({$department_id}, '{$mysql_name}', '{$mysql_description}', {$max_position}, 1, '{$mysql_native_language}')";
        $this->DB->mysqli->query($query);
        $data->course_id = $this->DB->mysqli->insert_id;
        if ($this->DB->mysqli->errno>0) return false;
        return true;
    }

    public function clone_course($mysql_name,$course){
        $query = "INSERT INTO courses
                                (
                                departmentid,
                                name,
                                description,
                                is_active,
                                position,
                                native_language
                                )
                                SELECT
                                    departmentid,
                                    '{$mysql_name}',
                                    description,
                                    is_active,
                                    position,
                                    native_language
                                    FROM courses
                                WHERE courses.id={$course->id}
                            ";
        return $this->query_noResult($query);
    }
    public function clone_banks($newCourseId,$user_id,$course){
        $query = "INSERT INTO banks
                            (title,
                            course_id,
                            default_objective_id,
                            created_by)
                                SELECT title,
                                        {$newCourseId},
                                        default_objective_id,
                                        '{$user_id}'
                                FROM banks
                                WHERE course_id = {$course->id}";
        return $this->query_noResult($query);
    }
    public function clone_classes($newCourseId,$mysql_name,$course,$term_id){
        $query = "SELECT id FROM classes WHERE courseid={$newCourseId}";
        $classId=$this->DB->mysqli->query($query)->fetch_object();
        $orgId = OrganizationController::_getOrgFromClassId($classId->id);
        $query = "INSERT INTO classes
                            (courseid,
                            name,
                            is_active,
                            term_id,
                            show_table_of_contents,
                            show_dates,
                            show_grades,
                            show_grades_as_score,
                            show_grades_as_letter,
                            show_grades_as_percentage)
                                SELECT {$newCourseId},
                                        '{$mysql_name}',
                                        is_active,
                                        {$term_id},
                                        show_table_of_contents,
                                        show_dates,
                                        show_grades,
                                        show_grades_as_score,
                                        show_grades_as_letter,
                                        show_grades_as_percentage
                                FROM classes
                                WHERE courseid = {$course->id}";
        $this->query_noResult($query);
        if($orgId==10){
            $query="INSERT INTO class_meta(classid,meta_key,meta_value) VALUES( $newCourseId,'show_for_student',1)";
            $this->query_noResult($query);
        }
        return $this->query_noResult($query);
    }
    public function clone_objectives($newCourseId,$user_id,$course){
        $query = "INSERT INTO objectives
                            (courseid,
                            name,
                            created_by)
                                SELECT {$newCourseId},
                                        name,
                                        '{$user_id}'
                                FROM objectives
                                WHERE course_id = {$course->id}";
        return $this->query_noResult($query);
    }
    public function clone_quizzes($newCourseId,$user_id,$course){
        $query = "INSERT INTO quizzes
                            (title,
                            course_id,
                            created_by,
                            description)
                                SELECT title,
                                        {$newCourseId},
                                        '{$user_id}',
                                        description
                                FROM quizzes
                                WHERE course_id = {$course->id}";
        return $this->query_noResult($query);
    }
    public function clone_units($newCourseId,$course){
        $query = "INSERT INTO units
                            (courseid,
                            name,
                            description,
                            position,
                            image_url,
                            is_active,
                            tab_name)
                                SELECT {$newCourseId},
                                        name,
                                        description,
                                        position,
                                        image_url,
                                        is_active,
                                        tab_name
                                FROM units
                                WHERE courseid = {$course->id}";
        return $this->query_noResult($query);
    }
    public function clone_page($parent,$newCourseId,$course_id,$old_id,$cloneQuizzes=false){
        $util=new Utility();
        $ids = $util->fetchOne("SELECT quiz_id,timed_id FROM pages WHERE id=:pageId",['pageId'=>$old_id]);
        $quiz_id=$ids['quiz_id'];
        $timed_id=$ids['timed_id'];

        if(intval($quiz_id)>0 && $cloneQuizzes){
            $quiz_id = CloneController::_cloneQuiz($quiz_id,['courseId'=>$newCourseId]);
        }else if(is_null($quiz_id)){
            $quiz_id='null';
        }
        if($timed_id){
            $timed_id = CloneController::_cloneTimedReview($old_id,true);
        }else{
            $timed_id = 'null';
        }


        $query = "INSERT INTO pages
                        (
                        unitid, pagegroupid, name, subtitle, moduleid, content, layout, position,
                         allow_video_post, allow_text_post, allow_upload_post, is_private, is_gradeable,
                          hide_activity, quiz_id, time_limit, allowed_takes, password, listen_course,
                           listen_lesson, listen_numEx, native_lang, target_lang, timed_id, timed_limit,
                            timed_pause, searchquiz, objective, gate, minimum_score, rubricid,task_type,
                            task_duration,show_created_date,show_objectives,automatically_grade,template,
                            survey_points,external_id,lesson_duration
                        )
                            SELECT new.id as unitid, {$parent}, pages.name, subtitle, moduleid, content,
                            layout, pages.position, allow_video_post, allow_text_post, allow_upload_post,
                            is_private, is_gradeable, hide_activity, {$quiz_id}, time_limit, allowed_takes, password,
                            listen_course, listen_lesson, listen_numEx,
                            native_lang, target_lang,{$timed_id}, timed_limit, timed_pause,
                             searchquiz, objective, gate, minimum_score, rubricid,task_type,
                            task_duration,show_created_date,show_objectives,automatically_grade,template,
                            survey_points,external_id,lesson_duration
                            from pages
                            LEFT JOIN units as old on pages.unitid=old.id
                            LEFT JOIN units as new on new.name=old.name
                            WHERE new.courseid={$newCourseId} and old.courseid={$course_id} and pages.id ={$old_id}";
        return $this->query_noResult($query);
    }
    public function clone_assignments($newClassId,$cloned_id,$oldClassId,$old_id){
        $query = "INSERT INTO class_assignments
                    (class_id, page_id, points, due, due_offset_days, allowed_takes)
                    SELECT
                        {$newClassId}, {$cloned_id},
                        points,due,due_offset_days, allowed_takes
                    FROM class_assignments
                    WHERE class_id = {$oldClassId} and page_id = {$old_id}
                    ";
        $this->query_noResult($query);
        $query = "INSERT INTO page_meta (pageid,meta_key,meta_value)
                SELECT {$cloned_id}, meta_key,meta_value
                FROM page_meta where pageid={$old_id}";
        return $this->query_noResult($query);
    }
    public function rollBack($table){
        $query = "DELETE FROM {$table->name} WHERE {$table->id_field}={$table->courseId}";
        return $this->query_noResult($query);
    }


    public function update($mysql_name,$mysql_description,$mysql_native_language,$course_id,$dept_id=null){
        $query = "UPDATE courses SET name='{$mysql_name}', description='{$mysql_description}', native_language='{$mysql_native_language}'";
        if($dept_id){
            $query.= ", departmentid = {$dept_id}";
        }
        $query.=" WHERE id={$course_id}";
        return $this->query_noResult($query);
    }
    public function delete_by_id($course_id){
        $query = "DELETE FROM courses WHERE id={$course_id}";
        return $this->query_noResult($query);
    }
    public function get_all_by_department_id($department_id){
        $query = "SELECT id,departmentid,name,description,is_active,position,created,native_language FROM courses WHERE departmentid={$department_id}";
        return $this->query($query);
    }

    public function get_by_id($id){
        $query = "SELECT courses.id, courses.name, courses.description,courses.native_language,
                        departments.id as department_id, organizations.id as organization_id
                  FROM courses
                   LEFT JOIN departments on courses.departmentid = departments.id
                   LEFT JOIN organizations on departments.organizationid = organizations.id
                  WHERE courses.id={$id} LIMIT 1";
        return $this->query($query);
    }

}

class ClassSQL extends BaseSQL{
    public function get_by_course_id($course_id){
        $query = "SELECT classes.id FROM classes WHERE courseid = {$course_id}";
        return $this->query($query);
    }
    public function get_all(){
        $query = "SELECT * FROM classes order by name";
        return $this->query($query,true);
    }
    public function get_for_student_v2($user_id){
        $query =  "select distinct c.* from activity_history ah
        join pages p on p.id = ah.pageid
        join units u on u.id = p.unitid
        join classes c on c.courseid = u.courseid
        where ah.userid = {$user_id}";
        return $this->query($query);
    }
    public function get_for_student($user_id){
        $query = "SELECT classes.*
                    FROM user_classes uc
                    JOIN classes on uc.classid = classes.id
                    WHERE uc.userid = {$user_id} and uc.is_student = 1
                    ";
        return $this->query($query);

    }
    public function get_by_page_id($page){
        $query = "select c.* from
                  classes c
                  join units u on c.courseid = u.courseid
                  join pages p on p.unitid = u.id
                  where p.id = {$page}
        ";
        return $this->fetch_one($query);
    }
    public function get_by_unit_id($unitid){
        $query = "select c.* from
                  units u
                  join classes c on c.courseid = u.courseid
                  where u.id = {$unitid}
        ";
        return $this->fetch_one($query);
    }
    public function getMeta($classId){
        $raw_data = $this->query("SELECT meta_key,meta_value from class_meta WHERE classid={$classId}");
        $meta = array();
        foreach($raw_data as $row){
            $meta[$row->meta_key]=$row->meta_value;
        }
        return $meta;
    }
    public function __construct(){
        parent::__construct();
        $this->tablename='classes';
    }
}

class DepartmentSQL extends BaseSQL{
    public function get_by_id($department_id){
        $query = "SELECT id FROM departments WHERE id={$department_id}";
        return $this->query($query);
    }
}

class UnitSQL extends BaseSQL{
    public function get_by_course_id($course_id){
        $query = "SELECT units.id FROM units WHERE courseid={$course_id} LIMIT 1";
        return $this->query($query);
    }
}
class GradePostSQL extends BaseSQL{
    public function get_user_grade($user_id,$post_id){
        $query = "SELECT * FROM grade_posts WHERE user_id={$user_id} and post_id={$post_id}";
        $row = $this->query($query);
        if($row && count($row)) $row = $row[0];
        return $row;
    }
    public function mark_as_viewed($user_id,$ids){
        $where = '';
        if($ids == 'all'){
            $where = '1';
        } else {
            $ids=implode(',',$ids);
            $where = "grade_posts.id in ($ids)";
        }
        $query = "UPDATE grade_posts
                  LEFT JOIN posts on grade_posts.post_id = posts.id
                  SET grade_posts.viewed=1
                  WHERE  viewed=0 and posts.userid = {$user_id} and {$where}";
        return $this->query_noResult($query);
    }
    public function get_student_feedback($user_id){
        $query = "select
                c.name as className,
                un.name as unitPosition,
                pg.name as pageName,
                'student_feedback' as type,
                concat(u.fname,' ', u.lname) as senderName,
                p.created,p.message,p.video_url,p.video_thumbnail_url,p.viewed,p.id
                from posts p
                join posts  root on p.postrootparentid = root.id
                join pages pg on p.pageid = pg.id
                join units un on un.id = pg.unitid
                join classes c on un.courseid = c.courseid
                join users u on u.id = p.userid
                join user_classes uc on uc.userid = u.id and uc.classid = p.classid
                and root.userid = :userId
                and p.is_teacher=0
                and p.userid <> root.userid
                and p.id <> root.id";
        return Utility::getInstance()->fetch($query,['userId'=>$user_id]);
    }
    public function get_all_notifications($user_id){
        $query = "SELECT grade_posts.id, grade_posts.grade, users.fname, users.lname, posts.video_thumbnail_url,grade_posts.created,
                grade_posts.viewed, grade_posts.teacher_notes, pages.name as 'page_name',show_grades, show_grades_as_score, show_grades_as_letter, show_grades_as_percentage,
                pages.id as pageId, pages.layout
                FROM `grade_posts` JOIN users ON (grade_posts.user_id=users.id)
                JOIN posts ON (grade_posts.post_id=posts.id)
                LEFT JOIN pages ON (pages.id = posts.pageid)
                LEFT JOIN classes on posts.classid = classes.id
                WHERE posts.userid={$user_id} ORDER BY grade_posts.created DESC";
        return $this->query($query);
    }
    public function get_quiz_responses($page_id,$users){
        $users = implode(',',$users);
        $query = "select *,
                  'quiz' as type
                  from
                  questions
                  INNER JOIN pages on questions.quiz_id = pages.quiz_id
                  LEFT JOIN quiz_responses qr on qr.question_id = questions.id
                  WHERE pages.id = {$page_id} and qr.user_id in ({$users}) ";
        ;
        return $this->query($query);
    }

}
class GradeQuizSQL extends  BaseSQL{
    public function get_quiz_for_student($page_id,$student_id){
        $query =  "SELECT qs.user_id,p.quiz_id,qs.randomquiz_id,
                      qs.submitted,
                      qs.score,
                      quizzes.keep_highest_score,
                      p.id as page_id,
                      fname,lname,email,qs.id as score_id,p.name as page_name,units.description as 'unit_name'
                    FROM
                    quiz_scores qs
                    JOIN pages p on p.id = qs.quiz_id
                    JOIN quizzes ON p.quiz_id = quizzes.id
                    JOIN users on users.id = qs.user_id
                    join units on p.unitid=units.id
                    where p.id = {$page_id} and qs.user_id = {$student_id}
                    group by qs.user_id";
        return $this->query($query);
    }
    public function get_quizzes($page_id,$needing_grade = false,$group_id='', $showWithdrawnStudents){
        $filter = $needing_grade?'and is_correct = -1':'';
        $user_classes_history = '';
        if($showWithdrawnStudents == "true"){
            $user_classes_history = "union all (SELECT qs.user_id,
                        qs.randomquiz_id,
                        qs.id as score_id,
                        qs.score,
                        p.quiz_id,
                        p.name as page_name,
                        p.id as page_id,
                        fname,
                        lname,
                        email,
                        units.description as 'unit_name',
                        quizzes.keep_highest_score
                    FROM
                    quiz_scores qs
                    JOIN pages p on p.id = qs.quiz_id
                    JOIN quiz_responses qr on qr.quiz_id = p.id and qs.user_id= qr.user_id and qr.attempt_id is not null
                    JOIN users on users.id = qs.user_id
                    join units on p.unitid=units.id
                    join classes on units.courseid = classes.courseid
                    JOIN quizzes ON quizzes.id = p.quiz_id
                    JOIN user_classes_history on user_classes_history.userid = users.id and user_classes_history.classid = classes.id
                    where p.id = {$page_id}  {$filter}
                    and if(p.can_return and qs.attempt_id = qr.attempt_id,qs.is_finished = 1,1)
                    and user_classes_history.is_student=1 and user_classes_history.is_teacher=0
                    and (user_classes_history.groupid='{$group_id}' or user_classes_history.groupid is null)
                    group by qs.user_id)";
        }
        $query =  "(SELECT qs.user_id,
                        qs.randomquiz_id,
                        qs.id as score_id,
                        qs.score,
                        p.quiz_id,
                        p.name as page_name,
                        p.id as page_id,
                        fname,
                        lname,
                        email,
                        units.description as 'unit_name',
                        quizzes.keep_highest_score
                    FROM
                    quiz_scores qs
                    JOIN pages p on p.id = qs.quiz_id
                    JOIN quiz_responses qr on qr.quiz_id = p.id and qs.user_id= qr.user_id and qr.attempt_id is not null
                    JOIN users on users.id = qs.user_id
                    join units on p.unitid=units.id
                    join classes on units.courseid = classes.courseid
                    JOIN quizzes ON quizzes.id = p.quiz_id
                    JOIN user_classes on user_classes.userid = users.id and user_classes.classid = classes.id
                    where p.id = {$page_id}  {$filter}
                    and if(p.can_return and qs.attempt_id = qr.attempt_id,qs.is_finished = 1,1)
                    and user_classes.is_student=1 and user_classes.is_teacher=0
                    and (user_classes.groupid='{$group_id}' or user_classes.groupid is null)
                    group by qs.user_id) {$user_classes_history}";
        return $this->query($query);
    }
    public function archive($page_id){

    }
    public function user_responses_from_random($quiz_question_id,$page_id,$user_id,$attempt_id){
        $query = "select
                    qr.question_id, qq.position,qq.points,qq.random,
                    qr.response,qr.is_correct,qr.quiz_response_id as response_id,
                    qr.submited as Responsesubmited,
                    qq.id as quiz_question_id,
                    users.fname as teacher_fname,
                    users.lname as teacher_lname,
                    users.email as teacher_email,
                    users.id as teacher_id,
                    qf.feedback,
                    qf.date as feedback_date,
                    q.*
                    FROM quiz_responses qr
                    JOIN quiz_questions qq on qr.quiz_question_id = qq.id
                    LEFT JOIN questions q on qr.question_id = q.id
                    LEFT JOIN quiz_feedback qf ON qr.question_id = qf.question_id and qf.user_id = {$user_id} and qf.attempt_id = '{$attempt_id}'
                    LEFT JOIN users on qf.by_user = users.id
                    WHERE  qr.quiz_question_id = {$quiz_question_id} and qr.user_id = {$user_id} and qr
                    .attempt_id = '{$attempt_id}' and qr.quiz_id = {$page_id} 
                    group by qr.question_id
                    order by qq.position";

        return $this->query($query);
    }

    public function user_responses_from_other($quiz_id,$user_id,$attempt_id){
        $query = "select q.*,
                    qr.question_id,
                    qr.response,
                    qr.is_correct,
                    qr.submited as Responsesubmited,
                    qr.quiz_response_id as response_id,
                    users.fname as teacher_fname,
                    users.lname as teacher_lname,
                    users.email as teacher_email,
                    users.id as teacher_id,
                    qf.feedback,
                    qf.date as feedback_date
                    FROM quiz_responses qr
                    LEFT JOIN questions q on qr.question_id = q.id
                    LEFT JOIN quiz_feedback qf ON qr.question_id = qf.question_id and qf.user_id = {$user_id} and qf.attempt_id = '{$attempt_id}'
                    LEFT JOIN users on qf.by_user = users.id
                    WHERE qr.user_id = {$user_id} AND qr.quiz_id = {$quiz_id} AND qr.quiz_question_id = 0 and qr.attempt_id='{$attempt_id}'
                    group by qr.question_id
                    ";

        return $this->query($query);
    }

    public function user_responses($user_id,$quiz_id,$page_id,$attempt_id){
        $query = "select
                    qq.question_id, qq.position,qq.points,qq.random,
                    qr.response,
                    qr.is_correct,
                    qr.quiz_response_id as response_id,
                    qr.submited as Responsesubmited,
                    qq.id as quiz_question_id,
                    users.fname as teacher_fname,
                    users.lname as teacher_lname,
                    users.email as teacher_email,
                    users.id as teacher_id,
                    qf.feedback as qFeedback,
                    qf.date as feedback_date,
                    bq.bank_id,
                    q.*
                    FROM quiz_questions qq
                    LEFT JOIN questions q ON q.id = qq.question_id
                    LEFT JOIN (select * from quiz_responses where quiz_id ={$page_id} and user_id = {$user_id} and attempt_id = '{$attempt_id}') qr on q.id = qr.question_id
                    LEFT JOIN quiz_feedback qf ON q.id = qf.question_id and qq.id = qf.quiz_question_id and qf.user_id = {$user_id} and qf.attempt_id = '{$attempt_id}'
                    LEFT JOIN users on qf.by_user = users.id
                    LEFT JOIN bank_questions bq on bq.question_id = q.id
                    WHERE  qq.quiz_id = {$quiz_id}
                    group by qq.id,q.id
                    order by qq.position";

        $data = $this->query($query);

        $questions = array();


        if ($data)
        foreach($data as $row){

            if(isset($row->random)){
                $randomQuestions = $this->user_responses_from_random($row->quiz_question_id,$page_id,$user_id,
                $attempt_id);
                if (is_array($randomQuestions) && count($randomQuestions) > 0){
                    $questions = array_merge($questions,  $randomQuestions);
            }

                $otherQuestions = $this->user_responses_from_other($page_id,$user_id,$attempt_id);
                if (is_array($otherQuestions) && count($otherQuestions) > 0){
                    $questions = array_merge($questions,  $otherQuestions);                    
                }
                
            }
            else{
                $questions[]=$row;
            }

        }

        $tmp =   array();
        $tmparray = array();
        foreach($questions as $key=>&$row){
            if(!$row->id){
                unset($questions[$key]);
                continue;
            }
            if($row->random){
                $row->max_points=isset($row->points)?floatval($row->points):1;
            }else{
                $row->max_points=isset($row->points)?floatval($row->points):$row->max_points;
            }

            $row->max_points = round($row->max_points,2);

            if (!isset($tmp[$row->id])){
                $tmp[$row->id] = 1;
                 $tmparray[] = $row;
            }

        }
        return $tmparray;
    }
    public function question_options($question_id){
        $query = "select * from question_options where question_id = {$question_id}";
        return $this->query($query);
    }

}
class LanguageSQL extends BaseSQL{
    public function get_all(){
        $query = "SELECT language_id, language_name, rtl_support FROM languages";
        return $this->query($query);
    }
}
class MessageSQL extends BaseSQL{
    public function new_message($sender_id,$subject,$message){
        $query = "INSERT INTO  sent_messages ( user_id,subject, message) VALUES ('{$sender_id}','{$subject}','{$message}') ";
        return $this->query_noResult($query);
    }
    # @param receivers {array|int}
    public function new_received_message($receivers,$message_id,$is_feedback){
        if(!is_array($receivers)){
            $receivers = array($receivers);
        }
        $values = array();
        foreach( $receivers  as $receiver ) {
            $post_id = $is_feedback?$is_feedback:0;
            $values[] = '('.$message_id.', '.$receiver.','. $post_id .')';
        }

        $query = 'INSERT INTO received_messages (message_id, user_id,post_id) VALUES '.implode(',', $values);
        return $this->query_noResult($query);
    }
    public function get_sent_message($user_id){
        $query = "SELECT
                      sm.id,subject,message,sm.created
                    FROM sent_messages sm
                    LEFT JOIN users as sender on sm.user_id = sender.id
                    WHERE sender.id={$user_id}
                    ";
        $emails = $this->query($query);
        foreach($emails as $email){
            $query = "SELECT
                      receiver.id,receiver.fname,receiver.lname,receiver.email
                      FROM received_messages rm
                    LEFT JOIN sent_messages sm on rm.message_id = sm.id
                    LEFT JOIN users as receiver on rm.user_id = receiver.id
                    WHERE sm.id={$email->id}
                    ";
            $email->receivers = $this->query($query);
            $email->type = 'sent';
        }
        return $emails;
    }
    public function get_received_message($user_id)
    {
        $query = "SELECT
                      sm.id,subject,message,sm.created,
                      sender.fname,sender.lname,sender.id as sender_id,sender.email,rm.read
                    FROM received_messages rm
                    LEFT JOIN users as receiver on rm.user_id = receiver.id
                    LEFT JOIN sent_messages sm on sm.id = rm.message_id
                    LEFT JOIN users as sender on sm.user_id = sender.id
                    WHERE receiver.id={$user_id} and rm.post_id=0
                    ";
        $emails = $this->query($query);
        foreach($emails as $email){
            $email->type="received";
        }
        return $emails;
    }
    public function get_feedback_message($user_id){
        $query = "SELECT
                      sm.id,subject,message,sm.created,rm.read,
                      sender.fname,sender.lname,sender.id as sender_id,sender.email
                    FROM received_messages rm
                    LEFT JOIN users as receiver on rm.user_id = receiver.id
                    LEFT JOIN sent_messages sm on sm.id = rm.message_id
                    LEFT JOIN users as sender on sm.user_id = sender.id
                    WHERE receiver.id={$user_id} and rm.post_id<>0
                    ";
        $emails = $this->query($query);
        foreach($emails as $email){
            $email->type="feedback";
        }
        return $emails;
    }
    public function get_new_emails($user_id){
        $query = "SELECT count(id) as count FROM received_messages WHERE `read`=0 and user_id={$user_id}";
        $count = $this->query($query);
        if($count){
            return $count[0]->count;
        }
        return false;
    }
    public function get_new_student_feedback($user_id){
        $query = "select
                count(p.id) as count
                from posts p
                join posts  root on p.postrootparentid = root.id
                join users u on u.id = p.userid
                join user_classes uc on uc.userid = u.id and uc.classid = p.classid
                JOIN pages pg ON p.pageid = pg.id
                JOIN units un ON un.id = pg.unitid
                where
                p.viewed=0
                and p.is_teacher=0
                and p.userid <> root.userid
                and root.userid = {$user_id}
                and p.id <> root.id";
        return $this->fetch_one($query);
    }
    public function get_new_feedback($user_id){
        $query = "select count(grade_posts.id) as count
          from grade_posts
          JOIN users ON (grade_posts.user_id=users.id)
          left join posts on posts.id = grade_posts.post_id
          where grade_posts.viewed = 0 and posts.userid={$user_id} and grade_posts.user_id<>0";
        return $this->fetch_one($query);
    }
    public function get_new_teacher_feedback($user_id){
        $query = "select count(posts.id) as count from posts left join posts feedback on posts.id = feedback.post_reply_id where feedback.viewed = 0 and posts.userid={$user_id} and feedback.teacher_feedback=1";
        return $this->fetch_one($query);
    }
    public function get_new_quiz_feedback($user_id){
        $query = "select count(distinct quiz_id) as count
                  from quiz_feedback qf
                  where viewed=0 and qf.user_id = {$user_id}";
        return $this->fetch_one($query);
    }
    public function get_new_forum_feedback($user_id){
        $query = "select count(distinct id) as count
                  from forum_grade g
                  where read_on is null and studentid = {$user_id}";
        return $this->fetch_one($query);
    }
    public function mark_as_read($user_id,$message_ids){
        $where = '';
        if($message_ids == 'all'){
            $where = 'post_id=0';
        } else {
            $ids=implode(',',$message_ids);
            $where = "message_id in ($ids)";
        }
        $query = "UPDATE received_messages SET `read`=1 WHERE user_id={$user_id} and `read`=0 and {$where}";
        return $this->query_noResult($query);
    }
    public function mark_feedback_as_read($user_id,$post_ids){
        $where = '';
        if($post_ids == 'all'){
            $where = 'post_id<>0';
        } else {
            $ids=implode(',',$post_ids);
            $where = "post_id in ($ids)";
        }
        $query = "UPDATE received_messages SET `read`=1 WHERE user_id={$user_id} and `read`=0 and {$where}";
        return $this->query_noResult($query);
    }



}
class PageMetaSQL extends BaseSQL{
    private $boolvars = [
        'is_id_verification',
        'cannot_delete_posts',
        'exclude_glossary',
        'hide_title',
        'auto_start',
        'hide_default_instructions',
        'nationality',
        'gender',
        'language',
        'department',
        'department_contact',
        'department_email'
    ];


    public function get($pageid,$process=false){
        $raw_data = json_decode(json_encode(Utility::getInstance()->fetch("SELECT meta_key,meta_value from page_meta WHERE pageid={$pageid}")));
        $meta = array();
        foreach($raw_data as $row){
            if($process && array_search($row->meta_key,$this->boolvars)){
                $row->meta_value = boolval($row->meta_value);
            }
            $meta[$row->meta_key]=$row->meta_value;
        }

        return $meta;
    }
    public function save($pageid,$meta_key,$meta_value){
        $id = $this->fetch_one("SELECT id FROM page_meta where pageid={$pageid} and meta_key='{$meta_key}'");

        if($id){
            $id=$id->id;
            $this->query_noResult("UPDATE page_meta SET meta_value='{$meta_value}' WHERE id = {$id}");
        }
        else{
            $id = $this->query_ReturnId("INSERT INTO page_meta (pageid,meta_key,meta_value) values ({$pageid},'{$meta_key}','{$meta_value}')");
        }
        return $id;
    }
}
class PageSQL extends BaseSQL{
    public function get_pages_by_course_id($course){
        $query = "SELECT pages.id,pagegroupid, class_assignments.id as assignment_id
                              FROM pages
                                LEFT JOIN units on pages.unitid=units.id
                                LEFT JOIN class_assignments on class_assignments.page_id = pages.id
                                LEFT JOIN classes on class_assignments.class_id = classes.id
                              WHERE units.courseid={$course->id}";
        return $this->query($query);
    }

    public function __construct(){
        parent::__construct();
        $this->tablename='pages';
    }
    public function get_children($page_id){
        $query = "SELECT * FROM pages WHERE pagegroupid={$page_id}";
        return $this->query($query);
    }

}
class PermissionsSQL extends BaseSQL{
    public function getPageTypePermissions($org_id){
        $query = "SELECT page_type_permissions FROM organizations WHERE id = {$org_id}";
        return $this->fetch_one($query);
    }
    public function setPageTypePermissions($int,$org_id){
        $query = "UPDATE organizations SET page_type_permissions={$int} where id={$org_id}";
        return $this->query_noResult($query);
    }
}
class PostSQL extends BaseSQL{

    public function __construct(){
        parent::__construct();
        $this->tablename='posts';
    }

}

class ObjectiveSQL extends BaseSQL{
    #@param {array|int} course_id
    public function get_all_by_course_id($course_id){
        $courses= is_array($course_id)?$course_id:array($course_id);
        $query = "SELECT * FROM `objectives` WHERE `objectives`.`course_id` IN(" . implode(',', array_keys($courses)) . ") ORDER BY `objectives`.`name` ASC";
        return $this->query($query);
    }
}
class OrgSQL extends BaseSQL{
    public function get_by_unit_id($unitid){
        $query = "select o.* from
                  units u
                  join courses c on c.id = u.courseid
                  join departments d on d.id = c.departmentid
                  join organizations o on o.id = d.organizationid
                  where u.id = {$unitid}
        ";
        return $this->fetch_one($query);
    }
    public function get_by_page_id($pageid){
        $query = "select o.* from
                  pages p
                  join units u on p.unitid = u.id
                  join courses c on c.id = u.courseid
                  join departments d on d.id = c.departmentid
                  join organizations o on o.id = d.organizationid
                  where p.id = {$pageid}
        ";
        return $this->fetch_one($query);
    }

}
class BankSQL extends BaseSQL{
    #@param {array|int} course_id
    /*
    Golabs issue here we need to group by or not $course_id
    For now I just have it getting all banks...

    */
    public function get_all_by_course_id($course_id){
        if (is_numeric($course_id)){
            $courses = array($course_id=>$course_id);
        }
        else{
        $courses= is_array($course_id)?$course_id:array($course_id=>$course_id);
    }
        $query = "SELECT `banks`.*, COUNT(`bank_questions`.`id`) AS 'count' FROM `banks` LEFT JOIN `bank_questions` ON(`bank_questions`.`bank_id`=`banks`.`id`) WHERE `banks`.`course_id` IN (" . implode(',', array_keys($courses)) . ") GROUP BY `banks`.`course_id`, `banks`.`id` ORDER BY `banks`.`title` ASC";
        return $this->query($query);
    }

    public function setBankQuestionsCount($id){
         $util = new Utility();
        $query ="select count(question_id) as counter from banks,bank_questions
where 
banks.id = ".$id."
AND
bank_questions.bank_id = banks.id";
    return $util->fetchOne($query,[]);
    }


    /*
    Golabs 26/02/2015
    Need this for now...
    */
    public function get_all_banks(){
        $query = "SELECT `banks`.*, COUNT(`bank_questions`.`id`) AS 'count' FROM `banks` LEFT JOIN `bank_questions` ON(`bank_questions`.`bank_id`=`banks`.`id`) GROUP BY `banks`.`course_id`, `banks`.`id` ORDER BY `banks`.`title` ASC";
        return $this->query($query);
    }

    public function get_all_by_org_id($id){
        $query = "SELECT banks.*,COUNT(`bank_questions`.`id`) AS 'count'
                    FROM banks
                    LEFT JOIN `bank_questions` ON(`bank_questions`.`bank_id`=`banks`.`id`)
                    LEFT JOIN users on users.id = banks.created_by
                    WHERE users.organizationid = '{$id}'
                    GROUP BY `banks`.`course_id`, `banks`.`id`
                    ORDER BY `banks`.`title` ASC;";

        return $this->query($query);
    }
    public static function getBankQuestionsCount($bankId){
        $query = "SELECT count(*) FROM bank_questions where bank_id=:bankId";
        $util = new Utility();
        return $util->fetchOne($query,['bankId'=>$bankId]);
    }
    public function create_default_bank($user_id,$id){
        $query = "INSERT
        INTO
        banks
        SET
        title = 'Default',
        created_by = '$user_id'";
        $this->query_noResult($query);
        return $this->get_all_by_org_id($id);
    }
    public function remove($id){
        $query = "delete from banks where banks.id={$id}";
        $sucess = $this->query_noResult($query);
        $query = "delete from bank_questions where bank_id={$id}";
        return $this->query_noResult($query) && $sucess;
    }
}


class RandomQuestionsSQL extends BaseSQL{

    public function  insertRandomQuiz($Bankid,$input,$user_id,$quizzes_id)
    {
        $this->Bankid = $Bankid;
        $this->input = $input;
        $this->user_id = $user_id;
        $this->quizzes_id = $quizzes_id;

        $query = "UPDATE quizzes SET
        qtype = 'random',
        random ='" . $this->input->counter . "'
        WHERE
        id = '".$this->input->quizzes_id ."'
        LIMIT 1";

        /*
        $query = "INSERT
        INTO
        quizzes
        SET
        title = '" . $this->input->title . "',
        course_id =  '" . $this->input->course_id . "',
        created_by =  '" . $this->user_id . "',
        description =  '" . $this->input->description . "',
        qtype =  'random',
        random =  '" . $this->input->counter . "'
            ";
        */
        $result = $this->query_noResult($query);

        $this->insertQuiz_Questions();
    }

    private function insertQuiz_Questions()
    {
        $lastPosition = \English3\Controller\QuizController::_getLastQuestionPosition($this->quizzes_id);
        $lastPosition++;
        $bankId = $this->Bankid?:null;
        $tags = $this->input->tags?:null;

        $values = [
            'quiz_id'=>$this->quizzes_id,
            'question_id'=>0,
            'bank_id'=>$bankId,
            'tags'=>$tags,
            'position'=>$lastPosition,
            'random'=>$this->input->counter,
            'points'=>1
        ];
        Utility::getInstance()->reader->insert('quiz_questions',$values);
    }

}
class HistorySQL extends  baseSQL{
    public function page_entered($user_id,$page_id){
        $query = "INSERT INTO activity_history (userid, pageid, time_in) VALUES ({$page_id},{$user_id},current_timestamp())";
        return $this->query_noResult($query);
    }
    public function last_access($pageid,$user_id){
        $query = "SELECT max(id) as id FROM activity_history WHERE userid={$user_id} and pageid = {$pageid}";
        return $this->fetch_one($query);
    }
    public function page_leaved($id){
        $query = "UPDATE activity_history SET time_out = current_timestamp() WHERE id = {$id}";
        return $this->query_noResult($query);
    }
    public function classHistoryForUser($user_id,$class_id,$time=""){

        if($time!=""){
            $time = str_replace('##column##','time_in',$time);
            //$time = " and ( time_in is null or" . str_replace(' AND','',$time) . ")";
        }
        $query = "SELECT pages.id as page_id,pages.unitid,pages.pagegroupid,pages.name,
                        units.name as unitPosition, units.description as unit,
                        classes.name as classname,'history' as type,ah.*,
                        parent.name as groupName
                        FROM pages
                    JOIN units on pages.unitid = units.id
                    JOIN classes on classes.courseid = units.courseid
                    LEFT JOIN activity_history ah on ah.pageid = pages.id
                    LEFT JOIN pages parent ON parent.id = pages.pagegroupid
                    WHERE classes.id = {$class_id} and (ah.userid = {$user_id} and pages.hide_activity = 0)".$time;
        $data = $this->query($query);
        if($data){
            foreach($data as &$row){
                $timeFirst  = strtotime($row->time_in);
                $timeSecond = strtotime($row->time_out);
                if($row->time_in){
                    $row->timeSpent=$row->time_out?min(($timeSecond - $timeFirst),3600):60;
                }

            }
        }
        return $data;
    }
    public function classPostHistoryForUser($user_id,$class_id,$time=""){
        $time = str_replace('##column##','posts.created',$time);
        $query = "SELECT pages.id as page_id,pages.unitid,pages.pagegroupid,pages.name,
                        units.name as unitPosition, units.description as unit,
                        classes.name as classname,'post' as type,
                        posts.created as time_in,
                        parent.name as groupName
                        FROM pages
                    JOIN units on pages.unitid = units.id
                    JOIN classes on classes.courseid = units.courseid
                    JOIN posts on posts.pageid = pages.id
                    LEFT JOIN pages parent ON parent.id = pages.pagegroupid
                    WHERE classes.id = {$class_id} and (posts.userid={$user_id}) and pages.hide_activity = 0 ".$time ;
        return $this->query($query);
    }
    public function classGradeHistoryForUser($user_id,$class_id,$time=""){
        $time = str_replace('##column##','gp.created',$time);
        $query = "SELECT pages.id as page_id,pages.unitid,pages.pagegroupid,pages.name,
                        units.name as unitPosition, units.description as unit,
                        classes.name as classname,'grade' as type,
                        gp.id as notification_id, gp.grade,gp.created as time_in,
                        parent.name as groupName
                        FROM pages
                    JOIN units on pages.unitid = units.id
                    JOIN classes on classes.courseid = units.courseid
                    JOIN posts on posts.pageid = pages.id
                    LEFT JOIN grade_posts gp on gp.post_id = posts.id
                    LEFT JOIN pages parent ON parent.id = pages.pagegroupid
                    WHERE classes.id = {$class_id}
                    AND posts.userid={$user_id} AND gp.id IS NOT NULL and pages.hide_activity = 0 ".$time;
        return $this->query($query);
    }
    public function classQuizHistoryForUser($user_id,$class_id,$time=""){
        $time = str_replace('##column##','qs.submitted',$time);
        $query = "SELECT pages.id as page_id,pages.unitid,pages.pagegroupid,pages.name,
                        units.name as unitPosition, units.description as unit,
                        classes.name as classname,'quiz' as type,
                        qs.score,qs.submitted as time_in,qs.id,
                        parent.name as groupName
                        FROM pages
                    JOIN units on pages.unitid = units.id
                    JOIN classes on classes.courseid = units.courseid
                    LEFT JOIN quiz_scores qs on qs.quiz_id = pages.id
                    LEFT JOIN pages parent ON parent.id = pages.pagegroupid
                    WHERE classes.id = {$class_id}
                    AND qs.user_id = {$user_id} and pages.hide_activity = 0 ".$time;
        return $this->query($query);
    }

}
class TestSQL extends BaseSQL{
    public function __construct(){
        parent::__construct();
        $this->tablename='quizzes';
    }


    public function make_private($id,$is_private){
        $is_private=$is_private?'1':0;
        $query = "UPDATE quizzes set is_private = {$is_private} where id = {$id}";
        return $this->query_noResult($query);
    }

    public function set_keep_highest($id,$keep_highest){
        $keep_highest=$keep_highest?'1':0;
        $query = "UPDATE quizzes set keep_highest_score = {$keep_highest} where id = {$id}";
        return $this->query_noResult($query);
    }
    public function set_sort_mode($id,$sort_mode){
        $sort_mode=$sort_mode?:'in_order';
        $query = "UPDATE quizzes set sort_mode = '{$sort_mode}' where id = {$id}";
        return $this->query_noResult($query);
    }
    public function set_questions_per_page($id,$questions_per_page){
        $questions_per_page=$questions_per_page?:'-1';
        $query = "UPDATE quizzes set questions_per_page = '{$questions_per_page}' where id = {$id}";
        return $this->query_noResult($query);
    }
    public function make_survey($id,$is_survey){
        $is_survey=$is_survey?'1':0;
        $query = "UPDATE quizzes set is_survey = {$is_survey} where id = {$id}";
        return $this->query_noResult($query);
    }
    public function remove($id){
        $query = "delete from quizzes where id={$id}";
        $sucess = $this->query_noResult($query);
        $query = "delete from quiz_questions where quiz_id={$id}";
        return $this->query_noResult($query) && $sucess;
    }
    #@param {array|int} course_id
    public function get_all_by_course_id($course_id){
        $courses= is_array($course_id)?$course_id:array($course_id=>$course_id);
        $query = "SELECT `quizzes`.*, COUNT(`questions`.`id`) AS 'count' FROM `quizzes` LEFT JOIN `quiz_questions` ON(`quiz_questions`.`quiz_id`=`quizzes`.`id`) LEFT JOIN `questions` on (`questions`.`id` = `quiz_questions`.`question_id` AND `questions`.`type` != 'pagebreak') WHERE `quizzes`.`course_id` IN (" . implode(',', array_keys($courses)) . ") GROUP BY `quizzes`.`course_id`, `quizzes`.`id` ORDER BY `quizzes`.`title` ASC";
        return $this->query($query);
    }

    public function get_all_tests(){
        $query = "SELECT `quizzes`.*, COUNT(`questions`.`id`) AS 'count' FROM `quizzes` LEFT JOIN `quiz_questions` ON( `quiz_questions`.`quiz_id`=`quizzes`.`id`) LEFT JOIN `questions` on (`questions`.`id` = `quiz_questions`.`question_id` AND `questions`.`type` != 'pagebreak') GROUP BY `quizzes`.`course_id`, `quizzes`.`id` ORDER BY `quizzes`.`title` ASC";
        return $this->query($query);
    }
    public function get_tests_list($search){
        $query = "SELECT * FROM (SELECT `quizzes`.*, COUNT(`questions`.`id`) AS 'count'
                    FROM `quizzes`
                    LEFT JOIN `quiz_questions` ON(`quiz_questions`.`quiz_id`=`quizzes`.`id`)
                    LEFT JOIN `questions` on (`questions`.`id` = `quiz_questions`.`question_id` AND `questions`.`type` != 'pagebreak')
                    WHERE quizzes.title like '%{$search}%'
                    GROUP BY `quizzes`.`course_id`, `quizzes`.`id`
                    ORDER BY `quizzes`.`title` ASC) as quizzes where count > 0";
        return $this->query($query);
    }
    public function vocab_questions_count($module_id){
        $query = "select count(*) as count from vocabularies where module_id={$module_id}";
        return $this->fetch_one($query);
    }
    public function quiz_questions_count($quiz_id){
        $query = "select sum(max_points) as count from quiz_questions
                  left join questions on questions.id = quiz_questions.question_id
                  where quiz_id={$quiz_id}";
        return $this->fetch_one($query);
    }
    public function quiz_already_taken($page_id,$user_id){
        $query = "select randomquiz_id as id from quiz_scores where quiz_id = $page_id and user_id = $user_id";
        return  $this->fetch_one($query);

    }

    public function get_all_by_org_id($org_id,$user_id = 0){
        /* $query="SELECT quizzes.id,title,quizzes.course_id,quizzes.created_by,quizzes.description FROM quizzes
                 LEFT JOIN courses on quizzes.course_id = courses.id
                 LEFT JOIN departments on courses.departmentid = departments.id
                 LEFT JOIN organizations on departments.organizationid = organizations.id
                 WHERE organizations.id = '{$org_id}'";
         */
        /*
        Golabs 23/02/2015
        Added  in Question counter to statment below.
        */
        $where='';
        if($org_id>0){
            $where =" WHERE organizations.id = '{$org_id}' and ((is_private=0) or (is_private=1 and quizzes.created_by = {$user_id}))";
        }

        $query = "SELECT quizzes.id,title,quizzes.course_id,quizzes.created_by,quizzes.description,qtype,quizzes.random,
                COUNT(quiz_questions.id) as count,quiz_questions.bank_id as bank_id,
                organizations.id as org_id, organizations.name as org_name
                FROM quizzes
                LEFT JOIN quiz_questions ON(quiz_questions.quiz_id=quizzes.id)
                LEFT JOIN courses on quizzes.course_id = courses.id
                LEFT JOIN departments on courses.departmentid = departments.id
                LEFT JOIN organizations on departments.organizationid = organizations.id
                {$where}
                group by quizzes.id";

        return $this->query($query);
    }
    public function clone_quiz($id,$new_name,$user){
        $query = "INSERT INTO  quizzes
                  (title, course_id, created_by, modified, description,qtype,random,is_private,is_survey,department_id,org_id)
                  SELECT '{$new_name}', course_id, {$user}, CURRENT_TIMESTAMP() , description,qtype,random,is_private,is_survey,department_id,org_id
                  FROM quizzes
                  WHERE id = '{$id}'
                  ";
        return $this->query_noResult($query);
    }
    public function clone_quiz_question($old_id,$new_id){
        $query = "INSERT INTO quiz_questions
                  (quiz_id, question_id, position,bank_id,random)
                  SELECT '{$new_id}',question_id,position,bank_id,random
                  FROM quiz_questions
                  WHERE quiz_id = '{$old_id}'
                  ";
        return $this->query_noResult($query);
    }
    public static $queryGetQuizQuestions = <<<SQL
    SELECT `questions`.*,
            `quiz_questions`.`position`,
            quiz_questions.id as quiz_question_id,
            quiz_questions.bank_id,
            quiz_questions.tags,
            quiz_questions.random ,
            quiz_questions.points,
            banks.title as bankName,
            bank_questions.bank_id as ChangedBank,
            questions.max_points as qpoints,
            @rownum := @rownum + 1 as counter
            FROM `quiz_questions` cross join (select @rownum := 0) r
            LEFT JOIN `questions` ON (`questions`.`id` = `quiz_questions`.`question_id`)
            LEFT JOIN `bank_questions` ON (`bank_questions`.`question_id` = `questions`.`id`)
             LEFT JOIN banks on quiz_questions.bank_id = banks.id
            WHERE `quiz_questions`.`quiz_id`=:quizId
            ORDER BY `quiz_questions`.`position` ASC
SQL;

    public static $queryGetquizqustionPageid = <<<SQL
            select pages.id from 
            quiz_questions,pages
            where quiz_questions.id = :quiz_question_id
            AND
            pages.quiz_id = quiz_questions.quiz_id
SQL;




}
class UserSQL extends BaseSQL{
    public function get_courses_by_id($user_id){
        $query = "SELECT courses.id, courses.name, courses.description
                  FROM users JOIN user_classes ON (users.id=user_classes.userid)
                  JOIN classes ON (user_classes.classid=classes.id)
                  JOIN courses ON (classes.courseid=courses.id)
                  WHERE users.id={$user_id} AND classes.is_active AND courses.is_active=1 ORDER BY courses.name ASC";
        return $this->query($query);
    }
}
Class VocabSQL extends BaseSQL{
    public function get_by_unit($unit_id){
        $query = "select m.id as module_id,m.name,m.description,count(distinct v.id) as 'count'
                    from pages p
                    left join vocabularies v on p.moduleid = v.module_id
                    join modules m on m.id = p.moduleid
                    where p.unitid={$unit_id}
                    group by m.id";
        return $this->query($query);
    }
    public function get_all($lang=''){
        $where = '1';
        if($lang!=''){
            $where = "language_id='{$lang}'";
        }
        $query = "select m.id as module_id,name,description,language_name,language_id,count(distinct v.id) as 'count'  from modules m
                    join languages l on l.language_id = m.base_language
                    left join vocabularies v on m.id = v.module_id
                    left join vocabulary_audios va on v.id = va.vocabulary_id
                    where {$where}
                    group by m.id";
        return $this->query($query);
    }
    public function details($moduleid){
        $query = "select
                   v.*, va.audio_url,m.name,m.description,m.base_language,m.target_language
                   from vocabularies v
                   left join vocabulary_audios va on va.vocabulary_id = v.id
                   left join modules m on v.module_id = m.id
                   where v.module_id = '{$moduleid}'
                   order by v.position,va.id" ;
        return $this->query($query);
    }
    public function createModule($name,$description,$target_language,$base_language,$course_id){
        return VocabController::_create([
            'name'=>$name,
            'description'=>$description,
            'target_language'=>$target_language,
            'base_language'=>$base_language,
            'course_id'=>$course_id
        ]);
    }
    public function updateModule($id,$name,$description,$target_language,$base_language){
        $query = "UPDATE modules SET name='{$name}',description='{$description}',base_language='{$base_language}',target_language='{$target_language}'
                  WHERE id = {$id}";
        return $this->query_noResult($query);
    }
    public function saveModule($id,$name,$description,$target_language,$base_language,$course_id){
        if($id==0){
            return $this->createModule($name,$description,$target_language,$base_language,$course_id);
        }
        if(!$this->updateModule($id,$name,$description,$target_language,$base_language)) return false;

        return $id;
    }

    public function createVocab($module_id,$phrase,$translation,$position,$image=null){
        $query = "INSERT INTO vocabularies (module_id, phrase,translation, position,image)
                  VALUES ('{$module_id}','{$phrase}','{$translation}','{$position}','{$image}')";
        return $this->query_ReturnId($query);
    }
    public function updateVocab($id,$module_id,$phrase,$translation,$position,$image=null){
        $util = new Utility();
        return  $util->insert(
            VocabController::$queryUpdateVocab,
            [
                'moduleId'=>$module_id,
                'phrase'=>$phrase,
                'translation'=>$translation,
                'position'=>$position,
                'image'=>$image,
                'id'=>$id
            ]
        );

    }
    public function saveVocab($id,$module_id,$phrase,$translation,$position,$image=null){
        if($id==0){
            return $this->createVocab($module_id,$phrase,$translation,$position,$image);
        }else{
            $this->updateVocab($id,$module_id,$phrase,$translation,$position,$image);
            return $id;
        }
    }
    public function saveAudio($vocab_id,$audio_list){
        $this->query_noResult("DELETE FROM vocabulary_audios WHERE vocabulary_id = $vocab_id");
        $values = array();
        foreach($audio_list as $audio){
            $values[]="('{$vocab_id}','{$audio}')";
        }
        $values = implode(',',$values);
        $query = "INSERT INTO vocabulary_audios ( vocabulary_id, audio_url) VALUES {$values}";
        return $this->query_noResult($query);
    }

}
?>