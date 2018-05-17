<?php

global $PATHS, $DB;

if(isset($_SESSION['USER']) && isset($_SESSION['USER']['LOGGED_IN']) && isset($_SESSION['USER']['ID']) && $_SESSION['USER']['ID'] > 0 && $_SESSION['USER']['LOGGED_IN']==true) {
	$uri = strtok($_SERVER['REQUEST_URI'], '?');

	$uri = str_replace('/externallink/', '', $uri);

	$uri = strtok($uri, '/');

	$external_link_id = intval($uri);

	if($external_link_id > 0) {
		$user_id = INTVAL($_SESSION['USER']['ID']);

		$query = "SELECT pages.id, pages.name, pages.content, pages.allow_video_post, pages.allow_text_post, pages.allow_upload_post, pages.is_private, pages.is_gradeable,pages.password FROM `user_classes` JOIN classes ON (user_classes.classid=classes.id) JOIN units ON (classes.courseid=units.courseid) JOIN pages ON (pages.unitid=units.id) WHERE user_classes.userid={$user_id} AND pages.id={$external_link_id} AND pages.layout='EXTERNAL_LINK' LIMIT 1";

		$result = $DB->mysqli->query($query);

		if($result && $result->num_rows == 1) {
			$row = $result->fetch_object();			
		
			$data = new \stdClass();

			$data->id = $row->id;
			$data->pagename = $row->name;
			$data->contenthtml = $row->content;
			$data->allow_video_post = $row->allow_video_post;
			$data->allow_text_post = $row->allow_text_post;
			$data->allow_upload_post = $row->allow_upload_post;
			$data->page_is_private = $row->is_private;
            $data->page_is_gradeable = $row->is_gradeable;
			$data->need_password = $row->password?true:false;

			header('Content-Type: application/json');

			print json_encode($data);			
		}
	}

	exit();
}

?>