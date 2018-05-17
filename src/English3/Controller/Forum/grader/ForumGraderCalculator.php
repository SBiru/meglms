<?php
namespace English3\Controller\Forum\grader;



use English3\Controller\GradebookController;
use English3\Controller\Utility;

class ForumGraderCalculator{
    /**
     * @var ForumGraderCalculatorSQL
     */
    private $sql;
    private $forumId;
    private $gradeMode;
    public function __construct($forumId)
    {
        $this->sql = new ForumGraderCalculatorSQL();
        $this->forumId = $forumId;
        $this->loadGradeMode();
    }
    private function loadGradeMode(){
        if(!$this->gradeMode = Utility::getInstance()->fetchOne($this->queryLoadGradeMode,['forumId'=>$this->forumId])){
            $this->gradeMode = 'perPost';
        }
    }
    public function gradePost($postId,$userId,$grade,$message){
        $this->sql->savePostGrade($postId,$grade,$message);
        if($this->gradeMode=='perPostMax'){
            return $this->updateForumGradeIfNeeded($userId,$grade);
        }
        $avg = round($this->sql->getForumAvg($this->forumId,$userId),2);
        return $this->saveForumAvg($userId,$avg,'',false);


    }
    public function saveForumAvg($userId,$grade,$message = '',$spread=true){
        $this->sql->saveForumGrade($this->forumId,$userId,$grade,$message);
        if($this->gradeMode!='perPostMax' && $spread ){
            $this->spreadForumPoints($userId,$grade);
        }
        $classId = Utility::getInstance()->fetchOne("SELECT classid From forums where id = ".$this->forumId);
        GradebookController::_recalculate($userId,$classId);
        return $grade;
    }

    private function spreadForumPoints($userId,$grade){
        $this->sql->setGradeToAllPosts($this->forumId,$userId,$grade);
    }
    private function updateForumGradeIfNeeded($userId,$grade){
        $currentGrade = $this->sql->getForumGrade($this->forumId,$userId);
        if($currentGrade<$grade){
            $this->sql->saveForumGrade($this->forumId,$userId,$grade);
            return $grade;
        }
        return $currentGrade;
    }
    private $queryLoadGradeMode = <<<SQL
    SELECT meta_value from page_meta pm
    join forums f on f.pageid = pm.pageid
     where meta_key='grade_mode' && f.id = :forumId
SQL;

}
