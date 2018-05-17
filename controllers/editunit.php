<?php

global $PATHS, $DB;
use English3\Controller\Classes\ClassSuperUnits;
use English3\Controller\ClassesController;
use English3\Controller\GradebookController;
use English3\Controller\PageController;
use English3\Controller\Utility;

require_once('_utils.php');
require_once('sql.php');

function clonePageQuery($row,$newName,$newUnit,$pageGroupId=0){
	global $DB;
	$header = [];
	$values = [];
	foreach($row as $key => $value){
		$value = $DB->mysqli->real_escape_string($value);
		if($key=='id' || $key=='created')  continue;
		$header[]=$key;
		if($key=='name'){
			$values[]=$newName;
		}
		else if($key=='unitid'){
			$values[]=$newUnit;
		}
		else if($key=='pagegroupid'){
			$values[]=$pageGroupId;
		}
		else{
			$values[]=$value;
		}
	}
	$header = implode(",",$header);
	$values = implode("','",$values);
	return "INSERT INTO pages ({$header}) values ('{$values}')";
}
function cloneAssignments($newId,$oldId,$classId){
	$sql = new BaseSQL();

	$query = "INSERT INTO class_assignments (class_id, page_id, points, due, due_offset_days, allowed_takes, no_due_date)
                SELECT {$classId}, {$newId}, points, due, due_offset_days, allowed_takes, no_due_date
                FROM class_assignments where page_id={$oldId}";
	$sql->query_noResult($query);
	$query = "INSERT INTO page_meta (pageid,meta_key,meta_value)
                SELECT {$newId}, meta_key,meta_value
                FROM page_meta where pageid={$oldId}";
	$sql->query_noResult($query);
}
if(isset($_SESSION['USER']) && isset($_SESSION['USER']['LOGGED_IN']) && isset($_SESSION['USER']['ID']) && $_SESSION['USER']['ID'] > 0 && $_SESSION['USER']['LOGGED_IN']==true) {


	//$query = "SELECT FROM users JOIN user_classes ON (users.id=user_classes.userid) JOIN units ON (user_classes.courseid=units.courseid) WHERE users.id={$user_id} AND user_classes.courseid={$course_id} AND user_classes.is_teacher=1 LIMIT 1";

	$uri = strtok($_SERVER['REQUEST_URI'], '?');

	$uri = str_replace('/editunit/', '', $uri);

	$action = strtok($uri, '/');

	if($action == 'save') {
		if($_SERVER['REQUEST_METHOD'] == 'POST') {
			$json_input = file_get_contents('php://input');

                     $input = json_decode($json_input);

			$data = new \stdClass();

			$course_id = intval($input->course_id);
			$mysql_name = intval($input->unit_number);
			$image_url = @$input->image_url?$input->image_url:'';
			$superUnitId = @$input->superUnitId?intval(@$input->superUnitId):null;
            $tab_name = $DB->mysqli->real_escape_string($input->tab_name);

			$mysql_description = $DB->mysqli->real_escape_string($input->unit_title);

			$query = "SELECT id from units where courseid={$course_id} and name='{$mysql_name}'";
			$query .= $superUnitId?' and superunitid = '.$superUnitId:'';
			$result = $DB->mysqli->query($query);
			if($result->num_rows>0)
				throwError("Unit number already exists");


			$sql = new BaseSQL();
			$superUnitId = $superUnitId?:'0';
			$query = "INSERT INTO units(courseid, name, description,superunitid,image_url,tab_name) VALUES('{$course_id}', 
'{$mysql_name}',
 '{$mysql_description}',{$superUnitId},'{$image_url}','{$tab_name}')";

			$id = $sql->query_ReturnId($query);
			if(isset($input->recalculate)){
				$data->recalculate = $input->recalculate;
			}
			if(intval(@$input->superUnitId)){
				$classSuperUnits = new ClassSuperUnits();
				$classSuperUnits->addUnitsToSuperUnit([$id],intval(@$input->superUnitId));
			}
			$data->message = 'successful';
			$data->query = $query;
			$data->id = $id;


			header('Content-Type: application/json');
			print json_encode($data);
			exit();
		}			
	} else if($action == 'update') {
		if($_SERVER['REQUEST_METHOD'] == 'POST') {
			$json_input = file_get_contents('php://input');

                     $input = json_decode($json_input);

			$unit_id = $DB->mysqli->real_escape_string($input->unitid);
			$unit_id = intval($unit_id);

			$mysql_name = $DB->mysqli->real_escape_string($input->unit_number);
			$mysql_name = intval($input->unit_number);
			$image_url = @$input->image_url?$input->image_url:'';
			$mysql_hide_from_student = intval($input->hide_from_student);

			$mysql_description = $DB->mysqli->real_escape_string($input->unit_title);
			$tab_name = $DB->mysqli->real_escape_string($input->tab_name);

			$query = "UPDATE units SET image_url='{$image_url}', name='{$mysql_name}', description='{$mysql_description}',
hide_from_student = '{$mysql_hide_from_student}',tab_name = '{$tab_name}' WHERE id={$unit_id}";

			$DB->mysqli->query($query);

			$data = new \stdClass();

			$data->message = 'successful';
                     $data->query = $query;
			if(intval(@$input->superUnitId)){
				$classSuperUnits = new ClassSuperUnits();
				$classSuperUnits->addUnitsToSuperUnit([$unit_id],intval(@$input->superUnitId));
			}

			header('Content-Type: application/json');
			print json_encode($data);
			exit();
		}
	}
	else if($action== 'clone'){
		$input = get_input();
		$new_id = $input->id;
		$raw_pages = $input->pages;
		$cloneQuizzes = boolval($input->cloneQuizzes);
		$clonePrompts = boolval($input->clonePrompts);
		$pageSQL = new PageSQL();
		$classId = ClassesController::_getFromUnitId($new_id);
		$util = new Utility();
		//grouping pages
		$group_pages = array();
		foreach($raw_pages as $page){
			if($page->pagegroupid>0){
				if(!isset($group_pages[$page->pagegroupid])){
					$group_pages[$page->pagegroupid]=array('pages'=>array());
				}
				$group_pages[$page->pagegroupid]['pages'][]=$page;
			}
			else{
				if(!isset($group_pages[$page->id])){
					$group_pages[$page->id]=array('pages'=>array());
				}
				$group_pages[$page->id]['page']=$page;
			}
		}

		foreach($group_pages as $group){
			$pageinfo = $pageSQL->get_by_id($group['page']->id);
			if($cloneQuizzes && $group['page']->layout == "QUIZ" ){
				$pageinfo->quiz_id = \English3\Controller\CloneController::_cloneQuiz($pageinfo->quiz_id);
			}
			if($pageinfo->timed_id){
				$pageinfo->timed_id = \English3\Controller\CloneController::_cloneTimedReview($pageinfo->timed_id,$clonePrompts);
			}
			$query = clonePageQuery($pageinfo,$group['page']->cloned_name,$new_id,0);
			$newGroupId = $pageSQL->query_ReturnId($query);
			cloneAssignments($newGroupId,$group['page']->id,$classId);
            $content = \English3\Controller\Utility::getInstance()->fetchOne('SELECT content from pages where id = :pageId',['pageId'=>$newGroupId]);
            \English3\Controller\Pages\PageVersions::_save($newGroupId,$content,true);
			foreach($group['pages'] as $page){
				if($cloneQuizzes && $page->layout == "QUIZ" ){
					$pageinfo->quiz_id = \English3\Controller\CloneController::_cloneQuiz($pageinfo->quiz_id);
				}
				$pageinfo = $pageSQL->get_by_id($page->id);
				if($pageinfo->timed_id){
					$pageinfo->timed_id = \English3\Controller\CloneController::_cloneTimedReview($pageinfo->timed_id,$clonePrompts);
				}
				$query = clonePageQuery($pageinfo,$page->cloned_name,$new_id,$newGroupId);
				$newPageId = $pageSQL->query_ReturnId($query);
                $content = \English3\Controller\Utility::getInstance()->fetchOne('SELECT content from pages where id = :pageId',['pageId'=>$newPageId]);
                \English3\Controller\Pages\PageVersions::_save($newPageId,$content,true);
                cloneAssignments($newPageId,$page->id,$classId);
			}
		}
		if(isset($input->recalculate)){
			$classId = $util->fetchOne(ClassesController::$queryGetFromUnitId,['unitId'=>$new_id]);
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
		jsonResponse(['message'=>'successful']);
	}
	else if($action== 'get'){
		$input = $_REQUEST;
		$course_id = $input['courseid'];

		$orderBy = '';
		$limit = '';
		if(isset($input['orderBy'])) $orderBy = 'order by ' . $input['orderBy'];
		if(isset($input['limit'])) $limit = 'limit ' .$input['limit'];

		$sql = new BaseSQL();

		$query = "SELECT * from units WHERE courseid={$course_id} {$orderBy} {$limit}";
		$result = $sql->query($query);
		jsonResponse(['units'=>$result]);
	}
	else if($action == 'delete') {
		if($_SERVER['REQUEST_METHOD'] == 'POST') {
			$json_input = file_get_contents('php://input');

                     $input = json_decode($json_input);

			$data = new \stdClass();

			$unit_id = $DB->mysqli->real_escape_string($input->unitid);
			$unit_id = intval($unit_id);

			$query = "SELECT unitid FROM pages WHERE unitid={$unit_id} LIMIT 1";

			$result = $DB->mysqli->query($query);

			if($result && $result->num_rows == 0) {
                \English3\Controller\Utility::moveToHistory('units','units_history',$unit_id);

				$data->message = 'successful';
				$data->query = $query;
			} else {
				if(isset($input->forceDelete) and $input->forceDelete){
					\English3\Controller\Utility::moveToHistory('units','units_history',$unit_id);
					$DB->mysqli->query($query);
					$data->message='successful';
				}else{
					$util = new Utility();
					$data->message = 'has_children';
					try{
						$data->needGradebookRecalculation = boolval($util->fetchOne(PageController::$queryGetUnitGradeablePages,['unitId'=>$unit_id]));
					}catch(\Exception $e){

					}

				}
			}
				

			header('Content-Type: application/json');
			print json_encode($data);
			exit();

		}
	} else if(is_numeric($action) && $action > 0) {
		$action = intval($action);
		$user_id = intval($_SESSION['USER']['ID']);
		$classId = ClassesController::_getFromUnitId($action);
		Utility::getInstance()->checkTeacher($classId);

		$query = "SELECT units.id, units.name,units.image_url, units.description,units.hide_from_student,superunitid as superUnitId,
units.tab_name FROM units WHERE units.id={$action}";

		$result = $DB->mysqli->query($query);

		if($result && $result->num_rows == 1) {
			$row = $result->fetch_object();

			$data = new \stdClass();

			$data->unit = new \stdClass();

			$data->unit = clone $row;
			$data->unit->hide_from_student=boolval($data->unit->hide_from_student);
			header('Content-Type: application/json');
			print json_encode($data);
			exit();
		} else {
			$data = new \stdClass();

			header('Content-Type: application/json');
			print json_encode($data);
			exit();
		}
	}

	exit();
}

?>