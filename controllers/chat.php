<?php

global $PATHS, $DB;

if(isset($_SESSION['USER']) && isset($_SESSION['USER']['LOGGED_IN']) && isset($_SESSION['USER']['ID']) && $_SESSION['USER']['ID'] > 0 && $_SESSION['USER']['LOGGED_IN']==true) {
	$data = new \stdClass();

	$uri = strtok($_SERVER['REQUEST_URI'], '?');

	$uri = str_replace('/chat/', '', $uri);

	$uri = strtok($uri, '/');

       if($uri == 'user') {
		$data->chats = array();

		$json_input = file_get_contents('php://input');

              $input = json_decode($json_input);

		if(is_numeric($input->chatter_id) && $input->chatter_id > 0 && is_numeric($input->course_id) && $input->course_id > 0) {
			$user_id = intval($_SESSION['USER']['ID']);
			$chatter_id = intval($input->chatter_id);
			$course_id = intval($input->course_id);

			$query = "SELECT chats.from_user_id, users.fname, users.lname, chats.message, chats.created FROM chats JOIN classes ON (chats.class_id=classes.id) JOIN users ON (users.id=chats.from_user_id) WHERE classes.courseid={$course_id} AND (chats.from_user_id={$user_id} OR chats.to_user_id={$user_id}) AND (chats.from_user_id={$chatter_id} OR chats.to_user_id={$chatter_id}) ORDER BY chats.created ASC";
            $queryForNewChats = "SELECT chats.from_user_id, users.fname, users.lname, chats.message, chats.created FROM chats JOIN classes ON (chats.class_id=classes.id) JOIN users ON (users.id=chats.from_user_id) WHERE classes.courseid={$course_id}";

			$result = $DB->mysqli->query($query);

			$data->query = $query;

			if($result && $result->num_rows > 0 ) {
				while($row = $result->fetch_object()) {
					$temp = new \stdClass();
					$temp = clone $row;
				
					$data->chats[] = $temp;
				}
			}
		}
	} else if($uri == 'send') {
		$data->send = 'got here';

		$json_input = file_get_contents('php://input');

              $input = json_decode($json_input);

		if(is_numeric($input->chatter_id) && $input->chatter_id > 0 && is_numeric($input->course_id) && $input->course_id > 0) {
			$user_id = intval($_SESSION['USER']['ID']);
			$chatter_id = intval($input->chatter_id);
			$course_id = intval($input->course_id);

			$query = "SELECT uc1.classid FROM users as u1, user_classes as uc1, classes as c1, users as u2, user_classes as uc2, classes as c2 WHERE u1.id={$user_id} AND u1.id=uc1.userid AND uc1.classid=c1.id AND c1.courseid={$course_id} AND u2.id=uc2.userid AND uc2.classid=c2.id AND c2.courseid={$course_id} AND u2.id={$chatter_id} AND u2.is_active=1 LIMIT 1";

			$result = $DB->mysqli->query($query);

			$data->send = $query;

			if($result && $result->num_rows == 1) {
				$row = $result->fetch_object();
		
				$class_id = $row->classid;

				$message = $DB->mysqli->real_escape_string($input->message);	

				$query = "INSERT INTO chats(class_id, from_user_id, to_user_id, message) VALUES('{$class_id}','{$user_id}','{$chatter_id}','{$message}')";

				$result = $DB->mysqli->query($query);

				$data->send = $query;
			}
		}
       } else {
		$course_id = intval($uri);

		if($course_id > 0) {
			$user_id = INTVAL($_SESSION['USER']['ID']);

			$query = "SELECT u2.id, u2.fname, u2.lname FROM users as u1, user_classes as uc1, classes as c1, users as u2, user_classes as uc2, classes as c2 WHERE u1.id={$user_id} AND u1.id=uc1.userid AND uc1.classid=c1.id AND c1.courseid={$course_id} AND u2.id=uc2.userid AND uc2.classid=c2.id AND c2.courseid={$course_id} AND u2.id!=u1.id AND u2.is_logged_in=1 AND u2.is_active=1 ORDER BY u2.fname, u2.lname";

			$result = $DB->mysqli->query($query);

			if($result && $result->num_rows > 0 ) {
				while($row = $result->fetch_object()) {
					$temp = new \stdClass();
					$temp = clone $row;
				
					$data->users[] = $temp;
				}
			}
		}	 
       }

	header('Content-Type: application/json');
	print json_encode($data);
	exit();
}

?>