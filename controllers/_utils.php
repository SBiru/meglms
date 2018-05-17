<?php
/*
 * DSerejo
 * TODO can we remove this?
 */
require_once('usertools/orm.php');
function throwError($message){
    $data = new \stdClass();
    $data->message=$message;
    $data->error=$message;
    header('Content-Type: application/json');
    print json_encode($data);
    exit();
}

function throwMessage($message){
    $data = new \stdClass();
    $data->message=$message;
    header('Content-Type: application/json');
    print json_encode($data);
    exit();
}
function returnData($data){
    $data = (object) $data;
        $data->message = 'successful';
    header('Content-Type: application/json');
    print json_encode($data);
    exit();
}
function jsonResponse($data){
    header('Content-Type: application/json');
    print json_encode($data);
    exit();
}
function is_valid_user($sess,$echo=false){
    if(isset($sess['USER']) &&
    isset($sess['USER']['LOGGED_IN']) &&
    isset($sess['USER']['ID']) &&
    $sess['USER']['ID'] > 0 &&
    $sess['USER']['LOGGED_IN']==true)
    {
        return $sess['USER']['ID'];
    }
    else
        if($echo){
            throwError("User is not valid or not logged in");
        }
        return false;
}
function getCookieByName($cookie){
    if(!isset($_COOKIE[$cookie])) return false;
    return $_COOKIE[$cookie];
}
function is_logged_in($sess) {
    return isset($sess['USER']) &&
        isset($sess['USER']['LOGGED_IN']) &&
        isset($sess['USER']['ID']) &&
        $sess['USER']['ID'] > 0 &&
        $sess['USER']['LOGGED_IN']==true;
}

function get_id($prefix, $uri) {
    $uri = strtok($uri, '?');
    $uri = str_replace($prefix, '', $uri);
    $uri = strtok($uri, '/');
    return intval($uri);
}
function get_action($prefix,$uri) {
    $uri = strtok($uri, '?');
    $uri = str_replace($prefix, '', $uri);
    $uri = strtok($uri, '/');
    return $uri;
}
function is_admin_user($user_id=0,$DB=null,$echo=true){
    $orm = new PmOrm($_SESSION,$DB);


    if(!($orm->am_i_super_user() or $orm->am_i_organization_admin())){
        if($echo){
            throwError("You are not an admin user");
        }
        return false;
    }
    return $orm->user_id;

}
function get_input(){
    $input = new \stdClass();
    if($_SERVER['REQUEST_METHOD'] == 'POST') {
        $json_input = file_get_contents('php://input');

        $input = json_decode($json_input);
    }
    return $input;
}
/*used to test email locally*/
function send_mail_locally($subject,$input,$message,$from="",$to=""){
    require_once($_SERVER['DOCUMENT_ROOT'].'/vendor/PHPMailer/PHPMailerAutoload.php');
    $mail = new PHPMailer;
    $mail->isSMTP();                                      // Set mailer to use SMTP
    $mail->Host = 'smtp.gmail.com';  // Specify main and backup SMTP servers
    $mail->SMTPAuth = true;                               // Enable SMTP authentication
    $mail->Username = 'x@gmail.com';                 // SMTP username
    $mail->Password = 'x';                           // SMTP password
    $mail->SMTPSecure = 'ssl';                            // Enable TLS encryption, `ssl` also accepted
    $mail->Port = 465;                                    // TCP port to connect to
    $mail->From = $from['email'];
    $mail->FromName = $from['fname'] . ' ' . $from['lname'];
    if(is_array($to)){
        foreach($to as $recipient ){
            $mail->addAddress("dennyserejom@gmail.com", $recipient->fname . ' ' . $recipient->lname );     // Add a recipient
        }
    }
    else{
        $mail->addAddress($to, $input->fname . ' ' . $input->lname );     // Add a recipient
    }

    $mail->isHTML(true);                                  // Set email format to HTML

    $mail->Subject = $subject;
    $mail->Body    = $message;
    //$mail->AltBody = $message;

    if(!$mail->send()) {
        //echo 'Message could not be sent.';
        //echo 'Mailer Error: ' . $mail->ErrorInfo;
    } else {
        //echo 'Message has been sent';
    }

}
function validate_str($input,$error_message){
    if(!(isset($input)&&$input!="")) throwError($error_message);
}
function validate_array($input,$error_message){
    if(!(isset($input)&&is_array($input) && count($input)>0) ) throwError($error_message);
}
function validate_id($input,$error_message){
    if(!(isset($input)&&intval($input)!=0 ) ) throwError($error_message);
}

?>
