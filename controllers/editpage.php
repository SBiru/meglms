<?php

global $PATHS, $DB,$app;
use English3\Controller\ClassesController;
use English3\Controller\CloneController;
use English3\Controller\Forum\Forum;
use English3\Controller\Glossary\Glossary;
use English3\Controller\Glossary\GlossaryLinkOptions;
use English3\Controller\GradebookController;
use English3\Controller\HtmlmeglmsTemplateController;
use English3\Controller\Organization\OrganizationController;
use English3\Controller\PageController;
use English3\Controller\PageTypePermissions;
use English3\Controller\QuestionController;
use English3\Controller\QuizController;
use English3\Controller\TimedReviewController;
use English3\Controller\Utility;

require_once('sql.php');
require_once('usertools/orm.php');
require_once('usertools/bitwise_permissions.php');
require_once("src/English3/Controller/Scorm/ScormController.php");
class Escaper {
  public function __construct($input, $db) {
    $this->input = $input;
    $this->db = $db;
  }

  public function get($name) {
    return $this->db->mysqli->real_escape_string($this->input->$name);
  }

  public function num($name) {
    return intval($this->input->$name);
  }
}



function prepareTimedPrompts($timed_prompts,$orgId,$classId){

    $util = Utility::getInstance();
    $defaultGroup = OrganizationController::_getField($orgId,'default_prompt_group');
    if($defaultGroup==0){
        $defaultGroup = createDefaultPrompt($classId,$orgId);
    }
    $prompts = array_map(
        function($prompt) use($util,$defaultGroup){
            if(!boolval($prompt->selected) && ($prompt->prompt || $prompt->type!='text')){

                $util->reader->insert('timed_review_prompts',
                    [
                        'prompt'=>$prompt->prompt,
                        'answer'=>$prompt->answer,
                        'name'=>$prompt->name,
                        'time_limit'=>is_numeric($prompt->time_limit)?$prompt->time_limit:null,
                        'time_pause'=>is_numeric($prompt->time_pause)?$prompt->time_pause:null,
                        'time_prepare'=>is_numeric($prompt->time_prepare)?$prompt->time_prepare:null,
                        'type'=>$prompt->type,
                        'groupid'=>$defaultGroup,
                        'options'=>TimedReviewController::prepareOptions(json_decode(json_encode( $prompt),true)),
                        'modified_by'=>$_SESSION['USER']['ID']
                    ]
                );
                $id = $util->reader->lastInsertId();
                $prompt->selected= new \stdClass();
                $prompt->selected->group= $defaultGroup ;
                $prompt->selected->prompt=$id;

                $prompt->isRandom=false;
                $prompt->type='promptFromGroup';
            }
            return array(
                'selected'=>array(
                    'group'=>$prompt->selected->group,
                    'prompt'=>$prompt->selected->prompt,
                ),
                'isRandom'=>$prompt->isRandom,
                'type'=>$prompt->type
            );

        },$timed_prompts);
    return json_encode($prompts);




}
function createDefaultPrompt($classId,$orgId){
    $orgName = OrganizationController::_getField($orgId,'name');
    $promptName = $orgName. ' default';
    $id = TimedReviewController::_createGroup($classId,$orgId,$promptName,$_SESSION['USER']['ID']);
    Utility::getInstance()->reader->update('organizations',
        ['default_prompt_group'=>$id],
        ['id'=>$orgId]
    );
    return $id;
}
function savePageMeta($pageid,$meta){
    if($pageid==0) return;
    global $DB;
    $pageMetaSQL = new PageMetaSQL();
    foreach($meta as $meta_key => $meta_value){
        $meta_value =$DB->mysqli->real_escape_string($meta_value);
        $pageMetaSQL->save($pageid,$meta_key,$meta_value);
    }
}
function getQuizInfo($quizId){
    $query = "SELECT quizzes.id,quizzes.title,quizzes.is_survey,
              sum(if(quiz_questions.random is not null and quiz_questions.random>0,quiz_questions.random,1)) as questions from quizzes
            left join quiz_questions on quiz_questions.quiz_id = quizzes.id
        WHERE quizzes.id={$quizId}
        group by quizzes.id";
    $sql = new BaseSQL();
    return $sql->fetch_one($query);
}
function throwError($message){
    $data = new \stdClass();
    $data->message=$message;
    $data->error=$message;
    header('Content-Type: application/json');
    print json_encode($data);
    exit();
}
function checkQuizMinimumScore($minimum_score,$quiz_id,$page_id=null){
    if(is_null($quiz_id)){
        $quiz_id = QuizController::_getQuizFromPageId($page_id);
    }
    $maxPoints = QuizController::_getQuizMaxPoints($quiz_id);
    return intval($minimum_score<=$maxPoints);
}
function validate_str($input,$error_message){
    if(!(isset($input)&&$input!="")) throwError($error_message);
}
function validate_int($input,$error_message){
    if(!(isset($input)&&intval($input))) throwError($error_message);
}
function clonePage($pageId,$position=false,$groupId=false,$cloneQuizzes=false){
    $sql = new BaseSQL();
    $util = new Utility();
    $page_info = $sql->fetch_one("select unitid,position,quiz_id,timed_id from pages where id = $pageId");

    if($cloneQuizzes && $page_info->quiz_id){
        $unit = $util->fetchRow(CloneController::$queryGetUnit, array('unitId' => $page_info->unitid));
        $quizId = CloneController::_cloneQuiz($page_info->quiz_id,['courseId'=>$unit['courseid']]);
    }else{
        $quizId=$page_info->quiz_id?$page_info->quiz_id:'null';
    }

    if(!$position) $position = intval($page_info->position)+1;

    //moving down next pages
    $query = "UPDATE pages set position = position+1 where unitid={$page_info->unitid} and position>={$position}";
    $sql->query_noResult($query);

    $groupId=$groupId?"'{$groupId}'":"pagegroupid";

    $timedId = $page_info->timed_id;
    if($timedId){
        $shouldClonePrompts = boolval(@$_REQUEST['clonePrompts']);
        $timedId = CloneController::_cloneTimedReview($timedId,$shouldClonePrompts);
    }

    $query = "INSERT INTO pages
						(
						unitid, pagegroupid, name, subtitle, moduleid, content, layout, position,
						 allow_video_post, allow_text_post, allow_upload_post, allow_upload_only_post,allow_video_text_post,allow_template_post, 
						 is_private, is_gradeable,
						  hide_activity, created, quiz_id, time_limit, allowed_takes, password, listen_course,
						   listen_lesson, listen_numEx, native_lang, target_lang, timed_id, timed_limit,
						    timed_pause, searchquiz, objective, new_post_text, gate,double_check_cam_audio, no_menu_go_back, minimum_score, rubricid,task_type,
						    task_duration,show_created_date,show_objectives,automatically_grade,template,show_score_per_standard,
						    show_mastery,mastery_percentage,journal_grading_type,required_pages,vocab_config,can_return,show_archived_posts,disable_visual_indicators,hide_reply,question,show_previous_responses,category_id,
						    org_category_id,minimum_score_for_completion, keep_highest_score
						)
							SELECT unitid, {$groupId}, pages.name, subtitle, moduleid, content, layout, {$position},
						    allow_video_post, allow_text_post, allow_upload_post, allow_upload_only_post,allow_video_text_post,allow_template_post, is_private, is_gradeable,
						    hide_activity, created, {$quizId}, time_limit, allowed_takes, password, listen_course,
						    listen_lesson, listen_numEx, native_lang, target_lang, {$timedId}, timed_limit,
						    timed_pause, searchquiz, objective, new_post_text, gate,double_check_cam_audio, no_menu_go_back, minimum_score, rubricid,task_type,
						    task_duration,show_created_date,show_objectives,automatically_grade,template,show_score_per_standard,
						    show_mastery,mastery_percentage,journal_grading_type,required_pages,vocab_config,can_return,show_archived_posts,disable_visual_indicators,hide_reply,question,show_previous_responses,category_id,
						    org_category_id,minimum_score_for_completion, keep_highest_score
							from pages
							WHERE id={$pageId}";

    $id = $sql->query_ReturnId($query);

    $content = \English3\Controller\Utility::getInstance()->fetchOne('SELECT content from pages where id = :pageId',
        ['pageId'=>$id]);
    \English3\Controller\Pages\PageVersions::_save($id,$content,true);


    $query = "INSERT INTO class_assignments (class_id, page_id, points, due, due_offset_days, allowed_takes, no_due_date)
                SELECT class_id, {$id}, points, due, due_offset_days, allowed_takes, no_due_date
                FROM class_assignments where page_id={$pageId}";
    $sql->query_noResult($query);
    $query = "INSERT INTO page_meta (pageid,meta_key,meta_value)
                SELECT {$id}, meta_key,meta_value
                FROM page_meta where pageid={$pageId}";
    $sql->query_noResult($query);
    return $id;
}

function determine_layout_type($page_type) {

  // TODO this is a useless function....
  if ($page_type == 'vocab') {
    return 'VOCAB';
  } else if ($page_type == 'external_link') {
    return 'EXTERNAL_LINK';
  } else if ($page_type == 'iframed') {
    // save content to file then change content to iframe
  } else if ($page_type == 'sub_unit') {
    return 'HEADER';
  } else if ($page_type == 'quiz') {
    return 'QUIZ';
  } else if ($page_type == 'vocab_quiz') {
      return 'VOCAB_QUIZ';
  }
    else if ($page_type == 'quiz_list') {
          return 'QUIZ_LIST';
  } else if ($page_type == 'lesson_listening_activity') {
    return 'LESSON_LISTENING';
  } else if ($page_type == 'listening_practice') {
    return 'LISTENING_PRACTICE';
  } else if ($page_type == 'reading_practice') {
    return 'READING_PRACTICE';
  } else if ($page_type == 'timed_review') {
    return 'TIMED_REVIEW';
  }
    else if ($page_type == 'class_summary') {
        return 'CLASS_SUMMARY';
    }
    else if ($page_type == 'user_info_form') {
        return 'USER_INFO_FORM';
    }
    else if ($page_type == 'survey') {
        return 'SURVEY';
    }
    else if ($page_type == 'journal') {
        return 'JOURNAL';
    }
    else if ($page_type == 'welcome') {
        return 'WELCOME';
    }
    else if ($page_type == 'picture') {
        return 'PICTURE';
    }
    else if ($page_type == 'glossary') {
        return 'GLOSSARY';
    }
    else if ($page_type == 'course_description') {
        return 'course_description';
    }
    else if ($page_type == 'scorm') {
        return 'SCORM';
    }
    else if ($page_type == 'forum') {
        return 'FORUM';
    }

  return 'CONTENT';
}

function is_logged_in($user) {
  return isset($user['LOGGED_IN']) &&
      isset($user['ID']) &&
      $user['ID'] > 0 &&
      $user['LOGGED_IN'] == true;
}
function find($array,$filters){
    $resp = array();
    foreach($array as $obj){
        $found = true;
        foreach($filters as $key=>$value){
            if(!isset($obj->$key) || $obj->$key!=$value){
                $found=false;
                break;
            }
        }
        if($found){
            $resp[]=$obj;
        }
    }
        return $resp;
}

function where($array,$filters,$return_index=false){
    $i = 0;
    $resp = null;
    foreach($array as $obj){
        $found = true;
        foreach($filters as $key=>$value){
            if(!isset($obj->$key) || $obj->$key!=$value){
                $found=false;
                break;
            }
        }
        if($found){
            $resp=$obj;
            break;
        }
        $i++;
    }
    if($return_index){
        return $i;
    }else{
        return $resp;
    }
}

if (isset($_SESSION['USER']) && is_logged_in($_SESSION['USER'])) {


  //$query = "SELECT FROM users JOIN user_classes ON (users.id=user_classes.userid) JOIN units ON (user_classes.courseid=units.courseid) WHERE users.id={$user_id} AND user_classes.courseid={$course_id} AND user_classes.is_teacher=1 LIMIT 1";

  $uri = strtok($_SERVER['REQUEST_URI'], '?');

  $uri = str_replace('/editpage/', '', $uri);

  $action = strtok($uri, '/');

  if ($action == 'save') {
    if ($_SERVER['REQUEST_METHOD'] == 'POST') {

        $orgSQL = new OrgSQL();
        $classSQL = new ClassSQL();



      $data = new \stdClass();

      $json_input = file_get_contents('php://input');

      $input = json_decode($json_input);

      $_REQUEST['clonePrompts'] = $input->clonePrompts;

      $es = new Escaper($input, $DB);

      $unit_id = intval($input->unit_id);

        $orgId = $orgSQL->get_by_unit_id($unit_id);
        $classId = $classSQL->get_by_unit_id($unit_id);
        if(isset($input->timed_prompts)){
            $input->timed_prompts = prepareTimedPrompts($input->timed_prompts,$orgId->id,$classId->id);
        }

        if(!$orgId || !$classId){
            exit();
        }
        $orgId = $orgId->id;
        $classId = $classId->id;

        $util = new Utility($app['dbs']['mysql_read']);
        $util->checkEditTeacher($classId,$orgId);

      $max_points = floatval($input->max_points);
      $time_limit = null;
      if (isset($input->time_limit)) {
        $time_limit = intval($input->time_limit);
      }
      $allowed_takes = null;
      if (isset($input->allowed_takes)) {
        $allowed_takes = intval($input->allowed_takes);
      }
      $mysql_quiz_id = null;
        if(strtolower( $input->page_type)=='quiz'){
            validate_int($input->quiz_id,"Quiz id must not be empty");
        }
      if($input->cloneQuizzes){
          $input->quiz_id = CloneController::_cloneQuiz($input->quiz_id);
      }
      if (isset($input->quiz_id) && strtolower( $input->page_type)=='quiz' || strtolower( $input->page_type)=='survey') {
        $mysql_quiz_id = intval($input->quiz_id);
          $max_points = QuizController::_getQuizMaxPoints($input->quiz_id);
      }


        $mysql_module_id = 0;
        if (isset($input->vocabId)) {
            $mysql_module_id = intval($input->vocabId);
        }

      if (isset($input->due_date)) {
        $due_date = date('Y-m-d H:i:s', strtotime($input->due_date));
      } else {
        $due_date = date("Y-m-d H:i:s");
      }
      $mysql_name = $DB->mysqli->real_escape_string($input->page_title);

      validate_str($mysql_name,'Invalid page title');

      $mysql_subtitle = $DB->mysqli->real_escape_string($input->page_sub_title);
      $mysql_content = $DB->mysqli->real_escape_string($input->page_content);
      $mysql_password = $DB->mysqli->real_escape_string($input->password);
        $mysql_external_id = $DB->mysqli->real_escape_string($input->external_id);
        $mysql_export_id = $DB->mysqli->real_escape_string($input->export_id);

      $mysql_listen_course = $DB->mysqli->real_escape_string($input->listen_course);
      $mysql_listen_lesson = $DB->mysqli->real_escape_string($input->listen_lesson);
      $mysql_listen_numEx = $DB->mysqli->real_escape_string($input->listen_numEx);

      $mysql_native_lang = $DB->mysqli->real_escape_string($input->native_lang);
      $mysql_target_lang = $DB->mysqli->real_escape_string($input->target_lang);
      $mysql_task_type = $DB->mysqli->real_escape_string($input->task_type );
      $mysql_task_duration = $DB->mysqli->real_escape_string($input->task_duration );
      $mysql_show_created_date = intval($input->show_created_date);
      $mysql_show_objectives = intval($input->show_objectives );
      $mysql_show_score_per_standard = intval($input->show_score_per_standard );
      $mysql_show_mastery = intval($input->show_show_mastery);
      $mysql_journal_grading_type = intval($input->journalGradingType);
      $mysql_can_return = $input->can_return;
      $mysql_vocab_config = json_encode($input->vocab_config);
      $mysql_show_archived_posts = $input->show_archived_posts;
      $mysql_disable_visual_indicators = $input->disable_visual_indicators;
      $mysql_hide_reply = $input->hide_reply;
      $mysql_required_pages = intval($input->required_pages);
      $mysql_question = $input->question;
      $mysql_show_previous_responses = intval($input->show_previous_responses);
      $mysql_category_id = intval($input->category_id);
      $mysql_org_category_id = intval($input->org_category_id);
      $mysql_mastery_percentage = intval($input->mastery_percentage );
      //Golabs bandaid for searchquiz
      if (!isset($input->searchquiz)) $input->searchquiz = '';
      $mysql_search_quiz = $DB->mysqli->real_escape_string($input->searchquiz);

        if (!isset($input->objective)) $input->objective = '';
        $mysql_objective = $DB->mysqli->real_escape_string($input->objective);
        if (!isset($input->new_post_text)) $input->new_post_text = '';
        $mysql_new_post_text = $DB->mysqli->real_escape_string($input->new_post_text);

        if (!isset($input->gate)) $input->gate = '0';
        $mysql_gate = intval($input->gate);

        if (!isset($input->double_check_cam_audio)) $input->double_check_cam_audio = '0';
        $mysql_double_check_cam_audio = intval($input->double_check_cam_audio);

        if (!isset($input->no_menu_go_back)) $input->no_menu_go_back = '0';
        $mysql_no_menu_go_back = intval($input->no_menu_go_back);

        if (!isset($input->minimum_score_for_completion)) $input->minimum_score_for_completion = '0';
        if (!isset($input->minimum_score)) $input->minimum_score = '0';
        $mysql_minimum_score_for_completion = intval($input->minimum_score_for_completion);
        $mysql_minimum_score = intval($input->minimum_score);

        if($mysql_gate && $mysql_minimum_score){
            if(!$mysql_quiz_id){
                if($mysql_minimum_score>$max_points){
                    throwError("Minimum score must not be greater than max points");
                }
            }else{
                if(!checkQuizMinimumScore($mysql_minimum_score,$mysql_quiz_id)){
                    throwError("Minimum score must not be greater than max points");
                }
            }
        }

        if (!isset($input->rubricId)) $input->rubricId = '0';
        $mysql_rubricid = intval($input->rubricId);

      $mysql_layout = determine_layout_type($input->page_type);

      $mysql_page_group_id = 0;


      if (is_numeric($input->page_group_id) && $input->page_group_id > 0) {
        $mysql_page_group_id = intval($input->page_group_id);
      }

      $mysql_allow_video_post = 0;
      $mysql_allow_video_text_post = 0;
      $mysql_allow_text_post = 0;
      $mysql_allow_upload_post = 0;
      $mysql_allow_upload_only_post = 0;
      $mysql_is_private_post = 0;
      $mysql_is_cant_leave = 0;
      $mysql_is_gradeable_post = 0;
      $mysql_keep_highest_score=0;
        $mysql_automatically_grade = 0;
      $mysql_hide_activity = 0;
        $mysql_survey_points=0;
        $mysql_allow_template_post = 0;
        $mysql_allow_template = '';
      $mysql_scorm_config = $input->scorm_config;

    if (isset($input->survey_points)) {
        $mysql_survey_points = intval($input->survey_points);
    }
      if ($input->allow_video_post == 1) {
        $mysql_allow_video_post = 1;
      }if ($input->allow_video_text_post == 1) {
        $mysql_allow_video_text_post = 1;
      }

      if ($input->allow_text_post == 1) {
        $mysql_allow_text_post = 1;
      }

      if ($input->allow_template_post == 1) {
        $mysql_allow_template_post = 1;
          if($input->canvasTemplate){
              $mysql_allow_template = $input->canvasTemplate->id;
          }else{
              $mysql_allow_template = $input->template;
          }

      }

      if ($mysql_allow_video_post == 0 && $input->allow_upload_post == 1) {
        $mysql_allow_upload_post = 1;
      }
        if ($mysql_allow_upload_only_post == 0 && $input->allow_upload_only_post == 1) {
        $mysql_allow_upload_only_post = 1;
      }

      if ($input->is_private_post == 1) {
        $mysql_is_private_post = 1;
      }
        if ($input->is_cant_leave == 1) {
            $mysql_is_cant_leave = 1;
        }

      if ($input->is_gradeable_post == 1) {
        $mysql_is_gradeable_post = 1;
      }
        if ($input->keep_highest_score == 1) {
            $mysql_keep_highest_score=1;
        }
        if (isset($input->automatically_grade) && $input->automatically_grade == 1) {
            $mysql_automatically_grade = 1;
        }

      if ($input->hide_activity == 1) {
        $mysql_hide_activity = 1;
      }
        if($mysql_gate && $mysql_hide_activity==1){
            throwError("Assignments that are required or have a minimum score cannot be hidden ");
        }

      if (strlen($mysql_name) > 0) {
        $position = 0;
        /*
        Golabs doing some check to fix db heart Attack
        */
        if (!preg_match('/\d/',$mysql_quiz_id))
          $mysql_quiz_id = 0;
        if (!preg_match('/\d/',$time_limit))
          $time_limit = 0;
        if (!preg_match('/\d/',$allowed_takes))
          $allowed_takes = 0;
        if (!preg_match('/\d/',$mysql_listen_numEx))
          $mysql_listen_numEx = 0;

          //get the next page id for the timed review

          if((empty($es->num('timed_id')) || !intval('timed_id'))&&$mysql_layout=='TIMED_REVIEW'){


              // print_r($es);
              //  echo $es->get('timed_prompts');
              $query3 = "INSERT INTO timed_review (dialog_json,title,description,instructions) VALUES ('".$es->get('timed_prompts')."','".$es->get('timed_title')."','".$es->get('timed_description')."','".$es->get('timed_instruction')."')";
              // echo $query3;exit;
              $DB->mysqli->query($query3);

              $es->input->timed_id = $DB->mysqli->insert_id;


          }
        if($input->cloningId && $es->input->timed_id){
            $es->input->timed_id = CloneController::_cloneTimedReview($es->input->timed_id,false);
        }

        if ($mysql_page_group_id > 0) {
          $query = "SELECT max(position) as 'max_position' FROM pages WHERE unitid={$unit_id} AND (pagegroupid={$mysql_page_group_id} OR id={$mysql_page_group_id})";

          $result = $DB->mysqli->query($query);

          if ($result && $result->num_rows == 1) {
            $row = $result->fetch_object();

            $position = $row->max_position + 1;

            $query = "UPDATE pages SET position=position+1 WHERE unitid={$unit_id} AND position>={$position}";

            $DB->mysqli->query($query);

            $query = "INSERT INTO pages
                            (unitid, name, subtitle, pagegroupid,moduleid, content, layout,
                            allow_video_post, allow_text_post, allow_upload_post, allow_upload_only_post, allow_template_post,
                            allow_video_text_post,
                            is_private,  is_gradeable, hide_activity, position, quiz_id,
                            time_limit, allowed_takes, password,
                            listen_course, listen_lesson, listen_numEx,
                            timed_id, timed_limit, timed_pause,
                            native_lang, target_lang,searchquiz,objective,new_post_text,
                            gate, double_check_cam_audio,no_menu_go_back,minimum_score,rubricid,
                            task_type,task_duration,show_created_date,show_objectives,automatically_grade,template,survey_points,external_id,export_id,show_score_per_standard,
                            show_mastery,mastery_percentage,journal_grading_type,required_pages,vocab_config,can_return,show_archived_posts,disable_visual_indicators,hide_reply,question,show_previous_responses,category_id,org_category_id,minimum_score_for_completion, keep_highest_score,is_cant_leave,timed_prepare
                            )
                            VALUES(
                            '{$unit_id}', '{$mysql_name}', '{$mysql_subtitle}','{$mysql_page_group_id}','{$mysql_module_id}', '{$mysql_content}', '{$mysql_layout}',
                            '{$mysql_allow_video_post}', '{$mysql_allow_text_post}', '{$mysql_allow_upload_post}', '{$mysql_allow_upload_only_post}',  '{$mysql_allow_template_post}',
                            '{$mysql_allow_video_text_post}',
                            '{$mysql_is_private_post}', '{$mysql_is_gradeable_post}', '{$mysql_hide_activity}', '{$position}', '{$mysql_quiz_id}',
                            '{$time_limit}', '{$allowed_takes}', '{$mysql_password}',
                            '{$mysql_listen_course}', '{$mysql_listen_lesson}', '{$mysql_listen_numEx}',
                            '{$es->num('timed_id')}', '{$es->num('timed_limit')}', '{$es->num('timed_pause')}',
                            '{$mysql_native_lang}', '{$mysql_target_lang}','{$mysql_search_quiz}','{$mysql_objective}','{$mysql_new_post_text}'
                            ,'{$mysql_gate}', '{$mysql_double_check_cam_audio}','{$mysql_no_menu_go_back}','{$mysql_minimum_score}','{$mysql_rubricid}',
                            '{$mysql_task_type}','{$mysql_task_duration}','{$mysql_show_created_date}','{$mysql_show_objectives}','{$mysql_automatically_grade}','{$mysql_allow_template}','{$mysql_survey_points}','{$mysql_external_id}','{$mysql_export_id}','{$mysql_show_score_per_standard}',
                            '{$mysql_show_mastery}','{$mysql_mastery_percentage}','{$mysql_journal_grading_type}','{$mysql_required_pages}','{$mysql_vocab_config}','{$mysql_can_return}','{$mysql_show_archived_posts}','{$mysql_disable_visual_indicators}','{$mysql_hide_reply}','{$mysql_question}','{$mysql_show_previous_responses}'
                            ,'{$mysql_category_id}','{$mysql_org_category_id}','{$mysql_minimum_score_for_completion}','{$mysql_keep_highest_score}','{$mysql_is_cant_leave}','{$es->num('timed_prepare')}')";

            $DB->mysqli->query($query);

            $newPageId = $DB->mysqli->insert_id;
            $user_id = intval($_SESSION['USER']['ID']);

              //if we are cloning a group
              if($input->cloningId && $mysql_layout=='HEADER'){
                  CloneController::_clonePageGroup($util->reader,$input->cloningId,$unit_id,$newPageId);
              }

            $queryClass = "SELECT user_classes.classid
                                       FROM `user_classes`
                                       JOIN classes ON (user_classes.classid=classes.id)
                                       JOIN units ON (classes.courseid=units.courseid)
                                       JOIN pages ON (pages.unitid=units.id)
                                       WHERE user_classes.userid={$user_id} AND pages.id={$newPageId} LIMIT 1";
            $resultClass = $DB->mysqli->query($queryClass);
            if ($resultClass && $resultClass->num_rows == 1) {
              $rowClass = $resultClass->fetch_object();
              $class_id = $rowClass->classid;
            } else {
              $class_id = 0;
            }

            $query2 = "INSERT INTO class_assignments(class_id, page_id, points, due, no_due_date, due_offset_days) VALUES ({$class_id},{$newPageId},{$max_points},'{$due_date}',{$input->no_due_date},0)";
            $DB->mysqli->query($query2);

            if(isset($input->meta)){
                savePageMeta($newPageId,$input->meta);
            }

            $data->message = 'successful';
            $data->query = $query;
            $data->query2 = $query2;
              $data->id = $newPageId;
          } else {
            $data->message = 'Error: The group ID Does not exist in this Unit';
          }
        } else {
          $query = "SELECT max(position) as 'max_position' FROM pages WHERE unitid={$unit_id}";

          $result = $DB->mysqli->query($query);

          if ($result && $result->num_rows == 1) {
            $row = $result->fetch_object();

            $position = $row->max_position + 1;
          }

          $query = "INSERT INTO pages
                        (unitid, name, subtitle, moduleid,pagegroupid, content,
                        layout, allow_video_post, allow_text_post,
                        allow_upload_post,allow_upload_only_post,allow_template_post,allow_video_text_post, is_private,
                        is_gradeable, hide_activity, position, quiz_id,
                        time_limit, allowed_takes, `password`,
                        listen_course, listen_lesson, listen_numEx,
                        timed_id, timed_limit, timed_pause,
                        native_lang, target_lang,searchquiz,
                        objective,new_post_text,gate,double_check_cam_audio,
                        no_menu_go_back,minimum_score,rubricid,
                        task_type,task_duration,show_created_date,show_objectives,automatically_grade,template,survey_points,external_id,export_id,show_score_per_standard,
                        show_mastery,mastery_percentage,journal_grading_type,required_pages,vocab_config,can_return,show_archived_posts,disable_visual_indicators,hide_reply,question,show_previous_responses,category_id,org_category_id,minimum_score_for_completion,keep_highest_score, is_cant_leave,timed_prepare)
                        VALUES('{$unit_id}', '{$mysql_name}',
                        '{$mysql_subtitle}','{$mysql_module_id}', '{$mysql_page_group_id}', '{$mysql_content}',
                        '{$mysql_layout}', '{$mysql_allow_video_post}',
                        '{$mysql_allow_text_post}', '{$mysql_allow_upload_post}', '{$mysql_allow_upload_only_post}','{$mysql_allow_template_post}','{$mysql_allow_video_text_post}',
                        '{$mysql_is_private_post}', '{$mysql_is_gradeable_post}',
                        '{$mysql_hide_activity}','{$position}', '{$mysql_quiz_id}', '{$time_limit}',
                        '{$allowed_takes}', '{$mysql_password}',
                        '{$mysql_listen_course}', '{$mysql_listen_lesson}', '{$mysql_listen_numEx}',
                        '{$es->num('timed_id')}', '{$es->num('timed_limit')}', '{$es->num('timed_pause')}',
                        '{$mysql_native_lang}', '{$mysql_target_lang}','{$mysql_search_quiz}','{$mysql_objective}','{$mysql_new_post_text}',
                        '{$mysql_gate}', '{$mysql_double_check_cam_audio}','{$mysql_no_menu_go_back}','{$mysql_minimum_score}','{$mysql_rubricid}',
                        '{$mysql_task_type}','{$mysql_task_duration}','{$mysql_show_created_date}','{$mysql_show_objectives}','{$mysql_automatically_grade}','{$mysql_allow_template}','{$mysql_survey_points}','{$mysql_external_id}','{$mysql_export_id}','{$mysql_show_score_per_standard}',
                        '{$mysql_show_mastery}','{$mysql_mastery_percentage}','{$mysql_journal_grading_type}','{$mysql_required_pages}','{$mysql_vocab_config}','{$mysql_can_return}','{$mysql_show_archived_posts}','{$mysql_disable_visual_indicators}','{$mysql_hide_reply}','{$mysql_question}','{$mysql_show_previous_responses}',
                        '{$mysql_category_id}','{$mysql_org_category_id}','{$mysql_minimum_score_for_completion}','{$mysql_keep_highest_score}','{$mysql_is_cant_leave}','{$es->num('timed_prepare')}')";

          $DB->mysqli->query($query);

          $newPageId = $DB->mysqli->insert_id;
          $user_id = intval($_SESSION['USER']['ID']);

            //if we are cloning a group
            if($input->cloningId && $mysql_layout=='HEADER'){
                CloneController::_clonePageGroup($util->reader,$input->cloningId,$unit_id,$newPageId);
            }

            if($mysql_layout=='SCORM') {
                if (isset($mysql_scorm_config->scormName) && $mysql_scorm_config->scormName != "") {
                    $mysql_scorm_name = $mysql_scorm_config->scormName;
                } else {
                    $mysql_scorm_name = $mysql_scorm_config->scormTitle;
                }
                $mysql_display_description = intval(@$mysql_scorm_config->display_description);
                $mysql_scorm_course_id = $mysql_scorm_config->scormid;
                $query = "INSERT INTO scorm (scorm_course_id, page_id, scorm_name, display_description, scorm_title) 
                          values ('{$mysql_scorm_course_id}','{$newPageId}', '{$mysql_scorm_name}', '{$mysql_display_description}', '{$mysql_scorm_config->scormTitle}')";
                $DB->mysqli->query($query);
                $scorm_insert_id = $DB->mysqli->insert_id;
            }

          $queryClass = "SELECT user_classes.classid
                                       FROM `user_classes`
                                       JOIN classes ON (user_classes.classid=classes.id)
                                       JOIN units ON (classes.courseid=units.courseid)
                                       JOIN pages ON (pages.unitid=units.id)
                                       WHERE user_classes.userid={$user_id} AND pages.id={$newPageId} LIMIT 1";
          $resultClass = $DB->mysqli->query($queryClass);
          if ($resultClass && $resultClass->num_rows == 1) {
            $rowClass = $resultClass->fetch_object();
            $class_id = $rowClass->classid;
          } else {
            $class_id = 0;
          }

          $query2 = "INSERT INTO class_assignments(class_id, page_id, points, due, no_due_date, due_offset_days) VALUES ({$class_id},{$newPageId},{$max_points},'{$due_date}',{$input->no_due_date},0)";
          $DB->mysqli->query($query2);

            if(isset($input->meta)){
                savePageMeta($newPageId,$input->meta);
            }

          $data->message = 'successful';
          $data->id = $newPageId;
            $gbCategoriesController = new \English3\Controller\Gradebook\GradebookCategories();
            $gbCategoriesController->updateCategoryPage($newPageId,$input->gradebook_category_id);
          //$data->query = $query;
          //$data->query2 = $query2;
        }
          \English3\Controller\Pages\PageVersions::_save($data->id,$mysql_content,true);
          if(isset($input->recalculate)){

              $classCtrl = GradebookController::getClassCtrl();
              $users = $classCtrl->getUsers($classId);
              if($input->recalculate=='now'){
                  foreach($users['students'] as $student){
                      GradebookController::_setRecalculateDueDates($classId,$student['id']);
                  }
              }else{
                  foreach($users['students'] as $student){
                      GradebookController::_setRecalculateDueDates($classId,$student['id']);
                  }
              }
          }
          $a = 0;
      } else {
        $data->message = 'Page Name Cannot Be Empty';
      }
      if($newPageId && $mysql_layout=="FORUM"){
          $forum = new \English3\Controller\Forum\Forum();
          $forum->createForumFromPage($newPageId);
          $forum->saveSettingsFromPage($newPageId,json_decode(json_encode($input->forumSettings),true));

      }
      header('Content-Type: application/json');
      print json_encode($data);
      exit();
    }
  } else if ($action == 'update') {
    if ($_SERVER['REQUEST_METHOD'] == 'POST') {
      $data = new \stdClass();

      $json_input = file_get_contents('php://input');
      $input = json_decode($json_input);

	  //$query3 = "UPDATE timed_review set dialog_json = '".$es->get('timed_prompts')."' where id=".$es->num('timed_id');
	  //$DB->mysqli->query($query3);
	  //echo $input->timed_prompts;exit;
      $es = new Escaper($input, $DB);

      $page_id = intval($input->page_id);

        $orgSQL = new OrgSQL();
        $classSQL = new ClassSQL();
        $orgId = $orgSQL->get_by_page_id($page_id);
        $classId = $classSQL->get_by_page_id($page_id);

        if(!$orgId || !$classId){
            exit();
        }
        if(isset($input->timed_prompts)){
            $input->timed_prompts = prepareTimedPrompts($input->timed_prompts,$orgId->id,$classId->id);
        }
        $orgId = $orgId->id;
        $classId = $classId->id;

        $util = new Utility($app['dbs']['mysql_read']);
        $util->checkEditTeacher($classId,$orgId);

        $gbCategoriesController = new \English3\Controller\Gradebook\GradebookCategories();
        $gbCategoriesController->updateCategoryPage($page_id,$input->gradebook_category_id);

      $max_points = floatval($input->max_points);
      $time_limit = 0;
      if (isset($input->time_limit)) {
        $time_limit = intval($input->time_limit);
      }
      $allowed_takes = 0;
      if (isset($input->allowed_takes)) {
        $allowed_takes = intval($input->allowed_takes);
      }
      $class_id = intval($input->class_id);
      if (isset($input->due_date)) {
        $due_date = date('Y-m-d H:i:s', strtotime($input->due_date));
      } else {
        $due_date = date("Y-m-d H:i:s");
      }
      $mysql_name = $input->page_title;
      validate_str($mysql_name,'Invalid page title');

      $mysql_subtitle = $input->page_sub_title;
      $mysql_content = $input->page_content;
      $mysql_password = $input->password;
        $mysql_external_id = $input->external_id;
        $mysql_export_id = $input->export_id;

      $mysql_listen_course = $input->listen_course;
      $mysql_listen_lesson = $input->listen_lesson;
      $mysql_listen_numEx = $input->listen_numEx;

      $mysql_native_lang = $input->native_lang;
      $mysql_target_lang = $input->target_lang;
        $mysql_task_type = isset($input->task_type)?$input->task_type :"";
        $mysql_task_duration = isset($input->task_duration)?$input->task_duration :"";

        $mysql_show_created_date = intval($input->show_created_date);
        $mysql_show_objectives = intval($input->show_objectives );
        $mysql_show_score_per_standard=intval($input->show_score_per_standard );
        $mysql_show_mastery=intval($input->show_mastery);
        $mysql_journal_grading_type=intval($input->journalGradingType);
        $mysql_show_archived_posts=intval($input->show_archived_posts);
        $mysql_disable_visual_indicators=intval($input->disable_visual_indicators);
        $mysql_hide_reply=intval($input->hide_reply);
        $mysql_required_pages=$input->required_pages;
        $mysql_question=$input->question;
        $mysql_show_previous_responses=intval($input->show_previous_responses);
        $mysql_category_id=intval($input->category_id);
        $mysql_org_category_id=intval($input->org_category_id);
        $mysql_mastery_percentage=intval($input->mastery_percentage);
        $mysql_search_quiz = $input->searchquiz;
        $mysql_objective = $input->objective;
        $mysql_new_post_text = $input->new_post_text;
        $mysql_can_return = $input->can_return;
        $mysql_vocab_config = json_encode($input->vocab_config);
        if($input->canvasTemplate){
            $mysql_template = $input->canvasTemplate->id;
        }else{
            $mysql_template = $input->template;
        }
        \English3\Controller\Pages\PageVersions::_save($page_id,$mysql_content);
        $data->versionsCount = Utility::getInstance()->fetchOne('SELECT count(*) FROM page_versions WHERE pageid = :pageId',['pageId'=>$page_id]);

        if (!isset($input->gate)) $input->gate = '0';
        $mysql_gate = intval($input->gate);

        if (!isset($input->double_check_cam_audio)) $input->double_check_cam_audio = '0';
        $mysql_double_check_cam_audio = intval($input->double_check_cam_audio);


        if (!isset($input->no_menu_go_back)) $input->no_menu_go_back = '0';
        $mysql_no_menu_go_back = intval($input->no_menu_go_back);

        if (!isset($input->minimum_score)) $input->minimum_score = '0';
        if (!isset($input->minimum_score_for_completion)) $input->minimum_score_for_completion = '0';
        $mysql_minimum_score = intval($input->minimum_score);
        $mysql_minimum_score_for_completion = intval($input->minimum_score_for_completion);

        if($mysql_gate && $mysql_minimum_score){
            if(isset($input->page_type) && strpos(strtolower($input->page_type),'quiz')===false){
                if($mysql_minimum_score>$max_points){
                    throwError("Minimum score must not be greater than max points");
                }
            }else{
                if(!checkQuizMinimumScore($mysql_minimum_score,null,$page_id)){
                    throwError("Minimum score must not be greater than max points");
                }
            }
        }


        if (!isset($input->rubricId)) $input->rubricId = '0';
        $mysql_rubricid = intval($input->rubricId);

        if (!isset($input->survey_points)) $input->survey_points = '0';
        $mysql_survey_points = intval($input->survey_points);
      /*
       * Golabs 17/01/2015
       * Setting to Null if we do not have any numeric value a Integer that is.
       listen_numEx is set as int 11 so we must call it NULL if its Variable $mysql_listen_numEx is not.
       */
      if (!preg_match('/^\d+$/xsi', $mysql_listen_numEx)) {
        $mysql_listen_numEx = 'NULL';
      }
      $mysql_page_group_id = 0;

      if (is_numeric($input->page_group_id) && $input->page_group_id > 0) {
        $mysql_page_group_id = intval($input->page_group_id);
      }

      $mysql_allow_video_post = 0;
      $mysql_allow_video_text_post = 0;
      $mysql_allow_text_post = 0;
      $mysql_allow_upload_post = 0;
      $mysql_allow_template_post = intval($input->allow_template_post);
      $mysql_allow_upload_only_post = 0;
      $mysql_is_private_post = 0;
          $mysql_is_cant_leave = 0;
      $mysql_is_gradeable_post = 0;
      $mysql_keep_highest_score = 0;
        $mysql_automatically_grade = 0;
      $mysql_hide_activity = 0;

      if ($input->allow_video_post == 1) {
        $mysql_allow_video_post = 1;
      }
      if ($input->allow_video_text_post == 1) {
        $mysql_allow_video_text_post = 1;
      }

      if ($input->allow_text_post == 1) {
        $mysql_allow_text_post = 1;
      }

      if ($mysql_allow_video_post == 0 && $input->allow_upload_post == 1) {
        $mysql_allow_upload_post = 1;
      }
        if ($mysql_allow_video_post == 0 && $input->allow_upload_only_post == 1) {
        $mysql_allow_upload_only_post = 1;
      }

      if ($input->is_cant_leave == 1) {
            $mysql_is_cant_leave = 1;
        }

        if ($input->is_private_post == 1) {
            $mysql_is_private_post = 1;
        }


      if ($input->is_gradeable_post == 1) {
        $mysql_is_gradeable_post = 1;
      }

        if ($input->keep_highest_score == 1) {
            $mysql_keep_highest_score=1;
        }
        if (isset($input->automatically_grade) && $input->automatically_grade == 1) {
            $mysql_automatically_grade = 1;
        }

      if ($input->hide_activity == 1) {
        $mysql_hide_activity = 1;
      }


        if($mysql_gate && $mysql_hide_activity==1){
            throwError("Assignments that are required or have a minimum score cannot be hidden ");
        }
      if (strlen($mysql_name) > 0) {

        $query = "SELECT unitid, pagegroupid, position FROM pages WHERE id={$page_id} LIMIT 1";
        $query2 = "SELECT id from class_assignments WHERE page_id={$page_id} LIMIT 1";

        $result = $DB->mysqli->query($query);
        $result2 = $DB->mysqli->query($query2);

        if ($result && $result->num_rows == 1) {
          $row = $result->fetch_object();

          $unit_id = $row->unitid;
          $old_pagegroupid = $row->pagegroupid;
          $current_position = $row->position;

          if($es->get(isScorm) == true){
              $updateScorm = "UPDATE `scorm` SET scorm_name = '".$es->get('scormName')."', display_description = '".$es->get('displayDiscription')."',scorm_title = '".$es->get('scormTitle')."' WHERE scorm_course_id = '".$es->get('scormCourseId')."'";
              $DB->mysqli->query($updateScorm);
          }
            if(!boolval($es->num('timed_id'))){
                $query3 = "INSERT INTO timed_review (dialog_json,title,description,instructions) VALUES ('".$es->get('timed_prompts')."','".$es->get('timed_title')."','".$es->get('timed_description')."','".$es->get('timed_instruction')."')";
                $DB->mysqli->query($query3);
                $es->input->timed_id =  $DB->mysqli->insert_id;
            }else{
                $query3 = "UPDATE timed_review set dialog_json = '".$es->get('timed_prompts')."', title = '".$es->get('timed_title')."', description = '".$es->get('timed_description')."', instructions = '".$es->get('timed_instruction')."' where id=".$es->num('timed_id');
                $DB->mysqli->query($query3);
            }

           $util = new Utility();
            $updateArray = array(
                'name'=>$mysql_name,
                'subtitle'=>$mysql_subtitle,
                'pagegroupid'=>$mysql_page_group_id,
                'content'=>$mysql_content,
                'allow_video_post'=>$mysql_allow_video_post,
                'allow_video_text_post'=>$mysql_allow_video_text_post,
                'allow_text_post'=>$mysql_allow_text_post,
                'allow_upload_post'=>$mysql_allow_upload_post,
                'allow_upload_only_post'=>$mysql_allow_upload_only_post,
                'allow_template_post'=>$mysql_allow_template_post,
                'is_private'=>$mysql_is_private_post,
                'is_cant_leave'=>$mysql_is_cant_leave,
                'is_gradeable'=>$mysql_is_gradeable_post,
                'keep_highest_score'=>$mysql_keep_highest_score,
                'hide_activity'=>$mysql_hide_activity,
                'allowed_takes'=>$allowed_takes,
                'time_limit'=>$time_limit,
                'password'=>$mysql_password,
                'listen_course'=>$mysql_listen_course,
                'listen_lesson'=>$mysql_listen_lesson,
                'listen_numEx'=>$mysql_listen_numEx,
                'timed_id'=>$es->num('timed_id'),
                'timed_limit'=>$es->num('timed_limit'),
                'timed_pause'=>$es->num('timed_pause'),
                'timed_prepare'=>$es->num('timed_prepare'),
                'native_lang'=>$mysql_native_lang,
                'target_lang'=>$mysql_target_lang,
                'searchquiz'=>$mysql_search_quiz,
                'objective'=>$mysql_objective,
                'new_post_text'=>$mysql_new_post_text,
                'gate'=>$mysql_gate,
                'double_check_cam_audio'=>$mysql_double_check_cam_audio,
                'no_menu_go_back'=>$mysql_no_menu_go_back,
                'minimum_score'=>$mysql_minimum_score,
                'minimum_score_for_completion'=>$mysql_minimum_score_for_completion,
                'rubricid'=>$mysql_rubricid,
                'task_type'=>$mysql_task_type,
                'task_duration'=>$mysql_task_duration,
                'show_created_date'=>$mysql_show_created_date,
                'show_objectives'=>$mysql_show_objectives,
                'show_score_per_standard'=>$mysql_show_score_per_standard,
                'show_mastery'=>$mysql_show_mastery,
                'journal_grading_type'=>$mysql_journal_grading_type,
                'can_return'=>$mysql_can_return,
                'vocab_config'=>$mysql_vocab_config,
                'show_archived_posts'=>$mysql_show_archived_posts,
                'disable_visual_indicators'=>$mysql_disable_visual_indicators,
                'hide_reply'=>$mysql_hide_reply,
                'required_pages'=>$mysql_required_pages,
                'question'=>$mysql_question,
                'show_previous_responses'=>$mysql_show_previous_responses,
                'category_id'=>$mysql_category_id,
                'org_category_id'=>$mysql_org_category_id,
                'mastery_percentage'=>$mysql_mastery_percentage,
                'automatically_grade'=>$mysql_automatically_grade,
                'template'=>$mysql_template,
                'survey_points'=>$mysql_survey_points,
                'external_id'=>$mysql_external_id,
                'export_id'=>$mysql_export_id
            );
            if (isset($input->vocabId)) {
                $updateArray['moduleid'] = intval($input->vocabId);
            }
            if($mysql_password!=Utility::getInstance()->fetchOne(PageController::$queryGetPagePassword,['pageId'=>$page_id])){
                $updateArray['last_password_change']=date('Y-m-d h:i:s');
            }
            if (!is_null($input->quizId)) {
                if (!empty($updateArray)) {
                    $updateArray['quiz_id'] = $input->quizId;
                }
            }
            if($input->forumSettings){
                $forum = new Forum();
                $forum->saveSettingsFromPage($page_id,json_decode(json_encode($input->forumSettings),true));
            }

            if ($old_pagegroupid == $mysql_page_group_id) {
              $util->reader->update('pages',$updateArray,['id'=>$page_id]);
                $data->message='successful';
          if(isset($input->meta)){
              savePageMeta($page_id,$input->meta);
          }


            if ($result2 && $result2->num_rows == 1) {
              $rowClassAssignment = $result2->fetch_object();
              $query2 = "UPDATE class_assignments SET points={$max_points}, due='{$due_date}', no_due_date={$input->no_due_date} WHERE id={$rowClassAssignment->id}";
              $DB->mysqli->query($query2);
            } else {
              $query2 = "INSERT INTO class_assignments(class_id, page_id, points, due, no_due_date, due_offset_days) VALUES ({$class_id},{$page_id},{$max_points},'{$due_date}',{$input->no_due_date},0)";
              $DB->mysqli->query($query2);
            }

          } else if ($mysql_page_group_id == 0) {
            $query = "UPDATE pages SET position=0 WHERE id={$page_id}";

            $DB->mysqli->query($query);


            $query = "UPDATE pages SET position=position-1 WHERE unitid={$unit_id} AND position>{$current_position}";

            $DB->mysqli->query($query);


            $query = "SELECT max(position) as 'max_position' FROM pages WHERE unitid={$unit_id} AND (pagegroupid={$old_pagegroupid} OR id={$old_pagegroupid})";

            $result = $DB->mysqli->query($query);

            if ($result && $result->num_rows == 1) {
              $row = $result->fetch_object();

              $position = $row->max_position + 1;

              $query = "UPDATE pages SET position=position+1 WHERE unitid={$unit_id} AND position>={$position}";

              $DB->mysqli->query($query);
                $updateArray['position']=$position;

                $util->reader->update('pages',$updateArray,['id'=>$page_id]);

              $result = $DB->mysqli->query($query);
                if(isset($input->meta)){
                    savePageMeta($page_id,$input->meta);
                }
              if ($result) {
                $data->message = 'successful';
              } else {
                $data->message = 'failure';
              }

              if ($result2 && $result2->num_rows == 1) {
                $rowClassAssignment = $result2->fetch_object();
                $query2 = "UPDATE class_assignments SET points={$max_points}, due='{$due_date}', no_due_date={$input->no_due_date} WHERE id={$rowClassAssignment->id}";
                $DB->mysqli->query($query2);
              } else {
                $query2 = "INSERT INTO class_assignments(class_id, page_id, points, due, no_due_date, due_offset_days) VALUES ({$class_id},{$page_id},{$max_points},'{$due_date}',{$input->no_due_date},0)";
                $DB->mysqli->query($query2);
              }

              $data->query2 = $query2;
              $data->query = $query;
            } else {
              $data->message = $query;
            }
          } else {
            $query = "UPDATE pages SET position=0 WHERE id={$page_id}";

            $DB->mysqli->query($query);



            $query = "UPDATE pages SET position=position-1 WHERE unitid={$unit_id} AND position>{$current_position}";

            $DB->mysqli->query($query);



            $query = "SELECT max(position) as 'max_position' FROM pages WHERE unitid={$unit_id} AND (pagegroupid={$mysql_page_group_id} OR id={$mysql_page_group_id})";

            $result = $DB->mysqli->query($query);

            if ($result && $result->num_rows == 1) {
              $row = $result->fetch_object();

              $position = $row->max_position + 1;

              $query = "UPDATE pages SET position=position+1 WHERE unitid={$unit_id} AND position>={$position}";

              $DB->mysqli->query($query);

                $updateArray['position']=$position;

                $util->reader->update('pages',$updateArray,['id'=>$page_id]);

                if(isset($input->meta)){
                    savePageMeta($page_id,$input->meta);
                }
              if (!$result) {
                $data->message = 'failure';
              } else {
                $data->message = 'successful!';
              }
              $data->query = $query;
            } else {
              $data->message = $query;
            }
          }
          if($input->recalculateGradebook){
              if($input->recalculateGradebook->isNeeded){
                  $classCtrl = GradebookController::getClassCtrl();
                  $users = $classCtrl->getUsers($class_id);
                  if($input->recalculateGradebook->when=='now'){
                      foreach($users['students'] as $student){
                          GradebookController::_recalculate($student['id'],null,$class_id);
                      }
                  }
                  else{
                      foreach($users['students'] as $student){
                          GradebookController::_setRecalculateGradebook($class_id,$student['id']);
                      }
                  }
              }
          }
        } else {
          $data->message = "Error page id not valid.";
        }
      } else {
        $data->message = 'Page Name Cannot Be Empty';
      }


      header('Content-Type: application/json');
      print json_encode($data);
      exit();
    }
  } else if ($action == 'remove') {
    if ($_SERVER['REQUEST_METHOD'] == 'POST') {
        function deletePage($row,$page_id){
            global $DB;
            if($row->layout == 'SCORM'){
                $query = "SELECT scorm_course_id FROM `scorm` WHERE page_id = $page_id";
                $result = $DB->mysqli->query($query);
                $scormrow = $result->fetch_object();
                $courseid = $scormrow->scorm_course_id;
                $resp = null;
                try{
                    $resp = ScormController::deleteScorm($courseid);
                }
                catch (Exception $e){
                    $data = new \stdClass();
                    $data->message = $e -> getMessage();
                    print json_encode($data);
                    exit();
                }
                if($resp['rsp']['success'] == ""){
                    $query = "DELETE FROM `scorm` WHERE page_id = $page_id";
                    $DB->mysqli->query($query);
                }
                else{
                    header('Content-Type: application/json');
                    print json_encode($resp);
                    exit();
                }
            }
            $query = "UPDATE pages SET position = position-1 WHERE unitid={$row->unitid} AND position > {$row->position}";
            $DB->mysqli->query($query);

            Utility::moveToHistory('pages','pages_history',$page_id);

        }
      $data = new \stdClass();

      $json_input = file_get_contents('php://input');

      $input = json_decode($json_input);

      $page_id = intval($input->page_id);
      $confirm_delete = isset($input->confirm_delete);
      $data = new \stdClass();



      $query = "SELECT unitid, pagegroupid, position, layout FROM pages WHERE id={$page_id} LIMIT 1";

      $result = $DB->mysqli->query($query);

      if ($result && $result->num_rows == 1) {
          $pageSQL = new PageSQL();

          $util = new Utility();
          $classId = ClassesController::_getFromPage($util->reader,$page_id);
          $children = $pageSQL->get_children($page_id);
          if(count($children)>0){
              if(!$confirm_delete){
                  $data->message='has_children';
                  print json_encode($data);
                  exit();
              }
              else{
                foreach($children as $row){
                    deletePage($row,$row->id);
                }
              }
          }
          $row = $result->fetch_object();
          deletePage($row,$page_id);

          if(isset($input->recalculate)){

              $classCtrl = GradebookController::getClassCtrl();
              $users = $classCtrl->getUsers($classId);
              if($input->recalculate=='now'){
                  foreach($users['students'] as $student){
                      GradebookController::_setRecalculateDueDates($classId,$student['id']);
                      GradebookController::_recalculate($student['id'],null,$classId);
                  }
              }else{
                  foreach($users['students'] as $student){
                      GradebookController::_setRecalculateDueDates($classId,$student['id']);
                  }
              }
          }

        $data->message = 'successful';
      } else {
        $data->message = 'successful';
      }

      header('Content-Type: application/json');
      print json_encode($data);
      exit();
    }
  } else if ($action == 'movedown') {
    if ($_SERVER['REQUEST_METHOD'] == 'POST') {
      $data = new \stdClass();

      $json_input = file_get_contents('php://input');

      $input = json_decode($json_input);

      $page_id = intval($input->page_id);

      $data = new \stdClass();

      $query = "SELECT unitid, pagegroupid, position, layout FROM pages WHERE id={$page_id} LIMIT 1";

      $result = $DB->mysqli->query($query);

      if ($result && $result->num_rows == 1) {
        $row = $result->fetch_object();

        $position = $row->position;
        $unitid = $row->unitid;
        $page_group_id = $row->pagegroupid;
        $layout = $row->layout;
        $sql =new BaseSQL();
          $pagesInUnit = $sql->query("SELECT id,pagegroupid,position,layout FROM pages WHERE unitid={$unitid} order by position");
          $arrayPosition = where($pagesInUnit,['id'=>$page_id],true);
        if ($layout == 'HEADER') {


          $target_ids = array();

          $target_ids[] = $page_id;


          //$query = "SELECT id FROM pages WHERE unitid={$unitid} AND pagegroupid={$page_id}";
          $children_pages = find($pagesInUnit,['pagegroupid'=>$page_id]);
          foreach($children_pages as $p){
              $target_ids[] = $p->id;
          }
//          $result = $DB->mysqli->query($query);
//
//          if ($result && $result->num_rows > 0) {
//            while ($row = $result->fetch_object()) {
//              $target_ids[] = $row->id;
//            }
//          }

          $mysql_target_ids = '(' . implode(',', $target_ids) . ')';



          $target_length = count($target_ids);

//          $query = "SELECT id, layout FROM pages WHERE unitid={$unitid} AND position={$position} + {$target_length}";
//
//          $result = $DB->mysqli->query($query);

          //if ($result && $result->num_rows == 1) {
          if(count($pagesInUnit)>=$arrayPosition+$target_length){
            $row = $pagesInUnit[$arrayPosition+$target_length];

            if ($row->layout == 'HEADER') {
              $destination_ids = array();

              $destination_ids[] = $row->id;
                $arrayPositionDest = where($pagesInUnit,['id'=>$row->id],true);

                //$query = "SELECT id FROM pages WHERE unitid={$unitid} AND pagegroupid={$page_id}";
                $children_pages = find($pagesInUnit,['pagegroupid'=>$row->id]);
                foreach($children_pages as $p){
                    $destination_ids[] = $p->id;
                }

//
//              $query = "SELECT id FROM pages WHERE unitid={$unitid} AND pagegroupid={$row->id}";
//
//              $result = $DB->mysqli->query($query);
//
//              if ($result && $result->num_rows > 0) {
//                while ($row = $result->fetch_object()) {
//                  $destination_ids[] = $row->id;
//                }
//              }

              $mysql_destination_ids = '(' . implode(',', $destination_ids) . ')';

              $destination_length = count($destination_ids);


              $query = "UPDATE pages SET position = position-{$target_length} WHERE unitid={$unitid} AND id IN $mysql_destination_ids";

              $data->query1 = $query;

              $DB->mysqli->query($query);


              $query = "UPDATE pages SET position = position+{$destination_length} WHERE id IN $mysql_target_ids";

              $DB->mysqli->query($query);

              $data->query2 = $query;
            } else {
              $query = "UPDATE pages SET position = position-{$target_length} WHERE unitid={$unitid} AND position={$position}+{$target_length}";

              $data->query1 = $query;

              $DB->mysqli->query($query);


              $query = "UPDATE pages SET position = position+1 WHERE id IN $mysql_target_ids";

              $DB->mysqli->query($query);

              $data->query2 = $query;
            }
          }
        }
        else if ($page_group_id > 0) {
          $query = "SELECT max(position) as 'max_position' FROM pages WHERE unitid={$unitid} AND pagegroupid={$page_group_id}";

          $result = $DB->mysqli->query($query);

          if ($result && $result->num_rows == 1) {
            $row = $result->fetch_object();

            if ($position < $row->max_position) {
              $query = "UPDATE pages SET position = position-1 WHERE unitid={$unitid} AND position={$position}+1";

              $data->query1 = $query;

              $DB->mysqli->query($query);


              $query = "UPDATE pages SET position = position+1 WHERE id={$page_id}";

              $DB->mysqli->query($query);

              $data->query2 = $query;
            }
          }
        } else {
          $query = "SELECT max(position) as 'max_position' FROM pages WHERE unitid={$unitid}";

          $result = $DB->mysqli->query($query);

          if ($result && $result->num_rows == 1) {
            $row = $result->fetch_object();

            if ($position < $row->max_position) {
              //begin paste
              $mysql_target_ids = '(' . $page_id . ')';

              $target_length = 1;

//              $query = "SELECT id, layout FROM pages WHERE unitid={$unitid} AND position={$position} + {$target_length}";
//
//              $result = $DB->mysqli->query($query);

              if (true) {
                $row = $pagesInUnit[$arrayPosition+1];

                if ($row->layout == 'HEADER') {

                    $destination_ids = array();

                    $destination_ids[] = $row->id;
                    $arrayPositionDest = where($pagesInUnit,['id'=>$row->id],true);

                    //$query = "SELECT id FROM pages WHERE unitid={$unitid} AND pagegroupid={$page_id}";
                    $children_pages = find($pagesInUnit,['pagegroupid'=>$row->id]);
                    foreach($children_pages as $p){
                        $destination_ids[] = $p->id;
                    }

                  $mysql_destination_ids = '(' . implode(',', $destination_ids) . ')';

                  $destination_length = count($destination_ids);


                  $query = "UPDATE pages SET position = position-{$target_length} WHERE unitid={$unitid} AND id IN $mysql_destination_ids";

                  $data->query1 = $query;

                  $DB->mysqli->query($query);


                  $query = "UPDATE pages SET position = position+{$destination_length} WHERE id IN $mysql_target_ids";

                  $DB->mysqli->query($query);

                  $data->query2 = $query;
                } else {
                  $query = "UPDATE pages SET position = position-{$target_length} WHERE unitid={$unitid} AND position={$position}+{$target_length}";

                  $data->query1 = $query;

                  $DB->mysqli->query($query);


                  $query = "UPDATE pages SET position = position+1 WHERE id IN $mysql_target_ids";

                  $DB->mysqli->query($query);

                  $data->query2 = $query;
                }
              }



              //end paste
            }
          }
        }
      }



      $data->message = 'up: ' . $page_id;

      header('Content-Type: application/json');
      print json_encode($data);
      exit();
    }
  } else if ($action == 'moveup') {
    if ($_SERVER['REQUEST_METHOD'] == 'POST') {
      $data = new \stdClass();

      $json_input = file_get_contents('php://input');

      $input = json_decode($json_input);

      $page_id = intval($input->page_id);

      $query = "SELECT unitid, pagegroupid, position, layout FROM pages WHERE id={$page_id} LIMIT 1";

      $result = $DB->mysqli->query($query);


      if ($result && $result->num_rows == 1) {
        $row = $result->fetch_object();

        $position = $row->position;
        $unitid = $row->unitid;
        $page_group_id = $row->pagegroupid;
        $layout = $row->layout;
          $sql =new BaseSQL();
          $pagesInUnit = $sql->query("SELECT id,pagegroupid,position,layout FROM pages WHERE unitid={$unitid} order by position");
          $arrayPosition = where($pagesInUnit,['id'=>$page_id],true);

        if ($layout == 'HEADER') {
          $target_ids = array();

          $target_ids[] = $page_id;

            $children_pages = find($pagesInUnit,['pagegroupid'=>$page_id]);
            foreach($children_pages as $p){
                $target_ids[] = $p->id;
            }

          $mysql_target_ids = '(' . implode(',', $target_ids) . ')';

          $target_length = count($target_ids);

//          $query = "SELECT id, pagegroupid, layout FROM pages WHERE unitid={$unitid} AND position={$position} - 1";
//
//          $result = $DB->mysqli->query($query);

          if ($arrayPosition>0) {
            $row = $pagesInUnit[$arrayPosition-1];

            if ($row->layout == 'HEADER' || $row->pagegroupid > 0) {
              $destination_ids = array();

              if ($row->layout == 'HEADER') {
                $destination_ids[] = $row->id;

//                $query = "SELECT id FROM pages WHERE unitid={$unitid} AND pagegroupid={$row->id}";
//
//                $result = $DB->mysqli->query($query);
//
//                if ($result && $result->num_rows > 0) {
//                  while ($row = $result->fetch_object()) {
//                    $destination_ids[] = $row->id;
//                  }
//                }
              } else {
                  $destination_ids[] = $row->pagegroupid;

                  $arrayPositionDest = where($pagesInUnit, ['id' => $row->pagegroupid], true);

                  //$query = "SELECT id FROM pages WHERE unitid={$unitid} AND pagegroupid={$page_id}";
                  $children_pages = find($pagesInUnit, ['pagegroupid' => $row->pagegroupid]);
                  foreach ($children_pages as $p) {
                      $destination_ids[] = $p->id;
                  }
              }

              $mysql_destination_ids = '(' . implode(',', $destination_ids) . ')';

              $destination_length = count($destination_ids);


              $query = "UPDATE pages SET position = position+{$target_length} WHERE unitid={$unitid} AND id IN $mysql_destination_ids";

              $data->query1 = $query;

              $DB->mysqli->query($query);


              $query = "UPDATE pages SET position = position-{$destination_length} WHERE id IN $mysql_target_ids";

              $DB->mysqli->query($query);

              $data->query2 = $query;
            } else {
              $query = "UPDATE pages SET position = position+{$target_length} WHERE unitid={$unitid} AND position={$position}-1";

              $data->query1 = $query;

              $DB->mysqli->query($query);


              $query = "UPDATE pages SET position = position-1 WHERE id IN $mysql_target_ids";

              $DB->mysqli->query($query);

              $data->query2 = $query;
            }
          }
        } else if ($page_group_id > 0) {
          $query = "SELECT position as 'min_position' FROM pages WHERE unitid={$row->unitid} AND id={$page_group_id}";

          $result = $DB->mysqli->query($query);

          if ($result && $result->num_rows == 1) {
            $row = $result->fetch_object();

            $min_position = $row->min_position + 1;

            if ($position > $min_position) {
              $query = "UPDATE pages SET position = position+1 WHERE unitid={$unitid} AND position={$position}-1";

              $DB->mysqli->query($query);

              $data->query1 = $query;

              $query = "UPDATE pages SET position = position-1 WHERE id={$page_id}";

              $DB->mysqli->query($query);

              $data->query2 = $query;
            }
          }
        } else {
          if ($position > 0) {
            //begin paste


            $mysql_target_ids = '(' . $page_id . ')';



            $target_length = 1;

            $query = "SELECT id, pagegroupid, layout FROM pages WHERE unitid={$unitid} AND position={$position} - 1";

            $result = $DB->mysqli->query($query);

            if ($result && $result->num_rows == 1) {
              $row = $result->fetch_object();

              if ($row->layout == 'HEADER' || $row->pagegroupid > 0) {
                $destination_ids = array();

                if ($row->layout == 'HEADER') {
                  $destination_ids[] = $row->id;

//                  $query = "SELECT id FROM pages WHERE unitid={$unitid} AND pagegroupid={$row->id}";
//
//                  $result = $DB->mysqli->query($query);
//
//                  if ($result && $result->num_rows > 0) {
//                    while ($row = $result->fetch_object()) {
//                      $destination_ids[] = $row->id;
//                    }
//                  }
                } else {
                    $destination_ids[] = $row->pagegroupid;

                    $arrayPositionDest = where($pagesInUnit,['id'=>$row->pagegroupid],true);

                    //$query = "SELECT id FROM pages WHERE unitid={$unitid} AND pagegroupid={$page_id}";
                    $children_pages = find($pagesInUnit,['pagegroupid'=>$row->pagegroupid]);
                    foreach($children_pages as $p){
                        $destination_ids[] = $p->id;
                    }

                }

                $mysql_destination_ids = '(' . implode(',', $destination_ids) . ')';

                $destination_length = count($destination_ids);


                $query = "UPDATE pages SET position = position+{$target_length} WHERE unitid={$unitid} AND id IN $mysql_destination_ids";

                $data->query1 = $query;

                $DB->mysqli->query($query);


                $query = "UPDATE pages SET position = position-{$destination_length} WHERE id IN $mysql_target_ids";

                $DB->mysqli->query($query);

                $data->query2 = $query;
              } else {
                $query = "UPDATE pages SET position = position+{$target_length} WHERE unitid={$unitid} AND position={$position}-1";

                $data->query1 = $query;

                $DB->mysqli->query($query);


                $query = "UPDATE pages SET position = position-1 WHERE id IN $mysql_target_ids";

                $DB->mysqli->query($query);

                $data->query2 = $query;
              }
            }

            //end paste
          }
        }
      }



      $data->message = 'down: ' . $page_id;

      header('Content-Type: application/json');
      print json_encode($data);
      exit();
    }
  } else if ($action == 'getsubunits') {
    if ($_SERVER['REQUEST_METHOD'] == 'POST') {
      $data = new \stdClass();
      $data->subunits = array();
        $data->vocab_groups = array();

      $json_input = file_get_contents('php://input');
      $userOrm = new PmOrm($_SESSION,$DB);
      $input = json_decode($json_input);

      $unit_id = intval($input->unit_id);

      $query = "SELECT id, name FROM pages WHERE unitid={$unit_id} AND layout='HEADER'";

        if($userOrm->am_i_super_user()){
            $query2 = "SELECT * FROM (SELECT quizzes.id, quizzes.title,count(quiz_questions.id) as questions,quizzes.course_id FROM quizzes
                      join quiz_questions on quizzes.id = quiz_questions.quiz_id
                      JOIN courses on courses.id = quizzes.course_id
					  JOIN departments on departments.id = courses.departmentid
                      where is_survey=0 and (is_private=0) or (is_private=1 and quizzes.created_by = {$userOrm->user_id})
                      group by quizzes.id
                      order by title) quizzes
                      ";

            $querySurvey = "SELECT * FROM (SELECT quizzes.id, quizzes.title,count(quiz_questions.id) as questions,quizzes.course_id FROM quizzes
                      join quiz_questions on quizzes.id = quiz_questions.quiz_id
                      where is_survey=1 and ((is_private=0) or (is_private=1 and quizzes.created_by = {$userOrm->user_id}))
                      group by quizzes.id
                      order by title) quizzes
                      ";
        }
        else{

            $myOrg = $userOrm->my_org(false)['id'];
          $query2 = "SELECT * FROM (SELECT quizzes.id, quizzes.title,count(quiz_questions.id) as questions,quizzes.course_id FROM quizzes
              JOIN users on quizzes.created_by = users.id
              join quiz_questions on quizzes.id = quiz_questions.quiz_id
              WHERE organizationid = {$myOrg} and  is_survey=0 and ((is_private=0) or (is_private=1 and quizzes.created_by = {$userOrm->user_id}))
              group by quizzes.id
              ORDER BY quizzes.title) quizzes
              ";

            $querySurvey = "SELECT * FROM (SELECT quizzes.id, quizzes.title,count(quiz_questions.id) as questions,quizzes.course_id FROM quizzes
              JOIN users on quizzes.created_by = users.id
              join quiz_questions on quizzes.id = quiz_questions.quiz_id
              WHERE organizationid = {$myOrg} and  is_survey=1 and ((is_private=0) or (is_private=1 and quizzes.created_by = {$userOrm->user_id}))
              group by quizzes.id
              ORDER BY quizzes.title) quizzes
              ";
        }




        //Getting vocab groups
        $query_vocab_groups="SELECT name,moduleid FROM pages
                            WHERE unitid = {$unit_id} and layout = 'VOCAB'";

      $result = $DB->mysqli->query($query);
      $result2 = $DB->mysqli->query($query2);
        $resultSurvey = $DB->mysqli->query($querySurvey);
        $result_vocab_groups = $DB->mysqli->query($query_vocab_groups);

      if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_object()) {
          $data->subunits[] = clone $row;
        }
      }

      if ($result2 && $result2->num_rows > 0) {
        while ($row = $result2->fetch_object()) {
          $data->quizzes[] = clone $row;
        }
      }
        if ($resultSurvey && $resultSurvey->num_rows > 0) {
            while ($row = $resultSurvey->fetch_object()) {
                $data->surveys[] = clone $row;
            }
        }
        if ($result_vocab_groups && $result_vocab_groups->num_rows > 0) {
            while ($row = $result_vocab_groups->fetch_object()) {
                $data->vocab_groups[] = clone $row;
            }
        }
        if($userOrm->am_i_super_user()){
            $data->allowed_pages = -1;
        }
        else{
            $pagePermissions = new PageTypePermissions();
            $data->allowed_pages = $pagePermissions->getPermission($_SESSION['USER']['ID']);
        }
        $orgId = OrganizationController::_getFromUnit($unit_id);
        $data->orgOptions = OrganizationController::_get($orgId,false);
        $classId = ClassesController::_getFromUnitId($unit_id);
        if($isProficiencyTest = ClassesController::isProficiencyTest($classId)){
            $data->proficiencyAreas = \English3\Controller\ProficiencyTest\ScoreRange\CategoryDB::getAll($classId);
            $data->isProficiencyTest = true;
        };
        if($data->orgOptions['enable_gradebook_categories']){
            $gbCategoriesController = new \English3\Controller\Gradebook\GradebookCategories();
            $data->gradebookCategories = $gbCategoriesController->getAndPrepareCategories($classId,true);
        }
        if(@$input->layout){
            $data->hasGlossary = boolval(Glossary::getForClassId($classId) && GlossaryLinkOptions::_checkPageType
                ($classId,$input->layout));
        }


      header('Content-Type: application/json');
      print json_encode($data);
      exit();
    }
  }
  else if ($action=='all'){
      $where = 'where 1';
      $page_keys = ['id'];

      foreach(array_keys($_REQUEST) as $key){
          $key_ = gettype(array_search($key,$page_keys))!='boolean'?'p.'.$key:$key;
          $where.=" and {$key_}='{$_REQUEST[$key]}' ";
      }

      $query = "SELECT p.*,ca.points,ca.due,ca.due_offset_days,ca.allowed_takes,ca.no_due_date FROM
                pages p
                left join class_assignments ca on ca.page_id = p.id
                join units u on p.unitid = u.id
                join courses c on u.courseid = c.id
                join departments d on c.departmentid = d.id
                join organizations o on d.organizationid = o.id
                {$where}
                GROUP BY p.id
                ";

      $sql = new BaseSQL();
      $pages = $sql->query($query);

      header('Content-Type: application/json');
      print json_encode(['pages'=>$pages]);
      exit();
  }
  else if ($action=='clone'){
      if($_SERVER['REQUEST_METHOD'] == 'POST') {
          $json_input = file_get_contents('php://input');
          $input = json_decode($json_input);
      }
      if(!(isset($input->pageId)&&intval($input->pageId)>0)){
          throwError("Invalid page id");
      }
      $pageId=$input->pageId;
      $cloneQuizzes = @$input->cloneQuizzes;
      $_REQUEST['clonePrompts'] = $input->clonePrompts;
      $sql = new BaseSQL();
      $util = new Utility();
      if(isset($input->isGroup)){
          //getting all pages inside the group
          $pages = $sql->query("select * from pages where pagegroupid='{$pageId}' order by position");
          $lastPage = end($pages);
          $position = $lastPage->position+1;
          reset($pages);

          $newId=clonePage($pageId,$position,false,$cloneQuizzes);

          foreach($pages as $page){
            $position++;
            clonePage($page->id,$position,$newId,$cloneQuizzes);
          }
      }
      else{
          $page_info = $sql->fetch_one("select unitid,position from pages where id = $pageId");
          clonePage($pageId,$page_info->position,false,$cloneQuizzes);
      }
      if(isset($input->recalculate)){
          $classId = ClassesController::_getFromPage($util->reader,$pageId);
          $classCtrl = GradebookController::getClassCtrl();
          $users = $classCtrl->getUsers($classId);
          if($input->recalculate=='now'){
              foreach($users['students'] as $student){
                  GradebookController::_setRecalculateDueDates($classId,$student['id']);
                  GradebookController::_recalculate($student['id'],null,$classId);
              }
          }else{
              foreach($users['students'] as $student){
                  GradebookController::_setRecalculateDueDates($classId,$student['id']);
              }
          }
      }

      throwError("Success");

  }
  else if (is_numeric($action) && $action > 0) {
    $content_id = intval($action);
    $user_id = intval($_SESSION['USER']['ID']);


    $content_id = intval($uri);

    $query = "SELECT
            pages.id,
            pages.name,
            pages.subtitle,
            pages.content,
            pages.pagegroupid,
            pages.allow_video_post,
            pages.allow_video_text_post,
            pages.allow_text_post,
            pages.allow_upload_post,
            pages.allow_upload_only_post,
            pages.allow_template_post,
            pages.is_private,
            pages.is_cant_leave,
            pages.is_gradeable,
            pages.keep_highest_score,
            pages.hide_activity,
            pages.layout,
            pages.allowed_takes,
            pages.password,
            pages.time_limit,
            pages.quiz_id,
            pages.listen_course,
            pages.listen_lesson,
            pages.listen_numEx,

            pages.timed_id,
            pages.timed_limit,
            pages.timed_pause,
            pages.timed_prepare,

            pages.native_lang,
            pages.target_lang,
            pages.searchquiz,
            pages.objective,
            pages.new_post_text,
            pages.gate,
            pages.double_check_cam_audio,
            pages.no_menu_go_back,
            pages.minimum_score,
            pages.minimum_score_for_completion,
            pages.rubricid,
            pages.task_type,
            pages.task_duration,
            pages.show_objectives,
            pages.show_created_date,
            pages.created,
            pages.automatically_grade,
            pages.survey_points,
            pages.template,
            pages.external_id,
            pages.export_id,
            pages.moduleid,
            pages.show_score_per_standard,
            pages.show_mastery,
            pages.journal_grading_type,
            pages.can_return,
            pages.vocab_config,
            pages.show_archived_posts,
            pages.disable_visual_indicators,
            pages.hide_reply,
            pages.required_pages,
            pages.question,
            pages.show_previous_responses,
            pages.category_id,
            pages.org_category_id,
            pages.mastery_percentage,
            user_classes.classid,
            class_assignments.points as 'max_points',
            class_assignments.due as 'due_date',
            class_assignments.no_due_date,
			timed_review.dialog_json as time_review_data,
			timed_review.description as timed_description,
			timed_review.instructions as timed_instruction,
			timed_review.title as timed_title,
			gp.category_id,
            pages2.children_count,
            courses.id as courseId,
            organizations.id as orgId,
            organizations.save_deleted_posts,
            organizations.calculate_progress
                  FROM `user_classes`
                  JOIN classes ON (user_classes.classid=classes.id)
                  JOIN units ON (classes.courseid=units.courseid)
                  JOIN courses ON courses.id = classes.courseid
                  JOIN departments ON courses.departmentid = departments.id
                JOIN organizations on departments.organizationid = organizations.id
                  JOIN pages ON (pages.unitid=units.id)
				  LEFT JOIN timed_review ON pages.timed_id = timed_review.id
                  LEFT JOIN class_assignments ON (class_assignments.page_id=pages.id)
                  LEFT JOIN gradebook_category_pages gp on gp.page_id = pages.id
                  LEFT JOIN (SELECT {$content_id} AS id,COUNT(*) AS children_count FROM pages WHERE pagegroupid = {$content_id}) AS pages2 ON pages2.id = pages.id
                  WHERE pages.id={$content_id} LIMIT 1";
    $result = $DB->mysqli->query($query);

    if ($result && $result->num_rows == 1) {
      $row = $result->fetch_object();
      $pageMetaSQL = new PageMetaSQL();
	//  print_r($row);exit;
      $data = clone($row);

      // These are the items that are different.
      $data->pagename = $row->name;
      $data->contenthtml = $row->content;
      $data->timed_instruction = Utility::addMediaAttribute($row->timed_instruction,'video');
      $data->page_is_private = $row->is_private;
      $data->page_is_cant_leave = $row->is_cant_leave;
      $data->page_is_gradeable = $row->is_gradeable;
      $data->page_keep_highest_score = $row->keep_highest_score;
      $data->page_type = $row->layout;
      $data->show_score_per_standard = boolval($row->show_score_per_standard);
      $data->can_return=boolval($row->can_return);
      $data->vocab_config=json_decode($row->vocab_config);
      $data->show_archived_posts=boolval($row->show_archived_posts);
      $data->disable_visual_indicators=boolval($row->disable_visual_indicators);
      $data->hide_reply=boolval($row->hide_reply);
      $data->save_deleted_posts=boolval($row->save_deleted_posts);
      $data->isJ1OrProficiency = ClassesController::isJ1($row->classid) || ClassesController::isProficiencyTest($row->classid);
      $data->question=QuestionController::fetchBeforeLeavePageQuestions(json_decode($row->question,true),$editor=true);
      $data->show_previous_responses=boolval($row->show_previous_responses);
      $data->show_mastery = boolval($row->show_mastery);
      $data->calculate_progress = boolval($row->calculate_progress);
      if(intval($row->template)){
          $data->canvasTemplate = \English3\Controller\CanvasTemplates\CanvasTemplatesDB::get($row->template);
      }
      $data->meta = $pageMetaSQL->get($content_id,true);


        $data->versionsCount = Utility::getInstance()->fetchOne('SELECT count(*) FROM page_versions WHERE pageid = :pageId',['pageId'=>$content_id]);
        $timedReviewController = new TimedReviewController(Utility::getInstance()->reader);
	  $data->time_review_data = @$_REQUEST['fetchTimedReview']?$timedReviewController->fetchTimedPrompts(json_decode( $data->time_review_data,true)):json_decode( $data->time_review_data);
      $data->required_pages = json_decode($row->required_pages);
        if(($data->page_type=='QUIZ'||$data->page_type=='SURVEY')){
            $data->quizInfo = getQuizInfo($data->quiz_id);
            if($data->quizInfo){
                $data->quizInfo->is_survey=boolval($data->quizInfo->is_survey);
                $data->quizInfo->hasBeenTaken=PageController::_hasQuizBeenTaken($data->id);
            }
        }
        $data->template = $row->template?HtmlmeglmsTemplateController::_getTemplate($data->template):null;
        if($row->layout==='GLOSSARY'){
            $linkOptions = new \English3\Controller\Glossary\GlossaryLinkOptions($row->id);
            $data->linkOptions = array_values($linkOptions->load());
        }
        if($row->layout==="FORUM"){
            $forum = new Forum();
            $data->forumSettings = $forum->loadSettingsFromPage($row->id);
        }

        $query = "SELECT * from scorm where page_id = $row->id";
        $result = $DB->mysqli->query($query);
        if ($result && $result->num_rows == 1) {
            $scorm_row = $result->fetch_object();
            $data->scormName = $scorm_row->scorm_name;
            $data->display_description = $scorm_row->display_description;
            $data->scormCourseId = $scorm_row->scorm_course_id;
            $data->scormTitle = $scorm_row->scorm_title;
            $data->propsEditorUrl = ScormController::editUrl($data->scormCourseId);
            $data->attributes = ScormController::properties($data->scormCourseId);
        }

      header('Content-Type: application/json');

      print json_encode($data);
    }
  }
}
?>
