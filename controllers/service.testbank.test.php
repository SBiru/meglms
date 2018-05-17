<?php

global $PATHS, $DB;
require_once('_utils.php');
require_once('sql.php');
require_once('usertools/orm.php');
require_once('usertools/multipart.php');
use English3\Controller\ClassesController;
use English3\Controller\CloneController;
use English3\Controller\GradebookController;
use English3\Controller\Organization\OrganizationController;
use English3\Controller\QuestionController;
use English3\Controller\QuizController;
use English3\Controller\QuizzesAndQuestions\QuestionTags\QuestionTags;
use English3\Controller\QuizzesAndQuestions\QuestionTags\QuestionTagsFilter;
use English3\Controller\Utility;

class Test {
	public $DB;

	public function __construct($user_id){
		global $PATHS, $DB;
		$this->DB = $DB;
		$this->user_id = $user_id;
	}
	public function create_for($id,$response){
		$DB = $this->DB;
		$course_id = $id;
		$user_id = $this->user_id;
		$sql = new BaseSQL();
		$data   = get_input();
		$editing = isset($data->id);
		$title  = isset($data->title) ? $data->title : '';
		$description  = isset($data->description) ? $data->description : '';

		$response->course_id = $course_id;

		//Getting departmentId and orgId
		$util = Utility::getInstance();
		$courseInfo = $util->fetchRow(self::$queryGetCourseInfo,['courseId'=>$course_id]);


		if($course_id > 0) {

			if(strlen($title) <= 0) {

				$response->error = 'Must provide a title';

			} else {


				$sql_title = $DB->mysqli->real_escape_string($title);
				$sql_description = $DB->mysqli->real_escape_string($description);

				//verifying if the title is duplicated
//				$query = "select title from quizzes where title='{$sql_title}'";
//				if($editing){
//					$query.= " and id != {$data->id}";
//				}
//				$dup_title = $sql->fetch_one($query);
//				if($dup_title){
//					jsonResponse(['error'=>'Test title already exists']);
//				}
				if($editing){
					$query = "UPDATE `quizzes` SET `title`='{$sql_title}',
 						`course_id`={$course_id},
 						 `created_by`={$user_id},
 						  `description`='{$sql_description}',
 						  department_id={$courseInfo['departmentid']},
						  	org_id={$courseInfo['organizationid']}
						  	WHERE id={$data->id}";
				}
				else{
					$query = "INSERT INTO `quizzes` SET `title`='{$sql_title}',
 						`course_id`={$course_id},
 						 `created_by`={$user_id},
 						  `description`='{$sql_description}',
 						  department_id={$courseInfo['departmentid']},
						  	org_id={$courseInfo['organizationid']},
						  keep_highest_score=1";
				}



				$DB->mysqli->query($query);

				if($DB->mysqli->affected_rows == 1 || $editing) {
					$response->test = new \stdClass();
					if($editing){
						$response->test->editing  = true;
						$response->test->id     = $data->id;
					}else{
						$response->test->id     = $DB->mysqli->insert_id;
					}
					$response->test->title      = $title;
					$response->test->course_id  = $course_id;
					$response->test->created_by = $user_id;
					$response->test->modified   = date('Y-m-d H:i:s'); // an estimate
					$response->test->count      = 0;


				} else {
					$response->error = 'Could not create new Test. [DB-ERROR]';
				}
			}

		} else {
			$response->error = 'Must provide a valid course id.';
		}

		/*
		Golabs all_tests
		*/
		$response->allTests = return_alltests();

		return $response;
	}

	public function rename($id,$response){
		$DB = $this->DB;
		$test_id = $id;

		$data   = get_input();
		$title  = isset($data->title) ? $data->title : '';


		if($test_id > 0) {

			if(strlen($title) <= 0) {

				$response->error = 'Must provide a title';

			} else {

				$sql_title = $DB->mysqli->real_escape_string($title);


				// @TODO: implement security here
				// @TODO: don't allow duplicate names among the same course

				$query = "UPDATE `quizzes` SET `title`='{$sql_title}' WHERE `id`={$test_id} LIMIT 1";

				$DB->mysqli->query($query);

				if($DB->mysqli->affected_rows == 1) {
					$response->test = new \stdClass();
					$response->test->id         = $test_id;
					$response->test->title      = $title;

				} else {
					$response->error = 'Could not rename Test. [DB-ERROR]';
				}
			}

		} else {
			$response->error = 'Must provide a valid Test id.';
		}
		return $response;
	}
	public function details($id,$response){
		$DB = $this->DB;
		$test_id = $id;
		$util = Utility::getInstance();
			// @TODO: implement security here

			$query = "SELECT `quizzes`.*,departments.organizationid,courses.name as courseName FROM `quizzes`
						JOIN courses on courses.id = quizzes.course_id
						JOIN departments on departments.id = courses.departmentid
					 WHERE quizzes.`id`={$test_id} LIMIT 1";

			$result = $DB->mysqli->query($query);

			if($result && $result->num_rows == 1) {
				$response->test = $result->fetch_object();
				if(isset($response->test->is_private))
				$response->test->is_private = $response->test->is_private =='1';
				$response->test->is_survey = $response->test->is_survey =='1';
				$response->test->keep_highest_score = boolval($response->test->keep_highest_score);
				$response->test->is_owner = $response->test->created_by==$_SESSION['USER']['ID'];
				$response->test->pages = QuizController::_getPagesUsingQuiz($test_id);
				$advanced = json_decode($response->test->advanced,true)?:[];

				$response->test->advancedSettings = array_merge(QuizController::$defaultAdvancedSettings,$advanced);
				$response->questions = array();
				$query = TestSQL::$queryGetQuizQuestions;
				$testsSQL    = new TestSQL();
				$result = $util->fetch($query,['quizId'=>$id]);

				if(isset($result[0]['quiz_question_id'])){

					$query = TestSQL::$queryGetquizqustionPageid;
					$resultPageID = $util->fetch($query,['quiz_question_id'=>$result[0]['quiz_question_id']]);
					$response->pageId = @$resultPageID[0]['id'];
					$orgId = OrganizationController::_getOrgFromClassId(ClassesController::_getFromPage($util->reader,$response->pageId));
					$response->needGradebookRecalculation = boolval(OrganizationController::_getField($orgId,'calculate_progress'));
				}

				if($result) {
					$banks = array();
					foreach($result as &$row) {
                        $courseId = ClassesController::_getCourseId($row['class_id']);
                        $row['course_id'] = $courseId;
						$row['position']=intval($row['position']);
						$row['enable_distractors']=boolval($row['enable_distractors']);
						//print_r($row);


					/*
					Golabs 24/08/2015
					Looking for and correcting poitns issues. A Start
					*/
					if ((isset($row['points'])) && ($row['points'] == 0)){
							$row['points'] = $row['max_points'];
					}
					/*
						Looking for and correcting poitns issues. A Start
					*/

						if($row['random']){
							$row['max_points']=isset($row['points'])?floatval($row['points']):1;
						}else{
							$row['max_points']=isset($row['points'])?floatval($row['points']):$row['max_points'];
						}
						$row['max_points'] = round($row['max_points'],2);


						/*
						Golabs 24/08/2015
						Looking for and correcting poitns issues. B Start

						We must allow max_points = 0 for information type of question
						*/
						if ($row['max_points'] == 0 && $row['type']!='information'){
							if ($row['qpoints'] == 0){
								$row['qpoints'] = 1;
							$query = "update questions set max_points=1 WHERE id = '".$row['id']."' limit 1";
							$DB->mysqli->query($query);
							}
							$row['max_points'] = $row['qpoints'];
						}
/*
						Looking for and correcting poitns issues. B Start
*/

							if ($row['type'] == 'multipart'){
							$multipart = new multipartPrepare;
							$multipart->is_teacher = 1;
							if (!preg_match('@\w@',$row['extra'])){
								$row['edit'] = $row['prompt'];
								$multipart->questionLifter($row['prompt'],$row['id']);
								$row['prompt'] = '<h4 style="font-weight:bold">Multipart Question Teacher view with Answers shown or selected :</h2>';
							}else{
							$row['edit'] = $row['extra'];
							$multipart->questionLifter($row['extra'],$row['id']);
						}
						
						$row['extra'] = $multipart->question;
							}

		


						if($row['bank_id']){
							if( !isset($banks[$row['bank_id']])){
								//$banks[$row['bank_id']] = 8;
								$banks[$row['bank_id']] = BankSQL::setBankQuestionsCount($row['bank_id']);
							}
							$row['totalBankQuestions']=$banks[$row['bank_id']];
							$row['type']= 'Random';
							$row['prompt'] = "From : '" . $row['bankName'] . "' Bank Randomised by " . $row['random'] . ' of ' . $row['totalBankQuestions'];
						}
						if($row['tags']){
							$row['type']='Random';
							$row['totalBankQuestions']=QuestionTagsFilter::filterQuestionCount(explode(',',$row['tags']));
							$row['prompt']=$row['random'].' out of '.$row['totalBankQuestions'] . ' random questions from tag(s):'. QuestionTags::prepareTagsForRandomPrompt($row['tags']);
						}

						$row['options']=array();

						//Golabs July 13/07/2015
						//Correcting issue with non object as an array.
						if (!isset($row->id)){
							$id = $row['id'];
						}
						else{
							$id = $row->id;
						}
						$query = "SELECT text FROM question_options WHERE question_id = {$id} ORDER BY sort_order ";
						$options = $DB->mysqli->query($query);
						if ($options && $options->num_rows > 0)
						while($option = $options->fetch_object()) {
							$row['options'][]=$option->text;
						}
						$row['extra'] = preg_replace('/\r\n|\r|\n|\t/xsi', '', $row['extra']);

					$response->questions[] = json_decode(json_encode($row),true);
					}
					QuestionController::fetchTagsForQuestions($response->questions);

				}
					$query = "select count(*) as bankQuestionCount,quiz_questions.bank_id as bank_id,title as bankTitle from quiz_questions,bank_questions,banks where quiz_id = '{$test_id}' AND bank_questions.bank_id = quiz_questions.bank_id AND banks.id = bank_questions.bank_id";
					$bank_ids = $DB->mysqli->query($query);
					if ($bank_ids && $bank_ids->num_rows > 0)
						while($bank_id = $bank_ids->fetch_object()) {
							$response->test->bank_id=$bank_id->bank_id;
							$response->test->bankQuestionCount=$bank_id->bankQuestionCount;
							$response->test->bankTitle=$bank_id->bankTitle;
						}
				$response->test->objectives = QuizController::_quizObjectives($test_id);
			}

		 	else {
				$response->error = 'Must provide a valid test id.';
			}


		return $response;
	}
	public function get_all_by_course_id($id,$response){
		$userOrm = new PmOrm($_SESSION,$this->DB);
		if(!$id){
			$id = $userOrm->am_i_super_user()?0:$userOrm->my_org(false);
			$id = count($id)>0?$id['id']:0;
		}

		$testSQL = new TestSQL();
		$response->tests = $testSQL->get_all_by_course_id($id);
		if(!$response->tests){
			$response->error = $this->DB->mysqli->error;
		}
		return $response;
	}
	public function get_all($response){
		$response->tests = QuizController::_getAll($_REQUEST);
		return $response;
	}
	public function get_all_by_org_id($id,$response){
		$userOrm = new PmOrm($_SESSION,$this->DB);
		if(!$id){
			$id = $userOrm->am_i_super_user()?0:$userOrm->my_org(false);
			$id = count($id)>0?$id['id']:0;
		}

		$testSQL = new TestSQL();
		$response->tests = $testSQL->get_all_by_org_id($id,$userOrm->user_id);
		if(!$response->tests){
			$response->error = $this->DB->mysqli->error;
		}


		return $response;
	}
	public function clone_quiz($response){
		$input = get_input();
		if(!(isset($input->id) && intval($input->id) )){
			$response->error = "Must provide a valid test id";
			return $response;
		}
		if(!(isset($input->new_title) && $input->new_title!="" )){
			$response->error = "Must provide a valid test title";
			return $response;
		}
		$params = array(
			'title'=>$input->new_title
		);
		if($input->targetCourse) {
			$params['courseId'] = $input->targetCourse;
		}
		$response->newQuizId = CloneController::_cloneQuiz($input->id,$params);
		return $response;
	}

	public function random_quiz($response,$test,$request){

		$input = get_input();
		$RandomQuestionsSQL = new RandomQuestionsSQL();
		$input = get_input();
		if (!isset($input->description)){
			$input->description = '';
		}
		if(!isset($input->user_id)){
			$input->user_id=$_SESSION['USER']['ID'];
		}
		$RandomQuestionsSQL->insertRandomQuiz($input->bank_id,$input,$this->user_id,$input->quizzes_id);

		$request['action'] = 'details';
		$request['id'] = $input->quizzes_id;
		main($this->user_id,$request);
		}
	public function make_private($response,$id,$request){
		$input = get_input();
		$is_private = $input->is_private;
		$testSQL = new TestSQL();
		$testSQL->make_private($id,$is_private);
		return $response;
	}
	public function set_keep_highest($response,$id,$request){
		$input = get_input();
		$keep_highest_score = $input->keep_highest_score;
		$testSQL = new TestSQL();
		$testSQL->set_keep_highest($id,$keep_highest_score);
		return $response;
	}
	public function set_sort_mode($response,$id,$request){
		$input = get_input();
		$sort_mode = $input->sort_mode;
		$testSQL = new TestSQL();
		$testSQL->set_sort_mode($id,$sort_mode);
		return $response;
	}
    public function set_questions_per_page($response,$id,$request){
        $input = get_input();
        $questions_per_page = $input->questions_per_page;
        $testSQL = new TestSQL();
        $testSQL->set_questions_per_page($id,$questions_per_page);
        return $response;
    }
	public function make_survey($response,$id,$request){
		$input = get_input();
		$is_survey = $input->is_survey;

		$checkStatus = intval(!boolval($is_survey));
        $usedQuiz = Utility::getInstance()->fetchRow("
Select p.name as pName, c.name as cName, u.description as uName
FROM quizzes q 
join pages p on p.quiz_id = q.id
join units u on u.id = p.unitid
join classes c on c.courseid = u.courseid
WHERE if({$checkStatus},p.layout='survey',p.layout='quiz') and q.id = {$id}");
		if($usedQuiz){
		    return ['error'=>true,
                'msg'=>"Cannot make this page ".($is_survey?'survey/pretest':'quiz').". This ".(!$is_survey?'survey/pretest':'quiz')." is in use in page {$usedQuiz['pName']}, unit {$usedQuiz['uName']}, class {$usedQuiz['cName']}"
            ];
        }


		$testSQL = new TestSQL();
		$testSQL->make_survey($id,$is_survey);
		return $response;
	}
	public function remove($id,$response){
		$testSQL = new TestSQL();

		$success = $testSQL->remove($id);
		if($success){
			$response->status = 'success';
		}
		else{
			$response->status = 'An error has occurred';
		}
		return $response;
	}
	function questionPositions($request,$input){
		$util = Utility::getInstance();
		foreach($input as $quizQuestionId =>$position){
			$util->reader->update(
				'quiz_questions',
				['position'=>$position],
				['id'=>$quizQuestionId]
			);
		}
		exit('done');
	}
	function saveAdvancedSettings($id,$input){
		$util = Utility::getInstance();
        $util->reader->update(
            'quizzes',
            ['advanced'=>json_encode($input)],
            ['id'=>$id]
        );
		exit('done');
	}
	function spread($request,$input){
		$DB = $this->DB;
		$max_points = $input->max_points;
		$questions = $input->questions;
		$old_max_points=$input->old_max_points;
		$quiz_id = $input->quiz_id;
		//removing information questions
		foreach($questions as $i=>$question){
			if($question->type=='information'){
				unset($questions[$i]);
			}
		}

		//counting our questions.
		//we will include randoms
		$count = 0;
		foreach ($questions as $key => $value) {
			if ($value->type== 'Random'){
				$count += $value->random;
			}
			else{
				$count +=1;
			}
			# code...
		}

		$points = $max_points/$count;
		$points_per_questions = $points;
		$util = Utility::getInstance();
		foreach($questions as $question){
			$util->insert(
				QuestionController::$queryUpdateQuizResponseScores,
				[
					'quizQuestionId'=>$question->quiz_question_id,
					'newPoints'=>$points_per_questions
				]
			);
			$util->reader->update(
				'quiz_questions',
				array('points'=>$points_per_questions),
				array('id'=>$question->quiz_question_id)
			);
		}
		$util->insert(
			QuizController::$queryUpdateQuizScores,
			[
				'newMaxPoints'=>$max_points,
				'oldMaxPoints'=>$old_max_points,
				'quizId'=>$quiz_id
			]
		);

		if(isset($input->recalculate)){
			$util = Utility::getInstance();
			$classes = $util->fetch(QuizController::$queryGetQuizClasses,['quizId'=>$quiz_id]);
			$classCtrl = GradebookController::getClassCtrl();
			foreach($classes as $class){
				$classId = $class['id'];
				$users = $classCtrl->getUsers($classId);
				if($input->recalculate=='now'){
					foreach($users['students'] as $student){
						GradebookController::_recalculate($student['id'],null,$classId);
					}
				}else{
					foreach($users['students'] as $student){
						GradebookController::_setRecalculateGradebook($classId,$student['id']);
					}
				}
			}

		}

		exit('done');
	}

	public static $queryGetCourseInfo = <<<SQL
	SELECT courses.departmentid,departments.organizationid
	FROM courses
	JOIN departments on courses.departmentid = departments.id
	WHERE courses.id = :courseId
SQL;

}




function main($user_id,$request){

	$response = new \stdClass();
	$response->user_id   = $user_id;
	$response->action = $request['action'];
	$test = new Test($user_id);

	if($response->action=='create-for') $response = $test->create_for($request['id'],$response);

	else if($response->action=='rename') $response = $test->rename($request['id'],$response);

	else if($response->action=='details') $response = $test->details($request['id'],$response);

	else if($response->action=='get-by-org') $response = $test->get_all_by_org_id($request['id'],$response);

	else if($response->action=='all') $response = $test->get_all($response);

	else if($response->action=='get-by-course') $response = $test->get_all_by_course_id($request['id'],$response);

	else if($response->action=='clone-quiz') $response = $test->clone_quiz($response);

	else if($response->action=='make-private') $response = $test->make_private($response,$request['id'],$request);

	else if($response->action=='make-survey') $response = $test->make_survey($response,$request['id'],$request);

	else if($response->action=='set-keep-highest') $response = $test->set_keep_highest($response,$request['id'],$request);

	else if($response->action=='set-sort-mode') $response = $test->set_sort_mode($response,$request['id'],$request);

    else if($response->action=='set-questions-per-page') $response = $test->set_questions_per_page($response,$request['id'],$request);

	else if($response->action=='random-quiz') $response = $test->random_quiz($response,$test,$request);

	else if($response->action=='quiz-list') $response = $test->get_quiz_list($request['search'],$response);

	else if($response->action=='delete') $response = $test->remove($request['id'],$response);

	else if($response->action=='spread') $response = $test->spread($request,get_input());

	else if($response->action=='question-positions') $response = $test->questionPositions($request,get_input());

	else if($response->action=='advanced-settings') $response = $test->saveAdvancedSettings($request['id'],get_input());

	header('Content-Type: application/json');
	echo json_encode($response);
	exit;
}

$user_id = is_valid_user($_SESSION);
if(!$user_id){
	// @TODO: respond with uniform "must-log-in" or "invalid-access" error
	exit();
}

$request  = array();
if(preg_match('/\/(.+)\/([a-z\-]+)(?:\/(\d+))?/', $_SERVER['REQUEST_URI'], $request)) {
	$request['service']=$request[1];
	$request['action'] = $request[2];
	$request['id']     = intval(@$request[3]);
}

if($request['service']=='service.testbank.test') main($user_id,$request);

function return_alltests(){
	$testSQL = new TestSQL();
	$result = $testSQL->get_all_tests();
	$allTests =  array();
	if($result && count($result) > 0) {
		foreach($result as $row) {
		$allTests[] = $row;
		}
	}
	return $allTests;
}