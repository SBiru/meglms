<?php

use English3\Controller\NotificationsController;
use English3\Controller\Organization\OrganizationController;
use English3\Controller\UserController;
use English3\Controller\Utility;

require_once('usertools/orm.php');
require_once('_utils.php');
require_once('sql.php');

function userclasses(){
    global $DB;
    $user = new PmOrm($_SESSION,$DB);
    $class = new ClassSQL();
    if($user->am_i_super_user()){
        $classes = $class->get_all();
        for($i = 0 ;$i< count($classes);$i++){
            $classes[$i]['students']=$user->get_students_for_class($classes[$i]['id']);
            $classes[$i]['teachers']=$user->get_teachers_for_class($classes[$i]['id']);
        }

    }
    else {
        $classes = array();
        if($user->am_i_teacher()){
            $classesTmp= $user->get_my_classes(2,false,true);
            for($i = 0 ;$i< count($classesTmp);$i++){
                //unset($classes[$i]['teachers']);
                $users = $user->get_students_for_class($classesTmp[$i]['class_id'],$classesTmp[$i]['groupid']);
                $classesTmp[$i]['students']=$users;
                $classes[]=$classesTmp[$i];
            }
        }
        if($user->am_i_student()) {
            $classesTmp = $user->get_my_classes(false,true,true);
            for ($i = 0; $i < count($classesTmp); $i++) {
//                $users = $user->get_teachers_for_class($classesTmp[$i]['id'],$classesTmp[$i]['groupid']);
//                $classesTmp[$i]['teachers'] = $users;
                $classes[]=$classesTmp[$i];
            }
        }
    }



    $data = new \stdClass();
    $data->message='successful';
    $data->classes = $classes;
    header('Content-Type: application/json');
    print json_encode($data);
    exit();
}

function storeMessage($myId, $to,$subject,$message,$is_feedback = 'false',$cc=null){
    global $DB;
    $messageSQL = new MessageSQL();
    if(!$messageSQL->new_message($myId,$DB->mysqli->real_escape_string($subject),$DB->mysqli->real_escape_string($message))){
        throwError("Could not store message in the database");
    }
    $message_id = $DB->mysqli->insert_id;
    $receivers =array();
    foreach($to as $user){
        $receivers[]=$user->id;
    }
    if($cc){
        foreach($cc as $user){
            $receivers[]=$user->id;
        }
    }
    $messageSQL->new_received_message($receivers,$message_id,$is_feedback);
}

#required fields
#$input->text {string}
#$input->subject {string}
#$input->to {array(users)}
#$input->cc {array(users)}
function sendEmail_private($myInfo,$input,$message,$attachment=false,$store=true,$echo = true){

    $message = str_replace("##sender_mail##",$myInfo['email'],$message);
    if (isset($input->cc)){
        $cc = $input->cc;
    }
    else {
        $cc = array();
    }
    // a random hash will be necessary to send mixed content
    $separator = md5(time());

    // carriage return type (we use a PHP end of line constant)
    $eol = PHP_EOL;
    $fromEmailAddress = 'noreply@english3.com';
    // main header (multipart mandatory)
    $headers = 'From: ' . $myInfo['fname'] . ' ' . $myInfo['lname'] . ' <'.$fromEmailAddress.'>'. $eol;
    $headers .= 'Reply-to: ' . $myInfo['email'] . $eol;
    if(!empty($cc)){
        $ccEmails = array();
        foreach($cc as $user){
            $ccEmails[]=$user->email;
        }
        $headers .= 'CC: ' . implode(",",$ccEmails) . $eol;
    }
//    $headers = 'From: ' . $myInfo['fname'] . ' ' . $myInfo['lname'] . ' <dennyserejom@gmail.com>'. $eol;
    $headers .= "MIME-Version: 1.0" . $eol;
    $headers .= "Content-Type: multipart/mixed; boundary=\"" . $separator . "\"" . $eol . $eol;
 
    /*
    $emessage = "--".$separator.$eol;
    $emessage.= "Content-type:text/plain; charset=iso-8859-1".$eol;
    $emessage.= "Content-Transfer-Encoding: 7bit".$eol.$eol;
    $emessage .= $message.$eol.$eol;//$message.$eol.$eol;
    */
    $emessage .= "--" . $separator . $eol;
    $emessage .= "Content-type: text/html;;charset=utf-8" . $eol;
    $emessage .= "Content-Transfer-Encoding: 8bit" . $eol . $eol;
    $emessage .= $message . $eol . $eol;

    // attachment
    if($attachment){
        $filename = $attachment->filename;
        $file = $attachment->path . $filename;
        $file_size = filesize($file);
        $handle = fopen($file, "r");
        $content = fread($handle, $file_size);
        fclose($handle);
        $content = chunk_split(base64_encode($content));

        $emessage .= "--" . $separator . $eol;
        $emessage .= "Content-Type: application/octet-stream; name=\"" . $filename . "\"" . $eol;
        $emessage .= "Content-Transfer-Encoding: base64" . $eol;
        $emessage .= "Content-Disposition: attachment" . $eol . $eol;
        $emessage .= $content . $eol . $eol;
    }

    $emessage .= "--" . $separator . "--";
    $to_list = array();
    foreach($input->to as $to){
        $to_list[] = $to->email;
    }
    //Surpress mail warning...
    $canSendMail = true;
    $util = new Utility();
    $userController = new UserController($util->reader);
    foreach($input->to as $user){
        $orgId = $util->fetchOne($userController->queryInitUser,['userId'=>$user->id],'organizationid');
        $canSendMail = !boolval(OrganizationController::_getField($orgId,'disallow_email'));
        if(!$canSendMail){
            break;
        }
    }
    if($canSendMail){
        $success = @mail(implode(',',$to_list), $input->subject, $emessage, $headers,'-f'.$fromEmailAddress);
    }
    if($success || !$canSendMail) {
        if($store) {
            storeMessage($myInfo['id'], $input->to, $input->subject, $input->text,false,$cc);
        }
            if($echo) throwMessage("Email has been successfully sent");
    }

    if($echo) throwError("Email could not be sent");
}
function sendEmail($input){
    global $DB;

    $user = new PmOrm($_SESSION,$DB);
    $myInfo = $user->get_my_info();
    validate_str($input->text,"Email body is empty");
    validate_str($input->subject,"Subject is empty");
    validate_array($input->to,"Users list must not be empty");
    $message = str_replace('##sender_mail##',$myInfo['email'],emailTemplate());
    $message = str_replace('##mail_message##',$input->text,$message);
    $message = str_replace('##hi##','',$message);
    sendEmail_private($myInfo,$input,$message);


}

function getSentEmails($user_id){
    $messageSQL = new MessageSQL();
    $emails = $messageSQL->get_sent_message($user_id);
    $data = new \stdClass();
    $data->emails = $emails;
    returnData($data);
}


function getReceivedEmails($user_id){
    $messageSQL = new MessageSQL();
    $emails = $messageSQL->get_received_message($user_id);
    $data = new \stdClass();
    $data->emails = $emails;
    returnData($data);
}

function getFeedbackEmails($user_id){
    $messageSQL = new MessageSQL();
    $emails = $messageSQL->get_feedback_message($user_id);
    $data = new \stdClass();
    $data->emails = $emails;
    returnData($data);
}
function getAllEmails($user_id){
    global $app;
    $reader = $app['dbs']['mysql_read'];
    $messageSQL = new MessageSQL();
    $gradePostSQL = new GradePostSQL();
    $data= new \stdClass();
    $feedback_messages = $messageSQL->get_feedback_message($user_id);
    foreach($feedback_messages as $message) $message->type='feedback';

    $sent_messages = $messageSQL->get_sent_message($user_id);
    foreach($sent_messages as $message) $message->type='sent';

    $received_messages = $messageSQL->get_received_message($user_id);
    foreach($received_messages as $message) $message->type='received';

    $data->emails = array();
    $data->emails = array_merge($data->emails,$sent_messages);
    $data->emails = array_merge($data->emails,$received_messages);
    $data->emails = array_merge($data->emails,$feedback_messages);

    $notifications = $gradePostSQL->get_all_notifications($user_id);
    foreach($notifications as &$post){
        $post->grade = round(floatval($post->grade),2);
    }
    $studentFeedback = $gradePostSQL->get_student_feedback($user_id);
    foreach($studentFeedback as &$post){
        $post['viewed'] = boolval($post['viewed']);
    }


    $quizNotifications = NotificationsController::_getQuizNotifications($user_id);
    foreach($quizNotifications as &$quiz){
        $quiz['grade']=round(floatval($quiz['score']),2);
    }
    $forumNotifications = NotificationsController::_getForumNotifications($user_id);
    foreach($forumNotifications as &$forum){
        $forum['grade']=round(floatval($forum['grade']),2);
    }


    $data->notifications = array_merge($notifications,$quizNotifications,$forumNotifications);
    $data->teacher_notifications = NotificationsController::_getTeacherFeedbacks($reader,$user_id);
    $data->student_feedbacks = $studentFeedback;
    returnData($data);
}
function getNewEmailsCount($user_id){
    $messageSQL = new MessageSQL();

    $emails = $messageSQL->get_new_emails($user_id);
    $feedback = $messageSQL->get_new_feedback($user_id);
    $student_feedback = $messageSQL->get_new_student_feedback($user_id);
    $teacher_feedback = $messageSQL->get_new_teacher_feedback($user_id);
    $quiz_feedback = $messageSQL->get_new_quiz_feedback($user_id);
    $forum_feedback = $messageSQL->get_new_forum_feedback($user_id);
    $emails += $feedback->count;
    $emails += $student_feedback->count;
    $emails += $teacher_feedback->count;
    $emails += $quiz_feedback->count;
    $emails += $forum_feedback->count;
    $data = new \stdClass();
    $data->count = $emails;
    returnData($data);
}

function markAsRead($user_id){
    $input = get_input();
    if(!isset($input->ids)) throwError("Message ids must be provided");

    $messageSQL = new MessageSQL();

    if ($messageSQL->mark_as_read($user_id,$input->ids)) {
        returnData(new \stdClass());
    }
    else{
        throwError("An unexpected error has occurred");
    }
}
function markStudentFeedbackAsViewed($user_id){
    $input = get_input();
    if(!isset($input->ids)) throwError("Message ids must be provided");
    foreach($input->ids as $id){
        NotificationsController::_markStudentFeedbackAsViewed($id);
    }
    returnData(new \stdClass());
}
function markTeacherFeedbackAsViewed($user_id){
    $input = get_input();
    if(!isset($input->ids)) throwError("Message ids must be provided");
    foreach($input->ids as $id){
        NotificationsController::_markTeacherFeedbackAsViewed($id);
    }
    returnData(new \stdClass());
}
function markQuizFeedbackAsViewed($user_id){
    $input = get_input();
    if(!isset($input->ids)) throwError("Message ids must be provided");
    foreach($input->ids as $id){
        NotificationsController::_markQuizFeedbackAsViewed($id);
    }
    returnData(new \stdClass());
}

function markForumFeedbackAsViewed($user_id){
    $input = get_input();
    if(!isset($input->ids)) throwError("Message ids must be provided");
    foreach($input->ids as $id){
        NotificationsController::_markForumFeedbackAsViewed($id);
    }
    returnData(new \stdClass());
}

function markFeedbackAsViewed($user_id){
    $input = get_input();
    if(!isset($input->ids)) throwError("Message ids must be provided");
    $messageSQL = new MessageSQL();
    $messageSQL->mark_feedback_as_read($user_id,$input->ids);
    $g_postSQL = new GradePostSQL();

    if ($g_postSQL->mark_as_viewed($user_id,$input->ids)) {
        returnData(new \stdClass());
    }
    else{
        throwError("An unexpected error has occurred");
    }
}

function emailTemplate(){
    return '
    <div style="width:100%!important;min-width:100%;color:#222222;
font-family:Helvetica,Arial,sans-serif;font-weight:normal;text-align:left;line-height:18px;font-size:12px;margin:0;padding:0">
        <table style="width:100%;margin: 50px auto">
            <tr>
                <td style = "padding: 20px 30px;background: rgb(244, 244, 244);">
                    <div><a href="http://elearn.english3.com"> <img src="http://www.english3.com/images/green-logo.png" width="150px"></a></div>
                    <div style="margin-left: 37px;font-size: 14px;">Results that speak for themselves</div>
                </td>
            </tr>
        </table>
        <table style="width:100%;margin:auto;font-size:20px">
            <tr>
                <td>
                    ##hi##
                    <br>
                    <br>
                    ##mail_message##
                    <p>&nbsp;</p>
                </td>
            </tr>
        </table>
    </div>

    <div style="width:100%;margin: 70px auto;padding:10px 0;color:white;background-color: black">
        <div style="padding: 0 10px">

            <div>
                Do not reply this email.
                 <br>
                If you want to contact the person who sent this email, you can use this address <<span style="color:#9aff97">##sender_mail##</span>>.
            </div>
            <div>
                Copyright © 2015 English3. All rights reserved.
            </div>
        </div>

    </div>
    ';

}
function teacherFeedbackTemplates(){
    return
        '
        <p>You have received feedback for your post in the activity "##activity##"!</p>
        <b>Supervisor comments:</b>
        <p>##comments##</p>
        ';

}
function feedbackTemplate(){
    return
    '
    <p>You have received feedback for task "##activity##"!</p>
    <br>
    ##display_grades##
    ##rubric_table##
	<br>
	<br>
    <b>Teacher comments:</b>

    <p>##comments##</p>
    <hr>
    <br><br>
    <a href ="##activity_url##" style="padding: 15px 30px;font-size: 23px;background: rgb(25, 28, 50);color: rgb(136, 204, 123);text-decoration: none">
    Go to task
    </a>
    ';
}
function createRubric($rubric){
    $rubric = json_decode(json_encode($rubric),true);
    $table = "<table style='border-spacing:0;margin-top: 20px'><tbody>";
    for($i = 0; $i<count($rubric['grid']['items']);$i++){
        $desc = $rubric['grid']['rubric_descriptions'][$i]['text'];
        $score = intval($rubric['grid']['rubric_descriptions'][$i]['score'])*(intval($rubric['selectedScore'][$i]['score'])/100.0);
        $table.="<tr>";
        $table.="<td style='background-color: #C2C2C2;text-align: center;border: 1px solid #818181;padding: 5px;'>".
            "<div>". $desc ."</div>".
            "<div style='font-size:14px;'>". $score ."</div>".
            "</td>";
        for($j = 0; $j<count($rubric['grid']['items'][$i]);$j++){
            $active='';
            $col = $rubric['grid']['items'][$i][$j];
            if($j==$rubric['selectedScore'][$i]['index']){
                $active="background: #EBEBEB";
            }
            $table.="<td style=\"text-align: center;border: 1px solid #818181;padding: 5px;".$active."\">"
                ."<div>". $col['text'] ."</div>"
                ."<div style='font-size:14px;'>". $col['score'] ."%</div>"
                ."</td>";
        }
        $table.="</tr>";
    }
    $table.="</tbody></table>";
    return $table;
}
function sendFeedbackToTeacher($post_id,$feedback,$video_url){
    global $DB;
    $postSQL = new PostSQL();
    $pageSQL = new PageSQL();
    $classSQL = new ClassSQL();

    $parent_post = $postSQL->get_by_id($post_id);

    $user = new PmOrm($_SESSION,$DB);
    $myInfo=$user->get_my_info();

    $page = $pageSQL->get_by_id($parent_post->pageid);
    $class=$classSQL->get_by_id($parent_post->classid);

    $to = new PmOrm($_SESSION,$DB);
    $to->set_me($parent_post->userid);
    $message = teacherFeedbackTemplates();
    $message = str_replace('##activity##',$page->name,$message);
    $message = str_replace('##comments##',$feedback,$message);

    $translations = $to->get_translations();
    $to = $to->get_my_info();

    $hi = isset($translations['user_language']['hi'])?$translations['user_language']['hi']:$translations['en']['hi'];

    $text = str_replace('##hi##',$hi,emailTemplate());
    $text = str_replace('##fname##',$to['fname'],$text);
    $text = str_replace('##lname##',$to['lname'],$text);
    $text = str_replace('##mail_message##',$message,$text);

    //find attachment
    $attachment=false;
    if($video_url!=""){
        $attachment = new \stdClass();
        $last_slash = strrpos($video_url,'/');
        $attachment->filename = substr($video_url,$last_slash+1);
        $attachment->path = $_SERVER['HTTP_HOST'] . substr($video_url,0,$last_slash+1);
    }


    $input = new \stdClass();
    $input->to = array((object)$to);
    $input->subject = "Feedback from supervisor: " . $page->name;;
    $input->text = $message;

    sendEmail_private($myInfo,$input,$text,$attachment,false,false);
    //storeMessage($myInfo['id'], $input->to, $input->subject, $input->text,$parent_post->id);

}
function sendFeedBack($post_id,$rubric){
    global $DB;
    $postSQL = new PostSQL();
    $pageSQL = new PageSQL();
    $classSQL = new ClassSQL();
    $post = $postSQL->get_by_id($post_id);
    if(!$post) return false;

    if($post->postrootparentid!=$post->id){
           $parent_post = $postSQL->get_by_id($post->postrootparentid);
    }
    else return false;
    $user = new PmOrm($_SESSION,$DB);
    $myInfo=$user->get_my_info();

    $page = $pageSQL->get_by_id($post->pageid);
    $class=$classSQL->get_by_id($post->classid);

    $to = new PmOrm($_SESSION,$DB);
    $to->set_me($parent_post->userid);
    $translations = $to->get_translations();

    $subject = "Feedback for task: " . $page->name;

    $message = feedbackTemplate();
    $message = str_replace('##activity##',$page->name,$message);
    $message = str_replace('##activity_url##',$_SERVER['HTTP_HOST'] . '/#/content/' . $page->id ,$message);
    $message = str_replace('##comments##',$post->message,$message);
    if(isset($class->show_dates)){
        $rubric_table = '';
        if($rubric){
            $rubric_table = createRubric($rubric);
        }
        $grade_post = new GradePostSQL();
        $grade = $grade_post->get_user_grade($post->userid,$parent_post->id);
        if($grade->grade!=""){
            $message = str_replace('##display_grades##','<a style = "padding:5px 10px;background:lightgray" > Grade: ##grade##</a><p>&nbsp;</p>',$message);
            $message = str_replace('##grade##',$grade->grade,$message);
        }
        else{
            $message = str_replace('##display_grades##','',$message);
        }
        $message = str_replace('##rubric_table##',$rubric_table,$message);

    }else{
        $message = str_replace('##display_grades##','',$message);
        $message = str_replace('##rubric_table##','',$message);
    }


    $to = $to->get_my_info();
    $hi = isset($translations['user_language']['hi'])?$translations['user_language']['hi']:$translations['en']['hi'];
    $text = str_replace('##hi##',$hi,emailTemplate());
    $text = str_replace('##fname##',$to['fname'],$text);
    $text = str_replace('##lname##',$to['lname'],$text);
    $text = str_replace('##mail_message##',$message,$text);

    //find attachment
    $attachment=false;
    if($post->video_url!=""){
        $attachment = new \stdClass();
        $last_slash = strrpos($post->video_url,'/');
        $attachment->filename = substr($post->video_url,$last_slash+1);
        $attachment->path = $_SERVER['HTTP_HOST'] . substr($post->video_url,0,$last_slash+1);
    }


    $input = new \stdClass();
    $input->to = array((object)$to);
    $input->subject = $subject;
    $input->text = $message;

    sendEmail_private($myInfo,$input,$text,$attachment,false,false);
    //storeMessage($myInfo['id'], $input->to, $input->subject, $input->text,$parent_post->id);
}




function main($uri){
    $user_id = is_valid_user($_SESSION,true);
    $action = get_action('/email/',$uri);
    if($action=='userclasses') userclasses();
    if($action=='send-email') sendEmail(get_input());
    if($action=='sent-emails') getSentEmails($user_id);
    if($action=='received-emails') getReceivedEmails($user_id);
    if($action=='feedback-emails') getFeedbackEmails($user_id);
    if($action=='all-emails') getAllEmails($user_id);
    if($action=='new-emails') getNewEmailsCount($user_id);
    if($action=='mark-as-read') markAsRead($user_id);
    if($action=='mark-feedback-as-viewed') markFeedbackAsViewed($user_id);
    if($action=='mark-student-feedback-as-viewed') markStudentFeedbackAsViewed($user_id);
    if($action=='mark-teacher-feedback-as-viewed') markTeacherFeedbackAsViewed($user_id);
    if($action=='mark-quiz-feedback-as-viewed') markQuizFeedbackAsViewed($user_id);
    if($action=='mark-forum-feedback-as-viewed') markForumFeedbackAsViewed($user_id);



}
$uri = strtok($_SERVER['REQUEST_URI'], '?');
$uri = strtok($_SERVER['REQUEST_URI'], '?');

if (substr($uri,0,7)=='/email/'){

    main($uri);
}




?>