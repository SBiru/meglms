<?php
namespace English3\Controller\QuizzesAndQuestions;
use English3\Controller\QuizzesAndQuestions\Questions\QuestionFactory;
use English3\Controller\Utility;

/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.26.4
 * Time: 22:14
 */

class AfterLeavePageQuestions {

    static public function classResponses($classId){
        $rawResponses = \English3\Controller\Utility::getInstance()->fetch(
            sprintf(AfterLeavePageQuestionsSQL::$queryAllClassResponses," And c.id=:classId")
            ,['classId'=>$classId]
        );
        $units = array();
        foreach($rawResponses as $row){
            self::prepareUnitResponses($row,$units);
        }
        return $units;
    }
    static private function prepareUnitResponses($row,&$units){
        Utility::addToObjectIfNotExists($row['unitId'],self::unitFromRow($row),$units);
        self::preparePageResponses($row,$units[$row['unitId']]['pages']);
    }
    static private function unitFromRow($row){
        return [
            'id'=>$row['unitId'],
            'position'=>$row['unitPosition'],
            'name'=>$row['unitName'],
            'pages'=>array()
        ];
    }
    static private function preparePageResponses($row,&$pages){
        Utility::addToObjectIfNotExists($row['page_id'],self::pageFromRow($row),$pages);
        self::prepareUserResponses($row,$pages[$row['page_id']]['students']);
    }
    static private function pageFromRow($row){
        return [
            'id'=>$row['page_id'],
            'name'=>$row['pageName'],
            'position'=>$row['position'],
            'students'=>array()
        ];
    }
    static public function pageResponses($pageId){
        $rawResponses = \English3\Controller\Utility::getInstance()->fetch(
            sprintf(AfterLeavePageQuestionsSQL::$queryAllClassResponses," And pr.page_id=:pageId")
            ,['pageId'=>$pageId]
        );
        $users = array();
        foreach($rawResponses as $row){
            self::prepareUserResponses($row,$users);
        }
        return $users;
    }
    static private function prepareUserResponses($row,&$users){

        Utility::addToObjectIfNotExists($row['user_id'],self::userFromRow($row),$users);
        $users[$row['user_id']]['questions'][]= self::prepareQuestion($row);
    }
    static private function userFromRow($row){
        return [
            'questions'=>array(),
            'id'=>$row['user_id'],
            'fname'=>$row['fname'],
            'lname'=>$row['lname']
        ];
    }
    static private function prepareQuestion($row){
        $type = $row['type'];
        if(!array_key_exists($row['type'],QuestionFactory::$availableTypesWithClasses)){
            $type = 'simplequestion';
        }
        $question = QuestionFactory::createFromTypeWithId($type,$row['question_id']);
        $question->grader->setStudentResponse(json_decode($row['response']));
        $q = (array) $question->grader->prepareForDisplay();
        $q['type']=$row['type'];
        return $q;
    }
}
class AfterLeavePageQuestionsSQL{

    static public $queryAllClassResponses = <<<SQL
    SELECT pr.*,
    q.type,
    p.name as pageName,p.position,
    users.fname,users.lname,
    u.id as unitId,u.name as unitPosition,u.description as unitName
     FROM page_question_reponses  pr
    join pages p on pr.page_id = p.id
    join units u on u.id = p.unitid
    join classes c on c.courseid = u.courseid
    join users on users.id = pr.user_id
    join user_classes uc on uc.userid = users.id and uc.classid = c.id
    join questions q ON pr.question_id = q.id
    WHERE uc.is_student = 1 %s
    ORDER BY u.name,p.position
SQL;

}

