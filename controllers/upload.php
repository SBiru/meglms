<?php
require_once('usertools/orm.php');
require_once('_utils.php');
require_once('sql.php');

function uploadAudio(){
    if(isset($_FILES['file']['error']) && $_FILES['file']['error'] == 0){
        $type = strtok($_FILES['file']['type'], '/');
        if($type!="audio") {
            throwMessage('Invalid audio type');
        }
        saveFile();
    }

}
function uploadImage(){
    if(isset($_FILES['file']['error']) && $_FILES['file']['error'] == 0){
        $type = strtok($_FILES['file']['type'], '/');
        if($type!="image") {
            throwMessage('Invalid image type');
        }
        saveFile();
    }

}
function saveFile(){
    global $PATHS;
    $data = new \stdClass();
    $data->name = $_FILES['file']['name'];
    $data->tmp_name = $_FILES['file']['tmp_name'];
    $targetFolder = isset($_POST['altFolder']) ? $_POST['altFolder'] : "useruploads";
    $destination_file = $PATHS->app_path . $PATHS->base_site_public_path . $targetFolder . "/" .$data->name;
    if(file_exists($destination_file)){
        $date=new DateTime();
        $temp_name = explode('.',$data->name);
        $data->name=$temp_name[0]. $date->format("YmdHis") . '.' . $temp_name[1];
        $destination_file = $PATHS->app_path . $PATHS->base_site_public_path . $targetFolder . "/" .$data->name;
    }
    $data->destination_file = $PATHS->base_site_public_path . $targetFolder . "/" .$data->name;
    if($error = move_uploaded_file($data->tmp_name, $destination_file)) {
        $data->message = 'successfull';
        jsonResponse($data);
    }
    throwMessage('Could not upload file');
}
function saveImage($img_type,$im,$filename){
    if(!substr($img_type,0,8)=='image/'){
        return false;
    }
    $ext = explode('/',$img_type)[1];
    switch($ext){
        case 'png':
            $filename.='.png';
            imagepng($im,$filename);
            return $filename;
        case 'jpeg':
            $filename.='.jpg';
            imagejpeg($im,$filename);
            return $filename;
        case 'gif':
            $filename.='.gif';
            imagegif($im,$filename);
            return $filename;
        default:
            return false;
    }
}
function uploadImageData($user_id){
    global $PATHS;

    $input = get_input();
    $data = $input->imageData;
    $data = base64_decode($data);
    $im = imagecreatefromstring($data);
    $targetFolder = isset($_POST['altFolder']) ? $_POST['altFolder'] : "useruploads";
    if($im){
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $img_type = $finfo->buffer($data);
        $date=new DateTime();
        $filename = $user_id.$date->format("YmdHis");
        $savedFilename = saveImage($img_type,$im,$PATHS->app_path . $PATHS->base_site_public_path . $targetFolder . "/" . $filename);
        $savedFilename = str_replace($PATHS->app_path,'',$savedFilename);
        imagedestroy($im);
        jsonResponse(['filename'=>$savedFilename, 'message'=>'successfull']);
    }
    else{
        jsonResponse(['message'=>'An error has occurred']);
    }
}
function main($uri){
    $user_id = is_valid_user($_SESSION,true);
    $action = get_action('/upload/',$uri);
    if($action=='audio') uploadAudio();
    if($action=='image-data') uploadImageData($user_id);
    if($action=='image') uploadImage();
}


$uri = strtok($_SERVER['REQUEST_URI'], '?');

if (substr($uri,0,8)=='/upload/'){

    main($uri);
}
?>

