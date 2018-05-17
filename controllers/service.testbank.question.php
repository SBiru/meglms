<?php
use English3\Controller\GradebookController;
use English3\Controller\QuestionController;
use English3\Controller\QuizzesAndQuestions\Questions\QuestionFactory;
use English3\Controller\Utility;
require_once('usertools/multipart.php');
require_once('sql.php');
require_once('_utils.php');
function generateRandomString($length = 10)
{
    $characters       = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $charactersLength = strlen($characters);
    $randomString     = '';
    for ($i = 0; $i < $length; $i++) {
        $randomString .= $characters[rand(0, $charactersLength - 1)];
    }
    return $randomString;
}
function createPropertiesFromInput($data){
    $properties = new \English3\Controller\QuizzesAndQuestions\Questions\QuestionProperties();
    $properties->extra = $data->extra;
    $properties->options = $data->options;
    $properties->prompt = $data->prompt;
    $properties->solution = $data->solution;
    return $properties;
}
function addQuestionToBankAndTest($bank_id,$test_id,$question_id,$points=1){
    global $DB;
    $lastPosition = \English3\Controller\QuizzesAndQuestions\Banks\BankController::_getLastQuestionPosition($bank_id);
    $lastPosition++;
    $query = "INSERT INTO `bank_questions` SET `bank_id`={$bank_id}, `question_id`={$question_id}, `position`={$lastPosition}";
    $DB->mysqli->query($query);
    $questionTags = new \English3\Controller\QuizzesAndQuestions\QuestionTags\QuestionTagsDB();
    $tags = $questionTags->assignCustomTagFromBankId($bank_id,$question_id);
    if (isset($test_id)) {
        $lastPosition = \English3\Controller\QuizController::_getLastQuestionPosition($bank_id);
        $lastPosition++;
        $query = "INSERT INTO `quiz_questions` SET `quiz_id`={$test_id}, `question_id`={$question_id},points={$points}, `position`={$lastPosition}";
        $DB->mysqli->query($query);
    }
    return $tags;
}
global $PATHS, $DB;

if (isset($_SESSION['USER']) && isset($_SESSION['USER']['LOGGED_IN']) && isset($_SESSION['USER']['ID']) && $_SESSION['USER']['ID'] > 0 && $_SESSION['USER']['LOGGED_IN'] == true) {
    
    $user_id  = intval($_SESSION['USER']['ID']);
    $action   = '';
    $response = new \stdClass();
    
    $request = array();
    if (preg_match('/\/.+\/([a-z\-]+)\/(\d+)/', $_SERVER['REQUEST_URI'], $request)) {
        $request['action'] = $request[1];
        $request['id']     = intval($request[2]);
    }
    
    $response->user_id = $user_id;
    $response->action  = $request['action'];
    
    $POST       = file_get_contents('php://input');
    $data       = json_decode($POST);
    $max_points = isset($data->max_points) ? $data->max_points : 1;
    /*
    Golabs 9th of April 2015
    Adding in multiple question for klose
    */
    if ($request['action'] == 'create-klose') {


        if (isset($data->test_id) && is_numeric($data->test_id)) {
            $response->test_id = $data->test_id;
        }
        $response->questionsresponse = array();



        $bank_id                     = check_bank($DB, $data);
        if ($bank_id > 0) {
            $sql_question_vars = array();
            $length            = count($data->questions);
            for ($i = 0; $i < $length; $i++) {
                $response->questionsresponse[$i]               = new \stdClass();
                $response->questionsresponse[$i]->prompt       = $data->questions[$i]->title;
                $response->questionsresponse[$i]->questionhtml = $data->questions[$i]->questionhtml;

                if ($data->type === 'multipartquestion'){
                $response->questionsresponse[$i]->type = 'multipart';
            }else{
                $response->questionsresponse[$i]->type         = 'klosequestions';
                }

                if ($data->type === 'multipartquestion'){
                    $single = '&#39;';
                    $double = '&#34;';
                    $data->questions[$i]->studentview = preg_replace('@\'@xsi',$single,$data->questions[$i]->studentview);
                    $data->questions[$i]->studentview = preg_replace('@\"@xsi',$double,$data->questions[$i]->studentview);

                    $data->questions[$i]->questionhtml = preg_replace('@\'@xsi',$single,$data->questions[$i]->questionhtml);
                    $data->questions[$i]->questionhtml = preg_replace('@\"@xsi',$double,$data->questions[$i]->questionhtml);  

                    foreach ($data->questions[$i]->answers as $key => $answer) {    
                    $data->questions[$i]->answers->$key = preg_replace('@\'@xsi',$single,$data->questions[$i]->answers->$key);
                    $data->questions[$i]->answers->$key = preg_replace('@\"@xsi',$double    ,$data->questions[$i]->answers->$key);
                    }

                }
                
                $data->questions[$i]->questionhtml             = addslashes($data->questions[$i]->questionhtml);
                $data->questions[$i]->studentview              = addslashes($data->questions[$i]->studentview);
                if(isset($data->questions[$i]->img)){
                $data->questions[$i]->img                      = addslashes($data->questions[$i]->img);
            }

                if (isset($data->questions[$i]->htmlSafeprompt)) {
                    unset($data->questions[$i]->htmlSafeprompt);
                }

                $sql_question_vars['extra']      = json_encode($data->questions[$i]);
                $sql_question_vars['prompt']     = $data->questions[$i]->title;
                $sql_question_vars['type']       = $response->questionsresponse[$i]->type;
                $sql_question_vars['max_points'] = $max_points;
                $sql_question_vars['class_id'] = \English3\Controller\ClassesController::_getFromCourseId($request['id'])['id'];

                $question_id                     = insertquestion($DB, $sql_question_vars, $user_id);
                
                if ($question_id === 0) {
                    exit('ERROR');
                }
                
                $response->questionsresponse[$i]->id = $question_id;
                
                $response->tags = banksquizes($DB, $bank_id, $question_id, $data);
            }
            header('Content-Type: application/json');
            $response->kloseQuestions = 1;
            echo json_encode($response);
            exit;
        }
    }

    elseif ($request['action'] == 'page-break') {
        $POST = file_get_contents('php://input');
        $data = json_decode($POST);
        
        $query  = "UPDATE questions set pagebreak = " . $data->pagebreak . " WHERE id = '" . $data->question_id . "'";
        $result = $DB->mysqli->query($query);
        echo $result;
        exit;
    }
    elseif ($request['action'] == 'multipartquestion') {
  if (isset($data->bank_id)) {
            $bank_id = $data->bank_id;
        } else {
            $bank_id = check_bank($DB, $data);
        }
        
        if (isset($data->test_id) && is_numeric($data->test_id)) {
            $response->test_id = $data->test_id;
        }        
        if ($bank_id > 0) {
            
            $sql_question_vars['prompt']     = trim($data->prompt);
            $sql_question_vars['extra']     = trim($data->extra);
            $sql_question_vars['type']       = 'multipart';
            $sql_question_vars['max_points'] = $max_points;
            $sql_question_vars['class_id'] = \English3\Controller\ClassesController::_getFromCourseId($request['id'])['id'];
        }
        $multipart = new multipartPrepare;
        $multipart->is_teacher = 1;
        $multipart->questionLifter($sql_question_vars['extra'],$question_id );
        if(isset($multipart->answers)){
            foreach($multipart->answers as $key=>$value){
                if(count($value)==0){
                    returnData(['error'=>'missing_correct_answer']);
                }
            }

        }
        $question_id = insertquestion($DB, $sql_question_vars, $user_id);

        $response->tags = banksquizes($DB, $bank_id, $question_id, $data);
       


       if ($question_id === 0) {
                exit('ERROR');
            }
            
            $response->id           = $question_id;
            $response->prompt       = $sql_question_vars['prompt'];
            $response->extra        = $multipart->question;
            $response->type         = 'multipart';
            $response->max_points   = $max_points;

            header('Content-Type: application/json');
            echo json_encode($response);
            exit;

    }
    elseif ($request['action'] == 'word-matching') {
        
        if (isset($data->bank_id)) {
            $bank_id = $data->bank_id;
        } else {
            $bank_id = check_bank($DB, $data);
        }
        
        if (isset($data->test_id) && is_numeric($data->test_id)) {
            $response->test_id = $data->test_id;
        }
        if ($bank_id > 0) {
            
            $sql_question_vars['extra']      = $DB->mysqli->real_escape_string(json_encode($data->wordMatching));
            $sql_question_vars['prompt']     = $data->prompt;
            $sql_question_vars['type']       = $data->type;
            $sql_question_vars['max_points'] = $max_points;
            $sql_question_vars['class_id'] = \English3\Controller\ClassesController::_getFromCourseId($request['id'])['id'];
            
            $question_id = insertquestion($DB, $sql_question_vars, $user_id);
            
            if ($question_id === 0) {
                exit('ERROR');
            }
            
            $response->tags = banksquizes($DB, $bank_id, $question_id, $data);
            $a = preg_replace('/(<[^>]*)(?<![\\\|>])(")([^>]*>)/','$1\\"$3',json_encode($data->wordMatching));
            $extra = json_encode($data->wordMatching);
            while($extra!=$a){
                $extra=$a;
                $a = preg_replace('/(<[^>]*)(?<![\\\|>])(")([^>]*>)/','$1\\"$3',$extra);
            }
            $extra = json_decode(preg_replace('/\r\n|\r|\n/','',$extra));
            $response->wordMatching = $extra;
            $response->id           = $question_id;
            $response->prompt       = $sql_question_vars['prompt'];
            $response->bank_id = $data->bank_id;
            
            header('Content-Type: application/json');
            echo json_encode($response);
            exit;
        }
        exit('ERROR');
        
    }
    elseif ($request['action'] == 'create-for') {
        
        $course_id = $request['id'];
        
        $POST       = file_get_contents('php://input');
        $data       = json_decode($POST);
        $max_points = isset($data->max_points) ? $data->max_points : 1;
        $bank_id    = isset($data->bank_id) ? intval($data->bank_id) : 0;
        $response->course_id = $course_id;
        $response->bank_id   = $bank_id;
        
        //We are not assigning banks to a course for now
        if ( /* $course_id > 0 */ true) {
            
            if ($bank_id > 0) {
                
                if (isset($data->test_id) && is_numeric($data->test_id)) {
                    $test_id           = intval($data->test_id);
                    $response->test_id = $test_id;
                }
                
                // @TODO: user permission checks on all queries
                // 1) make sure the course and the bank id line up
                //We are not assigning banks to a course for now
                $query  = "SELECT * FROM `banks` WHERE `banks`.`id`={$bank_id} LIMIT 1";
                $result = $DB->mysqli->query($query);
                
                if ($result && $result->num_rows == 1) {
                    $properties = createPropertiesFromInput($data);
                    $questionDB = QuestionFactory::createDBFromTypeWithProperties($data->type,$properties);
                    if(!is_null($questionDB)){
                        try{
                            $id = $questionDB->save();
                            $response->id = $id;
                            $response->tags = addQuestionToBankAndTest($bank_id,$test_id,$id,@$data->max_points);
                        }catch(\English3\Controller\QuizzesAndQuestions\Questions\QuestionDBException $e){
                            $response->error = $e->getMessage();
                            $response->show_error=true;
                        }

                    }else{
                        createquestion($data,$response,$max_points,$user_id,$bank_id,$test_id,$course_id);
                    }

                } else {
                    $response->error = 'Error in accessing this Bank. [DB-MISALIGN]';
                }
            } else {
                $response->error = 'Must provide a valid Bank';
            }
        } else {
            $response->error = 'Must provide a valid Course id.';
        }
    }
    else if ($request['action'] == 'delete') {
        $data           = json_decode(file_get_contents('php://input'));
        if(!$data->quizz_id){
            $data->quizz_id = preg_replace('/\D+/', '', $data->url);
        }


        $util = new Utility();
        if ($data->bankortest === 'test') {
            //are we deleting a random group of questions?
            if(intval($data->random)){
                $util->reader->delete('quiz_questions',['id'=>$data->quiz_question_id]);
            }else{
                $query = "delete from quiz_questions where quiz_id='" . $data->quizz_id . "' and question_id='" . $data->id . "';";
                $DB->mysqli->query($query);
            }

        } else {
            $query = "delete from quiz_questions where question_id='" . $data->id . "';";
            $DB->mysqli->query($query);
            $query = "delete from question_options where question_id='" . $data->id . "';";
            $DB->mysqli->query($query);
            $query = "delete from quiz_responses where question_id='" . $data->id . "';";
            $DB->mysqli->query($query);
            $query = "delete from questions where id='" . $data->id . "';";
            $DB->mysqli->query($query);
            $query = "delete from bank_questions where question_id='" . $data->id . "';";
            $DB->mysqli->query($query);
        }
        exit(''.$data->id);
    }

    else if ($request['action'] == 'update') {
        /*
         * Golabs Updating our question based on question id.
         * We are going to follow create code with just a few improvements.
         *
         */
        $data = json_decode(file_get_contents('php://input'));
        $max_points = isset($data->max_points) ? $data->max_points : 1;
        $properties = createPropertiesFromInput($data);
        $properties->id = $data->id;
        $questionDB = QuestionFactory::createDBFromTypeWithProperties($data->type,$properties);
        if(!is_null($questionDB)){
            try{
                $questionDB->save();
            }catch(\English3\Controller\QuizzesAndQuestions\Questions\QuestionDBException $e){
                $response->error = $e->getMessage();
                $response->show_error=true;
            }
        }
        else{
        //Matching
        if ($data->type == 'matching') {
            $sql_question_vars['solution'] = array();
            $arrayoptions = array();
            $data->matching = $data->imgdata->matching;
            foreach ($data->matching->imagesCordinates as $key => $current) {
                $current->name = generateRandomString(10);
                $current->img = $data->matching->matchedImage->savedname;
                $sql_question_vars['solution'][] = $current->name;
                $arrayoptions[] = $current->name;
                # code...
            }
            $sql_question_vars['solution'] = json_encode($sql_question_vars['solution']);
            $sql_question_vars['options'] = '';
            $sql_question_vars['prompt'] = $DB->mysqli->real_escape_string($data->prompt);
            $sql_question_vars['feedback'] = '';
            $sql_question_vars['extra'] = json_encode($data->imgdata);
            $sql_question_vars['max_points'] = $max_points;

            $data->options = $arrayoptions;
            $query = "UPDATE questions SET extra = '" . $sql_question_vars['extra'] . "', prompt = '" . $data->prompt . "' WHERE id = '" . $data->id . "'";
            $DB->mysqli->query($query);
            $query = "delete from question_options where question_id = '" . $data->id . "'";
            $DB->mysqli->query($query);
            $solution = explode(',', preg_replace('/\"|\[|\]/xsi', '', $data->solution));

            foreach ($solution as $x => $text) {
                $query = "insert into question_options set question_id = '" . $data->id . "',text= '" . preg_replace('/\"/', '', $text) . "',sort_order= '" . $x . "'";
                $DB->mysqli->query($query);
            }
            exit(1);
        }
        //multipart
        if ($data->type == 'multipart') {
            $sql_question_vars['extra'] = $DB->mysqli->real_escape_string($data->extra);
            $sql_question_vars['prompt'] = $DB->mysqli->real_escape_string($data->prompt);
            $multipart = new multipartPrepare;
            $multipart->is_teacher = 1;
            $multipart->questionLifter($data->extra, $data->id);
            if (isset($multipart->answers)) {
                foreach ($multipart->answers as $key => $value) {
                    if (count($value) == 0) {
                        returnData(['error' => "This question has no correct answer. Make sure you have an '=' in the beginning of any of the options"]);
                    }
                }

            }
            $response->type = 'multipart';
            $response->id = $data->id;
            $response->extra = $multipart->question;
        }
        //multiple
        if ($data->type == 'multiple') {
            $solution = array();
            foreach($data->resultvalue as $key=>$value){
                $solution[]=$key;
            }
            $data->solution = implode(',', $solution);
        }
        //multiple
        if ($data->type == 'wordmatching') {
            $sql_question_vars['extra'] = $DB->mysqli->real_escape_string($data->extra);
            $sql_question_vars['enable_distractors'] = isset($data->enable_distractors) ? boolval($data->enable_distractors) : 0;
        }
        if ($data->type == 'truefalse') {
            $sql_question_vars['extra'] = $DB->mysqli->real_escape_string(json_encode($data->extra));
        }

        $sql_question_vars['prompt'] = $DB->mysqli->real_escape_string($data->prompt);
        $sql_question_vars['options'] = $DB->mysqli->real_escape_string(json_encode($data->options_array));
        if($data->extra && !$sql_question_vars['extra']){
            $sql_question_vars['extra'] = $DB->mysqli->real_escape_string($data->extra);
        }


        if (!isset($data->solution)) {
            $data->solution = '';
        }
        $sql_question_vars['solution'] = $DB->mysqli->real_escape_string(($data->solution));

        if (!isset($data->feedback)) {
            $data->feedback = '';
        }
        $sql_question_vars['feedback'] = $DB->mysqli->real_escape_string($data->feedback);
        $sql_question_vars['max_points'] = $max_points;
        $sql_question_vars['modified_by'] = intval($user_id);

        foreach (array(
                     'prompt'
                 ) as $name) {
            if (strlen($name) <= 0) {
                $errors[$name] = 'Must provide a ' . $name;
            }
        }

        /*
        Golabs 24/02/2015
        Updating our options in question_options
        */

        if (isset($data->essay)) {
            $essay_data = $DB->mysqli->real_escape_string($data->essay);
            $query = "UPDATE  question_options SET
      text = '" . $data->essay . "'
      WHERE
      question_id = '" . $data->id . "'
      AND
      sort_order  = '0'
      LIMIT 1";
            $DB->mysqli->query($query);
        } else {
            $options = $data->options_array;
            $sql = new BaseSQL();
            $sql->query_noResult("delete from question_options where question_id={$data->id}");

            foreach ($options as $i => $value) {
                $value = $DB->mysqli->real_escape_string($value);
                $query = "INSERT into question_options (question_id,text,sort_order) values ({$data->id},'{$value}',{$i})";
                $DB->mysqli->query($query);
            }
        }
        $util = new Utility();
        if ($data->quiz_question_id) {
            $util->insert(
                QuestionController::$queryUpdateQuizResponseScores,
                [
                    'quizQuestionId' => $data->quiz_question_id,
                    'newPoints' => $data->max_points
                ]
            );
            $util->reader->update(
                'quiz_questions',
                ['points' => $data->max_points],
                ['id' => $data->quiz_question_id]
            );

            if (isset($data->recalculate)) {
                $classId = $util->fetchOne(QuestionController::$queryGetClassId, ['quizQuestionId' => $data->quiz_question_id]);
                $classCtrl = GradebookController::getClassCtrl();
                $users = $classCtrl->getUsers($classId);
                if ($data->recalculate == 'now') {
                    foreach ($users['students'] as $student) {
                        GradebookController::_recalculate($student['id'], null, $classId);
                    }
                } else {
                    foreach ($users['students'] as $student) {
                        GradebookController::_setRecalculateGradebook($classId, $student['id']);
                    }
                }
            }

            unset($sql_question_vars['max_points']);
        }


        $query = "UPDATE  questions SET ";
        foreach ($sql_question_vars as $name => $value) {
            $query .= "`{$name}`='{$value}',";
        }
        //Removing last comma of end
        $query = substr_replace($query, "", -1);
        $query .= " WHERE id = '" . $data->id . "' LIMIT 1";
        }
        if(isset($data->bankChanged)){
        if ($data->bankChanged == 1){
            $query = "update bank_questions set bank_id = '".$data->bank_id."' where question_id = '".$data->id."'";
        }
    }
        $DB->mysqli->query($query);
    }
    else if ($request['action'] == 'placequestions') {
        $POST = file_get_contents('php://input');
        $data = json_decode($POST);
        //    print_r($request);
        //    print_r($data);
        $lastPosition = \English3\Controller\QuizController::_getLastQuestionPosition($request['id']);
        foreach ($data->question_ids as $i => $question_id) {
            $lastPosition++;
            $DB->mysqli->query("INSERT INTO quiz_questions SET quiz_id = '" . $request['id'] . "',  question_id = '$question_id', position = '$lastPosition'");
        }
        
        /*
        Golabs 11/02/2015
        We are just going to make a change from placequestions to details and call our script
        service.testbank.test.php since we are all frieinds ie user is logged in we can do this.
        Golabs 23/02/2015
        Modified to relfect changes in the target file service.test.bank.php
        */
        $pattern = '/\/(\d+)$/';
        preg_match($pattern, $_SERVER['REQUEST_URI'], $matches);
        if (isset($matches[1])) {
            $_SERVER['REQUEST_URI'] = '/service.testbank.test/details/' . $matches[1];
        }
        include 'service.testbank.test.php';
        exit;
    }
    
    
    header('Content-Type: application/json');
    echo json_encode($response);
} else {
    
    // @TODO: respond with uniform "must-log-in" or "invalid-access" error
}

function check_bank($DB, $data)
{
    $bank_id = isset($data->bank_id) ? intval($data->bank_id) : 0;
    if ($bank_id > 0) {
        $query  = "SELECT * FROM `banks` WHERE `banks`.`id`={$bank_id} LIMIT 1";
        $result = $DB->mysqli->query($query);
        if ($result) {
            return $bank_id;
        }
    }
    return 0;
}

function insertquestion($DB, $sql_question_vars, $user_id)
{
    $query = "INSERT INTO `questions` SET ";
    foreach ($sql_question_vars as $name => $value) {
        $query .= "`{$name}`='{$value}', ";
    }
    $query .= " `modified_by`={$user_id}";
    $DB->mysqli->query($query) or exit('ERROR' . $query);
    if ($DB->mysqli->affected_rows == 1) {
        return $DB->mysqli->insert_id;
    }
    return 0;
}

function banksquizes($DB, $bank_id, $question_id, $data)
{
    if (isset($data->test_id)) {
        $test_id = intval($data->test_id);
    }
    $lastPosition = \English3\Controller\QuizzesAndQuestions\Banks\BankController::_getLastQuestionPosition($bank_id);
    $lastPosition++;
    $query = "INSERT INTO `bank_questions` SET `bank_id`={$bank_id}, `question_id`={$question_id}, `position`={$lastPosition}";
    $DB->mysqli->query($query);
    $questionTags = new \English3\Controller\QuizzesAndQuestions\QuestionTags\QuestionTagsDB();
    $tags = $questionTags->assignCustomTagFromBankId($bank_id,$question_id);
    if (isset($test_id)) {
        $lastPosition = \English3\Controller\QuizController::_getLastQuestionPosition($test_id);
        $lastPosition++;
        $query = "INSERT INTO `quiz_questions` SET `quiz_id`={$test_id}, `question_id`={$question_id}, `position`={$lastPosition}";
        $DB->mysqli->query($query);
    }
    return $tags;
}
function createquestion(&$data,&$response,$max_points,$user_id,$bank_id,$test_id,$course_id){
    global $DB;

    // @TODO: validate objective id with course_id
    $objective_id = (isset($data->objective_id) && is_numeric($data->objective_id)) ? intval($data->objective_id) : 0;
    $solution = $data->solution;
    // 2) validate that we have enough information to create a question in the system
    $errors            = array();
    $sql_question_vars = array();

    //Golabs 9/02/21015 Titles are not really used so we will just put someting in....
    $data->title = 'title';


    if ($data->type == 'matching') {
        //$data->prompt = 'Drag and Drop to Match';
        $data->solution = 0;
    }


    if (isset($data->prompt))
        $data->prompt = trim($data->prompt);
    if (isset($data->prompt) && strlen($data->prompt) > 0)
        $sql_question_vars['prompt'] = $DB->mysqli->real_escape_string($data->prompt);
    else
        $errors['prompt'] = 'Must provide a prompt';


    // feedback [optional]
    if (isset($data->feedback))
        $data->feedback = trim($data->feedback);
    if (isset($data->feedback) && strlen($data->feedback) > 0)
        $sql_question_vars['feedback'] = $DB->mysqli->real_escape_string($data->feedback);

    $question_type = $data->type;

    $sql_question_vars['type'] = $question_type;
    $sql_question_vars['class_id'] = \English3\Controller\ClassesController::_getFromCourseId($course_id);

    if (($question_type == 'oneword') || ($question_type == 'essay') || ($question_type == 'studentvideoresponse')) {


        if ($question_type == 'oneword') {
            $data->options_array = array(
                $data->onewordanswer
            );
        } else {
            $data->options_array = array(
                $data->solution
            );

        }
        $data->options  = $data->options_array;
        $data->solution = 0;
    }


    // normalizes data and verifies alignment;
    // we need a linear, sequential integer number [0,1,2,3,4,...]
    // options [required] [array]
    if (isset($data->options_array) && count($data->options_array)) {

        $options = $data->options_array;
    } else if (isset($data->options) && gettype($data->options) == 'object') {

        // @TODO: convert to array
    }

    // solution [required] [int]
    if (isset($data->solution))
        $solution = trim($data->solution);
    else
        $errors['solution'] = 'Must provide a solution';

    $arrayoptions = array();

    foreach ($data->options as $option) {
        $arrayoptions[] = $option;
    }

    if (empty($errors)) {

        $sql_question_vars['options']  = $DB->mysqli->real_escape_string(json_encode($arrayoptions));
        $sql_question_vars['solution'] = trim($solution);
    }

    if (!isset($data->feedback)) {
        $data->feedback = '';
    }


    if ($data->type == 'matching') {
        $sql_question_vars['solution'] = array();
        $arrayoptions                  = array();
        foreach ($data->matching->imagesCordinates as $key => $current) {
            $current->name                   = generateRandomString(10);
            $current->img                    = $data->matching->matchedImage->savedname;
            $sql_question_vars['solution'][] = $current->name;
            $arrayoptions[]                  = $current->name;
            # code...
        }
        $sql_question_vars['solution'] = json_encode($sql_question_vars['solution']);
        $sql_question_vars['options']  = '';
        $sql_question_vars['prompt']   = $data->prompt;
        $sql_question_vars['feedback'] = '';
        $sql_question_vars['extra']    = json_encode($data);
        $sql_question_vars['enable_distractors'] = isset($data->enable_distractors)?boolval($data->enable_distractors):0;

        $data->options = $arrayoptions;

    }
    if ($data->type == 'truefalse'){
        $sql_question_vars['extra']    = json_encode($data->extra);

    }
    $sql_question_vars['max_points'] = $max_points;
    if($data->extra && !$sql_question_vars['extra']){
        $sql_question_vars['extra'] = $DB->mysqli->real_escape_string($data->extra);
    }
    if (empty($errors)) {
        $query = "INSERT INTO `questions` SET ";
        foreach ($sql_question_vars as $name => $value) {
            if ($name == 'options')
                continue;
            $query .= "`{$name}`='{$value}', ";
        }
        $query .= " `modified_by`={$user_id}";
        $DB->mysqli->query($query) or exit('ERROR' . $query);

        if ($DB->mysqli->affected_rows == 1) {
            $response->question = new \stdClass();
            $response->question->id = $DB->mysqli->insert_id;
            $response->question->title = $data->title;
            $response->question->prompt = $data->prompt;
            $response->question->type = $question_type;
            $response->question->options = $arrayoptions; // json_decode'd already
            $response->question->solution = $solution;
            $response->question->max_points = $max_points;
            $response->question->extra = $data->extra;
            $response->question->feedback = $data->feedback;
            $response->question->modified_by = $user_id;
            $response->question->position = 0; // @TODO; use the real `bank_questions`.`position`

            if ($data->type == 'matching') {
                $response->question->extra = $sql_question_vars['extra'];
            }

            $currentSortOrder = 0;
            foreach ($data->options as $option) {
                $optionsQuery = "INSERT INTO `question_options` SET question_id = {$response->question->id}, `text`='{$option}', `sort_order`={$currentSortOrder}";
                $currentSortOrder = $currentSortOrder + 1;
                $DB->mysqli->query($optionsQuery);
            }


            $response->tags = addQuestionToBankAndTest($bank_id,$test_id,$response->question->id,$max_points);
        } else {
            $response->error = 'Could not create new Question. [DB-ERROR]';
        }
    }


    if (!empty($errors)) {

        $response->error = implode('; ', $errors);
    }

}