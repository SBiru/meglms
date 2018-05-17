<?php
namespace English3\Controller\Forum\grader;

use English3\Controller\Utility;

class ForumGraderData
{
    public $students = [];
    public $pageInfo = [];

    public function __construct($rawData)
    {
        foreach ($rawData as $row){

            $userId = $row['userid'];
            $entryId =$userId.'-'.$row['forumid'];
            Utility::addToObjectIfNotExists($entryId,$this->newStudentEntry($row),$this->students);
            $this->students[$entryId]['discussions'][]=$this->newTopicEntry($row);
            Utility::addToObjectIfNotExists($row['forumid'],$this->startPageInfo($row),$this->pageInfo);
            Utility::addToObjectIfNotExists('pageInfo',
                $this->addForumGradeData($row,$this->pageInfo[$row['forumid']]),
                $this->students[$entryId]
            );

        }
    }
    private function startPageInfo($row){
        $forumData = Utility::getInstance()->fetchRow('SELECT f.classid,p.name,p.id,pm.meta_value as grade_mode,ca.points,p.rubricid FROM 
pages p 
join forums f on f.pageid = p.id 
join page_meta pm on pm.pageid = p.id and pm.meta_key = "grade_mode"
join class_assignments ca on ca.page_id = p.id
where f.id = '.$row['forumid']);
        return [
            'name'=>$forumData['name'],
            'id'=>$forumData['id'],
            'forumId'=>$row['forumid'],
            'classId'=>$row['classid'],
            'gradeMode'=>$forumData['grade_mode'],
            'maxScore'=>floatval($forumData['points']),
            'useRubric'=>boolval(@$forumData['rubricid']),
            'rubricId'=>@$forumData['rubricid']
        ];
    }
    private function addForumGradeData($row,$pageInfo){
        $forumGradeData = Utility::getInstance()->fetchRow("SELECT grade,message FROM forum_grade where forumid={$row['forumid']} and studentid = {$row['userid']}");
        $pageInfo['avgScore']=$forumGradeData['grade'];
        $pageInfo['feedback']=$forumGradeData['message'];
        $pageInfo['created'] = $row['created'];
        return $pageInfo;
    }
    private function newStudentEntry($row){
        return [
            'id'=>$row['userid'],
            'fname'=>$row['fname'],
            'lname'=>$row['lname'],
            'type'=>'forum',
            'discussions'=>[]
        ];
    }
    private function newTopicEntry($row){
        return [
            'title'=>$row['title'],
            'created'=>$row['created'],
            'id'=>$row['id']
        ];
    }
    public function toObject()
    {
        return [
            'students'=>array_values($this->students),
        ];
    }
}