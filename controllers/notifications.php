<?php

global $PATHS, $DB;
require_once((__DIR__ . '/sql.php'));
require(__DIR__ . '/_utils.php');

function grade_post_query($grade_post_id) {
    return "
        SELECT
        grade_posts.id as 'grade_post_id',
        grade_posts.grade,
        tu.id as 'teacher_user_id',
        tu.fname as 'teacher_fname',
        tu.lname as 'teacher_lname',

        su.id as 'student_user_id',
        su.fname as 'student_fname',
        su.lname as 'student_lname',

        p1.id as 'student_post_id',
        p1.pageid,
        p1.postrootparentid,
        p1.post_reply_id,
        p1.video_url as 'student_video_url',
        p1.video_thumbnail_url as 'student_video_thumbnail_url',
        p1.message as 'student_message',
        p1.upload_url as 'student_upload_url',
        p1.upload_file_name as 'student_upload_file_name',
        p1.created as 'student_created',
        pg.name AS 'page_name',
        pg.allow_template_post,
        pg.layout

        FROM grade_posts
        JOIN posts as p1 ON (p1.id=grade_posts.post_id)
        JOIN users as tu ON (tu.id=grade_posts.user_id)
        JOIN users as su ON (su.id=p1.userid)
        LEFT JOIN pages as pg ON (pg.id=p1.pageid)
        WHERE grade_posts.id={$grade_post_id} LIMIT 1
    ";
}

function get_grade_post($DB, $grade_post_id) {

    $grade_post_res = $DB->mysqli->query(grade_post_query($grade_post_id));

    if (!$grade_post_res || $grade_post_res->num_rows != 1) {
        header('Content-Type: application/json');
        print '{"error": "Failed to find grade post"}';
        exit();
    }

    $grade_post = new \stdClass();
    $grade_post = clone ($grade_post_res->fetch_object());
    $grade_post->allow_template_post = boolval($grade_post->allow_template_post);
    $grade_post->student_created = date("n/j/Y g:i a" , strtotime($grade_post->student_created));
    // $grade_post->teacher_created = date("n/j/Y g:i a" , strtotime($grade_post->teacher_created));

    $grade_post->type = 'gradepost';
    $grade_post->grade = round(floatval($grade_post->grade),2);
    $query = "UPDATE grade_posts SET viewed=1 WHERE grade_posts.id={$grade_post_id}";
    $result = $DB->mysqli->query($query);

    if (!$result) {
        header('Content-Type: application/json');
        print '{"error": "Failed to mark grade post as viewed"}';
        exit();
    }

    return $grade_post;
}

function teacher_posts_query($student_post) {

    return "SELECT posts.*,users.fname as teacher_fname,users.lname as teacher_lname,gp.created as feedbackOn
        FROM posts
        join users on posts.userid = users.id
        left join grade_posts gp on gp.teacher_post_id = posts.id
        WHERE post_reply_id={$student_post} and posts.id != {$student_post} and is_teacher=1";
}
function teacher_posts_rubric($post) {
    return "SELECT *
        FROM grade_rubrics
        WHERE postid={$post}";
}
function getfilesuploaded($id){
    return "select * from filesuploaded where id = '".$id."'";
}

function get_teacher_posts($DB, $student_post) {
    $req = $DB->mysqli->query(teacher_posts_query($student_post));

    if (!$req) {
        header('Content-Type: application/json');
        print '{"error": "Failed to retried teacher posts"}';
        exit();
    }

    $posts = Array();
    $sql = new BaseSQL();
    while ($post = $req->fetch_assoc()) {
        $post['rubric'] = $sql->query(teacher_posts_rubric($post['id']));
		if (isset($post['created']))
		  $post['created'] = date("n/j/Y g:i a" , strtotime($post['created']));
		else
         $post['created'] = date("n/j/Y g:i a" , strtotime($post['created']));

        if (preg_match('@\w@',$post['fileuploadid'])){
            if(strlen($post['fileuploadid'])>24) {  // checking it is a json format or not
                $fileuploadid = json_decode($post['fileuploadid']);
                $post['fileuploadid'] = [];
                for($i = 0;sizeof($fileuploadid)>$i; $i++) {
                    $id = $fileuploadid[$i];
                    $query = "select * from filesuploaded WHERE  id = '$id' limit 1";
                    $result = $DB->mysqli->query($query);
                    if($result && $result->num_rows > 0) {
                        $result2 = $result->fetch_object();
                        $post['uploadedfile'][$i] = array("upload_file_name"=>$result2->filename, "upload_url"=>'../public/useruploads/'.$id.$result2->ext, "fileuploadsize"=>$result2->size);
                        $post['fileuploadid'][$i] = $result2->id;
                    }else {
                        $post['uploadedfile'][$i] = '';
                        $post['fileuploadid'][$i] = '';
                    }
                }
            }
            else { // for previous data
                $req1 = $DB->mysqli->query(getfilesuploaded($post['fileuploadid']));
                $uploaded = $req1->fetch_assoc();
                $post['upload_file_name'] = $uploaded['filename'];
                $post['upload_url'] = '../public/useruploads/'.$post['fileuploadid'].$uploaded['ext'];
                $post['fileuploadsize'] = $uploaded['size'];
            }
        }
        $posts[] = $post;
    }
    return $posts;
}

if (!is_logged_in($_SESSION)) {
    header('Content-Type: application/json');
    print '{"error": "Not logged in"}';
    exit();
}

$user_id = intval($_SESSION['USER']['ID']);

$data = new \stdClass();

function get_uri($uri) {
    $uri = strtok($uri, '?');
    $uri = str_replace('/notifications/', '', $uri);
    return strtok($uri, '/');
}

$uri = get_uri($_SERVER['REQUEST_URI']);

if($uri != 'gradepost') {
    $data->notifications = Array();

    $query = "SELECT grade_posts.id, grade_posts.grade, users.fname, users.lname, posts.video_thumbnail_url,grade_posts.created,
                grade_posts.viewed, grade_posts.teacher_notes, pages.name as 'page_name',show_grades, show_grades_as_score, show_grades_as_letter, show_grades_as_percentage
                FROM `grade_posts` JOIN users ON (grade_posts.user_id=users.id)
                JOIN posts ON (grade_posts.post_id=posts.id)
                LEFT JOIN pages ON (pages.id = posts.pageid)
                LEFT JOIN classes on posts.classid = classes.id
                WHERE posts.userid={$user_id} ORDER BY grade_posts.created DESC";

    $result = $DB->mysqli->query($query);

    if($result && $result->num_rows > 0 ) {
        while($row = $result->fetch_object()) {
            $temp = new \stdClass();
            $temp = clone $row;
            $temp->type = 'gradepost';

            $data->notifications[] = $temp;
        }
    }

    header('Content-Type: application/json');
    print json_encode($data);
    exit();
}

// gradepost
if($_SERVER['REQUEST_METHOD'] == 'POST') {
    $json_input = file_get_contents('php://input');

    $input = json_decode($json_input);

    $grade_post_id = intval($input->notificationId);

    $grade_post = get_grade_post($DB, $grade_post_id);
    $teacher_posts = get_teacher_posts($DB, $grade_post->student_post_id);

    $data->hide_reply = boolval(\English3\Controller\Utility::getInstance()->fetchOne(\English3\Controller\PageController::$queryGetPage,['pageId'=>$grade_post->pageid],'hide_reply'));
    $data->grade_post = $grade_post;
    $data->teacher_posts = $teacher_posts;

    header('Content-Type: application/json');
    print json_encode($data);
    exit();
}

?>
