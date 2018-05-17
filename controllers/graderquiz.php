<?php
require_once('usertools/orm.php');
require_once('_utils.php');
require_once('sql.php');
require_once('usertools/multipart.php');
use English3\Controller\ClassesController;
use English3\Controller\GradebookController;
use English3\Controller\PageController;
use English3\Controller\PostsController;
use English3\Controller\QuizController;
use English3\Controller\QuizzesAndQuestions\Questions\QuestionFactory;
use English3\Controller\QuizzesAndQuestions\Questions\QuestionProperties;
use English3\Controller\Utility;

function prepareStudent($user){
    return [
        'user_id'=>$user->user_id,
        'fname'=>$user->fname,
        'lname'=>$user->lname,
        'name'=>\English3\Controller\Grader\GraderActivity::prepareUserName($user->fname,$user->lname),
        'email'=>$user->email
    ];
}
function query($page_id,$input,$echo=true){
    global $app;
    $reader = $app['dbs']['mysql_read'];
    $gradequizSQL = new GradeQuizSQL();
    $util = new Utility();
    $isArchive = (isset($input['is_archive']) && $input['is_archive']=="true");
    if(!isset($input['studentId'])){


        $groupId = isset($input['groupId'])?$input['groupId']:'';
        $showWithdrawnStudents = $input['showWithdrawnStudents'];

        if($isArchive){
            $users = $gradequizSQL->get_quizzes($page_id,false,$groupId,$showWithdrawnStudents);
        }
        else{
            $users = $gradequizSQL->get_quizzes($page_id,true,$groupId,$showWithdrawnStudents);
        }
    }
    else{
        $users = $gradequizSQL->get_quiz_for_student($page_id,$input['studentId']);
    }

    $quizzes = array();
    $students = array();
    foreach($users as $user){
        Utility::addToObjectIfNotExists($user->user_id,prepareStudent($user),$students);
        $userQuizData = $util->fetchRow(QuizController::$queryGetUserQuizData,['userId'=>$user->user_id,'quizId'=>$page_id]);
        if(boolval($user->keep_highest_score) && !is_null($userQuizData['highest_attempt_id'])){
            $attempt_id = $userQuizData['highest_attempt_id'];
            $user->keep_highest_score = true;
        }
        else{
            $attempt_id = $userQuizData['attempt_id'];
        }
        $user->attempt_id =$attempt_id;
        $quiz = array(
            'user'=>$user,
            'attempts'=>QuizController::_getUserAttempts($page_id,$user->user_id,!$isArchive),
            'attempt_id'=>$attempt_id
        );

        foreach($quiz['attempts'] as $i=>&$attempt){
            if($isArchive && $i === count($quiz['attempts'])-1 &&  QuizController::canLeaveAndReturn($page_id) &&
                !boolval($userQuizData['is_finished'])){
                unset($quiz['attempts'][$i]);
                continue;
            }
            if($attempt_id==$attempt['attempt_id']){

                $attempt['active']=true;

                if(boolval($user->keep_highest_score)){
                    $attempt['highest']=true;
                }

            }
        }

        $quizzes[]=$quiz;
    }
    $data = new \stdClass();
    $data->quizzes = $quizzes;
    $data->students = array_values($students);
    $data->pageInfo = PageController::_get($reader,$page_id,true,$_SESSION['USER']['ID']);
    if($echo){
        jsonResponse($data);
    }else{
        return $data;
    }

}
function save($response_id,$score,$score_id,$total_score,$quiz_id,$question_id,$student_id,$feedback,$quiz_question_id,$attempt_id){
    global $DB;
    $gradequizSQL = new GradeQuizSQL();
    $sql = new BaseSQL();
    $orm = new PmOrm($_SESSION,$DB);
    $page = $sql->fetch_one("SELECT quiz_id as pageId from quiz_responses where quiz_response_id={$response_id}");
    $util = new Utility();
    if(!$orm->am_i_active_for_page($page->pageId)){
        Utility::buildHTTPError(
            'User Does Not Have Permission To Grade On This Page.',403
        );
    }

    $success = $gradequizSQL->query_noResult("update quiz_responses set is_correct = {$score} where quiz_response_id = {$response_id}");
    if($success){
        $total_score = QuizController::_getQuizCurrentPoints($page->pageId,$student_id);
        $userQuizData = $util->fetchRow(QuizController::$queryGetUserQuizData,['userId'=>$student_id,'quizId'=>$page->pageId]);
        $highest_score = floatval($userQuizData['highest_score']);
        $params=[
            'score'=>$total_score
        ];
        if($total_score>$highest_score){
            $params['highest_score']=$total_score;
            $params['highest_attempt_id']=$userQuizData['attempt_id'];
        }
        $success =  $util->reader->update(
            'quiz_scores',
            $params,
            ['id'=>$score_id]
        );
    }
    $util->reader->delete('scores_overrides',['userId'=>$student_id,'pageId'=>$page->id]);
    if($feedback && $feedback!=""){
        QuizController::_sendQuestionFeedBack(
            $question_id,
            $quiz_id,
            $student_id,
            $feedback,
            $quiz_question_id,
            $attempt_id
        );
    }
    GradebookController::_recalculate($student_id,$page->pageId);
    jsonResponse(['question_id'=>$question_id]);
}
function update_score($response_id,$score,$score_id,$total_score){
    global $DB;
    $gradequizSQL = new GradeQuizSQL();
    $sql = new BaseSQL();
    $orm = new PmOrm($_SESSION,$DB);
    $page = $sql->fetch_one("SELECT quiz_id as pageId from quiz_responses where quiz_response_id={$response_id}");

    if(!$orm->am_i_active_for_page($page->pageId)){
        jsonResponse(array('message'=>'User Does Not Have Permission To Grade On This Page.'));
    }

    $success = $gradequizSQL->query_noResult("update quiz_responses set is_correct = {$score} where quiz_response_id = {$response_id}");
    if($success){
        $success = $gradequizSQL->query_noResult("update quiz_scores set score = {$total_score} where id = {$score_id}");
        if($success){
            returnData(['message'=>'successfull']);
        }
    }

    exit();
}
function deleteAttempt($pageId,$userId,$attemptId,$keepHighest){
    $util = new Utility();
    $classId = ClassesController::_getFromPage($util->reader,$pageId);
    if(!$util->checkTeacher($classId,null,false)) {
        throw new Exception("You don't have permission to delete this attempt");
    }
    $util->reader->delete('quiz_responses',
        [
            'user_id'=>$userId,
            'quiz_id'=>$pageId,
            'attempt_id'=>$attemptId
        ]
    );
    $userQuizData = $util->fetchRow(QuizController::$queryGetUserQuizData,['userId'=>$userId,'quizId'=>$pageId]);
    $params = array(
        'attempts_completed'=>intval($userQuizData['attempts_completed'])-1
    );
    if($userQuizData['attempt_id']==$attemptId){
        $attempts = QuizController::_getUserAttempts($pageId,$userId);
        if(count($attempts)){
            $lastAttempt = end($attempts);
            $params['attempt_id']=$lastAttempt['attempt_id'];
            $params['score']=$lastAttempt['score'];
            $params['submitted']=$lastAttempt['submitted'];
        }else{
            $params['attempt_id']=0;
            $params['score']=0;
            $params['is_finished']=false;
        }

    }
    if($keepHighest){
        $highestAttempt = QuizController::_getUserHighestAttempt($pageId,$userId);
        $params['highest_score']=$highestAttempt['score'];
        $params['highest_attempt_id']=$highestAttempt['attempt_id'];
    }
    $util->reader->update(
        'quiz_scores',
        $params,
        [
            'user_id'=>$userId,
            'quiz_id'=>$pageId
        ]
    );
    GradebookController::_recalculate($userId,$pageId);
    returnData($params);

}
function getAttempt($pageId,$userId,$quizId,$attemptId,$isGraderView,$echo=false){
    if($isGraderView){
        $classId = ClassesController::_getFromPage(Utility::getInstance()->reader,$pageId);
        if(!Utility::getInstance()->checkTeacher($classId,null,false)){
            if($echo){
                returnData(['Must be a teacher']);
            }
            else{
                return 'Must be a teacher';
            }
        }
    }
    $gradequizSQL = new GradeQuizSQL();
    $questions=array_values($gradequizSQL->user_responses($userId,$quizId,$pageId,$attemptId));

    global $DB;
    $orm = new PmOrm($_SESSION,$DB);


    if (count($questions) > 0){
        foreach($questions as &$question){
            $questionObj = QuestionFactory::createFromTypeWithProperties(
                $question->type,
                new QuestionProperties(json_decode(json_encode($question),true))
            );
            $question->options = $gradequizSQL->question_options($question->question_id);
            if($questionObj){
                $questionObj->properties->options=QuizController::getQuestionOptions(Utility::getInstance()->reader,$question->id);
                $questionObj->grader->setStudentResponse(json_decode($question->response));
                $question = (object) array_merge((array) $question, (array) $questionObj->grader->prepareForDisplay());
            }
            if ($question->type == 'multipart'){
                $multipart = new multipartPrepare;
                $multipart->is_response = 1;
                $multipart->user_id = $userId;

                if($orm->am_i_teacher()){
                    $multipart->teacher_view = 1;
                }


                $response = preg_replace('@^\{|\}$@xsi','',$question->response);
                $response = html_entity_decode($response);
                $response =explode('","', $response);
                foreach ($response as $key => $value) {
                    $response[$key] = preg_replace('@.*?\:|"|\}$|\.$@xsi','',trim($response[$key]));
                }
                $multipart->response = $response;
                //print_r($response);

                //$multipart->response = preg_replace('@.*?\:|"|\}$@xsi','',$question->response);

                //echo $multipart->response."\n\n\n";


                if ($question->extra == ''){

                    $multipart->questionLifter($question->prompt,$question->question_id );
                    $question->prompt = $multipart->question;
                    $question->extra = $question->prompt;

                }else{
                    $multipart->questionLifter($question->extra,$question->question_id );
                    $question->studentResponses = $multipart->question;

                }

            }




            if($question->teacher_id){
                $question->teacher = array(
                    'fname'=>$question->teacher_fname,
                    'lname'=>$question->teacher_lname,
                    'user_id'=>$question->teacher_id,
                    'email'=>$question->teacher_email
                );
                $question->feedback = $question->qFeedback;
                $question->feedback_date = date_format(
                    new DateTime($question->feedback_date),"M d, Y. H:i:s");
            }

        }
    }
    if($echo){
        returnData(['questions'=>$questions]);
    }
    else{
        return $questions;
    }

}
function getAllNeedingGrade($classId,$courseId=null){
    $postCtrl = new PostsController(Utility::getInstance()->reader);
    if($courseId && !$classId){
        $classId = ClassesController::_getFromCourseId($courseId);
    }
    $quizzesNeedingGrade =Utility::getInstance()->fetch($postCtrl->queryQuizzesNeedingGrade('class'),['classId'=>$classId]);
    $quizzes=array();

    foreach($quizzesNeedingGrade as $quiz){
        Utility::addToObjectIfNotExists($quiz['pageId'],query($quiz['pageId'],[],false),$quizzes);

    }
    $needingGrade = array();
    foreach($quizzes as $quiz){
        foreach($quiz->quizzes as $userQuiz){
            $lastAttempt = null;
            if(count($userQuiz['attempts'])){
                $lastAttempt = $userQuiz['attempts'][count($userQuiz['attempts'])-1]['submitted'];
            }

            $needingGrade[]=[
                'pageInfo'=>$quiz->pageInfo,
                'quiz'=>$userQuiz,
                'created'=>$lastAttempt,
                'type'=>'quiz'
            ];
        }

    }
    returnData(['needingGrade'=>$needingGrade]);
}



function main($uri){
    $user_id = is_valid_user($_SESSION,true);
    $action = get_action('/graderquiz/',$uri);
    $input = get_input();
    if($action=='update-score') update_score($input->response_id,$input->score,$input->score_id,$input->totalScore);
    if($action=='save-question') save(
        $input->response_id,$input->score,$input->score_id,$input->totalScore,
        $input->quiz_id,$input->question_id,$input->user_id,$input->feedback,$input->quiz_question_id,
        $input->attempt_id
    );
    if($action=='attempt') getAttempt($_REQUEST['pageId'],$_REQUEST['userId'],$_REQUEST['quizId'],$_REQUEST['attemptId'],$_REQUEST['isGraderView'],true);
    if($action=='delete-attempt') deleteAttempt($input->pageId,$input->userId,$input->attemptId,$input->keepHighest);
    if($action=='all-needing-grade') getAllNeedingGrade($_REQUEST['classId'],$_REQUEST['courseId']);
    if($action=='recalculate-quizzes') recalculateQuizzes($_REQUEST['pages']);

    else if (intval($action)>0) {
        query($action,$_REQUEST);
    }
}


$uri = strtok($_SERVER['REQUEST_URI'], '?');

if (substr($uri,0,12)=='/graderquiz/'){

    main($uri);
}
?>