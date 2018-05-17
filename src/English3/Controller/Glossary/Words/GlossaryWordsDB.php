<?php

namespace English3\Controller\Glossary\Words;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use English3\Controller\Glossary\Glossary;
use English3\Controller\Glossary\Tags\GlossaryTags;
use English3\Controller\Utility;
use Symfony\Component\Config\Definition\Exception\Exception;
use Symfony\Component\HttpKernel\Exception\HttpException;

    class GlossaryWordsDB
    {
        public $lastDefinitionId = null;
        public function __construct(){}
        public function create($word,$definition,$orgId = null){
            if(!$orgId){
                $orgId = Utility::getInstance()->fetchOne('SELECT organizationid FROM users where id = :id',['id'=>$_SESSION['USER']['ID']]);
            }
            $wordId = $this->createOrGetWordId($word,$orgId);
            $userId = $_SESSION['USER']['ID'];
            Utility::getInstance()->reader->insert('glossary_definitions',[
                'word_id'=>$wordId,
                'definition'=>$definition,
                'created_by'=>$userId,
                'org_id'=>$orgId
            ]);
            $this->lastDefinitionId = Utility::getInstance()->reader->lastInsertId();
            return $wordId;
        }
        public function createOrGetWordId($word,$orgId = null){

            if(!$orgId){
                $orgId = Utility::getInstance()->fetchOne('SELECT organizationid FROM users where id = :id',['id'=>$_SESSION['USER']['ID']]);
            }
            if($id = $this->wordExists($word,$orgId,true)){
                return $id;
            }else{
                return $this->createWord($word,$orgId);
            }
        }
        private function createWord($word,$orgId){
            $userId = $_SESSION['USER']['ID'];
            Utility::getInstance()->reader->insert('glossary_words',[
                'word'=>$word,
                'created_by'=>$userId,
                'org_id'=>$orgId
            ]);
            return Utility::getInstance()->reader->lastInsertId();
        }
        public function updateDefinition($id,$definition){
            try{
                Utility::getInstance()->reader->update('glossary_definitions',[
                    'definition'=>$definition
                ],['id'=>$id]);
            }
            catch(UniqueConstraintViolationException $e){
                throw new HttpException(500, $e->getMessage(),$e,['type'=>'duplicated_key']);
            }
            return $id;
        }
        public function updateWord($id,$word){
            try{
                Utility::getInstance()->reader->update('glossary_words',[
                    'word'=>$word
                ],['id'=>$id]);
            }
            catch(UniqueConstraintViolationException $e){
                throw new HttpException(500, $e->getMessage(),$e,['type'=>'duplicated_key']);
            }
            return $id;
        }



        public function get($id,$includeTags=false){
            return self::_get($id,$includeTags);
        }
        public static function _get($id,$includeTags=false,$pageId = null,$onlySelected = false){
            if($pageId){
                $query = self::$queryGetGlossaryWord;
                if($onlySelected) {
                    $query = str_replace('LEFT', '', $query);
                }
                $data = Utility::getInstance()->fetch($query,['id'=>$id,'pageId'=>$pageId]);
            }else{
                $data = Utility::getInstance()->fetch(self::$queryGetWord,['id'=>$id]);
            }

            $word = self::prepareWord($data,$includeTags);
            return $word;
        }
        private static function prepareWord($data,$includeTags){
            $word = null;
            $tags = [];

            foreach ($data as $row){
                if(!$word) $word = self::buildWord($row);
                $def = self::buildDefinition($row,$includeTags);
                $word['definitions'][]=$def;
                if($includeTags){
                    foreach ($def['tags'] as $tag){
                        Utility::addToObjectIfNotExists($tag['id'],$tag,$tags);
                    }
                }

            }
            $word['tags']=array_values($tags);
            return $word;
        }
        private static function buildWord($row){
            return ['id'=>$row['id'],'word'=>$row['word'],'org_id'=>$row['org_id'],'definitions'=>[]];
        }
        private static function buildDefinition($row,$includeTags){
            $isAdmin = Utility::getInstance()->checkAdmin($row['org_id'],true,false);
            $def = [
                'id'=>$row['definition_id'],
                'definition'=>$row['definition'],
                'created_by'=>$row['created_by'],
                'created_on'=>$row['created_on'],
                'isSelected'=>boolval(@$row['page_id']),
                'org_id'=>$row['org_id'],
                'canEdit'=>$row['created_by']==$_SESSION['USER']['ID'] || $isAdmin
            ];

            if($includeTags){
                $def['tags']= GlossaryTags::getDefinitionTags($row['definition_id']);
            }
            return $def;
        }
        public function getDefinition($id,$includeTags=false){
            $row = Utility::getInstance()->fetchRow(self::$queryGetDefinition,['id'=>$id]);
            return self::buildDefinition($row,$includeTags);
        }

        public function delete($id){

            Utility::getInstance()->reader->delete('glossary_words',['id'=>$id]);
            Utility::getInstance()->reader->executeUpdate($this->queryDeleteWordTags,['word_id'=>$id]);
            Utility::getInstance()->reader->delete('glossary_definitions',['word_id'=>$id]);
            Utility::getInstance()->reader->delete('glossary',['wordid'=>$id]);
        }
        public function deleteDefinition($id){

            Utility::getInstance()->reader->delete('glossary_definitions',['id'=>$id]);
            Utility::getInstance()->reader->executeUpdate($this->queryDeleteDefinitionTags,['definition_id'=>$id]);
        }
        public function saveWordsToPage($pageId,$words){
            $glossary  = new Glossary($pageId);
            $glossary->addWords($words);
            return $glossary->getWords();
        }
        public function getAuthorsForOrg($orgId){
            return Utility::getInstance()->fetch($this->queryGetAuthors,['id'=>$orgId]);
        }

        public function wordExists($word,$orgId,$returnId = false){
            $id = Utility::getInstance()->fetchOne( $this->queryWordExists,['word'=>$word,'org_id'=>$orgId]);
            return $returnId?$id:boolval($id);
        }
        private static $queryGetDefinition=<<<SQL
    SELECT *,id as definition_id FROM glossary_definitions WHERE id = :id
SQL;

        private static $queryGetWord=<<<SQL
        SELECT w.id,w.word,w.org_id,
          d.id as definition_id,
          d.definition,
          d.created_on,
          d.created_by
         FROM glossary_words w
        join glossary_definitions d on d.word_id = w.id
         where w.id = :id
SQL;
        private static $queryGetGlossaryWord=<<<SQL
        SELECT w.id,w.word,w.org_id,
          d.id as definition_id,
          d.definition,
          d.created_on,
          d.created_by,
          pd.page_id
         FROM glossary_words w
        join glossary_definitions d on d.word_id = w.id
        LEFT join glossary_page_definitions pd on d.id = pd.definition_id and pd.page_id = :pageId
         where w.id = :id
SQL;
        private $queryGetAuthors=<<<SQL
        SELECT distinct u.id,concat(u.fname,' ',u.lname) as name, count(distinct w.id) as count  FROM glossary_words w
        join glossary_definitions d on d.word_id = w.id
        JOIN users u on u.id = d.created_by
         where w.org_id = :id GROUP BY d.created_by
SQL;
        private $queryWordExists = <<<SQL
        SELECT id FROM glossary_words WHERE word = :word and org_id = :org_id
SQL;
        private $queryDeleteDefinitionTags = <<<SQL
        DELETE dt FROM glossary_definition_tags dt
        JOIN glossary_definitions d on d.id = dt.definition_id
        WHERE d.id = :definition_id
SQL;
        private $queryDeleteWordTags = <<<SQL
        DELETE dt FROM glossary_definition_tags dt
        JOIN glossary_definitions d on d.id = dt.definition_id
        WHERE d.word_id = :word_id
SQL;


    }