
<?php
global $PATHS, $DB;
require_once ('sql.php');
require_once ('_utils.php');
require_once('email.php');
use English3\Controller\ClassesController;
use English3\Controller\GradebookController;
use English3\Controller\Organization\OrganizationController;
use English3\Controller\PageController;
use English3\Controller\Posts\SiblingServerFinder;
use English3\Controller\PostsController;
use English3\Controller\ProficiencyTest\Mailer\EmailCompletedTest;
use English3\Controller\TimedReview\TimedReviewAnswerBuilder;
use English3\Controller\Utility;

function reProcessVideoForTimedReviews($input){
    if(@$input->answerTimePositions){
        if (isset($input->contentid) && $input->contentid > 0) {
            $content_id = intval($input->contentid);
        }
        $append_timed_prompts = boolval(Utility::getInstance()->fetchOne('SELECT meta_value FROM pages p join page_meta pm on pm.pageid = p.id where pm.meta_key="append_timed_prompts" and p.id=:pageId',['pageId'=>$content_id]));
        if($append_timed_prompts){
            return true;
        }
    }
    return false;
}
function createLocalOnlyVid($destination_file,$sanitized_video_file_name){

    global $PATHS;
    $samplevid     = $PATHS->app_path . $PATHS->base_site_public_path . "uservids/sample.mp4";
    $mp4_file_name = str_replace('.flv', '.mp4', $destination_file);
    copy($samplevid, $mp4_file_name) or die('No smaple.mp4 found in ' . $samplevid);

    $sampleimg = $PATHS->app_path . $PATHS->base_site_public_path . "uservidthumbnails/sample.jpg";
    $thumbfile = $PATHS->app_path . $PATHS->base_site_public_path . "uservidthumbnails/" . str_replace('.mp4', '.jpg', $sanitized_video_file_name);
    copy($sampleimg, $thumbfile) or die('No smaple.mp4 found in ' . $thumbfile);
    return array($thumbfile,$mp4_file_name);
}
function checkFileType($filename){
    $not_allowed =  array('php', 'asp', 'aspx', 'vbs', 'xml', 'htm', 'html', 'msi', 'jar', 'js', 'bin', 'bat', 'exe', 'dmg', 'sh');
    $ext = pathinfo($filename, PATHINFO_EXTENSION);
    if(in_array($ext,$not_allowed) ) {
        header('Content-Type: application/json');
        print json_encode(['message'=>"File type not supported"]);
        exit();
    }
    return true;

}
function throwExecption($message,$code){
    header('HTTP/1.0 '. $code . " " .  $message);
    exit();
}
function test_user($DB,$user_id,$content_id){
    $query = "SELECT user_classes.classid, user_classes.is_teacher  FROM
              `user_classes`
              JOIN classes ON (user_classes.classid=classes.id)
              JOIN units ON (classes.courseid=units.courseid)
              JOIN pages ON (pages.unitid=units.id)
              WHERE
              user_classes.userid={$user_id} and user_classes.is_observer=0
              AND pages.id={$content_id} LIMIT 1";

    $result = $DB->mysqli->query($query);

    if($result && $result->num_rows == 1) {
        return  $result->fetch_object();
    } else {
        $data = new \stdClass();

        $data->message='User Does Not Have Permission To Post On This Page.';

        header('Content-Type: application/json');
        print json_encode($data);
        exit();
    }
}
function createVideo($filename){
    global $PATHS;
    $sanitized_video_file_name = str_replace('/', '', $filename);
    $sanitized_video_file_name = str_replace('.flv', '', $sanitized_video_file_name);
    $sanitized_video_file_name = str_replace('.', '', $sanitized_video_file_name);

    $sanitized_video_file_name = preg_replace('/[^a-z0-9\-]/', '', $sanitized_video_file_name);

    $sanitized_video_file_name .= '.flv';

    $source_file = $PATHS->wowza_content . $sanitized_video_file_name;
    $destination_file = $PATHS->app_path . $PATHS->base_site_public_path . "uservids/" . $sanitized_video_file_name;



    if(file_exists($source_file)) {
        if (!file_exists($destination_file)) {
            //$data->message = "Moved File: " . $source_file . " To: " . $destination_file;

            if (rename($source_file, $destination_file)) {
                $sanitized_video_file_name = str_replace('.flv', '.mp4', $sanitized_video_file_name);

                $mp4_file_name = $destination_file;

                $mp4_file_name = str_replace('.flv', '.mp4', $destination_file);

                $thumbfile = $PATHS->app_path . $PATHS->base_site_public_path . "uservidthumbnails/" . str_replace('.mp4', '.jpg', $sanitized_video_file_name);
                shell_exec("/usr/bin/ffmpeg -i " . $destination_file . " -deinterlace -an -ss 1 -t 00:00:10 -r 1 -y -vcodec mjpeg -f mjpeg $thumbfile 2>&1");

                $mp4convert = "/usr/bin/ffmpeg -i " . $destination_file . " -vcodec libx264 -crf 23 -preset medium -vsync 1 -r 25 -acodec aac -strict -2 -b:a 64k  -ar 44100 -ac 1 " . $mp4_file_name . " > /dev/null 2>/dev/null &";
                shell_exec($mp4convert);
                return $sanitized_video_file_name;
            }
        }
    }
    return false;
}
function autograde_mainpost_points($pageid,$user_id,$meta){
    $where = "(p.id = p.postrootparentid)";
    $max_points = $meta['main_max_points'];
    $per_post = $meta['main_per_post'];
    $current_points_at_level = Utility::getInstance()->fetchOne("
        SELECT count(*) from posts p
        WHERE userid = {$user_id} and pageid={$pageid} and {$where}
    ");
    $current_points_at_level = $current_points_at_level?intval($current_points_at_level)*$per_post:0;
    return min($current_points_at_level,$max_points);
}
function autograde_replypost_points($pageid,$user_id,$meta){
    $where = "(p.id != p.postrootparentid) and root.userid != p.userid";
    $max_points = $meta['reply_max_points'];
    $per_post = $meta['reply_per_post'];
    $current_points_at_level = Utility::getInstance()->fetchOne("
        SELECT count(*) FROM posts p
        join posts root on root.id = p.postrootparentid
        WHERE p.userid = {$user_id} and p.pageid={$pageid} and {$where}

    ");
    $current_points_at_level = $current_points_at_level?intval($current_points_at_level)*$per_post:0;
    return min($current_points_at_level,$max_points);
}

function auto_grade($post_id,$class_id,$page_id,$user_id,$postroot=0){
    $sql = new BaseSQL();
    $pageMetaSQL =new PageMetaSQL();
    $meta = $pageMetaSQL->get($page_id);
    global $PATHS;
    $server = @$PATHS->serverName?:'';

    if($postroot==0){
        $postroot=$post_id;
        $level = 0;
    }
    else{
        $level = 1;
    }

    $points = autograde_mainpost_points($page_id,$user_id,$meta) + autograde_replypost_points($page_id,$user_id,$meta);

    $teacher_post_id = $sql->query_ReturnId("INSERT INTO posts
                        (classid,userid,pageid,postrootparentid,post_reply_id,is_teacher,is_private,server) VALUES
                        ({$class_id},0,{$page_id},{$postroot},{$post_id},1,0,'{$server}')");

    $sql->query_noResult("INSERT INTO grade_posts
                        (post_id,teacher_post_id,user_id,grade) VALUES
                        ({$post_id},{$teacher_post_id},0,{$points})");
    $summary = GradebookController::_recalculate($user_id,$page_id);
    if(@$summary['percentSubmittedTasks']==100 && ClassesController::isJ1($class_id) &&
        !ClassesController::isPracticeTest($class_id)){
        EmailCompletedTest::_studentCompletedTest($user_id,$class_id);
    }
}
function generate_unique($unique_end_length) {
    $unique_end_length = intval($unique_end_length);

    $rand = array('a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'k', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z');

    $date = date("Y-m-d-s-");
    $str = '';

    $length = count($rand) - 1;

    for($i = 0; $i < $unique_end_length; $i++) {
        $str .= $rand[mt_rand(0, $length)];

    }

    return $date . $str;
}
function preparePosts($posts,$user_id,$is_teacher){
    $postmessages = array();
    foreach($posts as $post){

        $post['created'] = date("n/j/Y g:i a" , strtotime($post['created']));
        $post['upload_url'] = Utility::urlencodepath($post['upload_url']);

        if(gettype($post['upload_url'])=='array'){
            $post['upload_file_name']=json_decode($post['upload_file_name']);
        }else{
            if($post['upload_url']){
                $post['upload_url']=[$post['upload_url']];
                $post['upload_file_name']=[$post['upload_file_name']];
            }

        }
        if($post['video_url']){
            $views = new \English3\Controller\Posts\PostViews($post['id']);
            $post['views'] = $views->countViews();
        }
        $postmessages[] = json_decode(json_encode($post));
    }


    if(count($postmessages)){
        $postmessages = orderPostMessages($postmessages, $user_id, $is_teacher);
        $postmessages = splitRootChildren($postmessages);
    }
    return $postmessages;
}
function orderPostMessages($messages, $user_id, $user_is_teacher) {
    //print "NEED TO ORDER: ";
    //print_r($messages);
    //print "END NEED TO ORDER";


    $temp_data = array();

    foreach($messages as $message) {
        $tmp = new \stdClass();

        $tmp = clone $message;


        if($tmp->is_private) {
            if($user_is_teacher) {
                $temp_data["{$message->id}"] = $tmp;
                $temp_data["{$message->id}"]->replying_posts = array();
            } else {
                if($user_id == $tmp->user_id) {
                    $temp_data["{$message->id}"] = $tmp;
                    $temp_data["{$message->id}"]->replying_posts = array();
                } else {
                    if($tmp->is_teacher) {
                        $temp_data["{$message->id}"] = $tmp;
                        $temp_data["{$message->id}"]->replying_posts = array();
                    } else {
                        ;
                    }
                }
            }
        } else {
            $temp_data["{$message->id}"] = $tmp;
            $temp_data["{$message->id}"]->replying_posts = array();
        }
    }

    foreach($messages as $message) {
        if(isset($temp_data["{$message->post_reply_id}"]) && $message->post_reply_id != $message->id && $message->post_reply_id > 0) {

            $tmp = new \stdClass();

            $tmp = clone $message;
            if(boolval($tmp->is_private) && !boolval($tmp->is_teacher) && $user_id != $tmp->user_id){
                continue;
            }

            $temp_data["{$message->post_reply_id}"]->replying_posts[] = $tmp;
        }
    }

    //print "NEED TO WALK: ";
    //print_r($temp_data);
    //print "END NEED TO WALK";

    return orderPostMessagesWalk($temp_data);
}

function checkgetfileupload($fileuploadid){
    global $PATHS, $DB;

    if (!preg_match('/\d/',$fileuploadid))
    {
        return '';
    }
    if(strlen($fileuploadid)>24) {  //checking it is json format or not
        $fileuploadid = json_decode($fileuploadid);
        for($i = 0;sizeof($fileuploadid)>$i; $i++) {
            $id = $fileuploadid[$i];
            $query = "select * from filesuploaded WHERE  id = '$id' limit 1";
            $result = $DB->mysqli->query($query);
            if($result && $result->num_rows > 0) {
                $result2[$i] = $result->fetch_object();
            }else {
                $result2[$i] ='';
            }
        }
        return $result2;
    } else { // for previous data
         $query = "select * from filesuploaded WHERE  id = '$fileuploadid' limit 1";
         $result = $DB->mysqli->query($query);
         if($result && $result->num_rows > 0) {
             return $result->fetch_object();
         };
         return '';
     }
}
function postUploadedFile($file_upload_url,$filename,$user_id,$group_id){
    global $PATHS, $DB;
    $content_id = 0;

    $mysql_uploadurl = $DB->mysqli->real_escape_string($file_upload_url);
    $mysql_filename = $DB->mysqli->real_escape_string($filename);

    if(isset($_REQUEST['contentid']) && $_REQUEST['contentid'] > 0) {
        $content_id = intval($_REQUEST['contentid']);
    }

    if(isset($_REQUEST['reply_to_id']) && $_REQUEST['reply_to_id'] > 0) {
        $reply_to_id = intval($_REQUEST['reply_to_id']);
    } else {
        $reply_to_id = 0;
    }

    if(isset($_REQUEST['file_upload_comment']) && strlen($_REQUEST['file_upload_comment']) > 0) {
        $mysql_video_comment = $DB->mysqli->real_escape_string($_REQUEST['file_upload_comment']);
    } else {
        $mysql_video_comment = '';
    }

    if(isset($_REQUEST['check_is_private']) && $_REQUEST['check_is_private'] == 1) {
        $is_private = 1;
    } else {
        $is_private = 0;
    }

    $query = "SELECT user_classes.classid, user_classes.is_teacher  FROM `user_classes` JOIN classes ON (user_classes.classid=classes.id) JOIN units ON (classes.courseid=units.courseid) JOIN pages ON (pages.unitid=units.id) WHERE user_classes.userid={$user_id} AND pages.id={$content_id} LIMIT 1";

    $result = $DB->mysqli->query($query);

    if($result && $result->num_rows == 1) {
        $row = $result->fetch_object();

        $class_id = $row->classid;
        $is_teacher = $row->is_teacher;
    } else {
        $data = new \stdClass();

        $data->message='User Does Not Have Permission To Post On This Page.';

        header('Content-Type: application/json');
        print json_encode($data);
        exit();
    }

    $query = "SELECT allow_video_post, allow_text_post, is_private, is_gradeable,automatically_grade FROM pages WHERE id={$content_id} LIMIT 1";


    $result = $DB->mysqli->query($query);

    if($result && $result->num_rows == 1) {
        $row = $result->fetch_object();
        $automatically_grade = $row->automatically_grade==1;
        if($row->is_private == 1) {
            $is_private = 1;
        }
        $server = @$PATHS->serverName?:'';
        $query = "INSERT INTO posts(classid, userid, pageid, postrootparentid, post_reply_id, upload_url, upload_file_name, message, is_private, is_teacher,video_url,video_thumbnail_url,groupid,server) VALUES($class_id, $user_id, $content_id, $reply_to_id, $reply_to_id, '{$mysql_uploadurl}', '{$mysql_filename}', '{$mysql_video_comment}', {$is_private}, {$is_teacher},'','',{$group_id},'{$server}')";
        $sql = new BaseSQL();
        $newPostId = $sql->query_ReturnId($query);

        //need to work with existing data
        $content = PageController::_getContentPageAttempts($content_id, $user_id);
        if($content){
            PageController::_addContentPageAttempts($content_id, $user_id);
        }
        else{
            $totalPosts = PostsController::_getTotalUserPostsForPage($content_id,$user_id);
            PageController::_setContentPageAttempts($content_id, $user_id, $totalPosts);
        }

        if($newPostId) {
            if($reply_to_id != 0) {
                $query = "SELECT postrootparentid,userid FROM posts WHERE id=$reply_to_id LIMIT 1";

                $result = $DB->mysqli->query($query);

                if($result && $result->num_rows == 1) {
                    $row = $result->fetch_object();

                    $query = "UPDATE posts SET postrootparentid = {$row->postrootparentid},  post_reply_id = {$reply_to_id} WHERE id = {$DB->mysqli->insert_id}";

                    $DB->mysqli->query($query);
                    if($automatically_grade && $is_teacher==0 && $row->userid != $user_id){
                        auto_grade($newPostId,$class_id,$content_id,$user_id,$row->postrootparentid);
                    }
                }
            } else {
                $query = "UPDATE posts SET postrootparentid = {$newPostId},  post_reply_id = {$newPostId} WHERE id = {$newPostId}";

                $DB->mysqli->query($query);
                if($automatically_grade && $is_teacher==0){
                    auto_grade($newPostId,$class_id,$content_id,$user_id);
                }
            }
        }

        return "successful";
    }
    return "Unexpected error";
}

function orderPostMessagesWalk($temp_data) {
    $temp_array = array();
    $me = $_SESSION['USER']['ID'];
    $util=new Utility();
    foreach($temp_data as $data) {

        if($data->post_reply_id == $data->id || $data->post_reply_id==0) {
            $tmp = new \stdClass();

            $tmp->id = $data->id;
            $tmp->post_reply_id = $data->post_reply_id;
            $tmp->postrootparentid = $data->postrootparentid;
            $tmp->fileuploadid =  checkgetfileupload($data->fileuploadid);
            $tmp->video_url = $data->video_url;
            $tmp->video_thumbnail_url = $data->video_thumbnail_url;
            $tmp->upload_url = $data->upload_url;
            $tmp->upload_file_name = $data->upload_file_name;
            $tmp->message = $data->message;
            $tmp->is_teacher = $data->is_teacher;
            $tmp->is_private = $data->is_private;
            $tmp->created = $data->created;
            $tmp->user_id = $data->user_id;
            $tmp->fname = $data->fname;
            $tmp->lname = $data->lname;
            $tmp->views = $data->views;
            if($data->grade) $tmp->grade = $data->grade;
            if($data->rubricid) $tmp->rubricid = $data->rubricid;
            $tmp->indent_count = 0;


            $temp_array[] = $tmp;


            //print "Root ID: {$data->id}\n";
            //print_r($temp_array);
            //print "End Root\n\n";

            if(!empty($data->replying_posts)) {
                foreach($data->replying_posts as $reply_post) {
                    $tmp = new \stdClass();

                    $tmp->id = $reply_post->id;
                    $tmp->post_reply_id = $reply_post->post_reply_id;
                    $tmp->postrootparentid = $reply_post->postrootparentid;
                    $tmp->fileuploadid = checkgetfileupload($reply_post->fileuploadid);
                    $tmp->video_url = $reply_post->video_url;
                    $tmp->video_thumbnail_url = $reply_post->video_thumbnail_url;
                    $tmp->upload_url = $reply_post->upload_url;
                    $tmp->upload_file_name = $reply_post->upload_file_name;
                    $tmp->message = $reply_post->message;
                    $tmp->is_teacher = $reply_post->is_teacher;
                    $tmp->is_private = $reply_post->is_private;
                    $tmp->created = $reply_post->created;
                    $tmp->user_id = $reply_post->user_id;
                    $tmp->fname = $reply_post->fname;
                    $tmp->lname = $reply_post->lname;
                    $tmp->views = $reply_post->views;
                    if($reply_post->grade && ($data->user_id==$me || $util->checkTeacher($data->classid,null,false))) $tmp->grade = $reply_post->grade;
                    if($reply_post->rubricid && ($data->user_id==$me || $util->checkTeacher($data->classid,null,false))) $tmp->rubricid = $reply_post->rubricid;
                    $tmp->indent_count = 1;

                    $temp_array[] = $tmp;


                    //print "first level: \n";
                    //print_r($temp_array);
                    //print "end first level: \n";

                    if(!empty($temp_data["{$reply_post->id}"]->replying_posts)) {
                        $result = orderPostMessageWalkerHelper($temp_data, $temp_data["{$reply_post->id}"], 2);

                        $temp_array = array_merge($temp_array, $result);

                        //print "finished walked for all levels for first:\n";
                        //print_r($temp_array);
                        //print "end finished walked for all levels for first:\n";
                    }
                }
            }
        }
    }

    return $temp_array;
}

function orderPostMessageWalkerHelper($temp_data, $root_reply_post, $indent_count) {
    $temp_array = array();

    //print "helper $root_reply_post->id \n";

    if(isset($temp_data["{$root_reply_post->id}"])) {
        if(!empty($temp_data["{$root_reply_post->id}"]->replying_posts)) {
            foreach($temp_data["{$root_reply_post->id}"]->replying_posts as $reply_post) {
                $tmp = new \stdClass();

                $tmp->id = $reply_post->id;
                $tmp->post_reply_id = $reply_post->post_reply_id;
                $tmp->postrootparentid = $reply_post->postrootparentid;
                $tmp->video_url = $reply_post->video_url;
                $tmp->video_thumbnail_url = $reply_post->video_thumbnail_url;
                $tmp->upload_url = $reply_post->upload_url;
                $tmp->upload_file_name = $reply_post->upload_file_name;
                $tmp->is_teacher = $reply_post->is_teacher;
                $tmp->is_private = $reply_post->is_private;
                $tmp->message = $reply_post->message;
                $tmp->created = $reply_post->created;
                $tmp->user_id = $reply_post->user_id;
                $tmp->fname = $reply_post->fname;
                $tmp->lname = $reply_post->lname;
                $tmp->indent_count =    $indent_count;

                $temp_array[] = $tmp;
                //print "buillding step:\n";
                //print_r($temp_array);
                //print "end building step\n";

                if(!empty($temp_data["{$reply_post->id}"]->replying_posts)) {
                    $result = orderPostMessageWalkerHelper($temp_data, $temp_data["{$reply_post->id}"], $indent_count + 1);

                    $temp_array = array_merge($temp_array, $result);

                    //print "stepping \n";
                    //print_r($temp_array);
                    //print "end step\n";
                }
            }
        }
    }

    return $temp_array;
}

function splitRootChildren($postmessages) {
    $result = array();
    $temp_root = array();

    foreach($postmessages as $message) {

        if($message->indent_count == 0) {
            if(!empty($temp_root)) {
                $result = array_merge($result, $temp_root);
            }

            $temp_root = array();

            $temp_obj = clone $message;

            $temp_obj->children = array();
            $temp_root[] = $temp_obj;
        } else {
            $temp_root[0]->children[] = clone $message;
        }
    }

    if(!empty($temp_root)) {
        $result = array_merge($result, $temp_root);
    }

    return $result;
}

if(isset($_SESSION['USER']) && isset($_SESSION['USER']['LOGGED_IN']) && isset($_SESSION['USER']['ID']) && $_SESSION['USER']['ID'] > 0 && $_SESSION['USER']['LOGGED_IN']==true) {
    $uri = strtok($_SERVER['REQUEST_URI'], '?');

    $uri = str_replace('/post/', '', $uri);

    $post_action = strtok($uri, '/');

    if($post_action == 'new') {
        $file_name = generate_unique(10);
        $useWebRTC = false;
        if(isset($_REQUEST['orgId'])){

            $useWebRTC = OrganizationController::_getPreferencesField($_REQUEST['orgId'],'use_webrtc');

        }

        if(!$useWebRTC){
            $widget  = '<div>';
            $widget .= '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="272px" height="224px">';
            $widget .= '<param name="movie" value="/public/flash/megec2.swf?videofile=' . $file_name . '&amp;rtmpserver=' . $PATHS->wowza_url . '">';
            $widget .= '<param name="wmode" value="transparent">';
            $widget .= '<!--[if !IE]>-->';
            $widget .= '<object id="bob" type="application/x-shockwave-flash" data="/public/flash/megec2.swf?videofile=' . $file_name . '&amp;rtmpserver=' . $PATHS->wowza_url . '" width="272px" height="224px"">';
            $widget .= '<param name="wmode" value="transparent">';
            $widget .= '<!--<![endif]-->';
            $widget .= '<table style="margin-top:10px">';
            $widget .= '<tbody>';
            $widget .= '<tr>';
            $widget .= '<td><p>Flash object is not working on your browser. If your using a mobile device, click on upload to record your video. If not, then flash has not been set up correctly.</p></td>';
            $widget .= '</tr>';
            $widget .= '</tbody>';
            $widget .= '</table>';
            $widget .= '<!--[if !IE]>-->';
            $widget .= '</object>';
            $widget .= '<!--<![endif]-->';
            $widget .= '</object>';
            $widget .= '</div>';

            $button = '<img src="/public/img/recordbttn.png" id="button" onclick="callAS(bob,\'' . $file_name . '\')">';

        }
        else{
            $button = '<span class="loading-stream" style="display:none">Establishing connection </span><img src="/public/img/recordbttn.png" 
id="button" 
onclick="callWebRTCAS(\'' .
                $file_name . '\')"><i 
class="fa fa-spinner fa-pulse" style="display: none">';
            global $VIDEO;
            $widget = "<webrtc-video-recorder
                    id='${file_name}'
                    stream-name='{$file_name}'
                    video-bitrate='{$VIDEO->videoBitrate}'
                    audio-bitrate='{$VIDEO->audioBitrate}'
                    video-framerate='{$VIDEO->videoFrameRate}'
                    sdp-url='{$VIDEO->sdp_url}'
                    app-name='{$VIDEO->appName}'
                    ></webrtc-video-recorder>";
        }


        $data = new \stdClass();
        $data->video_widget = $widget;
        $data->button = $button;
        $data->file_name = $file_name;

        header('Content-Type: application/json');
        print json_encode($data);
    }else
        if($post_action == 'newTimed') {
            $file_name = generate_unique(10);
            $useWebRTC = false;
            if(isset($_REQUEST['orgId'])){

                $useWebRTC = OrganizationController::_getPreferencesField($_REQUEST['orgId'],'use_webrtc');

            }
            $data = new \stdClass();

            if(!$useWebRTC) {
                $objectID = 'bob_' . mt_rand();

                $widget = '<div>';
                $widget .= '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="272px" height="224px">';
                $widget .= '<param name="movie" value="/public/flash/megec2timed2.swf?videofile=' . $file_name . '&amp;rtmpserver=' . $PATHS->wowza_url . '">';
                $widget .= '<param name="wmode" value="transparent">';
                $widget .= '<!--[if !IE]>-->';
                $widget .= '<object id="' . $objectID . '" type="application/x-shockwave-flash" data="/public/flash/megec2timed2.swf?videofile=' . $file_name . '&amp;rtmpserver=' . $PATHS->wowza_url . '  " width="272px" height="224px">';
                $widget .= '<param name="wmode" value="transparent">';
                $widget .= '<!--<![endif]-->';
                $widget .= '<table style="margin-top:10px">';
                $widget .= '<tbody>';
                $widget .= '<tr>';
                $widget .= '<td><p>Flash object is not working on your browser. If your using a mobile device, click on upload to record your video. If not, then flash has not been set up correctly.</p></td>';
                $widget .= '</tr>';
                $widget .= '</tbody>';
                $widget .= '</table>';
                $widget .= '<!--[if !IE]>-->';
                $widget .= '</object>';
                $widget .= '<!--<![endif]-->';
                $widget .= '</object>';
                $widget .= '</div>';

                $button = '<img src="/public/img/recordbttn.png" id="button" onclick="callAS(' . $objectID . ',\'' . $file_name . '\')">';

                $data->object = (string) $objectID;
            } else{
                $button = '<span class="loading-stream" style="display:none">Establishing connection </span><img src="/public/img/recordbttn.png" 
id="button" 
onclick="callWebRTCAS(\'' .
                    $file_name . '\')"><i 
class="fa fa-spinner fa-pulse" style="display: none">';
                global $VIDEO;
                $widget = "<webrtc-video-recorder
                    id='${file_name}'
                    stream-name='{$file_name}'
                    video-bitrate='{$VIDEO->videoBitrate}'
                    audio-bitrate='{$VIDEO->audioBitrate}'
                    video-framerate='{$VIDEO->videoFrameRate}'
                    sdp-url='{$VIDEO->sdp_url}'
                    app-name='{$VIDEO->appName}'
                    ></webrtc-video-recorder>";

            }


            $data->video_widget = $widget;
            $data->button = $button;
            $data->file_name = $file_name;

            header('Content-Type: application/json');
            print json_encode($data);
        }
        else if($post_action == 'teacher_feedback') {
            if($_SERVER['REQUEST_METHOD'] == 'POST') {
                $json_input = file_get_contents('php://input');
                $postSQL = new PostSQL();

                $input = json_decode($json_input);

                $teacher_post_id = $input->teacher_post_id;
                $mysql_videofilename = '';
                $mysql_thumbnailfilename = '';
                $user_id = intval($_SESSION['USER']['ID']);

                if(isset($input->videoFileName) && strlen($input->videoFileName) > 0) {
                    $sanitized_video_file_name = createVideo($input->videoFileName);
                    if($sanitized_video_file_name){
                        $mysql_videofilename = $DB->mysqli->real_escape_string("/public/uservids/" . $sanitized_video_file_name);
                        $mysql_thumbnailfilename = $DB->mysqli->real_escape_string("/public/uservidthumbnails/" . str_replace('.mp4', '.jpg', $sanitized_video_file_name));
                    }
                }
                if(isset($input->video_comment) && strlen($input->video_comment) > 0) {
                    $mysql_video_comment = $DB->mysqli->real_escape_string($input->video_comment);
                } else {
                    $mysql_video_comment = '';
                }
                global $PATHS;
                $server = @$PATHS->serverName?:'';
                $postInfo = $postSQL->get_by_id($teacher_post_id);
                $postInfo->groupid=$postInfo->groupid?$postInfo->groupid:'null';
                $insertQuery = "INSERT INTO posts SET
                classid = {$postInfo->classid},
                userid = {$user_id},
                pageid = {$postInfo->pageid},
                postrootparentid = {$postInfo->postrootparentid},
                post_reply_id = {$teacher_post_id},
                video_url = '{$mysql_videofilename}',
                video_thumbnail_url = '{$mysql_videofilename}',
                message = '{$mysql_video_comment}',
                is_teacher=1,
                is_private=1,
                groupid={$postInfo->groupid},
                teacher_feedback=1,
                server={$server}
            ";

                if(!$postSQL->query_noResult($insertQuery)){
                    throwExecption('Feedback could not be saved',500);
                };

                sendFeedbackToTeacher($teacher_post_id,$mysql_video_comment,$mysql_videofilename);



            }
        } else if($post_action == 'save') {
            if($_SERVER['REQUEST_METHOD'] == 'POST') {
                $json_input = file_get_contents('php://input');

                $input = json_decode($json_input);
                $data = new \stdClass();
                $post_id = null;
                if(isset($input->contentid) && $input->contentid > 0) {
                    $content_id = intval($input->contentid);
                } else {
                    $content_id = 0;
                }
                $group_id = 'null';
                if(isset($input->courseId)){
                    $courseId = $input->courseId;
                    if(preg_match("/[0-9]+-[0-9]+/", $courseId)){
                        $group_id = intval(explode('-',$courseId)[1]);
                        $courseId = intval(explode('-',$courseId)[0]);

                    }
                }

                $user_id = intval($_SESSION['USER']['ID']);


                //checking for post limits
                //need to work with existing data
                $contentPageAttempts = PageController::_getContentPageAttempts($content_id,$user_id);
                if($contentPageAttempts){
                    $postLimit = PageController::_getPageMeta($content_id,'post_limit');
                    if($postLimit){
                        if($contentPageAttempts['attempts_completed']>=$postLimit){
                            throwError("You reached the maximum number of posts allowed for this activity");
                        }
                    }
                }
                else{
                    $postLimit = PageController::_getPageMeta($content_id,'post_limit');
                    if($postLimit){
                        $totalPosts = PostsController::_getTotalUserPostsForPage($content_id,$user_id);
                        PageController::_setContentPageAttempts($content_id, $user_id, $totalPosts);
                        if($totalPosts>=$postLimit){
                            throwError("You reached the maximum number of posts allowed for this activity");
                        }
                    }
                }


                $row = test_user($DB,$user_id,$content_id);

                $class_id = $row->classid;
                $is_teacher = $row->is_teacher;
                $orgId = OrganizationController::_getOrgFromClassId($class_id);


                $query = "SELECT allow_video_post, allow_text_post, is_private, is_gradeable,automatically_grade FROM pages WHERE id={$content_id} LIMIT 1";


                $result = $DB->mysqli->query($query);

                if($result && $result->num_rows == 1) {
                    $row = $result->fetch_object();

                    $allow_video_post = $row->allow_video_post;
                    $allow_text_post = $row->allow_text_post;
                    $master_is_private = $row->is_private;
                    $master_is_gradeable = $row->is_gradeable;
                    $automatically_grade = $row->automatically_grade==1;


                    if (!isset($PATHS->wowza_content))
                    {
                        if($allow_video_post == 1){
                            $allow_text_post = 1;
                            $allow_video_post = 0;
                        }
                    }

                    if($allow_video_post == 1 || isset($input->postAsVideo)) {

                        $mysql_videofilename     = isset($input->videoFileNameReady)?$input->videoFileNameReady:'';
                        $mysql_thumbnailfilename = isset($input->videoThumbnailFileNameReady)?$input->videoThumbnailFileNameReady:'';
                        if(isset($input->videoFileName) && strlen($input->videoFileName) > 0 || strlen($mysql_videofilename)>0) {
                            if(isset($input->videoFileName) && strlen($input->videoFileName) > 0){
                                $sanitized_video_file_name = str_replace('/', '', $input->videoFileName);
                                $sanitized_video_file_name = str_replace('.flv', '', $sanitized_video_file_name);
                                $sanitized_video_file_name = str_replace('.', '', $sanitized_video_file_name);

                                $sanitized_video_file_name = preg_replace('/[^a-z0-9\-]/', '', $sanitized_video_file_name);

                                $sanitized_video_file_name .= '.flv';

                                $source_file = $PATHS->wowza_content . $sanitized_video_file_name;
                                $destination_file = $PATHS->app_path . $PATHS->base_site_public_path . "uservids/" . $sanitized_video_file_name;

                                $getReadyToMove = function ($path, $mode='r+')
                                {
                                    $fp = fopen($path, $mode);
                                    $retries = 0;
                                    $max_retries = 100;

                                    if (!$fp) {
                                        // failure
                                        return false;
                                    }

                                    // keep trying to get a lock as long as possible
                                    do {
                                        if ($retries > 0) {
                                            usleep(rand(1, 10000));
                                        }
                                        $retries += 1;
                                        //echo "waiting ", $retries;
                                    } while (!flock($fp, LOCK_EX) and $retries <= $max_retries);

                                    // couldn't get the lock, give up
                                    if ($retries == $max_retries) {
                                        // failure
                                        return false;
                                    }

                                    // release the lock
                                    flock($fp, LOCK_UN);
                                    fclose($fp);
                                    // success
                                    return true;
                                };

                                if (isset($PATHS->local_only)){
                                    list ($mysql_thumbnailfilename,$mysql_videofilename) = createLocalOnlyVid($destination_file,str_replace('.flv', '.mp4', $sanitized_video_file_name));
                                    $mp4_file_name='/var/www/meglms/public/uservids/sample.mp4';

                                }else{
                                    $start = time();
                                    while(!file_exists($source_file) && (time() - $start < 30)){
                                        sleep(1);
                                    }
                                    if(file_exists($source_file)) {
                                        if (!file_exists($destination_file)) {
                                            //$data->message = "Moved File: " . $source_file . " To: " . $destination_file;
                                            //wait for lock, then proceed
                                            $getReadyToMove($source_file);
                                            $cmd = 'mv "' . $source_file . '" "' . $destination_file . '"';
                                            //echo $cmd;
                                            //echo exec($cmd, $output, $return_val);
                                            if (rename($source_file, $destination_file)) {
                                                //if ($return_val == 0) { //file moved
                                                $sanitized_video_file_name = str_replace('.flv', '.mp4', $sanitized_video_file_name);

                                                $mp4_file_name = $destination_file;

                                                $mp4_file_name = str_replace('.flv', '.mp4', $destination_file);

                                                $thumbfile = $PATHS->app_path . $PATHS->base_site_public_path . "uservidthumbnails/" . str_replace('.mp4', '.jpg', $sanitized_video_file_name);
                                                shell_exec("/usr/bin/ffmpeg -i " . $destination_file . " -deinterlace -an -ss 1 -t 00:00:10 -r 1 -y -vcodec mjpeg -f mjpeg $thumbfile 2>&1");

                                                Utility::convertToMp4($destination_file,$mp4_file_name,false);
                                                if(filesize($mp4_file_name)<500){
                                                    $data->message = 'Could Not Save. Please Try Again';
                                                }

                                                
                                                $mysql_videofilename = $DB->mysqli->real_escape_string("/public/uservids/" . $sanitized_video_file_name);
                                                $mysql_thumbnailfilename = $DB->mysqli->real_escape_string("/public/uservidthumbnails/" . str_replace('.mp4', '.jpg', $sanitized_video_file_name));



                                            }
                                            else {
                                                $data->message = "Could Not Save. Please Try Again";
                                            }
                                        }
                                        else {
                                            $data->message = "Could Not Save. Please Try Again";
                                        }
                                    }else {
                                        $data->message = "File Does Not Exist";
                                    }
                                }

                            }

                            if(!@$data->message){
                                $timedAnswerBuilder = null;
                                if( reProcessVideoForTimedReviews($input) ){
                                    if(OrganizationController::_getPreferencesField($orgId,'use_webrtc')){

                                        $timedAnswerBuilder = new \English3\Controller\TimedReview\WebRTCTimedReviewAnswerBuilder($input->timeToPrepareValues,
                                            $input->prompts,$input->answerTimePositions,$mp4_file_name);
                                    }else{
                                        $timedAnswerBuilder = new TimedReviewAnswerBuilder($input->timeToPrepareValues,$input->prompts,$input->answerTimePositions,$mp4_file_name);
                                    }

                                    $timedAnswerBuilder->createLogFile($user_id,$content_id);
                                    $answerFullPath = $timedAnswerBuilder->buildAnswer();
                                    $fileName = basename($answerFullPath);
                                    $finalFileName = $PATHS->app_path . $PATHS->base_site_public_path . "uservids/" . $fileName ;
                                    rename($answerFullPath, $finalFileName);
                                    if(file_exists($finalFileName)){
                                        $mysql_videofilename = $DB->mysqli->real_escape_string("/public/uservids/" . $fileName);
                                    }else{
                                        $timedAnswerBuilder->saveFailedVideo($user_id,$content_id);
                                    }

                                }

                                $user_id = intval($_SESSION['USER']['ID']);
                                $content_id = 0;
                                if (isset($input->contentid) && $input->contentid > 0) {
                                    $content_id = intval($input->contentid);
                                }


                                if (isset($input->reply_to_id) && $input->reply_to_id > 0) {
                                    $reply_to_id = intval($input->reply_to_id);
                                } else {
                                    $reply_to_id = 0;
                                }

                                if (isset($input->video_comment) && strlen($input->video_comment) > 0) {
                                    $mysql_video_comment = $DB->mysqli->real_escape_string($input->video_comment);
                                } else {
                                    $mysql_video_comment = '';
                                }

                                if (isset($input->check_is_private) && $input->check_is_private == 1) {
                                    $is_private = 1;
                                } else {
                                    $is_private = 0;
                                }

                                if ($master_is_private == 1) {
                                    $is_private = 1;
                                }
                                $mysql_thumbnailfilename = @$input->noCamera?'audioOnly':$mysql_thumbnailfilename;
                                global $PATHS;
                                $server = @$PATHS->serverName?:'';
                                $query = "INSERT INTO posts(classid, userid, pageid, postrootparentid, post_reply_id, video_url, video_thumbnail_url,upload_url,upload_file_name, message, is_private, is_teacher,groupid,server) VALUES($class_id, $user_id, $content_id, $reply_to_id, $reply_to_id, '{$mysql_videofilename}', '{$mysql_thumbnailfilename}','','', '{$mysql_video_comment}', {$is_private}, {$is_teacher},{$group_id},'{$server}')";
                                $data->query=$query;
                                $post_id = Utility::getInstance()->insert($query);

                                //need to work with existing data
                                $content = PageController::_getContentPageAttempts($content_id, $user_id);
                                if($content){
                                    PageController::_addContentPageAttempts($content_id, $user_id);
                                }
                                else{
                                    $totalPosts = PostsController::_getTotalUserPostsForPage($content_id,$user_id);
                                    PageController::_setContentPageAttempts($content_id, $user_id, $totalPosts);
                                }

                                if($post_id) {
                                    if($timedAnswerBuilder){
                                        $timedAnswerBuilder->saveAttempt($post_id);
                                    }
                                    if($reply_to_id != 0) {
                                        $query = "SELECT postrootparentid,userid FROM posts WHERE id=$reply_to_id LIMIT 1";

                                        $result = $DB->mysqli->query($query);

                                        if($result && $result->num_rows == 1) {
                                            $row = $result->fetch_object();

                                            $query = "UPDATE posts SET postrootparentid = {$row->postrootparentid},  post_reply_id = {$reply_to_id} WHERE id = {$post_id}";

                                            $DB->mysqli->query($query);
                                        }
                                        if($automatically_grade && $is_teacher==0 && $row->userid != $user_id){
                                            auto_grade($post_id,$class_id,$content_id,$user_id,$row->postrootparentid);
                                        }else {
                                            if(PageController::isGradeable($content_id)){
                                                $summary = GradebookController::_recalculate($user_id,$content_id);
                                                if(@$summary['percentSubmittedTasks']==100 && ClassesController::isJ1($class_id)){
                                                    EmailCompletedTest::_studentCompletedTest($user_id,$class_id);
                                                }
                                            }
                                        }
                                    } else {
                                        $query = "UPDATE posts SET postrootparentid = {$post_id},  post_reply_id = {$post_id} WHERE id = {$post_id}";

                                        $DB->mysqli->query($query);
                                        if($automatically_grade && $is_teacher==0){
                                            auto_grade($post_id,$class_id,$content_id,$user_id);
                                        }else{
                                            if(PageController::isGradeable($content_id)){
                                                $summary = GradebookController::_recalculate($user_id,$content_id);
                                                if(@$summary['percentSubmittedTasks']==100 && ClassesController::isJ1($class_id)){
                                                    EmailCompletedTest::_studentCompletedTest($user_id,$class_id);
                                                }
                                            }
                                        }

                                    }
                                }
                                $data->message = "successful";
                            }
                            PostsController::sendEmailIfNeeded($data->message,$user_id,
                                $reply_to_id,$post_id,$class_id,$is_teacher);
                            header('Content-Type: application/json');
                            print json_encode($data);
                            exit();
                        }
                    }
                    else{
                        //text only post allowed


                        if(isset($input->contentid) && $input->contentid > 0) {
                            $content_id = intval($input->contentid);
                        }

                        if(isset($input->reply_to_id) && $input->reply_to_id > 0) {
                            $reply_to_id = intval($input->reply_to_id);
                        } else {
                            $reply_to_id = 0;
                        }

                        if(isset($input->check_is_private) && $input->check_is_private == 1) {
                            $is_private = 1;
                        } else {
                            $is_private = 0;
                        }

                        if($master_is_private == 1) {
                            $is_private = 1;
                        }

                        if(isset($input->video_comment) && strlen($input->video_comment) > 0) {
                            $user_id = intval($_SESSION['USER']['ID']);
                            $mysql_video_comment = $DB->mysqli->real_escape_string($input->video_comment);
                            $mysql_videofilename     = isset($input->videoFileNameReady)?$input->videoFileNameReady:'';
                            $mysql_thumbnailfilename = isset($input->videoThumbnailFileNameReady)?$input->videoThumbnailFileNameReady:'';
                            global $PATHS;
                            $server = @$PATHS->serverName?:'';
                            $query = "INSERT INTO posts(classid, userid, pageid, postrootparentid, post_reply_id, message, is_private, is_teacher,groupid,video_url, video_thumbnail_url,upload_url,upload_file_name,server) VALUES($class_id, $user_id, $content_id, $reply_to_id, $reply_to_id, '{$mysql_video_comment}', {$is_private}, {$is_teacher},{$group_id},'{$mysql_videofilename}','{$mysql_thumbnailfilename}','','','{$server}')";

                            $DB->mysqli->query($query);

                            //need to work with existing data
                            $content = PageController::_getContentPageAttempts($content_id, $user_id);
                            if($content){
                                PageController::_addContentPageAttempts($content_id, $user_id);
                            }
                            else{
                                $totalPosts = PostsController::_getTotalUserPostsForPage($content_id,$user_id);
                                PageController::_setContentPageAttempts($content_id, $user_id, $totalPosts);
                            }

                            if($DB->mysqli->insert_id > 0) {
                                $post_id = $DB->mysqli->insert_id;
                                if($reply_to_id != 0) {
                                    $query = "SELECT postrootparentid,userid FROM posts WHERE id=$reply_to_id LIMIT 1";

                                    $result = $DB->mysqli->query($query);

                                    if($result && $result->num_rows == 1) {
                                        $row = $result->fetch_object();

                                        $query = "UPDATE posts SET postrootparentid = {$row->postrootparentid},  post_reply_id = {$reply_to_id} WHERE id = {$DB->mysqli->insert_id}";

                                        $DB->mysqli->query($query);
                                        if($automatically_grade && $is_teacher==0&& $row->userid != $user_id){
                                            auto_grade($post_id,$class_id,$content_id,$user_id,$row->postrootparentid);
                                        }
                                    }

                                } else {
                                    $query = "UPDATE posts SET postrootparentid = {$DB->mysqli->insert_id},  post_reply_id = {$DB->mysqli->insert_id} WHERE id = {$DB->mysqli->insert_id}";

                                    $DB->mysqli->query($query);
                                    if($automatically_grade && $is_teacher==0){
                                        auto_grade($post_id,$class_id,$content_id,$user_id);
                                    }
                                }

                            }

                            $data->message = "successful";
                        }
                        else {
                            $data->message = "Please Provide A Text Message";
                        }

                        PostsController::sendEmailIfNeeded($data->message,$user_id,
                            $reply_to_id,$post_id,$class_id,$is_teacher);


                        header('Content-Type: application/json');
                        print json_encode($data);
                        exit();
                    }
                } else {
                    $data->message = "Error: 494";
                }
            }
        }

        else if($post_action == 'save-video') {

            $json_input = file_get_contents('php://input');
            $input      = json_decode($json_input);
            $data       = new \stdClass();

            $sanitized_video_file_name = str_replace('/', '', $input->file_name);
            $sanitized_video_file_name = str_replace('.flv', '', $sanitized_video_file_name);
            $sanitized_video_file_name = str_replace('.', '', $sanitized_video_file_name);
            $sanitized_video_file_name = preg_replace('/[^a-z0-9\-]/', '', $sanitized_video_file_name);
            $sanitized_video_file_name .= '.flv';
            $source_file               = $PATHS->wowza_content . $sanitized_video_file_name;
            $destination_file          = $PATHS->app_path . $PATHS->base_site_public_path . "uservids/" . $sanitized_video_file_name;
            $sanitized_video_file_name = str_replace('.flv', '.mp4', $sanitized_video_file_name);

            /*
             ***FOR LOCAL DEVELOPMENT HOSTS****
             Golabs if testing in local machine
             Add in $PATHS->local_only = 1; in the  config.php
             You will need video of sample.mp4 and image.jpg
             */
            if (isset($PATHS->local_only)) {
                $samplevid     = $PATHS->app_path . $PATHS->base_site_public_path . "uservids/sample.mp4";
                $mp4_file_name = str_replace('.flv', '.mp4', $destination_file);
                copy($samplevid, $mp4_file_name) or die('No smaple.mp4 found in ' . $samplevid);

                $sampleimg = $PATHS->app_path . $PATHS->base_site_public_path . "uservidthumbnails/sample.jpg";
                $thumbfile = $PATHS->app_path . $PATHS->base_site_public_path . "uservidthumbnails/" . str_replace('.mp4', '.jpg', $sanitized_video_file_name);
                copy($sampleimg, $thumbfile) or die('No smaple.mp4 found in ' . $thumbfile);
                $data->message = 'successful';
            } else {

                if (rename($source_file, $destination_file)) {
                    $data->message             = 'successful';
                    $sanitized_video_file_name = str_replace('.flv', '.mp4', $sanitized_video_file_name);
                    $mp4_file_name             = $destination_file;
                    $mp4_file_name             = str_replace('.flv', '.mp4', $destination_file);
                    $thumbfile                 = $PATHS->app_path . $PATHS->base_site_public_path . "uservidthumbnails/" . str_replace('.mp4', '.jpg', $sanitized_video_file_name);
                    if(!$input->noCamera){
                        //Creating thumbnail image start
                        shell_exec("/usr/bin/ffmpeg -i " . $destination_file . " -deinterlace -an -ss 1 -t 00:00:10 -r 1 -y -vcodec mjpeg -f mjpeg $thumbfile 2>&1");
                    }
                    //converting video to mpg4 start
                    Utility::convertToMp4($destination_file,$mp4_file_name,false);
                    if(filesize($mp4_file_name)<500){
                        $data->message = 'Could not process the video';
                    }
                }
            }
            //converting video to mpg4 start

            $mysql_videofilename     = $DB->mysqli->real_escape_string("/public/uservids/" . $sanitized_video_file_name);
            $mysql_thumbnailfilename = $input->noCamera?'audiOnly':$DB->mysqli->real_escape_string("/public/uservidthumbnails/" . str_replace('.mp4', '.jpg', $sanitized_video_file_name));

            $data->videofilename     = $mysql_videofilename;
            $data->thumbnailfilename = $mysql_thumbnailfilename;

            header('Content-Type: application/json');
            print json_encode($data);
        }
        else if($post_action == 'upload') {
            $data = new \stdClass();

            if(isset($_FILES['file']['error']) && $_FILES['file']['error'] == 0) {
                $data->error = $_FILES['file']['error'];
                $data->name = $_FILES['file']['name'];
                $data->size = $_FILES['file']['size'];
                $data->type = $_FILES['file']['type'];

                checkFileType($data->name);

                $data->tmp_name = $_FILES['file']['tmp_name'];
                $data->comment = 'comment ' . (isset($_REQUEST['video_upload_comment']) ? $_REQUEST['video_upload_comment'] : '');
                $group_id = 'null';
                if(isset($_REQUEST['courseId'])){
                    $courseId = $_REQUEST['courseId'];
                    if(preg_match("/[0-9]+-[0-9]+/", $courseId)){
                        $group_id = intval(explode('-',$courseId)[1]);
                        $courseId = intval(explode('-',$courseId)[0]);

                    }
                }

                $sanitized_video_file_name = generate_unique(10);

                $destination_file = $PATHS->app_path . $PATHS->base_site_public_path . "uservids/" . $sanitized_video_file_name;
                $converted_file = $PATHS->app_path . $PATHS->base_site_public_path . "uservids/" . $sanitized_video_file_name . ".mp4";

                if(move_uploaded_file($data->tmp_name, $destination_file)) {
                    Utility::convertToMp4($destination_file,$converted_file,false);

                    $thumbfile = $PATHS->app_path . $PATHS->base_site_public_path . "uservidthumbnails/" . $sanitized_video_file_name . ".jpg";

                    shell_exec("/usr/bin/ffmpeg -i " . $converted_file . " -deinterlace -an -ss 1 -t 00:00:10 -r 1 -y -vcodec mjpeg -f mjpeg $thumbfile 2>&1");

                    $user_id = intval($_SESSION['USER']['ID']);
                    $content_id = 0;

                    $mysql_videofilename = $DB->mysqli->real_escape_string("/public/uservids/" . $sanitized_video_file_name . ".mp4");
                    $mysql_thumbnailfilename = $DB->mysqli->real_escape_string("/public/uservidthumbnails/" . $sanitized_video_file_name . ".jpg");

                    if(isset($_REQUEST['contentid']) && $_REQUEST['contentid'] > 0) {
                        $content_id = intval($_REQUEST['contentid']);
                    }

                    if(isset($_REQUEST['reply_to_id']) && $_REQUEST['reply_to_id'] > 0) {
                        $reply_to_id = intval($_REQUEST['reply_to_id']);
                    } else {
                        $reply_to_id = 0;
                    }

                    if(isset($_REQUEST['video_upload_comment']) && strlen($_REQUEST['video_upload_comment']) > 0) {
                        $mysql_video_comment = $DB->mysqli->real_escape_string($_REQUEST['video_upload_comment']);
                    } else {
                        $mysql_video_comment = '';
                    }

                    if(isset($_REQUEST['check_is_private']) && $_REQUEST['check_is_private'] == 1) {
                        $is_private = 1;
                    } else {
                        $is_private = 0;
                    }

                    if($master_is_private == 1) {
                        $is_private = 1;
                    }

                    $query = "SELECT user_classes.classid, user_classes.is_teacher  FROM `user_classes` JOIN classes ON (user_classes.classid=classes.id) JOIN units ON (classes.courseid=units.courseid) JOIN pages ON (pages.unitid=units.id) WHERE user_classes.userid={$user_id} AND pages.id={$content_id} LIMIT 1";

                    $result = $DB->mysqli->query($query);

                    if($result && $result->num_rows == 1) {
                        $row = $result->fetch_object();

                        $class_id = $row->classid;
                        $is_teacher = $row->is_teacher;
                    } else {
                        $data = new \stdClass();

                        $data->message='User Does Not Have Permission To Post On This Page.';

                        header('Content-Type: application/json');
                        print json_encode($data);
                        exit();
                    }

                    $query = "SELECT allow_video_post, allow_text_post, is_private, is_gradeable,automatically_grade FROM pages WHERE id={$content_id} LIMIT 1";

                    $result = $DB->mysqli->query($query);

                    if($result && $result->num_rows == 1) {
                        $row = $result->fetch_object();

                        if($row->is_private == 1) {
                            $is_private = 1;
                        }
                        $automatically_grade = $row->automatically_grade==1;
                        global $PATHS;
                        $server = @$PATHS->serverName?:'';
                        $query = "INSERT INTO posts(classid, userid, pageid, postrootparentid, post_reply_id, video_url, video_thumbnail_url, message, is_private, is_teacher,groupid,server) VALUES($class_id, $user_id, $content_id, $reply_to_id, $reply_to_id, '{$mysql_videofilename}', '{$mysql_thumbnailfilename}', '{$mysql_video_comment}', {$is_private}, {$is_teacher},{$group_id},'{$server}')";

                        $DB->mysqli->query($query);
                        //need to work with existing data
                        $content = PageController::_getContentPageAttempts($content_id, $user_id);
                        if($content){
                            PageController::_addContentPageAttempts($content_id, $user_id);
                        }
                        else{
                            $totalPosts = PostsController::_getTotalUserPostsForPage($content_id,$user_id);
                            PageController::_setContentPageAttempts($content_id, $user_id, $totalPosts);
                        }
                        if($DB->mysqli->affected_rows == 1) {
                            $post_id = $DB->mysqli->insert_id;
                            if($reply_to_id != 0) {
                                $query = "SELECT postrootparentid,userid FROM posts WHERE id=$reply_to_id LIMIT 1";

                                $result = $DB->mysqli->query($query);

                                if($result && $result->num_rows == 1) {
                                    $row = $result->fetch_object();

                                    $query = "UPDATE posts SET postrootparentid = {$row->postrootparentid},  post_reply_id = {$reply_to_id} WHERE id = {$DB->mysqli->insert_id}";

                                    $DB->mysqli->query($query);
                                    if($automatically_grade && $is_teacher==0 && $row->userid != $user_id){
                                        auto_grade($post_id,$class_id,$content_id,$user_id,$row->postrootparentid);
                                    }
                                }
                            } else {
                                $query = "UPDATE posts SET postrootparentid = {$DB->mysqli->insert_id},  post_reply_id = {$DB->mysqli->insert_id} WHERE id = {$DB->mysqli->insert_id}";

                                $DB->mysqli->query($query);
                                if($automatically_grade && $is_teacher==0){
                                    auto_grade($post_id,$class_id,$content_id,$user_id);
                                }
                            }
                        }

                        $data->message = "successful";
                    }
                }
            }

            header('Content-Type: application/json');
            print json_encode($data);
        }
        else if($post_action == 'templateHtml') {
            $data = new \stdClass();
            $template = new \stdClass();

            $json_input = file_get_contents('php://input');
            $input = json_decode($json_input);
            foreach($input->data->templateContent as $content) {
                $content = addslashes($content);
            }
            $template->templateContent = $input->data->templateContent;
            $template->template = $input->data->template;
            $messsage = json_encode($template);
            $user_id = intval($_SESSION['USER']['ID']);
            $pageid = intval($input->data->contentid);
            $row = test_user($DB,$user_id,$pageid);
            $class_id = $row->classid;
            $is_teacher = intval($row->is_teacher);
            $is_private = intval($input->data->check_is_private);
            $reply_to_id = intval($input->data->reply_to_id);
            $mysql_uploadurl = '';
            $mysql_filename = '';
            global $PATHS;
            $server = @$PATHS->serverName?:'';
            $query = "INSERT INTO posts(
 classid,
 userid,
 pageid,
 postrootparentid,
 post_reply_id,
 upload_url,
 upload_file_name,
 message,
 is_private,
 is_teacher,
video_url,
video_thumbnail_url,
server
) VALUES(
 $class_id,
 $user_id,
 $pageid,
 $reply_to_id,
 $reply_to_id,
 '{$mysql_uploadurl}',
 '{$mysql_filename}',
 '{$messsage}',
 {$is_private},
 {$is_teacher},
'',
'',
'{$server}'
)";
            $sql = new BaseSQL();
            $newPostId = $sql->query_ReturnId($query);

            //need to work with existing data
            $content = PageController::_getContentPageAttempts($pageid, $user_id);
            if($content){
                PageController::_addContentPageAttempts($pageid, $user_id);

            }
            else{
                $totalPosts = PostsController::_getTotalUserPostsForPage($pageid,$user_id);
                PageController::_setContentPageAttempts($pageid, $user_id, $totalPosts);
            }
            if($newPostId) {
                if($reply_to_id != 0) {
                    $query = "SELECT postrootparentid,userid FROM posts WHERE id=$reply_to_id LIMIT 1";

                    $result = $DB->mysqli->query($query);

                    if($result && $result->num_rows == 1) {
                        $row = $result->fetch_object();

                        $query = "UPDATE posts SET postrootparentid = {$row->postrootparentid},  post_reply_id = {$reply_to_id} WHERE id = {$DB->mysqli->insert_id}";

                        $DB->mysqli->query($query);
                        if(isset($automatically_grade) && $is_teacher==0 && $row->userid != $user_id){
                            auto_grade($newPostId,$class_id,$pageid,$user_id,$row->postrootparentid);
                        }
                    }
                } else {
                    $query = "UPDATE posts SET postrootparentid = {$newPostId},  post_reply_id = {$newPostId} WHERE id = {$newPostId}";

                    $DB->mysqli->query($query);
                    if(isset($automatically_grade) && $is_teacher==0){
                        auto_grade($newPostId,$class_id,$pageid,$user_id);
                    }
                }
            }
            $data->message = true;
            PostsController::sendEmailIfNeeded($data->message,$user_id,
                $reply_to_id,$newPostId,$class_id,$is_teacher);


            header('Content-Type: application/json');
            print json_encode($data);
        }
        else if($post_action == 'fileupload') {
            $data = new \stdClass();
            $orm = new PmOrm($_SESSION,$DB);
            $user_id = intval($_SESSION['USER']['ID']);
            if(!$orm->am_i_active_for_page($_REQUEST['contentid'])){
                $data->message='User Does Not Have Permission To Post On This Page.';

                header('Content-Type: application/json');
                print json_encode($data);
                exit();
            }
            $group_id = 'null';
            if(isset($_REQUEST['courseId'])){
                $courseId = $_REQUEST['courseId'];
                if(preg_match("/[0-9]+-[0-9]+/", $courseId)){
                    $group_id = intval(explode('-',$courseId)[1]);
                    $courseId = intval(explode('-',$courseId)[0]);

                }
            }
            $content_id = $_REQUEST['contentid'];
            //checking for post limits
            //need to work with existing data
            $contentPageAttempts = PageController::_getContentPageAttempts($content_id,$user_id);
            if($contentPageAttempts){
                $postLimit = PageController::_getPageMeta($content_id,'post_limit');
                if($postLimit){
                    if($contentPageAttempts['attempts_completed']>=$postLimit){
                        throwError("You reached the maximum number of posts allowed for this activity");
                    }
                }
            }
            else{
                $postLimit = PageController::_getPageMeta($content_id,'post_limit');
                if($postLimit){
                    $totalPosts = PostsController::_getTotalUserPostsForPage($content_id,$user_id);
                    PageController::_setContentPageAttempts($content_id, $user_id, $totalPosts);
                    if($totalPosts>=$postLimit){
                        throwError("You reached the maximum number of posts allowed for this activity");
                    }
                }
            }
            if($_REQUEST['file_link']){    //to check link upload
                $mysql_fileLink = $_REQUEST['file_link'];
                $mysql_filename = $_REQUEST['file_link'];
                $data->message = postUploadedFile($mysql_fileLink,$mysql_filename,$user_id,$group_id);
            }

            if($_REQUEST['upload_url']){
                $mysql_uploadurl = $_REQUEST['upload_url'];
                $mysql_filename = $_REQUEST['filename'];
                $data->message = postUploadedFile($mysql_uploadurl,$mysql_filename,$user_id,$group_id);

            }
            if(isset($_FILES['file']['error']) && $_FILES['file']['error'] == 0) {
                $activityName = preg_replace('/[\s:\/.]/','_',$_POST['activityname']);
                $sanitized_video_file_name = $activityName.'_'.$_SESSION['USER']['FNAME'].'_'.$_SESSION['USER']['LNAME'].'_'.date("nMY_g_i_s_a" , time());
                $sanitized_video_file_name = preg_replace('/[^A-Za-zZ0-9\_]/', '', $sanitized_video_file_name);
                $data->error = $_FILES['file']['error'];
                $data->name = $_FILES['file']['name'];
                $data->size = $_FILES['file']['size'];
                $data->type = $_FILES['file']['type'];
                checkFileType($data->name);
                $data->tmp_name = $_FILES['file']['tmp_name'];
                $data->name = $_FILES['file']['name'];
                $data->comment = 'comment ' . (isset($_REQUEST['file_upload_comment']) ? $_REQUEST['file_upload_comment'] : '');



                //$sanitized_video_file_name = generate_unique(10);
                /*
                Golabs 27/05/2015
                Chaning file name to something more appropriate.
                */

                if (!isset($_POST['activityname']))$_POST['activityname'] = '';
                $activityName = preg_replace('/[\s:\/.]/','_',$_POST['activityname']);
                $sanitized_video_file_name = $activityName.'_'.$_SESSION['USER']['FNAME'].'_'.$_SESSION['USER']['LNAME'].'_'.date("nMY_g_i_s_a" , time());
                $sanitized_video_file_name = preg_replace('/[^A-Za-z0-9\_]/', '', $sanitized_video_file_name);
                if($_REQUEST['file_order']){
                    $sanitized_video_file_name.=$_REQUEST['file_order'];
                }
                $extension = strrpos($_FILES['file']['name'], '.');

                if($extension > 0) {
                    $extension = substr($_FILES['file']['name'], $extension);
                } else {
                    $extension = '';
                }
                $destination_file = $PATHS->app_path . $PATHS->base_site_public_path . "useruploads/" . $sanitized_video_file_name . $extension;
                $file_upload_url = "/public/useruploads/" . $sanitized_video_file_name . $extension;

                if(move_uploaded_file($data->tmp_name, $destination_file)) {
                    if($_REQUEST['multiple']=='true'){
                        $data->upload_url = $file_upload_url;
                        $data->filename= $_FILES['file']['name'];
                        $data->multiple=true;
                    }
                    else{
                        $data->message=postUploadedFile($file_upload_url,$_FILES['file']['name'],$user_id,$group_id);
                    }

                }else{
                    throwError('There was a problem uploading the file. Please try again.');
                }
            }

            header('Content-Type: application/json');
            print json_encode($data);
        } else if($post_action == 'createImage') {
            $data = new \stdClass();

            if(isset($_FILES['file']['error']) && $_FILES['file']['error'] == 0) {
                $data->error = $_FILES['file']['error'];
                $data->name = $_FILES['file']['name'];
                $data->size = $_FILES['file']['size'];
                $data->type = $_FILES['file']['type'];
                checkFileType($data->name);
                $data->tmp_name = $_FILES['file']['tmp_name'];
                $extension = strrpos($_FILES['file']['name'], '.');
                if($extension > 0) {
                    $extension = substr($_FILES['file']['name'], $extension);
                } else {
                    $extension = '';
                }
                $savedname = 'img'.generate_unique(20).$extension;
                $data->size = getimagesize($data->tmp_name);
                $destination_file = $PATHS->app_path . $PATHS->base_site_public_path . "useruploads/" . $savedname;


                if(move_uploaded_file($data->tmp_name, $destination_file)) {
                    $data->baselocation = $PATHS->base_site_public_path . "useruploads/" . $savedname;
                    $data->savedname = $savedname;
                    $data->message = "successful";

                }
            }

            header('Content-Type: application/json');
            print json_encode($data);
        }
        else if($post_action == 'delete') {
            if($_SERVER['REQUEST_METHOD'] == 'POST') {
                $json_input = file_get_contents('php://input');
                $util  = new Utility();
                $input = json_decode($json_input);
                if (!isset($user_id)){
                    $user_id = intval($_SESSION['USER']['ID']);
                }
                if(isset($input->delete_id) && $input->delete_id > 0) {
                    $user_id = intval($_SESSION['USER']['ID']);
                    $classId = $util->fetchOne(PostsController::$queryGetPost,['postId'=>$input->delete_id],'classid');
                    $is_admin = $util->checkTeacher($classId,null,false);

                    $delete_id = intval($input->delete_id);

                    $query = "SELECT * FROM posts WHERE id={$delete_id} AND userid={$user_id} LIMIT 1";

                    $result = $DB->mysqli->query($query);

                    if(($result && $result->num_rows == 1)||$is_admin) {

                        //checking for can_delete_posts flag at org level
                        $canDelete = $is_admin||PostsController::canBeDeleted($delete_id);

                        if(!$canDelete ){
                            $data->message = "You Do Not Have Permission To Delete This Post.";
                        }
                        else{
                            $row = $result->fetch_object();

                            $query = "SELECT id FROM posts WHERE id!={$delete_id} AND post_reply_id={$delete_id} AND is_deleted=0 LIMIT 1";

                            $result = $DB->mysqli->query($query);

                            if (!isset($data)){
                                $data = new \stdClass();
                            }

                            if($result && $result->num_rows == 1) {
                                $data->message = "Can Not Delete Post. Post Has Active Replies.";
                            } else {
                                $orgId = OrganizationController::_getOrgFromClassId($classId);
                                $save_deleted_posts = boolval(OrganizationController::_getField($orgId,'save_deleted_posts'));
                                if($save_deleted_posts){
                                    $query = "UPDATE posts SET is_deleted=1 WHERE id={$delete_id}";
                                }else{
                                    $query = "DELETE FROM posts where id = {$delete_id}";
                                }


                                $DB->mysqli->query($query);
                                PageController::_subContentPageAttempts($row->pageid, $row->userid);

                                if($DB->mysqli->affected_rows == 1) {
                                    $data->message = "successful";
                                } else {
                                    $data->message = "successful";
                                }
                            }
                        }

                    } else {
                        $data->message = "You Do Not Have Permission To Delete This Video.";
                    }
                } else {
                    $data->message = "No Post Selected For Deletion.";
                }
            } else {
                $data->message = "No Post Selected For Deletion.";
            }

            header('Content-Type: application/json');
            print json_encode($data);
        } else if(is_numeric($post_action) && $post_action > 0) {


            $post_action = intval($post_action);
            $orm = new PmOrm($_SESSION,$DB);
            $user_id = intval($_SESSION ['USER']['ID']);

            $group_id = null;
            if(isset($_REQUEST['courseId'])){
                $courseId = $_REQUEST['courseId'];
                if(preg_match("/[0-9]+-[0-9]+/", $courseId)){
                    $group_id = intval(explode('-',$courseId)[1]);
                    $courseId = intval(explode('-',$courseId)[0]);

                }
            }

            $query = "SELECT user_classes.classid, user_classes.is_teacher  FROM `user_classes` JOIN classes ON (user_classes.classid=classes.id) JOIN units ON (classes.courseid=units.courseid) JOIN pages ON (pages.unitid=units.id) WHERE user_classes.userid={$user_id} AND pages.id={$post_action} AND (pages.layout='CONTENT' or pages.layout='TIMED_REVIEW') LIMIT 1";

            $result = $DB->mysqli->query($query);


            if($result && $result->num_rows == 1) {
                $row = $result->fetch_object();
                $class_id = $row->classid;
                $is_teacher = $row->is_teacher;
            } else {
                $data = new \stdClass();
                $u = Utility::getInstance();
                $class_id = \English3\Controller\ClassesController::_getFromPage($u->reader,$post_action);
                if(!$u->checkTeacher($class_id,null,false)){
                    header('Content-Type: application/json');
                    print json_encode($data);
                    exit();
                }else{
                    $is_teacher=true;
                }
            }
            /*DSerejo 08/07/2015
                Moving getPosts feature to inside PostsController
            */
            if (!isset($data)){
                $data = new \stdClass();
            }
            $orgId = OrganizationController::_getOrgFromClassId($class_id);
            $showArchive = boolval(@OrganizationController::_getField($orgId,'save_deleted_posts'));
            $posts = PostsController::_getContentPosts($post_action,$class_id,$group_id);
            $posts = array_map(function($p){
                SiblingServerFinder::checkIfThumbnailExists($p);
                return $p;
            },$posts);

            $data->postmessages = preparePosts($posts,$user_id,$is_teacher);
            if($showArchive && $is_teacher){
                $archive = PostsController::_getContentPosts($post_action,$class_id,$group_id,true);
                $data->archive = preparePosts($archive,$user_id,$is_teacher);
            }
            $data->allowTemplate = boolval(Utility::getInstance()->fetchOne("SELECT allow_template_post FROM pages WHERE id=:pageId",['pageId'=>$post_action]));
            $data->canViewMessageButton = PostsController::canViewMessageButton($class_id,$user_id);
            $data->showUserProfile = boolval(OrganizationController::_getField($orgId,'show_user_profile'));
            header('Content-Type: application/json');
            print json_encode($data);

        }

    exit();
}

?>
