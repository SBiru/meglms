<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 2/21/17
 * Time: 1:06 PM
 */

namespace English3\Controller\Glossary\Tags;


use English3\Controller\QuizzesAndQuestions\Banks\BankController;
use English3\Controller\Utility;

class GlossaryTagsDB {
    public function createTag($tag,$orgId = null){
        $userId = $_SESSION['USER']['ID'];
        if(!$orgId){
            $orgId = Utility::getInstance()->fetchOne('SELECT organizationid FROM users where id = :id',['id'=>$userId]);
        }
        Utility::getInstance()->reader->insert('glossary_tags',[
            'name'=>$tag,
            'created_by'=>$userId,
            'org_id'=>$orgId
        ]);
        return Utility::getInstance()->reader->lastInsertId();
    }
    public function updateTag($id,$name){
        Utility::getInstance()->reader->update('glossary_tags',[
            'name'=>$name
        ],['id'=>$id]);
    }
    public function removeTag($id){
        Utility::getInstance()->reader->delete('glossary_tags',['id'=>$id]);
    }
    public function getTag($tagId){
        return Utility::getInstance()->fetchRow($this->queryGetTag,['id'=>$tagId]);
    }
    public function assignTagsToDefinition($id,$tags){
        $this->removeTagsFromDefinition($id);
        foreach($tags as $tagId){
            if($tagId){
                Utility::getInstance()->insert($this->queryInsertDefTag,['def_id'=>$id,'tag_id'=>$tagId]);
            }
        }
        $tags = GlossaryTags::getDefinitionTags($id);
        return $tags;
    }
    private function removeTagsFromDefinition($id){
        Utility::getInstance()->reader->delete('glossary_definition_tags',['definition_id'=>$id]);
    }
    public function getOrCreateTagIdFromName($name){
        if($tagId = Utility::getInstance()->fetchOne($this->queryGetTagFromName,['name'=>$name],'id')){
            return $tagId;
        }
        return $this->createTag($name);
    }
    public function getAuthorsForOrg($orgId){
        return Utility::getInstance()->fetch($this->queryGetAuthors,['id'=>$orgId]);
    }
    private $queryInsertDefTag = <<<SQL
    INSERT IGNORE INTO glossary_definition_tags (definition_id,tag_id) values (:def_id,:tag_id)
SQL;

    private $queryGetAuthors=<<<SQL
    SELECT u.id,concat(u.fname,' ',u.lname) as name, count(g.id) as count  FROM glossary_tags g
    JOIN users u on u.id = g.created_by
     where g.org_id = :id GROUP BY g.created_by
SQL;

    private $queryGetTag=<<<SQL
    SELECT * FROM glossary_tags where id = :id
SQL;
    private $queryGetTagFromName=<<<SQL
    SELECT * FROM glossary_tags where name = :name
SQL;
}