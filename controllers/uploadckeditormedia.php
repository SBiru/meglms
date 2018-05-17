<?php

global $PATHS, $DB;

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

$funcNum = $_GET['CKEditorFuncNum'] ;

if(isset($_FILES['upload']['error']) && $_FILES['upload']['error'] == 0) {
	$destination_file_name = generate_unique(20);
	
	$destination_file_name .= '.' . preg_replace("/[^A-Za-z0-9]/", '', substr($_FILES['upload']['name'], strrpos($_FILES['upload']['name'], '.')));

	if(isset($_FILES['upload']['tmp_name'])) {
		if(move_uploaded_file($_FILES['upload']['tmp_name'], $PATHS->app_path . $PATHS->base_site_public_path . 'coursecontent/' . $destination_file_name)) {
			$url = $PATHS->base_site_public_path . 'coursecontent/' . $destination_file_name;


			$message = "successfully saved";

			print "<script type='text/javascript'>window.parent.CKEDITOR.tools.callFunction($funcNum, '$url', 0);</script>";
		}
	}
	else
	{
				$message = "Could not save the media";
				print "<script type='text/javascript'>window.parent.CKEDITOR.tools.callFunction($funcNum, '$url', '$message');</script>";
	}
}
else{
	exit('ERROR');
}

?>