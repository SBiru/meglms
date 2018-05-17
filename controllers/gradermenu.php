<?php

global $PATHS, $DB;
use English3\Controller\ClassesController;
use English3\Controller\Grader\MenuQuery;
use English3\Controller\QuizzesAndQuestions\AfterLeavePageQuestions;
use English3\Controller\Utility;

require_once('sql.php');
require_once('_utils.php');

function archive_for_admin_user($menu_id,$group_id){
	return "";
}

if(isset($_SESSION['USER']) && isset($_SESSION['USER']['LOGGED_IN']) && isset($_SESSION['USER']['ID']) && $_SESSION['USER']['ID'] > 0 && $_SESSION['USER']['LOGGED_IN']==true) {
	$uri = strtok($_SERVER['REQUEST_URI'], '?');

	$uri = str_replace('/gradermenu/', '', $uri);

	$menu_id = strtok($uri, '/');
    $isArchive = false;

    if($menu_id=='archive'){
        $uri = str_replace('archive/', '', $uri);
        $menu_id = strtok($uri, '/');
        if((is_numeric($menu_id) && $menu_id > 0)||preg_match("/[0-9]+-[0-9]+/", $menu_id)){
            $isArchive = true;
        }
    }
	//if there is a group, the id must be courseid-groupid
	if((is_numeric($menu_id) && $menu_id > 0)||preg_match("/[0-9]+-[0-9]+/", $menu_id)) {
		if(preg_match("/[0-9]+-[0-9]+/", $menu_id)){
			$group_id = intval(explode('-',$menu_id)[1]);
			$menu_id = intval(explode('-',$menu_id)[0]);

		}
		else{
			$menu_id = intval($menu_id);
			$group_id=null;
		}

		$user_id = INTVAL($_SESSION['USER']['ID']);
        $query = "";
		$class_id = ClassesController::_getFromCourseId($menu_id);
        if(!$isArchive) {

            $query = MenuQuery::needGradeMenu($menu_id,$class_id,$group_id);
			$students = Utility::getInstance()->fetch(MenuQuery::needGradeStudents($class_id,$group_id));
        } else {
			//18-jun-2015
			//Changing the query so that admin users can see all the content
            $query = MenuQuery::archiveMenu($menu_id,$class_id,$group_id);
			$students = Utility::getInstance()->fetch(MenuQuery::archiveStudents($menu_id,$class_id,$group_id));
        }

			$result = $DB->mysqli->query($query);


		if($result && $result->num_rows > 0) {
			$temp = array();
			$first_unit_id = 0;
			$added_vocab = false;

			$data = new \stdClass();

			$data->units = array();
			$pagesById = array();

			while($row = $result->fetch_object()) {
				if(isset($temp[$row->id])) {
					$temp_class = new \stdClass();
					if(isset($row->page_id) && $row->page_id > 0) {
						$temp_class->id     = $row->page_id;
						$temp_class->header_id = $row->header_id;
						$temp_class->position = intval($row->position);
						$temp_class->unitPosition = intval($row->name);
						$temp_class->external_link = '';
						$temp_class->layout = strtolower($row->layout);
						$temp_class->label  = $row->pagename;
						$temp_class->subtitle  = $row->subtitle;
						$temp_class->count_needing_grading  = $row->count_needing_grading;
						$temp_class->class_assignment_id = $row->class_assignment_id;
						$temp_class->allow_video_post = $row->allow_video_post;
						$temp_class->allow_text_post = $row->allow_text_post;
						$temp_class->allow_upload_post = $row->allow_upload_post;
						$temp_class->allow_template_post = $row->allow_template_post;
						if($temp_class->layout == 'external_link') {
							$temp_class->external_link = $row->content;
						}

						$pagesById[$row->page_id] = $temp_class;
						$temp[$row->id]->pages[] = &$pagesById[$row->page_id];
					}
				} else {
                    $temp[$row->id] = new \stdClass();
					$temp[$row->id]->id = $row->id;
					$temp[$row->id]->name = intval($row->name);
					$temp[$row->id]->description = $row->description;
					$temp[$row->id]->pages = array();

					$temp_class = new \stdClass();

					if(isset($row->page_id) && $row->page_id > 0) {
						$temp_class->id     = $row->page_id;
						$temp_class->position = intval($row->position);
						$temp_class->unitPosition = intval($row->name);
						$temp_class->header_id = $row->header_id;
						$temp_class->external_link = '';
						$temp_class->layout = strtolower($row->layout);
						$temp_class->label  = $row->pagename;
						$temp_class->subtitle  = $row->subtitle;
						$temp_class->count_needing_grading  = $row->count_needing_grading;
						$temp_class->class_assignment_id = $row->class_assignment_id;
						$temp_class->allow_video_post = $row->allow_video_post;
						$temp_class->allow_text_post = $row->allow_text_post;
						$temp_class->allow_upload_post = $row->allow_upload_post;
						$temp_class->allow_template_post = $row->allow_template_post;

						if($temp_class->layout == 'external_link') {
							$temp_class->external_link = $row->content;
						}
						$pagesById[$row->page_id] = $temp_class;
						$temp[$row->id]->pages[] = &$pagesById[$row->page_id];

					}
				}
			}
			if($isArchive){
				$unitsWithPageQuestions = AfterLeavePageQuestions::classResponses($class_id);
				foreach($unitsWithPageQuestions as $id=>$unit){
					$pages = array_map(function($page) use ($pagesById,$id,&$temp){
						$page['label'] = $page['name'];
						$page['layout'] = 'content';
						$page['count_needing_grading']=count($page['students']);
						$page['onlyQuestion']= true;
						if($temp[$id]){
							if($pagesById[$page['id']]){
								$newCount =$pagesById[$page['id']]->count_needing_grading+$page['count_needing_grading'];
								$pagesById[$page['id']]->count_needing_grading=$newCount;
							}else{
								$temp[$id]->pages[] = $page;
							}
						}
						return $page;
					},$unit['pages']);
					if(!$temp[$id]){
						$unit['pages']=$pages;
						$temp[$id]=(object)$unit;
					}
				}
			}
            
			$data->query = $query;
			$temp =array_map(function($unit){
				$pages = (array)$unit->pages;
				Utility::sortBy($pages,'position');
				$newPages = array();
				foreach($pages as $p){
					$newPages[]=$p;
				}
				$unit->pages = $newPages;

				return $unit;
			},(array)$temp);
			$temp = array_values($temp);
			Utility::sortBy($temp,'name');
			$data->units = array();
			foreach ($temp as $unit) {
				$data->units[]=$unit;
			}

			$data->students =\English3\Controller\Grader\GraderActivity::prepareStudents($students);

			$data->hasOnlyOnePage = checkHasOnlyOnePage($data);
			$data->doNotUpdateUsers = boolval(@$_REQUEST['doNotUpdateUsers']);
			header('Content-Type: application/json');

			print json_encode($data);

			//include_once($PATHS->app_path . $PATHS->data_path . '/' . $menu_id . '.json');
		}
	}

	exit();
}
function checkHasOnlyOnePage($data){
	$pagesFound = 0;
	foreach ($data->units as $unit){
		foreach ($unit->pages as $page){
			$pagesFound++;
			if($pagesFound>1){
				return false;
			}
		}
	}
	return $pagesFound==1;
}


?>
