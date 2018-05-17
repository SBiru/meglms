<?php

global $PATHS, $DB,$app;
$reader = $app['dbs']['mysql_read'];
require_once('sql.php');
require_once('usertools/orm.php');
require_once('usertools/multipart.php');

use English3\Controller\ClassesController;
use English3\Controller\GradebookController;
use English3\Controller\PageController;
use English3\Controller\QuestionController;
use English3\Controller\QuizController;
use English3\Controller\QuizzesAndQuestions\Questions\QuestionFactory;
use English3\Controller\SurveyController;
use English3\Controller\Utility;

$util = Utility::getInstance();
if (isset($_SESSION['USER']) && isset($_SESSION['USER']['LOGGED_IN']) && isset($_SESSION['USER']['ID']) && $_SESSION['USER']['ID'] > 0 && $_SESSION['USER']['LOGGED_IN'] == true) {
    $uri = strtok($_SERVER['REQUEST_URI'], '?');

    $uri = str_replace('/quiz/', '', $uri);

    $uri = strtok($uri, '/');

    $user_id = intval($_SESSION['USER']['ID']);

    function respond($DB, $uri, $user_id, $insert,$is_submitting=false)
    {
        global $app;
        $check = '@\&\w+\;|<.*?>|\W+@xsi';
        $reader = $app['dbs']['mysql_read'];
        $testsSQL = new TestSQL();
        if (gettype($insert) == 'integer') {
            $json_input   = file_get_contents('php://input');
            $input        = json_decode($json_input);
            $quiz_id      = intval($input->quiz_id);
            $response     = $input->response;
            $question_id  = intval($input->question_id);
            $quizQuestionId = intval($input->quizQuestionId);
            $fromRandomGroup = boolval($input->fromRandomGroup);
            $randomquizId = intval($input->randomquiz_id);
            $is_submitting = boolval(@$input->isFinishing);
            $attempt_id = $input->attempt_id;
            $questions = $input->questions;
        } else {
            $quiz_id     = intval($insert->quiz_id);
            $response    = $insert->response;
            $question_id = intval($insert->question_id);
            $quizQuestionId = intval($insert->questionQuestionId);
            $questions = $insert->questions;
            $attempt_id = $insert->attempt_id;
        }

        $data = new \stdClass();
        $page = PageController::_get($reader,$quiz_id);
        $canReturn = $page['quiz']['canReturn'];
        $unitId =$page['unit']['id'];
        $orm = new PmOrm($_SESSION,$DB);



        // Now query for class ID
        $queryClass  = "SELECT user_classes.classid,pages.quiz_id,pages.layout
                                       FROM `user_classes`
                                       JOIN classes ON (user_classes.classid=classes.id)
                                       JOIN units ON (classes.courseid=units.courseid)
                                       JOIN pages ON (pages.unitid=units.id)
                                       WHERE user_classes.userid={$user_id} and user_classes.is_observer=0 AND pages.id={$quiz_id} LIMIT 1";
        $resultClass = $DB->mysqli->query($queryClass);
        if ($resultClass && $resultClass->num_rows == 1) {
            $rowClass = $resultClass->fetch_object();
            $class_id = $rowClass->classid;
            if ($rowClass->quiz_id > 0)
                $randomquizId = $rowClass->quiz_id;

            $page_type = $rowClass->layout;
        } else {
            if(!($orm->am_i_super_user() || $orm->am_i_organization_admin())){
                //TODO: error message
                exit();
            }
            $class_id = 0;
        }

        // We query for the current quiz_score to see if it is non-existent and needs to be added.
        $scoresQuery  = "SELECT id, score FROM quiz_scores WHERE user_id='{$user_id}' AND quiz_id='{$quiz_id}' LIMIT 1";
        $scoresResult = $DB->mysqli->query($scoresQuery);

        // If there is already a scores object for this quiz for this user, do nothing
        if ( $scoresResult && $scoresResult->num_rows <= 0 && !SurveyController::_get($reader,$quiz_id)) {
            if($canReturn || $is_submitting){
                $max_points = QuizController::_getQuizMaxPoints($quiz_id);

                $submitted         = date("Y-m-d H:i:s");

                $scoresUpdateQuery = "INSERT INTO quiz_scores (user_id, quiz_id, score, class_id, submitted,max_points,randomquiz_id) VALUES ('{$user_id}', '{$quiz_id}', '0', '{$class_id}', '{$submitted}','{$max_points}','{$randomquizId}');";
                $data->newScore    = 0;
                $DB->mysqli->query($scoresUpdateQuery);
                $util = new Utility();
                $util->reader->delete('scores_overrides',['userId'=>$user_id,'pageId'=>$quiz_id]);
                GradebookController::_recalculate($user_id,$quiz_id);
            }
        }

        /*
        Golabs 03/02/2015 using question_options table instead of optiions
        */
        $query  = "select * from question_options where question_id = '$question_id' order by sort_order asc";
        $result = $DB->mysqli->query($query);
        if ($result->num_rows > 0) {
            while ($row = $result->fetch_object()) {
                $explode[] = $row->text;
            }
        }
        /*
        Golabs  20/01/2015
        we need to check the question and the answer this was not done right...
        */
        $query  = "select solution,type,max_points from questions where id = '$question_id'";
        $result = $DB->mysqli->query($query);
        $row    = $result->fetch_object();
        $solition = $row->solution;
        $max_points = $row->max_points;

        /*
        Golabs 24/08/2015
        Testing if question is part of a random group with its own points....
        */
        $query = "select points from pages,quiz_questions where pages.id = '".$quiz_id."' AND quiz_questions.quiz_id = pages.quiz_id AND quiz_questions.random > 0";
        $result = $DB->mysqli->query($query);
        if ($result->num_rows > 0) {
            $testRandomerow   = $result->fetch_object();
            if($testRandomerow->points){
                $row->max_points = $testRandomerow->points;
            }

        }

        //Golabs 24/08/2015
        //We are checking for any specific max points for this question if not we will leave as question default point from the question table.
        $query = "select quiz_questions.points,questions.max_points,quiz_questions.id from pages,quiz_questions,questions where  pages.id = '".$quiz_id."' AND quiz_questions.quiz_id = pages.quiz_id AND quiz_questions.question_id = '".$question_id."' AND questions.id = quiz_questions.question_id";
        $result = $DB->mysqli->query($query);

            if ($result->num_rows > 0) {
            $testPointsResult = $result->fetch_object();

            $quizQuestionId = $testPointsResult->id;
            if (floatval(@$testPointsResult->points)){
                $row->max_points = $testPointsResult->points;
            }else if(floatval($testPointsResult->max_points)){
                $row->max_points = $testPointsResult->max_points;
            }else{
                $row->max_points=1;
            }
        }else{
            $points = Utility::getInstance()->fetchRow("select quiz_questions.points,questions.max_points from questions,pages,quiz_questions where pages.quiz_id = quiz_questions.quiz_id and quiz_questions.id = :quizQuestionId and questions.id = :questionId",['quizQuestionId'=>$quizQuestionId,'questionId'=>$question_id]);
            $row->max_points=$points['points'];
            $row->max_points = $row->max_points?:$points['max_points'];
            $row->max_points = $row->max_points?:1;
        }


        if (!preg_match('/\d/',$row->max_points)){
            $row->max_points = $max_points;
        }
        $grade_percent=0;
        /*
        Golabs 09/03/2015
        If we have a single word we will split the result by a comma and see if any are correct.
        */
        if ($row->type == 'oneword') {
            $compareone = excludePrepareSameValues(explode(',',trim(strtolower($response))));
            $comparetwo = $explode[0]==''?'':excludePrepareSameValues(explode(',',trim(strtolower($explode[0]))));
            $isCorrect = false;
            foreach ($compareone as $one) {
                foreach ($comparetwo as $two) {
                    if (trim($one) == trim($two)){
                        $isCorrect=true;
                    }
                }
            }
            $grade_percent=intval($isCorrect);
            $is_correct = $isCorrect?round(floatval($row->max_points),1):0;
            $fully_correct = $isCorrect;
        }
        elseif ($row->type == 'multipart') {
            $tmp = new \stdClass();
            $query = "select prompt,extra from questions where id ={$response->question_id}";
            $result = $DB->mysqli->query($query);
            $row2 = $result->fetch_object();
            $question_id = $response->question_id;
            $worth=$row->max_points;

            if (preg_match('@\w@', $row2->extra)) {
                $NumberExpectedResults = substr_count(preg_replace('@<\w.*?>|<\/\w+>@xsi', '', $row2->extra), '__{');
            } else {
                $NumberExpectedResults = substr_count(preg_replace('@<\w.*?>|<\/\w+>@xsi', '', $row2->prompt), '__{');
            }

            $real = new multipartPrepare;
            $real->answers = new \stdClass();
            if (!preg_match('@\w@', $row2->extra)) {
                $real->questionLifter($row->prompt, $response->question_id);
            } else {
                $real->questionLifter($row2->extra, $response->question_id);
            }

            $counttmp = 0;
            $nomultiple = new \stdClass();

            //Preparing for : in answer numbers only at the moment
            //It is assume that : is number can be either side ie plus or minus
            foreach ($real->answers as $key => $answers) {
                foreach ($answers as $k => $value) {
                    if (preg_match('@\d\:\d@', $answers[$k])) {
                        list($left, $right) = explode(':', $answers[$k]);
                        $real->answers[$key][$k] = $left;
//                            $real->answers[$key][] = floatval($left)+floatval($right);
//                            $real->answers[$key][] = floatval($left)-floatval($right);
                        $real->useTolerance = true;
                        $real->tolerance = floatval($right);
                    }
                }

                //Adding in a zero at end incase answer example is 6.4 and student puts in 6.40
                if (preg_match('@\d\.\d@', $real->answers[$key][0])) {
                    $real->answers[$key][] = $real->answers[$key][0] . '0';
                }
            }

            foreach ($real->answers as $key => $answers) {
                foreach ($answers as $k => $value) {
                    $value = preg_replace('@\s+|[~=]|\&\w+\;|\W[,.]+@s', '', $value);
//                            if (isset($extra->multipartRadio)){
//                                 $value = preg_replace('@\W||\&\w+\;@s', '', $value);
//                            }
                    if (isset($response->answers->$key)) {
                        $response->answers->$key = preg_replace('@\s+|\W+[,.]@s', '', $response->answers->$key);

                        //if responses have commas and answers..
                        if ((preg_match('/,/', $response->answers->$key)) && ((preg_match('/,/', $value))) && !$real->containsHtml) {

                            $explodeValue = explode(',', strtolower(trim($value)));
                            $countValue = count($explodeValue);
                            $countCorrect = 0;
                            $explodeAnswers = explode(',', strtolower(trim($response->answers->$key)));
                            //echo '$max_points'.$max_points."\n";
                            //echo '$worth == '.$worth."\n";
                            //echo $countValue;
                            //exit;
                            if (preg_match('@\w@', $max_points)) {
                                $worth = $max_points / $countValue;
                            } else {
                                $worth = $worth / $countValue;
                            }

                            foreach ($explodeValue as $x => $valueTest) {
                                foreach ($explodeAnswers as $y => $answersTest) {
                                    if ($valueTest == $answersTest) {
                                        $counttmp++;
                                        $countCorrect++;
                                        if ($countCorrect == $countValue) {
                                            break 3;
                                        }
                                    }
                                }
                            }
                        } //if responses have commas only..
                        elseif ((preg_match('/,/', $response->answers->$key)) && (!(preg_match('/,/', $value))) && !$real->containsHtml) {
                            $explode = explode(',', strtolower(trim($response->answers->$key)));
                            foreach ($explode as $i => $singlevalue) {
                                if ($singlevalue == strtolower(trim($value))) {
                                    $counttmp++;
                                    break 2;//Breaking out of nested loop
                                }
                            }
                        } else {
                            if (strtolower(trim($response->answers->$key)) == strtolower(trim($value)) ||
                                ($real->useTolerance && (floatval($response->answers->$key) <= floatval($value + $real->tolerance) &&
                                        floatval($response->answers->$key) >= floatval($value - $real->tolerance))
                                )
                            ) {
                                $counttmp++;
                                break;
                            }
                        }
                    }
                }
            }

            //We are breaking down our question according to
            //The number of Exected results. look at $NumberExpectedResults above.
            $fullworth = $worth;
            $worth = $worth*1.0 / $NumberExpectedResults;

            if ($counttmp > 0) {
                $is_correct = $counttmp * $worth;

                $grade_percent=$counttmp*1.0/$NumberExpectedResults;
                if($grade_percent>0 && $grade_percent<1){
                    $data->isCorrectPartially=true;
                }
                if (($fullworth == $is_correct) || ($countValue == $counttmp) || ($NumberExpectedResults == $counttmp)) {
                    $fully_correct = 1;
                } else {
                    $fully_correct = 0;
                }

            } else {
                $is_correct = 0;
            }
            $replace = array(
                "'"
            );
            $with = array(
                '&#39;'
            );
            foreach ($response->answers as &$answer) {
                foreach ($replace as $i => $value) {
                    $answer = preg_replace('@' . $replace[$i] . '@xsi', $with[$i], $answer);
                }
            }
            $response = json_encode($response->answers);
        }
        elseif ($row->type == 'wordmatching') {
            $query          = "select extra from questions where id ={$response->question_id}";
            $result         = $DB->mysqli->query($query);
            $questionRow            = $result->fetch_object();
            $a = preg_replace('/(<[^>]*)(?<![\\\|>])(")([^>]*>)/','$1\\"$3',$questionRow->extra);
            while($questionRow->extra!=$a){
                $questionRow->extra=$a;
                $a = preg_replace('/(<[^>]*)(?<![\\\|>])(")([^>]*>)/','$1\\"$3',$questionRow->extra);
            }
            $tmp            = json_decode(preg_replace('@\r\n|\r|\n@xsi','',$questionRow->extra));
            $count          = 0;
            $questionnumber = 0;
            $totalPairs = count((array)$tmp);
            $worth = $max_points/$totalPairs;
            foreach ($tmp as $group) {
                $questionnumber += 1;
                if (isset($response->answers))
                    foreach ($response->answers as $i) {
                        $test = $i->name1 . $i->name2;
                        if (trim($test) == $group->tmpanswers ||
                            ($group->target==$i->name2 && array_search(trim($i->name1),$group->matches)!==false)
                        ) {
                            $count += 1;
                            break;
                        }
                    }
            }

            if ($count > 0 ) {
                $is_correct = $worth * $count;
                $grade_percent = $count*1.0/$totalPairs;
                if ($is_correct == $max_points){
                    $fully_correct = 1;
                }else{
                    $fully_correct = 0;
                }

            } else {
                $is_correct = 0;
            }

            if (isset($response->answers))
                $response = json_encode($response->answers);
            if (!isset($response)){
                $response = '';
            }
        }
        elseif ($row->type == 'essay') {
            $is_correct = $response!=""?-1:0;

        } elseif ($row->type == 'studentvideoresponse') {
            $is_correct = -1;
        } elseif ($row->type == 'multiple') {
            $compareone = explode(',',trim(strtolower($response)));
            $comparetwo = explode(',',trim(strtolower($row->solution)));
            $worth = $row->max_points/count($comparetwo);
            $countcorrect = 0;
            $count = 0;
            foreach ($compareone as $one) {
                foreach ($comparetwo as $two) {
                    if (trim($one) == trim($two)){
                        $countcorrect +=floatval($worth);
                        $count+=1;
                    }
                }
            }
            if ($countcorrect > 0){
                if (count($comparetwo) == $count) {
                    $fully_correct = 1;
                } else {
                    $fully_correct = 0;
                }
            }
            $is_correct = round($countcorrect,1);
            $grade_percent = $countcorrect*1.0/count($comparetwo);
        } elseif ($row->type == 'blank') {
            if (QuestionController::_isBlankCorrect($question_id,$response)) {
                $is_correct = floatval($row->max_points);
                $grade_percent = 1;
            } else {
                $is_correct = 0;
            }
        } elseif (($row->type == 'single') || ($row->type == 'truefalse')) {
            if ($solition == $response) {
                $is_correct = $row->max_points;
                $grade_percent = 1;
            } else {
                $is_correct = 0;
            }
        }
        else if(gettype($response)==='string') {
            $test1 = strtolower(preg_replace($check, '', $response));
            $test2 = strtolower(preg_replace($check, '', $explode[$row->solution]));
            if ($test1 == $test2) {
                $grade_percent = 1;
                $is_correct = 1;
            } else {
                $is_correct = 0;
            }
        }
        // Query to see if there is an existing response from this user for this question.
        $currentResponseQuery          = "SELECT quiz_response_id, is_correct, response FROM quiz_responses WHERE quiz_id={$quiz_id} AND user_id={$user_id} AND question_id={$question_id} and attempt_id = '{$attempt_id}'";
        $responseResult                = $DB->mysqli->query($currentResponseQuery);
        $response                      = $DB->mysqli->real_escape_string($response);


        $question = QuestionFactory::createFromTypeWithId($row->type,$question_id);
        if(!is_null($question)){
            $question->grader->setStudentResponse($input->response);
            $grade_percent = $question->grader->getGradePercent();
            $is_correct = $grade_percent;
            if(round($is_correct,10)==1){
                $is_correct=$row->max_points;
                $data->isCorrent=true;
            }else if($is_correct>0){

                $is_correct*=$row->max_points;
                $data->isCorrectPartially=true;
            }
            $response = $question->grader->formatResponse();
        }

        // If there is already a response for this question, we replace it.
        if($canReturn || $is_submitting) {



            if ($responseResult && $responseResult->num_rows == 1) {
                $dataPostQuery = "UPDATE quiz_responses SET response = '{$response}', is_correct = '{$is_correct}', grade_percent = '{$grade_percent}'
                          WHERE quiz_id={$quiz_id} AND user_id= {$user_id} AND question_id={$question_id} and attempt_id = '{$attempt_id}'";
            } else {
                // Create a new quiz response object for this question

                $dataPostQuery = "INSERT INTO quiz_responses (quiz_id, user_id, question_id, response,is_correct,quiz_question_id,attempt_id,grade_percent)
                          VALUES ('{$quiz_id}', '{$user_id}', '{$question_id}', '{$response}', '{$is_correct}','{$quizQuestionId}','{$attempt_id}','{$grade_percent}')";
            }
        }
        if($dataPostQuery){
            $DB->mysqli->query($dataPostQuery);
        }


        $data->is_correct = $is_correct;
        $data->newScore   = getScore($DB, $user_id, $quiz_id);
        if(isset($fully_correct)){
            $data->fully_correct = $fully_correct;
        }

        if (gettype($insert) == 'integer') {
            print json_encode($data);
            exit;
        }
        return $data;
    }

    if ($uri == 'respond') {

        respond($DB, $uri, $user_id, 1);
    }
    /*
    Golabs 27/04/2015
    Setting up our video for saving the path.
    to the answer system.
    */

    else if ($uri == 'save-video') {

        $json_input = file_get_contents('php://input');
        $input      = json_decode($json_input);
        $data       = new \stdClass();
        $mysql_videofilename     = isset($input->videoFileNameReady)?$input->videoFileNameReady:'';
        $mysql_thumbnailfilename = isset($input->videoThumbnailFileNameReady)?$input->videoThumbnailFileNameReady:'';
        $sanitized_video_file_name = str_replace('/', '', $input->videoFileName);
        $sanitized_video_file_name = str_replace('.flv', '', $sanitized_video_file_name);
        $sanitized_video_file_name = str_replace('.', '', $sanitized_video_file_name);
        $sanitized_video_file_name = preg_replace('/[^a-z0-9\-]/', '', $sanitized_video_file_name);
        $sanitized_video_file_name .= '.flv';
        $source_file               = $PATHS->wowza_content . $sanitized_video_file_name;
        $destination_file          = $PATHS->app_path . $PATHS->base_site_public_path . "uservids/" . $sanitized_video_file_name;
        $sanitized_video_file_name = str_replace('.flv', '.mp4', $sanitized_video_file_name);

        /*
         ***FOR LOCAL DEVELOPMENT HOSTS****
         Golabs if testing in local machine
         Add in $PATHS->local_only = 1; in the  config.php
         You will need video of sample.mp4 and image.jpg
         */
        if($mysql_videofilename==''){
            if (isset($PATHS->local_only)) {
                $samplevid     = $PATHS->app_path . $PATHS->base_site_public_path . "uservids/sample.mp4";
                $mp4_file_name = str_replace('.flv', '.mp4', $destination_file);
                copy($samplevid, $mp4_file_name) or die('No smaple.mp4 found in ' . $samplevid);

                $sampleimg = $PATHS->app_path . $PATHS->base_site_public_path . "uservidthumbnails/sample.jpg";
                $thumbfile = $PATHS->app_path . $PATHS->base_site_public_path . "uservidthumbnails/" . str_replace('.mp4', '.jpg', $sanitized_video_file_name);
                copy($sampleimg, $thumbfile) or die('No smaple.mp4 found in ' . $thumbfile);
                $data->message = 'successful';
            } else {

                if (rename($source_file, $destination_file)) {
                    $data->message             = 'successful';
                    $sanitized_video_file_name = str_replace('.flv', '.mp4', $sanitized_video_file_name);
                    $mp4_file_name             = $destination_file;
                    $mp4_file_name             = str_replace('.flv', '.mp4', $destination_file);
                    $thumbfile                 = $PATHS->app_path . $PATHS->base_site_public_path . "uservidthumbnails/" . str_replace('.mp4', '.jpg', $sanitized_video_file_name);

                    //Creating thumbnail image start
                    shell_exec("/usr/bin/ffmpeg -i " . $destination_file . " -deinterlace -an -ss 1 -t 00:00:10 -r 1 -y -vcodec mjpeg -f mjpeg $thumbfile 2>&1");
                    //converting video to mpg4 start
                    $mp4convert = "/usr/bin/ffmpeg -i " . $destination_file . " -vcodec libx264 -crf 23 -preset medium -vsync 1 -r 25 -acodec aac -strict -2 -b:a 64k  -ar 44100 -ac 1 " . $mp4_file_name . " > /dev/null 2>/dev/null &";
                    shell_exec($mp4convert);
                }
            }
            //converting video to mpg4 start

            $mysql_videofilename     = $DB->mysqli->real_escape_string("/public/uservids/" . $sanitized_video_file_name);
            $mysql_thumbnailfilename = $DB->mysqli->real_escape_string("/public/uservidthumbnails/" . str_replace('.mp4', '.jpg', $sanitized_video_file_name));

        }else{
            $data->message = 'successful';
        }

        $data->videofilename     = $mysql_videofilename;
        $data->thumbnailfilename = $mysql_thumbnailfilename;

        header('Content-Type: application/json');
        print json_encode($data);
    }

    /*
    Golabs 27/03/2015
    we want to crop our image so that
    we can drag and drop to the html easy.
    */
    else if ($uri == 'crop') {

        $width  = $_REQUEST['width'];
        $height = $_REQUEST['height'];
        $x      = $_REQUEST['x'];
        $y      = $_REQUEST['y'];


        if ($_REQUEST['imgtext'] == '0') {
            $img = $PATHS->app_path . '/public/useruploads/' . $_REQUEST['img'];


            switch (strtolower(pathinfo($img, PATHINFO_EXTENSION))) {
                case 'png':
                    $im = imagecreatefrompng($img);
                    break;
                case 'jpg':
                    $im = imagecreatefromjpeg($img);
                case 'jpeg':
                    $im = imagecreatefromjpeg($img);
                    break;
                case 'bmp':
                    $im = imagecreatefromwbmp($img);
                    break;
                case 'gif':
                    $im = imagecreatefromgif($img);
                    break;
            }

            $image = imagecrop($im, array(
                'x' => $x,
                'y' => $y,
                'width' => $width,
                'height' => $height
            ));
        } else {

            $textw  = 2 * $width;
            $height = 30;
            $_REQUEST['selectcolortext'] = 'matchingtrans';


            $text = trim($_REQUEST['text']);

            if (isset($_REQUEST['longest'])) {
                if ($_REQUEST['longest'] < 15) {
                    $_REQUEST['longest'] = 15;
                }
                $multiply = 9;
                $image = @imagecreate(intval($_REQUEST['longest'] * $multiply), $height) or die("Cannot Initialize new GD image stream");
                $textw = $_REQUEST['longest'];

            } else {

                if (!preg_match('@\d@',$textw)){
                    $textw = 100;
                    $height= 50;
                    $text = 'X';
                    $redx = 1;
                }
                $image = @imagecreate($textw, $height) or die("Cannot Initialize new GD image stream");
                $multiply = 1;
            }

            switch ($_REQUEST['selectcolortext']) {
                case 'matchingblank':
                    $background = imagecolorallocate($image, 255, 255, 255);
                    $color      = imagecolorallocate($image, 0, 0, 0);
                    break;
                case 'matchingtrans':
                    //$background = imagecolorallocate($image, 255, 0, 0);
                    $background = imagecolorallocatealpha($image, 200, 200, 200, 127);
                    if (isset($redx)){
                        $color      = imagecolorallocate($image, 255, 0, 0);
                    }
                    else{
                        $color      = imagecolorallocate($image, 0, 0, 0);
                    }
                    imagecolortransparent($image, $background);
                    break;
                case 'matchingrv':
                    $background = imagecolorallocate($image, 255, 0, 0);
                    $color      = imagecolorallocate($image, 255, 255, 255);
                    break;
                case 'matchingwb':
                    $background = imagecolorallocate($image, 0, 0, 0);
                    $color      = imagecolorallocate($image, 255, 255, 255);
                    break;
                case 'matchingyb':
                    $background = imagecolorallocate($image, 255, 255, 0);
                    $color      = imagecolorallocate($image, 0, 0, 0);
                    break;
                default:
                    $background = imagecolorallocate($image, 255, 255, 255);
                    $color      = imagecolorallocate($image, 0, 0, 0);
            }


            $x = (intval(($textw * $multiply) / 2));

            //echo $textw.'<br>';
            //echo $x.'<br>';
            //echo strlen($text).'<br>';
            //echo $multiply.'<br>';

            $x = $x - (strlen($text) * $multiply) / 2;

            //exit($x.'    '.$text);


            imagestring($image, 16, $x, ($height / 2) - 6, $text, $color);
        }
        imagepng($image);
        header("Content-Type: image/png");
        // Output the image

        // Free up memory
        imagedestroy($image);
        exit;
    } else if ($uri == 'finalize') {


        /*
        Golabs 20/01/2015
        re-did this so the when finalize the final score is updated
        */

        $json_input = file_get_contents('php://input');
        $input      = json_decode($json_input);


        $data       = new \stdClass();
        $quiz_id    = intval($input->quiz_id);
        $attempt_id = intval($input->attempt_id);
        $extrains = array();

        $util = new Utility();
        $pageInfo = PageController::_get($util->reader,$quiz_id);
        $unitId = $pageInfo['unit']['id'];
        $util->reader->delete(
            'quiz_feedback',
            [
                'quiz_id'=>$pageInfo['quiz']['id'],
                'user_id'=>$_SESSION['USER']['ID']
            ]

        );


        $orm= new PmOrm($_SESSION,$DB);
        if(!$orm->am_i_active_for_page($quiz_id)){
            //TODO:error message
            exit();
        }



        /*
        Golabs 19/03/2015
        */
        $c = 0;
        if (count($input->extra > 0)) {
            foreach ($input->extra as $extra) {

                if(isset($worth)){unset($worth);}
                // Getting question points value Start
                $query = "select quiz_questions.points,questions.max_points,quiz_questions.id from pages,quiz_questions,questions where  pages.id = '".$input->quiz_id."' AND quiz_questions.quiz_id = pages.quiz_id AND quiz_questions.question_id = '".$extra->question_id."' AND questions.id = quiz_questions.question_id";
                $testPoints  = $DB->mysqli->query($query);
                $testPointsResult     = $testPoints->fetch_object();
                $quizQuestionId = $testPointsResult->id;
                if ((preg_match('@\d@',$testPointsResult->points)) && ($testPointsResult->points > 0)){
                    $max_points = $testPointsResult->points;
                }else{
                    $max_points = $testPointsResult->max_points;
                }

                if (!preg_match('@\d@',$max_points)){
                    foreach ($input->questions as $i => $singlequestion) {
                        if ($singlequestion->id == $extra->question_id){
                            $worth = $singlequestion->maxPoints;
                            $max_points = $singlequestion->maxPoints;
                            break 1;
                        }
                    }
                }else{
                    $worth = $max_points;
                }

                // Getting question points value End

                $quizQuestionId = $extra->quizQuestionId;
                $question_id = $extra->question_id;

                if ($extra->type == 'essay') {
                    $respond_input              = new \stdClass();
                    if(isset($extra->uploadedFile)){
                        $extra->answer = json_encode(['text'=>$extra->answer,'file'=>$extra->uploadedFile]);
                    }
                    $respond_input->response    = $extra->answer;
                    $respond_input->quiz_id     = $quiz_id;
                    $respond_input->question_id = $extra->question_id;
                    $respond_input->quizQuestionId = $extra->quizQuestionId;
                    $respond_input->questions = $input->questions;
                    $respond_input->attempt_id = $attempt_id;
                    respond($DB, $uri, $user_id, $respond_input,true);
                } else if ($extra->type == 'studentvideoresponse') {
                    $videogroup                    = new \stdClass();
                    $videogroup->thumbnailfilename = $extra->thumbnailfilename;
                    $videogroup->videofilename     = $extra->videofilename;
                    $videogroup->video_comment     = $extra->video_comment;
                    $respond_input                 = new \stdClass();
                    $respond_input->response       = json_encode($videogroup);
                    $respond_input->quiz_id        = $quiz_id;
                    $respond_input->question_id    = $extra->question_id;
                    $respond_input->quizQuestionId = $extra->quizQuestionId;
                    $respond_input->questions = $input->questions;
                    $respond_input->attempt_id = $attempt_id;
                    respond($DB, $uri, $user_id, $respond_input,true);
                }
                /*
                Golabs 10/04/2015
                We have to get our extra from question and extract the correct answers
                to to a compare of the students answer we will do all correct = 1 or 0 if any wrong.

                */

                else if ($extra->type == 'multipart') {
                    $tmp     = new \stdClass();
                    $query   = "select prompt,extra from questions where id ={$extra->question_id}";
                    $result  = $DB->mysqli->query($query);
                    $row     = $result->fetch_object();
                    $question_id = $extra->question_id;

                    if (preg_match('@\w@',$row->extra)){
                        $NumberExpectedResults = substr_count(preg_replace('@<\w.*?>|<\/\w+>@xsi', '', $row->extra),'__{');
                    }
                    else{
                        $NumberExpectedResults = substr_count(preg_replace('@<\w.*?>|<\/\w+>@xsi', '', $row->prompt),'__{');
                    }

                    $real = new multipartPrepare;
                    $real->answers = new \stdClass();
                    if (!preg_match('@\w@',$row->extra)){
                        $real->questionLifter($row->prompt,$extra->question_id);
                    }else{
                        $real->questionLifter($row->extra,$extra->question_id);
                    }

                    $counttmp = 0;
                    $nomultiple = new \stdClass();

                    //Preparing for : in answer numbers only at the moment
                    //It is assume that : is number can be either side ie plus or minus
                    foreach ($real->answers as $key => $answers) {
                        foreach ($answers as $k => $value) {
                            if (preg_match('@\d\:\d@',$answers[$k])){
                                list($left,$right) = explode(':',$answers[$k]);
                                $real->answers[$key][$k] = $left;
//                            $real->answers[$key][] = floatval($left)+floatval($right);
//                            $real->answers[$key][] = floatval($left)-floatval($right);
                                $real->useTolerance = true;
                                $real->tolerance=floatval($right);
                            }
                        }

                        //Adding in a zero at end incase answer example is 6.4 and student puts in 6.40
                        if  (preg_match('@\d\.\d@',$real->answers[$key][0])){
                            $real->answers[$key][] = $real->answers[$key][0].'0';
                        }
                    }

                    foreach ($real->answers as $key => $answers) {
                        foreach ($answers as $k => $value) {
                            $value = preg_replace('@\s+|[~=]|\&\w+\;|\W[,.]+@s', '', $value);
//                            if (isset($extra->multipartRadio)){
//                                 $value = preg_replace('@\W||\&\w+\;@s', '', $value);
//                            }
                            if (isset($extra->answers->$key)){
                                $extra->answers->$key = preg_replace('@\s+|\W+[,.]@s', '', $extra->answers->$key);

                                //if responses have commas and answers..
                                if ((preg_match('/,/',$extra->answers->$key)) && ((preg_match('/,/',$value))) && !$real->containsHtml){

                                    $explodeValue = explode(',',strtolower(trim($value)));
                                    $countValue = count($explodeValue);
                                    $countCorrect = 0;
                                    $explodeAnswers =  explode(',',strtolower(trim($extra->answers->$key)));
                                    //echo '$max_points'.$max_points."\n";
                                    //echo '$worth == '.$worth."\n";
                                    //echo $countValue;
                                    //exit;
                                    if (preg_match('@\w@',$max_points)){
                                        $worth = $max_points/$countValue;
                                    }else{
                                        $worth = $worth/$countValue;
                                    }

                                    foreach ($explodeValue as $x => $valueTest) {
                                        foreach ($explodeAnswers as $y => $answersTest) {
                                            if ($valueTest == $answersTest){
                                                $counttmp++;
                                                $countCorrect++;
                                                if ($countCorrect == $countValue){
                                                    break 3;
                                                }
                                            }
                                        }
                                    }
                                }
                                //if responses have commas only..
                                elseif ((preg_match('/,/',$extra->answers->$key)) && (!(preg_match('/,/',$value))) && !$real->containsHtml){
                                    $explode = explode(',',strtolower(trim($extra->answers->$key)));
                                    foreach ($explode as $i => $singlevalue) {
                                        if ($singlevalue == strtolower(trim($value))){
                                            $counttmp++;
                                            break 2;//Breaking out of nested loop
                                        }
                                    }
                                }
                                else{
                                    if (strtolower(trim($extra->answers->$key)) == strtolower(trim($value))||
                                        ($real->useTolerance && (floatval($extra->answers->$key)<=floatval($value+$real->tolerance) &&
                                                floatval($extra->answers->$key)>=floatval($value-$real->tolerance))
                                        )
                                    ){
                                        $counttmp++;
                                        break;
                                    }
                                }
                            }
                        }
                    }

                    //We are breaking down our question according to
                    //The number of Exected results. look at $NumberExpectedResults above.
                    $fullworth = $worth;
                    $worth = $worth/$NumberExpectedResults;
                    //echo $counttmp.' == '.$countValue."\n";

                    //echo '$countValue ='.$countValue."\n";
                    //echo '$counttmp ='.$counttmp."\n";

                    if ($counttmp > 0){
                        $is_correct = $counttmp * $worth;

                        //echo '$worth ='.$worth."\n";
                        //echo '$counttmp ='.$counttmp."\n";
                        //echo '$countValue ='.$countValue."\n";
                        //echo '$NumberExpectedResults ='.$NumberExpectedResults."\n";
                        //echo '$question_id = '.$question_id."\n";
                        //echo $fullworth.' == '.$is_correct."\n\n";

                        if (($fullworth == $is_correct) || ($countValue == $counttmp) || ($NumberExpectedResults == $counttmp)){
                            $fully_correct = 1;
                        }else{
                            $fully_correct = 0;
                        }

                    }
                    else
                    {
                        $is_correct = 0;
                    }
                    $replace       = array(
                        "'"
                    );
                    $with = array(
                        '&#39;'
                    );
                    foreach($extra->answers as &$answer){
                        foreach ($replace as $i => $value) {
                            $answer = preg_replace('@' . $replace[$i] . '@xsi', $with[$i], $answer);
                        }
                    }
                    $response    =json_encode($extra->answers);


                    if(QuestionController::_getQuestionResponse($user_id,$quiz_id,$attempt_id,$question_id)){
                        $dataPostQuery      = "UPDATE quiz_responses SET response='{$response}',is_correct='{$is_correct}' WHERE user_id='{$user_id}' and quiz_id='{$quiz_id}' and question_id='{$question_id}' and attempt_id='{$attempt_id}'";
                    }else{
                        $dataPostQuery      = "INSERT INTO quiz_responses (quiz_id, user_id, question_id, response,is_correct,quiz_question_id,attempt_id) VALUES ('{$quiz_id}', '{$user_id}', '{$question_id}', '{$response}', '{$is_correct}','{$quizQuestionId}','{$attempt_id}')";
                    }
                    $DB->mysqli->query($dataPostQuery);
                    $extra->correct = $is_correct;
                    $extra->is_correct = $is_correct;
                    $extra->response = $extra->answers;
                    if (isset($fully_correct)){
                        $extra->fully_correct = $fully_correct;
                    }
                    $extrains[] = $extra;
                    $data->extra    = json_encode($extrains);

                }
                else if ($extra->type == 'wordmatching') {

                    $query          = "select extra from questions where id ={$extra->question_id}";
                    $result         = $DB->mysqli->query($query);
                    $row            = $result->fetch_object();
                    $a = preg_replace('/(<[^>]*)(?<![\\\|>])(")([^>]*>)/','$1\\"$3',$row->extra);
                    while($row->extra!=$a){
                        $row->extra=$a;
                        $a = preg_replace('/(<[^>]*)(?<![\\\|>])(")([^>]*>)/','$1\\"$3',$row->extra);
                    }
                    $tmp            = json_decode(preg_replace('@\r\n|\r|\n@xsi','',$row->extra));
                    $count          = 0;
                    $questionnumber = 0;
                    $worth = $worth/count(array_values(json_decode(json_encode(($tmp)),true)));
                    foreach ($tmp as $group) {
                        $questionnumber += 1;
                        if (isset($extra->answers))
                            foreach ($extra->answers as $i) {
                                $test = $i->name1 . $i->name2;
                                if (trim($test) == $group->tmpanswers ||
                                    ($group->target==$i->name2 && array_search(trim($i->name1),$group->matches)!==false)
                                ) {
                                    $count += 1;
                                    break;
                                }
                            }
                    }

                    if ($count > 0 ) {
                        $is_correct = $worth * $count;

                        if ($is_correct == $max_points){
                            $fully_correct = 1;
                        }else{
                            $fully_correct = 0;
                        }

                    } else {
                        $is_correct = 0;
                    }

                    if (isset($extra->answers))
                        $response = json_encode($extra->answers);
                    if (!isset($response)){
                        $response = '';
                    }
                    if(QuestionController::_getQuestionResponse($user_id,$quiz_id,$attempt_id,$question_id)){
                        $dataPostQuery      = "UPDATE quiz_responses SET response='{$response}',is_correct='{$is_correct}' WHERE user_id='{$user_id}' and quiz_id='{$quiz_id}' and question_id='{$question_id}' and attempt_id='{$attempt_id}'";
                    }else{
                        $dataPostQuery      = "INSERT INTO quiz_responses (quiz_id, user_id, question_id, response,is_correct,quiz_question_id,attempt_id) VALUES ('{$quiz_id}', '{$user_id}', '{$question_id}', '{$response}', '{$is_correct}','{$quizQuestionId}','{$attempt_id}')";
                    }
                    $DB->mysqli->query($dataPostQuery);
                    $extra->correct = $is_correct;
                    if(isset($fully_correct)){
                        $extra->fully_correct = $fully_correct;
                    }
                    $data->extra    = json_encode($input->extra);
                }

                /*
                Golabs 27/03/2015
                */
                else if ($extra->type == 'matching') {
                    $count = 0;
                    $worth = $max_points/count($extra->matching->imagesCordinates);
                    foreach ($extra->matching->imagesCordinates as $key => $cordinates) {
                        if (isset($cordinates->dropindex))
                            if ($key == $cordinates->dropindex) {
                                $count += 1;
                            }
                    }

                    if ($count > 0 ) {
                        $is_correct = $worth * $count;

                        if ($is_correct == $max_points){
                            $fully_correct = 1;
                        }else{
                            $fully_correct = 0;
                        }

                    } else {
                        $is_correct = 0;
                    }
                    if(isset($fully_correct)){
                        $extra->fully_correct = $fully_correct;
                    }

                    $extra->is_correct = $is_correct;

                    $response = json_encode($extra->matching->imagesCordinates);

                    if(QuestionController::_getQuestionResponse($user_id,$quiz_id,$attempt_id,$question_id)){
                        $dataPostQuery      = "UPDATE quiz_responses SET response='{$response}',is_correct='{$is_correct}' WHERE user_id='{$user_id}' and quiz_id='{$quiz_id}' and question_id='{$question_id}' and attempt_id='{$attempt_id}'";
                    }else{
                        $dataPostQuery      = "INSERT INTO quiz_responses (quiz_id, user_id, question_id, response,is_correct,quiz_question_id,attempt_id) VALUES ('{$quiz_id}', '{$user_id}', '{$question_id}', '{$response}', '{$is_correct}','{$quizQuestionId}','{$attempt_id}')";
                    }
                    $DB->mysqli->query($dataPostQuery);
                    $data->extra = json_encode($input->extra);
                }
            }
            if (isset($worth)){
                unset($worth);
            }
        }

        //Checking if the quiz is flagged as survey
        if(SurveyController::_get($reader,$quiz_id)){
            SurveyController::_finalize($reader,$quiz_id);
            exit();
        }
        $sql = new BaseSQL();
        $max = QuizController::_getQuizMaxPoints(QuizController::_getQuizFromPageId($quiz_id));


        if ($max) {
            $max_points = ",max_points={$max}";
        } else {
            $max_points = "";
        }

        if ($sql->fetch_one("SELECT id FROM quiz_scores WHERE quiz_id={$quiz_id} AND user_id={$user_id}")) {
            $finalizeQuery = "UPDATE quiz_scores SET is_finished = true {$max_points}  WHERE quiz_id={$quiz_id} AND user_id={$user_id}";
        } else {
            $finalizeQuery = "INSERT INTO quiz_scores SET is_finished=true {$max_points} ,attempts_completed=1,quiz_id={$quiz_id} ,user_id={$user_id},score=0";
        }

        $DB->mysqli->query($finalizeQuery);

        $score = getScore($DB, $user_id, $quiz_id);

        $data->newScore = round(floatval($score),2,PHP_ROUND_HALF_UP);
        $data->maxPoints = round(floatval(preg_replace('@(\.\d)\d+@','$1',$max)),0,PHP_ROUND_HALF_UP);

        updatequiz_scores($DB, $user_id, $quiz_id, $data->newScore) ;
        $util = new Utility();
        $util->reader->delete('scores_overrides',['userId'=>$user_id,'pageId'=>$quiz_id]);
        GradebookController::_recalculate($user_id,$quiz_id);
        //echo '$score = '.$score."\n";
        //echo '$max = '.$max."\n\n";
        //echo '$data->newScore = '.$data->newScore."\n";
        //echo '$data->maxPoints = '.$data->maxPoints."\n\n";


        //Correcting rounding issue if 100%
        if ($data->newScore >  $data->maxPoints){
            $data->newScore = $data->maxPoints;
        }

        /*
        Golabs 29/05/2015
        Searching for any responses that were not made
        and inserting a in-correct response we will use mysql to do the work for us...
        */
        $query = "INSERT INTO quiz_responses (quiz_id , user_id , question_id , response , is_correct,quiz_question_id,attempt_id,grade_percent)
select pages.id,{$user_id},quiz_questions.question_id,'',0,quiz_questions.id,'{$attempt_id}',0 from pages,quizzes,quiz_questions
where
pages.id = {$quiz_id}
AND
quizzes.id = pages.quiz_id
AND
quiz_questions.quiz_id = quizzes.id
AND
quiz_questions.question_id not in ( SELECT question_id FROM quiz_responses WHERE quiz_id = {$quiz_id} AND user_id = {$user_id})
AND
quiz_questions.question_id > 0
AND
quiz_questions.random = 0
";
        $DB->mysqli->query($query);

        print json_encode($data);
        exit;
    }

    else if ($uri == 'start') {
        $json_input = file_get_contents('php://input');
        $input      = json_decode($json_input);
        $quiz_id    = intval($input->quiz_id);

        $pageInfo = PageController::_get($util->reader,$quiz_id);

        //Resetting our score back to zero
        $util = new Utility();
        $input->quizId = $pageInfo['quiz']['id'];
        $quizData =$util->fetchRow(QuizController::$queryGetUserQuizData,['userId'=>$user_id,'quizId'=>$quiz_id]);
        if (!$quizData) {
            set_quiz_scores($DB, $user_id, $quiz_id, $input);
        }
        $attempt_id=$util->fetchOne(QuizController::$queryGetUserQuizData,['userId'=>$user_id,'quizId'=>$quiz_id],'attempt_id');
        $util->reader->delete('scores_overrides',['userId'=>$user_id,'pageId'=>$quiz_id]);
        GradebookController::_recalculate($user_id,$quiz_id);

        /*
        Golabs 03/02/2015
        Removing response from quiz_responses this is mainly for the random quizz system so that we  know what question the current user has ansewred.
        */
        //$query = "DELETE FROM quiz_responses WHERE quiz_id = {$quiz_id} and user_id = {$user_id}";
        //$DB->mysqli->query($query);

        print json_encode(['attempt_id'=>$attempt_id]);

    } else if ($uri == 'retake') {
        $json_input = file_get_contents('php://input');
        $input      = json_decode($json_input);

        $data = new \stdClass();

        $quiz_id     = intval($input->quiz_id);

        $util=Utility::getInstance();
        $pageInfo = PageController::_get($util->reader,$quiz_id);
        $quizData =$util->fetchRow(QuizController::$queryGetUserQuizData,['userId'=>$user_id,'quizId'=>$quiz_id]);
        $classId = ClassesController::_getFromPage($util->reader,$quiz_id);
        if(!$util->checkTeacher($classId,null,false)){
            if($pageInfo['quiz']['allowedTakes'] && intval($quizData['attempts_completed'])>=$pageInfo['quiz']['allowedTakes']){
                throwError('You have 0 attempts remaining');
            }
        }
        if ($quizData) {
            $sumAttempt=true;
            if(!boolval($quizData['is_finished'])&&$pageInfo['quiz']['canReturn']){
                $sumAttempt=false;
            }
            updatequiz_scores($DB, $user_id, $quiz_id, 0,$sumAttempt);
        }
        $retakeQuery = "UPDATE quiz_scores SET is_finished = false, score = 0 WHERE quiz_id={$quiz_id} AND user_id={$user_id}";
        $DB->mysqli->query($retakeQuery);
        $data->finalizeQuery = $retakeQuery;

        /*
        Golabs 03/02/2015
        Removing response from quiz_responses this is mainly for the random quizz system so that we  know what question the current user has ansewred.
        */
        //$query       = "DELETE FROM quiz_responses WHERE quiz_id = {$quiz_id} and user_id = {$user_id}";
        //$data->query = $query;
        //$DB->mysqli->query($query);


        $pageInfo = PageController::_get($util->reader,$quiz_id);
//        $util->reader->delete(
//            'quiz_feedback',
//            [
//                'quiz_id'=>$pageInfo['quiz']['id'],
//                'user_id'=>$user_id
//            ]
//
//        );
        $data->retake = 'ok';

        print json_encode($data);
    } else if ($uri == 'storescore') {
        $json_input  = file_get_contents('php://input');
        $input       = json_decode($json_input);
        $data        = new \stdClass();
        $testsSQL    = new TestSQL();
        $quiz_id     = intval($input->quiz_id);

        $queryClass  = "SELECT user_classes.classid,pages.moduleid
                                       FROM `user_classes`
                                       JOIN classes ON (user_classes.classid=classes.id)
                                       JOIN units ON (classes.courseid=units.courseid)
                                       JOIN pages ON (pages.unitid=units.id)
                                       WHERE user_classes.userid={$user_id} AND pages.id={$quiz_id} LIMIT 1";
        $resultClass = $DB->mysqli->query($queryClass);
        if ($resultClass && $resultClass->num_rows == 1) {
            $rowClass  = $resultClass->fetch_object();
            $class_id  = $rowClass->classid;
            $module_id = $rowClass->moduleid;
        } else {
            $class_id = 0;
        }

        // We query for the current quiz_score to see if it is non-existent and needs to be added.
        $scoresQuery  = "SELECT id, score FROM quiz_scores WHERE user_id='{$user_id}' AND quiz_id='{$quiz_id}' LIMIT 1";
        $scoresResult = $DB->mysqli->query($scoresQuery);

        $score     = isset($input->score) ? $input->score : 0;
        // If there is already a scores object for this quiz for this user, do nothing
        $submitted = date("Y-m-d H:i:s");
        if ($scoresResult && $scoresResult->num_rows <= 0) {

            $max_points        = $testsSQL->vocab_questions_count($module_id);
            $max_points        = $max_points ? $max_points->count : 0;
            $scoresUpdateQuery = "INSERT INTO quiz_scores (user_id, quiz_id, score, class_id, submitted,max_points) VALUES ('{$user_id}', '{$quiz_id}', '{$score}', '{$class_id}', '{$submitted}','{$max_points}');";

        } else {
            $row               = $scoresResult->fetch_object();
            $score_id          = $row->id;
            $scoresUpdateQuery = "UPDATE quiz_scores SET score = '{$score}', submitted='{$submitted}',attempts_completed = attempts_completed + 1 WHERE id = '{$score_id}';";
        }
        $DB->mysqli->query($scoresUpdateQuery);
        $util->reader->delete('scores_overrides',['userId'=>$user_id,'pageId'=>$quiz_id]);
        GradebookController::_recalculate($user_id,$quiz_id);

    } else {

        $quiz_id  = intval($uri);

        $fromList = $_REQUEST['fromListId'];

        if ($quiz_id > 0) {
            $user_id = INTVAL($_SESSION['USER']['ID']);

            $orm = new PmOrm($_SESSION,$DB);

            /*
            if($orm->am_i_teacher()){
                $teacher_true = 1;
            }
            */
            //$teacher_true = 1;

            if (isset( $_SESSION['USER']['teacher_true'])){
                $teacher_true = 1;
            }
            else if (($orm->sess['USER']['ID'] == 8) || ($orm->sess['USER']['ID'] == 2)){
                if($orm->am_i_super_user()){
                    $teacher_true = 1;
                    $_SESSION['USER']['teacher_true'] = 1;
                }
            }


            $select = "SELECT pages.id, pages.name, pages.content, pages.allow_video_post, pages.allow_text_post,
                      pages.allow_upload_post, pages.is_private, pages.is_gradeable, pages.quiz_id, pages.time_limit,
                      pages.allowed_takes, pages.password,pages.show_score_per_standard,pages.show_objectives,pages.can_return,
                       pages.show_previous_responses,pages.new_post_text";

            $commonWhere = " AND pages.id={$quiz_id}
                      AND (pages.layout='QUIZ' OR pages.layout='QUIZ_LIST' or pages.layout='SURVEY') LIMIT 1";


            if($orm->am_i_super_user()){
                $from = " FROM pages ";
                $where = " WHERE 1 ";


            } else if($orm->am_i_organization_admin()){
                $org = $orm->my_org()['id'];
                $from = " FROM pages
                    JOIN units on units.id = pages.unitid
                    JOIN courses on courses.id = units.courseid
                    JOIN departments on departments.id = courses.departmentid ";

                $where = " WHERE departments.organizationid = {$org} ";
            }
            else {
                $from = " FROM `user_classes`
                    JOIN classes ON (user_classes.classid=classes.id)
                    JOIN units ON (classes.courseid=units.courseid)
                    JOIN pages ON (pages.unitid=units.id) ";

                $where = " WHERE user_classes.userid={$user_id} ";
            }
            $query = $select . $from . $where .$commonWhere;


            $result = $DB->mysqli->query($query);

            if ($result && $result->num_rows == 1) {
                $row = $result->fetch_object();

                $data = new \stdClass();

                if (isset($teacher_true)){
                    $data->teacher_true = true;
                }

                $data->id                = $row->id;
                $data->pagename          = $row->name;
                $data->contenthtml       = $row->content;
                $data->allow_video_post  = $row->allow_video_post;
                $data->allow_text_post   = $row->allow_text_post;
                $data->allow_upload_post = $row->allow_upload_post;
                $data->page_is_private   = $row->is_private;
                $data->page_is_gradeable = $row->is_gradeable;
                $data->quiz_id           = $fromList > 0 ? $fromList : $row->quiz_id;
                $data->time_limit        = $row->time_limit;
                $data->allowed_takes     = intval($row->allowed_takes);
                $data->canReturn         = boolval($row->can_return);
                $data->showPrevious      = boolval($row->show_previous_responses);
                $data->password          = $row->password;
                $data->new_post_text     = $row->new_post_text;
                $data->meta              = PageController::_getPageMeta($row->id);

                $data->questions         = array();
                $data->score             = 0;
                $data->is_finished       = false;
                $data->show_score_per_standard = boolval($row->show_score_per_standard);
                $data->show_objectives = boolval($row->show_objectives);

                if($data->show_score_per_standard){
                    $data->objectives = QuizController::_quizObjectives($data->quiz_id);
                }

                $quizQuery  = "SELECT title, description,random,is_survey,keep_highest_score,advanced,questions_per_page from quizzes WHERE id = '{$data->quiz_id}'";
                $quizResult = $DB->mysqli->query($quizQuery);
                if ($quizResult && $quizResult->num_rows > 0) {
                    while ($quizRow = $quizResult->fetch_object()) {
                        $advanced = json_decode($quizRow->advanced,true)?:[];

                        $data->advancedSettings = array_merge(QuizController::$defaultAdvancedSettings,$advanced);
                        $data->quizTitle       = $quizRow->title;
                        $data->quizDescription = $quizRow->description;
                        $data->random          = $quizRow->random;
                        $data->isSurvey          = $quizRow->is_survey==1;
                        $data->questionsPerPage = $quizRow->questions_per_page;
                        $data->keep_highest_score = boolval($quizRow->keep_highest_score);
                    }
                }


                $util = Utility::getInstance();
                $attempt_id=$util->fetchOne(QuizController::$queryGetUserQuizData,['userId'=>$user_id,'quizId'=>$quiz_id],'attempt_id');
                $attempt_id=$attempt_id?:0;
                $is_finished=$util->fetchOne(QuizController::$queryGetUserQuizData,['userId'=>$user_id,'quizId'=>$quiz_id],'is_finished');
                if(($data->canReturn && $is_finished==0)||($data->showPrevious&& !isset($_REQUEST['starting']))){
                    $questions = QuizController::_getQuizQuestions($util->reader,$data->quiz_id,$user_id,$quiz_id,$attempt_id);
                }else{
                    $questions = QuizController::_getQuizQuestions($util->reader,$data->quiz_id,null,$quiz_id);
                }

                $classId = ClassesController::_getFromPage($util->reader,$quiz_id);

                $data->isStudent = $util->checkStudent($classId,null,false);
                foreach($questions as &$questionRow){
                    $properties = new \English3\Controller\QuizzesAndQuestions\Questions\QuestionProperties($questionRow);
                    $question = QuestionFactory::createFromTypeWithProperties($questionRow['type'],$properties);
                    if(!is_null($question)){
                        $questionRow=array_merge($questionRow,$question->toArray());
                        $questionRow = json_decode(json_encode($questionRow));
                        $questionRow->question_id = $questionRow->id;
                    }
                    else{
                        $solution = '';
                        $questionRow = json_decode(json_encode($questionRow));
                        $questionRow->question_id = $questionRow->id;

                        //echo 'solution = '.$questionRow->solution."\n";

//                if ($questionsResult && $questionsResult->num_rows > 0) {
//                    while ($questionRow = $questionsResult->fetch_object()) {

                        if ($questionRow->type == 'wordmatching') {
                            $a = preg_replace('/(<[^>]*)(?<![\\\|>])(")([^>]*>)/','$1\\"$3',$questionRow->extra);
                            $extra = $questionRow->extra;
                            while($extra!=$a){
                                $extra=$a;
                                $a = preg_replace('/(<[^>]*)(?<![\\\|>])(")([^>]*>)/','$1\\"$3',$extra);
                            }
                            $extra = json_decode(preg_replace('/\r\n|\r|\n/','',$extra));
                            //looking for and correcing double up  import issues with wordmatching start
                            //Testing for double ups first....
                            $double_issue = 0;
                            foreach ($extra as $id => $wordmatch) {
                                $test = 0;
                                foreach ($wordmatch as $key => $value) {
                                    if ($test == 1){
                                        if (isset($wordmatch->$key )){
                                            $double_issue = 1;
                                            break(2);
                                        }
                                    }
                                    if ($key == 'tmpanswers'){
                                        $test = 1;
                                    }
                                }
                            }

                            /*
                            Golabs Looking for and correcting doubles from import Start
                            */
                            if ($double_issue == 1){
                                $parent = new \stdClass();
                                foreach ($extra as $id => $wordmatch) {
                                    //echo "\n".$id."\n";
                                    $child = new \stdClass();
                                    foreach ($wordmatch as $key => $value) {
                                        if ($wordmatch->$key == ''){continue;}
                                        $child->$key = $value;
                                        //echo $key.' = '.$wordmatch->$key. "\n";
                                        if ($key == 'tmpanswers'){
                                            $parent->$id = $child;
                                            break(1);
                                        }
                                    }
                                }
                                $extra = $parent;
                            }
                            /*
                            Golabs Looking for and correcting doubles from import End
                            */

                            //If we have found a double we will fix in the question table Start
                            if ($double_issue == 1){
                                $query = "update questions set extra = '".$questionRow->extra."' where id = '".preg_replace('/\r\n|\r|\n|\t/xsi', '', json_encode($extra))."'";
                                $DB->mysqli->query($query);
                            }
                            //If we have found a double we will fix in the question table End

                            //Removing our tmpanswers for quiz
                            foreach ($extra as $id) {
                                unset($id->target);
                                unset($id->matches);
                                if (isset($id->tmpanswers)) {
                                    unset($id->tmpanswers);
                                }
                            }
                            $questionRow->extra = preg_replace('/\r\n|\r|\n|\t/xsi', '', json_encode($extra));
                        }

                        // print_r($questionRow);
                        $query        = "select * from question_options where question_id = '" . $questionRow->id . "' order by sort_order asc";
                        $optionResult = $DB->mysqli->query($query);
                        $optionsArray = array();
                        if ($optionResult && $optionResult->num_rows > 0) {
                            $c = 0;
                            while ($optionRow = $optionResult->fetch_object()) {
                                $optionRow->text = preg_replace('/\&lt\;/xsi', ' Less than ', $optionRow->text);
                                $optionRow->text = preg_replace('/\&gt\;/xsi', ' greater than ', $optionRow->text);


                                if ((isset($data->teacher_true) && $c == $questionRow->solution)){
                                    $solution = $optionRow->text;
                                }
                                $c += 1;
                                $optionsArray[] = $optionRow->text;
                            }
                        }
                        $questionRow->options = $optionsArray;

                        if (isset($teacher_true)){
                            $questionRow->solution = $solution;
                        }

                        /*
                        Golabs 10th of April 2015
                        Removing answers and teacher view from question.
                        */
                        if ($questionRow->type == 'blank')  {
                            $extra = json_decode($questionRow->extra);
                            unset($extra->answers);
                            unset($extra->questionhtml);
                            //unset($questionRow->options);
                            unset($questionRow->optionParams);
                            unset($extra->questionhtml);
                            $questionRow->extra = $extra;
                            //print_r($questionRow);
                            //exit;
                        }
                        elseif ($questionRow->type == 'klosequestions')  {
                            $extra = json_decode($questionRow->extra);
                            unset($extra->answers);
                            unset($extra->questionhtml);
                            $questionRow->extra = $extra;
                        }
                        else if  ($questionRow->type == 'multipart'){
                            $multipart = new multipartPrepare;
                            $multipart->answers = new \stdClass();

                            if (isset($teacher_true)){
                                $multipart->teacher_true = $teacher_true;
                            }

                            if (!preg_match('@\w@',$questionRow->extra)){
                                $multipart->questionLifter($questionRow->prompt,$questionRow->id);
                                $questionRow->prompt = '<h4 style="font-weight:bold">Multipart Question</h2>';
                            }else{

                                $multipart->questionLifter($questionRow->extra,$questionRow->id);
                            }
                            $questionRow->extra = $multipart->question;
                        }
                        if($data->canReturn || $data->showPrevious){
                            $query = "select response,is_correct from quiz_responses Where quiz_id = '$quiz_id' and question_id = '{$questionRow->id}' and user_id='{$user_id}' and attempt_id='{$attempt_id}'";
                            $response = $DB->mysqli->query($query);
                            if ($response && $response->num_rows > 0) {
                                $tmp =  $response->fetch_object();
                                $questionRow->attemptedanswers = is_null($tmp->response)?'':$tmp->response;
                                $questionRow->isCorrect = $tmp->is_correct==-1?false:boolval($tmp->is_correct);
                                if(@$tmp->is_correct){
                                    $questionRow->is_correct = $tmp->is_correct;
                                }

                            }
                        }

                    }
                    $data->questions[] = $questionRow;
                }

                $data->attempts_completed = 0;

                $scoresQuery  = "SELECT id, score, is_finished, attempts_completed,max_points,highest_score FROM quiz_scores WHERE user_id={$user_id} AND quiz_id={$data->id} LIMIT 1";
                $scoresResult = $DB->mysqli->query($scoresQuery);

                if ($scoresResult && $scoresResult->num_rows == 1) {
                    $row2                     = $scoresResult->fetch_object();
                    if($row2->highest_score && $data->keep_highest_score){
                        $data->score              = round(floatval($row2->highest_score),2);
                    }
                    else{
                        $data->score              = round(floatval($row2->score),2);
                    }
                    $data->waitingForGrade = boolval(QuizController::_isWaitingForGrade($data->id,$user_id));
                    $noAttemptsLeft = $data->allowed_takes>0&&$data->allowed_takes<=intval($row2->attempts_completed);
                    $data->is_finished        = $data->canReturn?$row2->is_finished:1;
                    $data->is_finished        = $noAttemptsLeft?1:$data->is_finished;
                    $data->attempts_completed = $row2->attempts_completed;
                    $data->hasQuizScores = true;
                    $data->maxPoints = round(floatval($row2->max_points),2);

                }
                $util = Utility::getInstance();
                if(@$_REQUEST['starting']){
                    foreach($data->questions as $q){
                        if(!@$q->attemptedanswers){
                            $qResponse = $util->fetchRow(QuizController::$queryGetQuestionAttempt,
                                 array(
                                    'pageId'=>$quiz_id,
                                    'userId'=>$user_id,
                                    'attemptId'=>$attempt_id,
                                    'questionId'=>$q->id
                                ));
                            if(!$qResponse){
                                $util->reader->insert(
                                    'quiz_responses',
                                    array(
                                        'is_correct'=>0,
                                        'submited'=>(new \DateTime())->format("Y-m-d h:i:s"),
                                        'response'=>null,
                                        'quiz_id'=>$quiz_id,
                                        'user_id'=>$user_id,
                                        'attempt_id'=>$attempt_id,
                                        'question_id'=>$q->id,
                                        'quiz_question_id'=>$q->quizQuestionId
                                    )
                                );
                            }
                        }
                    }
                }
                header('Content-Type: application/json');

                print json_encode($data);
            }
        }
    }

    exit();
}
/*
Golabs 20/01/2014
We will just add up our score here.
*/

function getScore($DB, $user_id, $quiz_id)
{
    $points = QuizController::_getQuizCurrentPoints($quiz_id,$user_id);
    return $points;

}

function updatequiz_scores($DB, $user_id, $quiz_id, $score,$sumAttempt=false)
{
    global $app;
    $reader = $app['dbs']['mysql_read'];
    $util = new Utility();

    if(!SurveyController::_get($reader,$quiz_id)){

        $quizData = $util->fetchRow(QuizController::$queryGetUserQuizData,['userId'=>$user_id,'quizId'=>$quiz_id]);
        $highest_score = floatval($quizData['highest_score']);

        $params =[
            'score'=>$score,
            'submitted'=>date("Y-m-d H:i:s")
        ];
        if($score>$highest_score){
            $params['highest_score']=$score;
            $params['highest_attempt_id']=$params['attempt_id'];
        }
        if($sumAttempt){
            $params['attempts_completed']=$quizData['attempts_completed']+1;
            $params['attempt_id']=$quizData['attempt_id']+1;
        }

        $reader->update(
            'quiz_scores',
            $params,
            ['user_id'=>$user_id,'quiz_id'=>$quiz_id]
        );

    }

}


function set_quiz_scores($DB, $user_id, $quiz_id, $input)
{
    $util = new Utility();
    $maxScore = QuizController::_getQuizMaxPoints($input->quizId);
    $submitted         = date("Y-m-d H:i:s");
    $class_id          = ClassesController::_getFromPage($util->reader,$quiz_id);
    $scoresUpdateQuery = "INSERT INTO quiz_scores (user_id, quiz_id, score,max_points, class_id, submitted,attempts_completed) VALUES ('{$user_id}', '{$quiz_id}', '0','{$maxScore}', '{$class_id}', '{$submitted}','1')";
    $DB->mysqli->query($scoresUpdateQuery);

}
/*
        Golabs
        Removing and spaces
        Stripping out non alpahas excluding . and :
        Removing and returns
        Removing any 0 at the end of a decimal ie 1.50 will be 1.5
*/
function prepareAnswer($answer)
{
    $answer = strip_tags($answer);
    return trim(strtolower(preg_replace('/\s+|[^a-zA-Z0-9 .:\/]|\r|\n|0?=\.|$/xsi', '', $answer)));
}

/*
            Golabs
            Sometimes a teacher will do something like this...
            $11.4,11.40,11.4
            we need a way to make sure that we only set one answer
            we will strip out off the array.
*/
function excludePrepareSameValues($array){
    $testtmp = new \stdClass();
    $arraytmp = array();
    foreach ($array as $key => $value) {
        $value = prepareAnswer($value);
        if (!isset($testtmp->$value)){
            $testtmp->$value = 1;
            $arraytmp[] = $value;
        }
    }
    return $arraytmp;
}

?>