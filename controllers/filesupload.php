<?php
/*
Golabs 04/05/2015
Accept files for upload and place in filesupload folder
Put details in 


*/
global $PATHS, $DB;
require_once('sql.php');



function generate_unique_id($unique_end_length)
{
    $unique_end_length = intval($unique_end_length);
    
    $rand = array(
        'a',
        'b',
        'c',
        'd',
        'e',
        'f',
        'g',
        'h',
        'i',
        'j',
        'k',
        'l',
        'm',
        'n',
        'o',
        'p',
        'k',
        'r',
        's',
        't',
        'u',
        'v',
        'w',
        'x',
        'y',
        'z'
    );
    
    $date = date("Y-m-d-s-");
    $str  = '';
    
    $length = count($rand) - 1;
    
    for ($i = 0; $i < $unique_end_length; $i++) {
        $str .= $rand[mt_rand(0, $length)];
    }
    
    return $date . $str;
}

if (isset($_SESSION['USER']) && isset($_SESSION['USER']['LOGGED_IN']) && isset($_SESSION['USER']['ID']) && $_SESSION['USER']['ID'] > 0 && $_SESSION['USER']['LOGGED_IN'] == true) {


   if (!isset($uri)) {
        $uri         = strtok($_SERVER['REQUEST_URI'], '?');
        $uri         = str_replace('/filesupload/', '', $uri);
        $post_action = strtok($uri, '/');
    } else {
	    if($uri=='/filesupload/video'){
			$post_action='video';
		}else{
			$post_action = strtok($uri, '/');
		}
        if (isset($_FILES['file-1'])) {
            $_FILES['file'] = $_FILES['file-1'];
        }
    }

	$mainUploadCode = function($isTimedAudio = false) use ($PATHS,$DB){ 


			$folder = '';	
			$user_id = $_SESSION['USER']['ID'];	
			if (isset($_FILES['file']['name'])) {
    			 if (isset($_POST['destination'])) {
                $folder = $_POST['destination'];
            }
				 $sanitized_name = generate_unique_id(10);
				 $extension      = strrpos($_FILES['file']['name'], '.');
				 if ($extension > 0) {
					 $extension = substr($_FILES['file']['name'], $extension);
				 } else {
					 $extension = '';
				 }
				 $folder = preg_replace('@^\/@','',$folder);

				 if (isset($PATHS->org_user_path)){
				 echo $PATHS->org_user_path."\n";
				 $destination_folder = $PATHS->app_path . $PATHS->base_site_public_path . "useruploads/" .$PATHS->org_user_path.$folder;
				 if (!file_exists($destination_folder)){
				 mkdir($destination_folder, 0777, true);	
				 }
				 $destination_file = $PATHS->app_path . $PATHS->base_site_public_path . "useruploads/" .$PATHS->org_user_path.$folder.'/'. $_FILES['file']['name'];
				}
				else{
				 $destination_file = $PATHS->app_path . $PATHS->base_site_public_path . "useruploads/" . $sanitized_name . $extension;
				}
				 //echo $_FILES['file']['tmp_name']." ".$destination_file;
				// var_dump(move_uploaded_file($_FILES['file']['tmp_name'], $destination_file));
				 if (move_uploaded_file($_FILES['file']['tmp_name'], $destination_file)) {
					 
					 if($isTimedAudio){
						 if($extension!='.mp3'){
							 $extension = '.mp3';
							$mp3_file_name =   $PATHS->app_path . $PATHS->base_site_public_path . "useruploads/" .$sanitized_name . $extension;
							$mp3convert="/usr/bin/ffmpeg -i " . $destination_file. " -f mp3 " .  $mp3_file_name . " > /dev/null 2>/dev/null &";
						
							shell_exec($mp3convert);
						 
							while (!file_exists($mp3_file_name)) //what if the convert code break?
							{	
								sleep(1);
							}
						
							if(file_exists($mp3_file_name)){
							
								unlink(realpath($destination_file));
							}
						}
					 }
					 if(strstr($_FILES['file']['type'], "video/")){
                         $mp4_file_name = $PATHS->app_path . $PATHS->base_site_public_path . "useruploads/" .
                             $sanitized_name . '.mp4';
					     \English3\Controller\Utility::convertToMp4($destination_file,$mp4_file_name,false);
                         if(file_exists($mp4_file_name)){
                             unlink(realpath($destination_file));
                         }
                     }
				    if (isset($_POST['class_id'])){
                    $class_id = $_POST['class_id'];
                    }
                    else{
                    	$class_id = '';
                    }
					 $query = "insert into filesuploaded set id='$sanitized_name',filename='" . $_FILES['file']['name'] . "',class_id='" . $class_id . "',ext='$extension',size='" . $_FILES['file']['size'] . "',user_id='" . $user_id . "',folder='" . $folder . "'";
					 $DB->mysqli->query($query);
					 $data               = new \stdClass();
					 $data->realfilename = $_FILES['file']['name'];
					 $data->fileid       = $sanitized_name;
					 $data->extension       = $extension;
					 $data->path = $PATHS->app_path . $PATHS->base_site_public_path . "useruploads/";
					 $data->showfilename = $sanitized_name.$extension;
					 return $data;
				 }
				 return false;
			}
			return false;
		};
	
	$clean = function ($data){
		unset($data->path);
		return $data;
	};
    

    if ($post_action == 'uploadany') {
		$data = $mainUploadCode();
		if($data!==false){
			header('Content-Type: application/json');
			print json_encode($clean($data));
			exit();
		}
    }
	
    if ($post_action == 'filesupload') {
		$data = $mainUploadCode();
		if($data!==false){
			header('Content-Type: application/json');
			print json_encode($clean($data));
			exit();
		}
    }	

	if($post_action == 'timedAudio'){
		//print_r($request);
		//print_r($_FILES);//exit;
		$data = $mainUploadCode(true);
		//var_dump($data);
		if($data!==false){
			
			header('Content-Type: application/json');
			print json_encode($clean($data));
			exit();
		}
	}
	if($post_action == 'video') {
		$data       = new \stdClass();
		if(isset($_FILES['file']['error']) && $_FILES['file']['error'] == 0) {

			$sanitized_video_file_name = $_SESSION['USER']['FNAME'].'_'.$_SESSION['USER']['LNAME'].'_'.generate_unique_id(10);
			$data->error = $_FILES['file']['error'];
			$data->name = $_FILES['file']['name'];
			$data->size = $_FILES['file']['size'];
			$data->type = $_FILES['file']['type'];
			$data->tmp_name = $_FILES['file']['tmp_name'];
            if(!strstr($data->type, "video/")){
                exit('ERROR');    // file is not a video
            }
            $extension = strrpos($_FILES['file']['name'], '.');
            if($extension > 0) {
				$extension = substr($_FILES['file']['name'], $extension);
			} else {
				$extension = '';
			}
			$destination_file = $PATHS->app_path . $PATHS->base_site_public_path . "uservids/" . $sanitized_video_file_name . $extension;

			if(move_uploaded_file($data->tmp_name, $destination_file)) {
				$doNotConvert =($extension == '.mp4')?true:false;
				$converted_file = $PATHS->app_path . $PATHS->base_site_public_path . "uservids/" . $sanitized_video_file_name . '.mp4';
				if($doNotConvert){
					$converted_file = $destination_file;
				}
				else{
					$uploadconvert = "/usr/bin/ffmpeg -i " . $destination_file . " -f mp4 -vcodec libx264 -preset fast -profile:v main -acodec aac " . $converted_file;
                    shell_exec($uploadconvert);
				}
				$thumbfile                 = $PATHS->app_path . $PATHS->base_site_public_path . "uservidthumbnails/" .  $sanitized_video_file_name . '.jpg';
				shell_exec("/usr/bin/ffmpeg -i " . $converted_file . " -deinterlace -an -ss 1 -t 00:00:10 -r 1 -y -vcodec mjpeg -f mjpeg $thumbfile 2>&1");
				$data->videofilename     = $PATHS->base_site_public_path . "uservids/" . $sanitized_video_file_name . '.mp4';
				$data->thumbnailfilename = $PATHS->base_site_public_path . "uservidthumbnails/" .  $sanitized_video_file_name . '.jpg';
				if(file_exists($converted_file) && $destination_file!=$converted_file){
					unlink($destination_file);
				}
				$filesize = floor(filesize($converted_file)/(1024*1024));
				if($filesize>=10){
					convertMp4FileAgain($converted_file);
					\English3\Controller\EmailController::sendFileBiggerThanLimitToMike($converted_file,$filesize);
				}
				header('Content-Type: application/json');
				print json_encode($clean($data));
				exit();
			}else{
				throwError('There was a problem uploading the file. Please try again.');
			}
		}
	}
  if ($post_action == 'upload') {
		$data = $mainUploadCode();
		if($data!==false){
			header('Content-Type: application/json');
			print json_encode($clean($data));
			exit();
		}
    }

}
function convertMp4FileAgain($filename){
	$tmpfilename = $filename . 'tmp';
	rename($filename,$tmpfilename);
	$uploadconvert = "/usr/bin/ffmpeg -i " . $tmpfilename . " -s 160x120 -ar 11025 -r 15 -maxrate 5k  -vb 200k " . $filename . " > /dev/null 2> /dev/null &";
	shell_exec($uploadconvert);
}
exit('ERROR');
?>