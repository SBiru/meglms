<?php


namespace English3\Controller\Glossary\Tags;

use English3\Controller\Glossary\Words\GlossaryWordsDB;
use English3\Controller\Utility;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class GlossaryTags {
    /**
     * @var Glossary
     * TagsDB
     */
    private $db;

    /**
     * @var GlossaryTagsFinder
     */
    private $finder;

    /**
     * @var GlossaryTagsFilter
     */
    private $filter;
    /**
     * @var GlossaryWordsDB
     */
    private $wordsDb;

    public function __construct(){
        $this->db = new GlossaryTagsDB();
        $this->finder = new GlossaryTagsFinder();
        $this->filter = new GlossaryTagsFilter();
        $this->wordsDb = new GlossaryWordsDB();
    }
    public function create (Request $request){
        Utility::getInstance()->calcLoggedIn();
        Utility::clearPOSTParams($request);
        Utility::getInstance()->checkRequiredFields(['tag'],$request->request->all(),true);
        $tagName = $request->request->get('tag');
        $orgId = $request->request->get('orgId');
        $id = $this->db->createTag($tagName,$orgId);
        return new JsonResponse($this->db->getTag($id));
    }
    public function update (Request $request,$id){
        Utility::getInstance()->calcLoggedIn();
        Utility::clearPOSTParams($request);
        Utility::getInstance()->checkRequiredFields(['name'],$request->request->all(),true);
        $tagName = $request->request->get('name');
        $this->db->updateTag($id,$tagName);
        return new JsonResponse($this->db->getTag($id));
    }
    public function remove (Request $request,$id){
        Utility::getInstance()->calcLoggedIn();
        $this->db->removeTag($id);
        return new JsonResponse('ok');
    }

    public function saveDefinitionTags(Request $request,$id){
        Utility::getInstance()->calcLoggedIn();
        Utility::clearPOSTParams($request);
        Utility::getInstance()->checkRequiredFields(['tags'],$request->request->all(),true);
        $tags = $request->request->get('tags');
        return new JsonResponse($this->db->assignTagsToDefinition($id,$tags));
    }


    public function query(Request $request){
        Utility::getInstance()->calcLoggedIn();
        Utility::getInstance()->checkRequiredFields(['term','orgId'],$request->query->all(),true);
        $term = $request->query->get('term');
        $selectedTags = $request->query->get('selectedTags');
        $removeEmpty = $request->query->get('removeEmpty');
        $orgId = $request->query->get('orgId');
        $isRegex = boolval($request->query->get('isRegex'));
        $limit = $request->query->get('limit');
        $page = $request->query->get('page');
        $author = $request->query->get('author');
        $period = $request->query->get('period');
        return new JsonResponse($author?
            $this->finder->queryAllTagsWithAuthor($author,$orgId,$limit,$page,$selectedTags,$removeEmpty):
            $this->finder->queryAllTags($term,$orgId,$limit,$page,$selectedTags,$removeEmpty,$isRegex,$period)
        );
    }
    public function queryWords(Request $request){
        Utility::getInstance()->calcLoggedIn();
        Utility::getInstance()->checkRequiredFields(['tags','limit','page','orgId'],$request->query->all(),true);
        $tags = $request->query->get('tags');
        $page = $request->query->get('page');
        $limit = $request->query->get('limit');
        $orgId = $request->query->get('orgId');
        $pageId = $request->query->get('pageId');
        $ignoreIds = $request->query->get('ignoreIds');
        $saveToGlossary = intval($request->query->get('saveToGlossary'));
        if($saveToGlossary){
            $data = $this->filter->filter($tags,1000000,1,$ignoreIds,$orgId);
            return new JsonResponse($this->wordsDb->saveWordsToPage($saveToGlossary,$data->data));
        }else{
            return new JsonResponse($this->filter->filter($tags,$limit,$page,$ignoreIds,$orgId,$pageId));
        }
    }

    public static function getWordCustomTags($word){
        return Utility::getInstance()->fetch(self::$queryGetWordCustomTags,['id'=>$word['id']]);
    }
    public static function getDefinitionTags($defId){
        return Utility::getInstance()->fetch(self::$queryGetDefTags,['id'=>$defId]);
    }
    public function getAuthors(Request $request){
        Utility::getInstance()->calcLoggedIn();
        Utility::getInstance()->checkRequiredFields(['orgId'],$request->query->all(),true);
        $orgId = $request->query->get('orgId');
        return new JsonResponse($this->db->getAuthorsForOrg($orgId));
    }


    private static $queryGetWordCustomTags=<<<SQL
	select distinct tags.id,tags.name from glossary_tags tags
		join glossary_definition_tags dt on dt.tag_id = tags.id
		join glossary_definitions d on d.id = dt.definition_id
	where d.word_id = :id
SQL;
    private static $queryGetDefTags=<<<SQL
	select tags.id,tags.name from glossary_tags tags
		join glossary_definition_tags dt on dt.tag_id = tags.id
	where dt.definition_id = :id
SQL;
}

