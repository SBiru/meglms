<?php
require_once('_utils.php');
require_once('sql.php');
require_once('editcourseclass.php');
class Page {
	//TODO security
	public $courseSQL;
	public $cloneQuizzes;
	function __construct($course_id,$newCourseId,$oldClassId,$newClassId,$DB,$cloneQuizzes=null) {
		$this->course_id=$course_id;
		$this->newCourseId=$newCourseId;
		$this->oldClassId=$oldClassId;
		$this->newClassId=$newClassId;
		$this->DB =$DB;
		$this->courseSQL = new CourseSQL();
		$this->cloneQuizzes=$cloneQuizzes;
	}

	public function set_page_data($row){
		$this->page_row = $row;
	}

	public function is_page_set(){
		return isset($this->page_row);
	}
	public function set_has_assignment(){
		$this->has_assignment = true;
	}
	public function set_parent($parent){
		$this->parent=$parent;
	}
	public function has_parent(){
		return isset($this->parent);
	}
	public function cloned_id(){
		if(isset($this->cloned_id_m)){
			return $this->cloned_id_m;
		}
		else return false;
	}
	public function set_cloned_id($id){
		$this->cloned_id_m = $id;
	}
	public function old_id(){
		if(!$this->is_page_set()) return false;

		return $this->page_row->id;
	}

	public function clone_page($parent){
		if(!$this->old_id()) return false;
		$this->courseSQL->clone_page($parent,$this->newCourseId,$this->course_id,$this->old_id(),$this->cloneQuizzes);
		$this->set_cloned_id( $this->DB->mysqli->insert_id);
	}
	public function clone_assignments(){
		$this->courseSQL->clone_assignments($this->newClassId,$this->cloned_id(),$this->oldClassId,$this->old_id());
	}
	public function clone_(){
		if($this->cloned_id()) return;
		$parent = 0;
		if($this->has_parent()){
			if(!$this->parent->cloned_id()){
				$this->parent->clone_();
			}
			$parent = $this->parent->cloned_id();
		}
		$this->clone_page($parent);

		if(isset($this->has_assignment)) $this->clone_assignments();
		$content = \English3\Controller\Utility::getInstance()->fetchOne('SELECT content from pages where id = :pageId',['pageId'=>$this->cloned_id()]);
        \English3\Controller\Pages\PageVersions::_save($this->cloned_id(),$content,true);
	}
}

class EditCourse {
	public $DB;
	public $user_id;

	function __construct($db,$user_id) {
		$this->DB=$db;
		$this->user_id=$user_id;
	}

	public function save($input){
		$DB = $this->DB;
		$data = new \stdClass();
		$courseSQL = new CourseSQL();
		$departmentSQL = new DepartmentSQL();

		$department_id = intval($input->department_id);
		$data->index = intval($input->index);




		$result = $departmentSQL->get_by_id($department_id);

		if($result && count($result) == 1) {
			$mysql_name   = $DB->mysqli->real_escape_string($input->name);
			$mysql_description = isset($input->description) ? $DB->mysqli->real_escape_string($input->description) : $DB->mysqli->real_escape_string('None Provided');
			$mysql_native_language = $DB->mysqli->real_escape_string($input->native_language);

			if(strlen($mysql_name) > 0) {
				$max_position = 0;

				$result = $courseSQL->max_position($department_id);

				if($result && count($result) == 1) {
					$max_position = $result[0]->max_position + 1;
				}

				$courseSQL->insert_course($department_id,$mysql_name,$mysql_description,$max_position,$mysql_native_language,$data);
				if($data->course_id){
					$input->course_id =$data->course_id;
					$data = addClass($input);
					$data->message = 'successful2';
				}else{
					$data->message = 'Could not add course.';
				}

			} else {
				$data->message = 'Course Name Must Not Be Empty';
			}

			header('Content-Type: application/json');
			print json_encode($data);
			exit();
		}

	}
	/*
     * If an error occurs in any stage, we need rollback.
     */
	function rollback($rollbackTables)
	{
		$courseSQL = new CourseSQL();
		foreach ($rollbackTables as $table) {
			$courseSQL->rollBack($table);
		}
	}
	public function cloneCourse($input){
		$user_id = $this->user_id;
		$cloneQuizzes = boolval($input->cloneQuizzes);
		$DB = $this->DB;
		$data = new \stdClass();
		$courseSQL = new CourseSQL();
		$pageSQL = new PageSQL();
		$classSQL = new ClassSQL();

		header('Content-Type: application/json');
		if(!isset($input->courses)){
			$data->message = "No courses to be cloned";
			print json_encode($data);
			exit();
		}

		$courses = $input->courses;

		foreach($courses as $course) {





			$rollbackTables = array();
			/*
             * First, we'll create a new course
             */
			if (!(isset($course->new_name) && $course->new_name != '')) {
				$data->message = "Ner course name cannot be empty";
				print json_encode($data);
				exit();
			}

			$mysql_name = $DB->mysqli->real_escape_string($course->new_name);

			$courseSQL->clone_course($mysql_name,$course);

			if ($DB->mysqli->errno != 0 || $DB->mysqli->insert_id == 0) {
				$data->message='Unable to create new course';
				print json_encode($data);
				exit();
			} else {
				$newCourseId = $DB->mysqli->insert_id;
				$table = new \stdClass();
				$table->name = 'courses';
				$table->id_field = 'id';
				$table->courseId = $newCourseId;
				$rollbackTables[] = $table;
			}


			/* DSerejo 2015-02-08
             * tables where course must be cloned (not sure about it):

             * 	-classes
             * 	-objectives

             * 	-units
             * 	-pages (after units)
             */

			//Cloning banks

//			$courseSQL->clone_banks($newCourseId,$user_id,$course);
//
//			if ($DB->mysqli->errno == 0 || $DB->mysqli->insert_id > 0) {
//				$table = new \stdClass();
//				$table->name = 'banks';
//				$table->id_field = 'course_id';
//				$table->courseId = $newCourseId;
//				$rollbackTables[] = $table;
//			} else {
//				//An error has occurred! lets rollback
//				$this->rollback($rollbackTables);
//				$data->message='Unable to clone banks';
//				print json_encode($data);
//				exit();
//			}

			//Cloning classes



			$result = $classSQL->get_by_course_id($course->id);

			if(count($result) == 0){
				throwError("No classes to be cloned");
			}

			$oldClassId = $result[0]->id;

			$courseSQL->clone_classes($newCourseId,$mysql_name,$course,$course->term->id==0?'null':$course->term->id);

			$newClassId = 0;
			if ($DB->mysqli->errno == 0 && $DB->mysqli->insert_id > 0) {
				$table = new \stdClass();
				$table->name = 'classes';
				$table->id_field = 'courseid';
				$table->courseId = $newCourseId;
				$newClassId=$DB->mysqli->insert_id;
				$rollbackTables[] = $table;
			} else {
				//An error has occurred! lets rollback
				$this->rollback($rollbackTables);
				$data->message='Unable to clone classes';
				print json_encode($data);
				exit();
			}
			//Cloning objectives
			$courseSQL->clone_objectives($newCourseId,$user_id,$course);
			if ($DB->mysqli->errno == 0 || $DB->mysqli->insert_id > 0) {
				$table = new \stdClass();
				$table->name = 'objectives';
				$table->id_field = 'course_id';
				$table->courseId = $newCourseId;
				$rollbackTables[] = $table;
			} else {
				//An error has occurred! lets rollback
				$this->rollback($rollbackTables);
				$data->message='Unable to objectives classes';
				print json_encode($data);
				exit();
			}
			//We are not cloning quizzes anymore. Quizzes belongs to an org now
			//Cloning quizzes
			$courseSQL->clone_quizzes($newCourseId,$user_id,$course);
			if ($DB->mysqli->errno == 0 || $DB->mysqli->insert_id > 0) {
				$table = new \stdClass();
				$table->name = 'quizzes';
				$table->id_field = 'course_id';
				$table->courseId = $newCourseId;
				$rollbackTables[] = $table;
			} else {
				//An error has occurred! lets rollback
				$this->rollback($rollbackTables);
				$data->message='Unable to clone quizzes';
				print json_encode($data);
				exit();
			}

			//Cloning units
			$courseSQL->clone_units($newCourseId,$course);
			if ($DB->mysqli->errno == 0 || $DB->mysqli->insert_id > 0) {
				$table = new \stdClass();
				$table->name = 'units';
				$table->id_field = 'courseid';
				$table->courseId = $newCourseId;
				$rollbackTables[] = $table;
			} else {
				//An error has occurred! lets rollback
				$this->rollback($rollbackTables);
				$data->message='Unable to clone units';
				print json_encode($data);
				exit();
			}

			//Cloning pages and class assignments

			$result = $pageSQL->get_pages_by_course_id($course);

			$pages = new \stdClass();
			foreach($result as $row){
				$id = $row->id;

				if(!isset($pages->$id)){
					$page = new Page($course->id,$newCourseId,$oldClassId,$newClassId,$DB,$cloneQuizzes);
					$pages->$id = $page;
				}
				$pages->$id->set_page_data($row);

				if($row->pagegroupid >  0 ){
					$parent_id = $row->pagegroupid;
					if(!isset($pages->$parent_id)){
						$pages->$parent_id = new Page($course->id,$newCourseId,$oldClassId,$newClassId,$DB,$cloneQuizzes);
					}
					$pages->$id->set_parent($pages->$parent_id);
				}

				if(!is_null($row->assignment_id)){
					$pages->$id->set_has_assignment();
				}
			}

			foreach($pages as $page){
				$page->clone_();
			}



		}
		$data->message="successful";
		print json_encode($data);
		exit();
	}
	public function update($input)
	{	$DB = $this->DB;
		$data = new \stdClass();
		$courseSQL = new CourseSQL();

		$course_id = intval($input->id);
		$dept_id = intval($input->departmentId);
		$mysql_name   = $DB->mysqli->real_escape_string($input->name);
		$mysql_description = $DB->mysqli->real_escape_string($input->description);
		$mysql_native_language = $DB->mysqli->real_escape_string($input->native_language);

		if(strlen($mysql_name) > 0) {
			$courseSQL->update($mysql_name,$mysql_description,$mysql_native_language,$course_id,$dept_id);
			$data->message = 'successful';

		} else {
			$data->message = 'Course Name Must Not Be Empty';
		}

		header('Content-Type: application/json');
		print json_encode($data);
		exit();
	}
	public function delete($input)
	{
		$DB = $this->DB;
		$data = new \stdClass();
		$courseSQL = new CourseSQL();
		$unitSQL = new UnitSQL();
		$course_id = intval($input->id);



		$result = $unitSQL->get_by_course_id($course_id);

		if ($result && count($result) == 0) {
			$courseSQL->delete_by_id($course_id);

			$data->message = 'successful';
		} else {
			$data->message = 'Could Not Delete Course. There Are Units Associated With This Course. Please Delete The Units Before Deleting The Course.';
		}


		header('Content-Type: application/json');
		print json_encode($data);
		exit();
	}
	public function languages()
	{
		$data = new \stdClass();

		$languageSQL = new LanguageSQL();
		$result = $languageSQL->get_all();

		if ($result && count($result) > 0) {
			$data->list = $result;
		}

		print json_encode($data);
		exit();
	}
	public function getavailablecourses($input)
	{
		$DB = $this->DB;
		$data = new \stdClass();
		$departmentSQL = new DepartmentSQL();
		$courseSQL = new CourseSQL();
		$department_id = intval($input->id);

		$result = $departmentSQL->get_by_id($department_id);

		if ($result && count($result) == 1) {

			$result = $courseSQL->get_all_by_department_id($department_id);
			if($result && count($result) > 0) {
				$data->courses=array();
				$data->courses = $result;
				$data->message='successful';
			}
			else{
				$data->message='No courses available to be cloned';
			}
		}
		else{
			$data->message='Department not found';
		}
		header('Content-Type: application/json');
		print json_encode($data);
		exit();
	}
	public function get($action)
	{
		$courseSQL = new CourseSQL();
		$id=explode('-',$action)[0];
		$DB = $this->DB;
		$result = $courseSQL->get_by_id($id);
		if ($result && count($result) == 1) {
			$row = $result[0];

			$data = new \stdClass();

			$data->course = new \stdClass();

			$data->course = clone $row;

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
}

function main($uri)
{
	global $PATHS, $DB;

	$user_id = is_valid_user($_SESSION,true);
	//is_admin_user($user_id,$DB,true);

	$editCourse = new EditCourse($DB,$user_id);

	$input = get_input();

	$action = get_action('/editcourse/',$uri);

	if($action=='save'){
		is_admin_user($user_id,$DB,true);
		$editCourse->save($input);
	}
	else if($action=='update')
	{
		//is_admin_user($user_id,$DB,true);
		$editCourse->update($input);
	}

	else if($action=='languages'){
		$editCourse->languages($input);
	}
	else if($action=='getavailablecourses'){
		is_admin_user($user_id,$DB,true);
		$editCourse->getavailablecourses($input);
	}
	else if($action=='delete'){
		is_admin_user($user_id,$DB,true);
		$editCourse->delete($input);
	}
	else if($action=='clone'){
		is_admin_user($user_id,$DB,true);
		$editCourse->cloneCourse($input);
	}
	else {
		$editCourse->get($action);
	}

}
$uri = strtok($_SERVER['REQUEST_URI'], '?');
if (substr($uri,0,11)=='/editcourse'){
	main($uri);
}

?>