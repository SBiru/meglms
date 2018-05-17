<?php
namespace English3\Controller\Grader;

use English3\Controller\ClassesController;
use English3\Controller\Posts\SiblingServerFinder;
use English3\Controller\Utility;

class GraderActivity {
    private $pageId;
    private  $courseId;
    private  $groupId;
    private  $sortOrder;
    private  $classId;
    private  $userId;
    private static $sortNameBy= 'lname';
    public function __construct($pageId,$courseId,$classId,$groupId,$userId,$sortOrder){
        $this->pageId = $pageId;
        $this->courseId = $courseId;
        $this->groupId = $groupId;
        $this->sortOrder = $sortOrder;
        $this->classId = $classId;
        $this->userId = $userId;
    }

    public function getAndPreparePosts($isArchive=false){
        Utility::getInstance()->checkTeacher($this->classId);
        $posts = GraderActivitySQL::getPagePosts($this->classId,$this->pageId,$this->groupId,$this->sortOrder,$isArchive);
        if($isArchive){
            return $this->prepareArchivePosts($posts);
        }else{
            return $this->preparePosts($posts,$this->classId,$this->pageId,$this->groupId,$this->sortOrder);
        }

    }
    private function preparePosts($posts,$classId,$pageId,$groupId,$sortOrder){
        $data               = new \stdClass();
        $postedMessages = array();
        if (count($posts)) {
            foreach ($posts as $row) {
                $row = json_decode(json_encode($row));
                if(!isset($data->page)){
                    $data->page=array(
                        'id'=>$row->pageId,
                        'name'=>$row->page_name
                    );
                }
                $result2             = GraderActivitySQL::getAllUserPosts($classId,$pageId,$row->user_id,$groupId,$sortOrder);
                if (count($result2)) {
                    foreach ($result2 as $row2) {
                        $row2 = json_decode(json_encode($row2));
                        $tmp                  = clone $row2;
                        $tmp->needingGrade = boolval($tmp->needingGrade);
                        $postedMessages[] = GraderActivitySQL::getchildren($tmp);
                    }
                }
            }
        }
        $splitPostedMessages = GraderActivity::splitChildrenMessages($postedMessages);
        $data->postmessages = self::groupMessagesByUserAndPage($splitPostedMessages);
        $data->students = self::getStudentsFromMessages($data->postmessages);
        return $data;
    }
    private function prepareArchivePosts($posts){
        $data = new \stdClass();
        $data->postmessages = array();
        $data->teachers=array();
        foreach ($posts as $row) {
            $row = json_decode(json_encode($row));
            if(!isset($data->page)){
                $data->page=array(
                    'id'=>$row->pageId,
                    'name'=>$row->page_name,
                    'unitName'=>$row->unit_name
                );
            }
            $data->upload_url = Utility::urlencodepath($data->upload_url);
            $tmp                  = new \stdClass();
            $grade_comments       = GraderActivitySQL::get_comments($row->postrootparentid);
            $row->grade_comments  = (is_array($grade_comments))? $grade_comments['grade_comments'] : '';
            $row->update_id       = (is_array($grade_comments))? $grade_comments['update_id'] : '';
            $tmp                  = clone $row;
            $tmp->hasVideo = boolval($tmp->video_url);
            $data->postmessages[] = GraderActivitySQL::getchildren($tmp);

            if($row->teacher_id && !isset($data->teachers[$row->teacher_id]))
                $data->teachers[$row->teacher_id]=array(
                    "user_id"=>$row->teacher_id,
                    "fname"=>$row->teacher_fname,
                    "lname"=>$row->teacher_lname,
                );
        }
        $data->postmessages = graderActivity::splitChildrenMessages($data->postmessages);
        $data->postmessages = self::groupMessagesByUserAndPage($data->postmessages);
        $data->students = self::getStudentsFromMessages($data->postmessages);
        $data->teachers=array_merge($data->teachers);
        return $data;
    }
    public static function splitChildrenMessages($postedMessages){
        $rootMessage = array();
        $postedMessages = json_decode(json_encode($postedMessages),true);
        foreach($postedMessages as $message){
            if(!isset($rootMessage[$message['postrootparentid']])){
                $rootMessage[$message['postrootparentid']] = array('replies'=>array());
            }
            if($rootMessage[$message['postrootparentid']]==@$rootMessage[$message['id']]){
                $replies = $rootMessage[$message['postrootparentid']]['replies'];
                $rootMessage[$message['postrootparentid']] = $message;
                $rootMessage[$message['postrootparentid']]['replies'] = $replies;
            }else{
                $rootMessage[$message['postrootparentid']]['replies'][]=$message;
            }
        }
        return array_values($rootMessage);
    }
    public static function groupMessagesByUserAndPage($messages){
        $groups = self::groupMessages($messages);
        foreach($messages as &$message){
            $key = $message['user_id'].'_'.$message['pageId'];
            $message['grouped']=$groups[$key];
            $message['morethenone']=self::getMoreThanOneNumber($message);
            foreach($message['grouped'] as $i=>&$msg){
                $msg['morethenone'] = $i==0?1:2;
            }
        }
        return $messages;
    }
    private static function groupMessages($messages){
        $grouped = array();
        foreach($messages as $i=>$message){
            $key = $message['user_id'].'_'.$message['pageId'];
            if(!isset($grouped[$key])){
                $grouped[$key]=array();
            }
            $grouped[$key][]=&$messages[$i];
        }
        return $grouped;
    }
    private static function getMoreThanOneNumber($message){
        if(count($message['grouped'])==1){
            return 0;
        }else{
            $firstMessageInGroup = $message['grouped'][0];
            return $message['id']==$firstMessageInGroup['id']?1:2;
        }
    }

    public static function prepareCourseAndGroupId($input){
        if(isset($input->courseId)){
            $courseId = $input->courseId;
            if(preg_match("/[0-9]+-[0-9]+/", $courseId)){
                $group_id = intval(explode('-',$courseId)[1]);
                $courseId = intval(explode('-',$courseId)[0]);

            }
        }

        if (!isset($group_id)){
            $group_id = null;
        }
        return [$courseId,$group_id];
    }
    public static function getStudentsFromMessages($messages){
        $students = array();
        foreach ($messages as $message) {
            $message=json_decode(json_encode($message),true);
            Utility::addToObjectIfNotExists($message['user_id'],[
                'user_id'=>$message['user_id'],
                'fname'=>$message['fname'],
                'lname'=>$message['lname'],
                'name'=>self::prepareUserName($message['fname'],$message['lname']),
            ],$students);

        }
        return array_values($students);

    }
    public static function prepareStudents($students){
        foreach($students as &$student){
            $student['name']=self::prepareUserName($student['fname'],$student['lname']);
            $student['disabled']=false;
        }
        return $students;
    }
    public static function prepareUserName($fname,$lname){
        if(self::$sortNameBy=='fname'){
            return $fname . ' ' . $lname;
        }else{
            return $lname . ', ' . $fname;
        }
    }
    public static function prepareTimedReviewTextPrompts($messages){
        foreach ($messages as &$message){
            if($message['layout'] !== 'TIMED_REVIEW') {
                continue;
            }
            $timed_attempt_raw = Utility::getInstance()->fetchOne("SELECT meta_value FROM post_meta WHERE post_id = ? and meta_key='timed_review_attempt'",[$message['id']]);
            try{
                $json = json_decode($timed_attempt_raw,true);
                $prompts = json_decode($json['prompts'],true);
            }catch (\Exception $e){
                continue;
            }

            $textPrompts = array_values(array_filter($prompts,function($p){return @$p['type']==='text';}));
            $message['textPrompts'] = $textPrompts;


        }
        return $messages;
    }


}
