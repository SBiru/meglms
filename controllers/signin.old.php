<?php

global $PATHS, $DB, $SECURITY;

if(isset($_POST['username']) && strlen($_POST['username']) > 0) {
	if(isset($_POST['password']) && strlen($_POST['password']) > 0) {
		if(!($stmt = $DB->mysqli->prepare("SELECT salt_for_password FROM users WHERE email=? LIMIT 1"))) {
			errorTechnical("Prepare failed: (" . $DB->mysqli->errno . ") " . $DB->mysqli->error);
		}

		if (!$stmt->bind_param("s", $_POST['username'])) {
			errorTechnical("Binding parameters failed: (" . $stmt->errno . ") " . $stmt->error);
		}

		if (!$stmt->execute()) {
			errorTechnical("Execute failed: (" . $stmt->errno . ") " . $stmt->error);
		}

		print_r($stmt);

		print "num rows:" . $stmt->num_rows;

		$result = $stmt->get_result();

		print "got here";
		
		/*if($stmt->num_rows() == 1)
			$result = $stmt->get_result();

			print "got here";

			$row = $result->fetch_object();

			if(!($stmt = $DB->mysqli->prepare("SELECT id, fname, lname, is_active FROM users WHERE email=? AND password=? LIMIT 1"))) {
				errorTechnical("Prepare failed: (" . $DB->mysqli->errno . ") " . $DB->mysqli->error);
			}

			if (!$stmt->bind_param("ss", $_POST['username'], md5($SECURITY->salt . $row->salt_for_password . $_POST['password']))) {
				errorTechnical("Binding parameters failed: (" . $stmt->errno . ") " . $stmt->error);
			}

			if (!$stmt->execute()) {
				errorTechnical("Execute failed: (" . $stmt->errno . ") " . $stmt->error);
			}

			$result = $stmt->get_result();

			if($result->num_rows() == 1) {
				$row = $result->fetch_object();

				print "Row ID: " . $row->id . " First Name: " . $row->fname . " Last Name: " . $row->lname . " Is Active: " . $row->is_active;
			}
		}*/
	} else {
		print "Please Provide Password";
	}	
} else if(isset($_POST['password']) && strlen($_POST['password']) > 0) {
	print "Please Provide Username";		
} else {
	print "Please Provide Username and Password";	
}

?>