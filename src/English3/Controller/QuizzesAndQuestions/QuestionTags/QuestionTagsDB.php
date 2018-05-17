<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 2/21/17
 * Time: 1:06 PM
 */

namespace English3\Controller\QuizzesAndQuestions\QuestionTags;


use English3\Controller\QuizzesAndQuestions\Banks\BankController;
use English3\Controller\Utility;

class QuestionTagsDB {
    public function createTag($tag,$orgId = null){
        $userId = $_SESSION['USER']['ID'];
        if(!$orgId){
            $orgId = Utility::getInstance()->fetchOne('SELECT organizationid FROM users where id = :id',['id'=>$userId]);
        }
        Utility::getInstance()->reader->insert('tags',[
            'name'=>$tag,
            'created_by'=>$userId,
            'org_id'=>$orgId
        ]);
        return Utility::getInstance()->reader->lastInsertId();
    }

    public function getTag($tagId){
        return Utility::getInstance()->fetchRow($this->queryGetTag,['id'=>$tagId]);
    }
    public function assignTagsToQuestion($questionId,$tags){
        $this->removeTagsFromQuestion($questionId);
        foreach($tags as $tagId){
            Utility::getInstance()->reader->insert('question_tags',['question_id'=>$questionId,'tag_id'=>$tagId]);
        }
        $tags = QuestionTags::getQuestionCustomTags(['id'=>$questionId]);
        return $tags;
    }
    private function removeTagsFromQuestion($questionId){
        Utility::getInstance()->reader->delete('question_tags',['question_id'=>$questionId]);
    }
    public function getOrCreateTagIdFromName($name){
        if($tagId = Utility::getInstance()->fetchOne($this->queryGetTagFromName,['name'=>$name],'id')){
            return $tagId;
        }
        return $this->createTag($name);
    }
    public function assignCustomTagFromBankId($bankId,$questionId){
        $bankName =  BankController::_getBank($bankId,'title');
        $tagId = $this->getOrCreateTagIdFromName($bankName);
        return $this->assignTagsToQuestion($questionId,[$tagId]);
    }

    private $queryGetTag=<<<SQL
    SELECT * FROM tags where id = :id
SQL;
    private $queryGetTagFromName=<<<SQL
    SELECT * FROM tags where name = :name
SQL;
}