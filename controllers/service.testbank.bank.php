<?php
require_once('sql.php');
require_once('usertools/orm.php');
require_once('_utils.php');
require_once('usertools/multipart.php');
global $PATHS, $DB;
use English3\Controller\QuestionController;
use English3\Controller\Utility;

$queryGetCourseInfo = <<<SQL
	SELECT courses.departmentid,departments.organizationid
	FROM courses
	JOIN departments on courses.departmentid = departments.id
	WHERE courses.id = :courseId
SQL;

if(isset($_SESSION['USER']) && isset($_SESSION['USER']['LOGGED_IN']) && isset($_SESSION['USER']['ID']) && $_SESSION['USER']['ID'] > 0 && $_SESSION['USER']['LOGGED_IN']==true) {
	
	$user_id   = intval($_SESSION['USER']['ID']);
	$action    = '';
	$response = new \stdClass();
	
	$request  = array();
	if(preg_match('/\/.+\/([a-z\-]+)\/(\d+)/', $_SERVER['REQUEST_URI'], $request)) {
		$request['action'] = $request[1];
		$request['id']     = intval($request[2]);
	}
	
	$response->user_id   = $user_id;
	$response->action    = $request['action'];
		
	if($request['action'] == 'create-for') {
		
		$course_id = $request['id'];
		$util = new Utility();
		$POST  = file_get_contents('php://input');
		$data  = json_decode($POST);
		$title = isset($data->title) ? $data->title : '';
		$objective_id = isset($data->objective_id) ? intval($data->objective_id) : 0;
		$sql = new BaseSQL();
		$response->course_id = $course_id;
		$courseInfo = $util->fetchRow($queryGetCourseInfo,['courseId'=>$course_id]);
		if($course_id > 0) {
			
			if(strlen($title) <= 0) {
				
				$response->error = 'Must provide a title';
				
			} else {
				
				$sql_title = $DB->mysqli->real_escape_string($title);
				$dup_title = $sql->fetch_one("select title from banks where title='{$sql_title}'");
				if($dup_title){
					jsonResponse(['error'=>'Bank title already exists']);
				}
				$query = "INSERT INTO `banks` SET
						`title`='{$sql_title}',
						`course_id`={$course_id},
						`created_by`={$user_id},
 						 department_id={$courseInfo['departmentid']},
						 org_id={$courseInfo['organizationid']}";
				
				if($objective_id > 0) {
					$query .= ", `default_objective_id`={$objective_id}";
				}
				
				$DB->mysqli->query($query);
				
				if($DB->mysqli->affected_rows == 1) {
					$response->bank = new \stdClass();
					$response->bank->id         = $DB->mysqli->insert_id;
					$response->bank->title      = $title;
					$response->bank->course_id  = $course_id;
					$response->bank->default_objective_id = $objective_id;
					$response->bank->created_by = $user_id;
					$response->bank->modified   = date('Y-m-d H:i:s'); // an estimate
					$response->bank->count      = 0;
					 
				} else {
					$response->error = 'Could not create new Bank. [DB-ERROR]';
				}
			}
			
		} else {
			$response->error = 'Must provide a valid course id.';
		}
		
		
	} else if($request['action'] == 'movequestion') {
		$data  = json_decode(file_get_contents('php://input'));
		$response = new \stdClass();

		//Getting current bank_id

		$query = "select bank_id from bank_questions where question_id = ".$data->Currentquestionid." limit 1";
		$result = $DB->mysqli->query($query);
		if($result && $result->num_rows == 1) {
			$row = $result->fetch_object();
			$old_bank_id = $row->bank_id;

			if ($old_bank_id == $request['id']){
				$response->error = "Cannot move to the same bank";
			}
		//getting last position of target bank.
		$position = 0;
		$query = "select position from bank_questions where bank_id = ".$request['id']." order by position desc limit 1";
		$positionResult = $DB->mysqli->query($query);
		if($positionResult && $positionResult->num_rows == 1) {
			$row = $positionResult->fetch_object();
			$position = $row->position+=1;
		}
		//Moving question from existing bank.
		$query = "UPDATE bank_questions SET bank_id='".$request['id']."',position = '$position' WHERE question_id = ".$data->Currentquestionid." LIMIT 1";
		$DB->mysqli->query($query);

		
		$response->old_bank_id = $old_bank_id;
		$response->new_bank_id = $request['id'];
		$response->question_id = $data->Currentquestionid;
		header('Content-Type: application/json');
		echo json_encode($response);
		}
		
		
		exit;

	} else if($request['action'] == 'rename') {
		
		$bank_id = $request['id'];
		
		$POST   = file_get_contents('php://input');
		$data   = json_decode($POST);
		$title  = isset($data->title) ? $data->title : '';
		
		
		if($bank_id > 0) {
			
			if(strlen($title) <= 0) {
				
				$response->error = 'Must provide a title';
				
			} else {
				
				$sql_title = $DB->mysqli->real_escape_string($title);
				
				
				// @TODO: implement security here
				// @TODO: don't allow duplicate names among the same course
				
				$query = "UPDATE `banks` SET `title`='{$sql_title}' WHERE `id`={$bank_id} LIMIT 1";
				
				$DB->mysqli->query($query);
				
				if($DB->mysqli->affected_rows == 1) {
					$response->bank = new \stdClass();
					$response->bank->id         = $bank_id;
					$response->bank->title      = $title;
					 
				} else {
					$response->error = 'Could not rename Bank. [DB-ERROR]';
				}
			}
			
		} else {
			$response->error = 'Must provide a valid Bank id.';
		}
		
		
	} else if($request['action'] == 'details') {
		
		$bank_id = $request['id'];
		
		if($bank_id > 0) {
			
			// @TODO: implement security here
			
			$query = "SELECT `banks`.*,courses.name as courseName FROM `banks`
						LEFT JOIN courses on banks.course_id = courses.id
 						WHERE banks.id={$bank_id} LIMIT 1";
			$result = $DB->mysqli->query($query);
			
			if($result && $result->num_rows == 1) {
				$response->bank = $result->fetch_object();
				$response->questions = array();
				
				$query = "SELECT `questions`.*,question_id, `bank_questions`.`position`  , @rownum := @rownum + 1 as counter  FROM `bank_questions` cross join (select @rownum := 0) r  LEFT JOIN `questions` ON (`questions`.`id` = `bank_questions`.`question_id`) WHERE `bank_questions`.`bank_id`={$bank_id} ORDER BY `bank_questions`.`position` ASC";
				$result = $DB->mysqli->query($query);
				
				if($result && $result->num_rows > 0) {
					while($row = $result->fetch_object()) {

					if ($row->type == 'multipart'){
					$row->prompt = preg_replace('@<script.*?>.*?<\/script>|<script.*?>|<\/script>@','',$row->prompt);

					if ($row->extra == ''){
						$row->extra = $row->prompt;
						$row->prompt = 'Multipart Question';
					}
					$multipart = new multipartPrepare;
             		$multipart->is_teacher = 1;
             		$multipart->questionLifter($row->extra,$row->question_id);
             		$row->edit = $row->extra;
             		$row->extra = $multipart->question;             		
					}

					$row->options=array();
						$query = "SELECT text FROM question_options WHERE question_id = {$row->id} ORDER BY sort_order ";
						$options = $DB->mysqli->query($query);
						if($options && $options->num_rows >= 1)
						while($option = $options->fetch_object()) {
							$row->options[]=$option->text;
						}
						$row->extra = preg_replace('/\r\n|\r|\n/', '', $row->extra);
						$response->questions[] = json_decode(json_encode($row),true);
					}
					QuestionController::fetchTagsForQuestions($response->questions);
				}
				
			}
			
		} else {
			$response->error = 'Must provide a valid bank id.';
		}
		
	}else if($request['action'] == 'delete'){
		$bank_id = $request['id'];
		$bankSQL = new BankSQL();
		$success = $bankSQL->remove($bank_id);
		if($success){
			$response->status = 'success';
		}
		else{
			$response->status = 'An error has occurred';
		}
	} else if($request['action'] == 'update') {
		
		$bank_id = $request['id'];
		
		$POST   = file_get_contents('php://input');
		$data   = json_decode($POST);
		$default_objective_id  = isset($data->default_objective_id) ? intval($data->default_objective_id) : -1;
		
		
		if($bank_id > 0) {
			
			// $TODO: implement security here
			
			if($default_objective_id >= 0) {
				
				$query = "UPDATE `banks` SET `banks`.`default_objective_id`={$data->default_objective_id} WHERE `banks`.`id`={$bank_id} LIMIT 1";
				
				$DB->mysqli->query($query);
				
				if($DB->mysqli->affected_rows == 1) {
					$response->bank = new \stdClass();
					$response->bank->id                   = $bank_id;
					$response->bank->default_objective_id = $default_objective_id;
					 
				} else {
					$response->error = 'Could not update Bank. [DB-ERROR]';
				}
				
			}
			
		} else {
			$response->error = 'Must provide a valid bank id.';
		}
	}
	else if($request['action'] == 'get-by-course') {


		$id = $request['id'];
		$bankSQL = new BankSQL();

		$POST   = file_get_contents('php://input');
		$data   = json_decode($POST);


		$userOrm = new PmOrm($_SESSION,$DB);
		if(!$id){
			$id = $userOrm->my_org(false);
			$id = count($id)>0?$id['id']:0;
		}
		$response->banks = $bankSQL->get_all_by_course_id($id);
		if (count($response->banks) === 0)
		{
			$response->banks = $bankSQL->create_default_bank($user_id,$id);
		}

	}
	else if($request['action'] == 'get-by-org') {


		$id = $request['id'];
		$bankSQL = new BankSQL();

		$POST   = file_get_contents('php://input');
		$data   = json_decode($POST);


		$userOrm = new PmOrm($_SESSION,$DB);
		if(!$id){
			$id = $userOrm->my_org(false);
			$id = count($id)>0?$id['id']:0;
		}
//		if($userOrm->am_i_super_user()){
//			$response->banks = $bankSQL->get_all_banks();
//		}
		//else{
			$response->banks = $bankSQL->get_all_by_org_id($id);
		//}
		

		if (count($response->banks) === 0)
		{
			$response->banks = $bankSQL->create_default_bank($user_id,$id);
		}

	}
	
	
	header('Content-Type: application/json');
	echo json_encode($response);
	
	
} else {

	// @TODO: respond with uniform "must-log-in" or "invalid-access" error
	
}
