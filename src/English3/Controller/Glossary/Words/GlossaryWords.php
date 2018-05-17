<?php

namespace English3\Controller\Glossary\Words;
use English3\Controller\Glossary\Tags\GlossaryTags;
use English3\Controller\Glossary\Tags\GlossaryTagsDB;
use English3\Controller\Utility;
use Kahlan\Reporter\Json;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class GlossaryWords
{
    /**
     * @var GlossaryWordsDB
     */
    private $db ;
    /**
     * @var GlossaryWordsFilter
     */
    private $filter ;
    /**
     * @var GlossaryTagsDB
     */
    private $tags ;

    public function __construct(){
        $this->db = new GlossaryWordsDB();
        $this->filter = new GlossaryWordsFilter();
        $this->tags = new GlossaryTagsDB();
    }
    public function create (Request $request){
        list($word,$description,$orgId,$tags) = $this->prepareToSave($request);
        $id = $this->db->create($word,$description,$orgId);
        if($tags){
            $this->tags->assignTagsToDefinition($this->db->lastDefinitionId,Utility::mapIds($tags));
        }
        return new JsonResponse($this->db->get($id,true));
    }
    public function update (Request $request,$id){
        list($word) = $this->prepareToSave($request);
        $this->db->updateWord($id,$word);
        return new JsonResponse($this->db->get($id));
    }
    public function updateDefinition (Request $request,$id){
        list($word,$description,$orgId,$tags) = $this->prepareToSave($request);
        $this->db->updateDefinition($id,$description);
        if($tags){
            $this->tags->assignTagsToDefinition($id,Utility::mapIds($tags));
        }
        return new JsonResponse($this->db->getDefinition($id));
    }
    private function prepareToSave(&$request){
        Utility::getInstance()->calcLoggedIn();
        Utility::clearPOSTParams($request);
        Utility::getInstance()->checkRequiredFields(['word','definition'],$request->request->all(),true);
        $word = $request->request->get('word');
        $description = $request->request->get('definition');
        $orgId = $request->request->get('orgId');
        $tags = $request->request->get('tags');
        return [$word,$description,$orgId,$tags];
    }
    public function get(Request $request,$id){
        return new JsonResponse($this->db->get($id,true));
    }
    public function query(Request $request){
        Utility::getInstance()->calcLoggedIn();
        Utility::getInstance()->checkRequiredFields(['term'],$request->query->all(),true);
        $term = $request->query->get('term');
        $limit = $request->query->get('limit')?:10;
        $page = $request->query->get('page')?:1;
        $orgId = $request->query->get('orgId')?:$_SESSION['USER']['ORGID'];
        $isRegex = boolval($request->query->get('isRegex'));
        $saveToGlossary = intval($request->query->get('saveToGlossary'));
        $pageId = intval($request->query->get('pageId'));
        $author = $request->query->get('author');
        $ignoreIds = intval($request->query->get('ignoreIds'));
        if($saveToGlossary){
            $data = $author?$this->filter->filterByAuthor($author,100000,1,$orgId,$ignoreIds):$this->filter->filter
            ($term,
                100000,1,$isRegex,$orgId,$ignoreIds);
            return new JsonResponse($this->db->saveWordsToPage($saveToGlossary,$data->data));
        }else{
            return new JsonResponse($author?$this->filter->filterByAuthor($author,$limit,$page,$orgId,'',$pageId)
                :$this->filter->filter($term,$limit,$page,$isRegex,$orgId,'',$pageId));
        }
    }

    public function delete(Request $request,$id){
        Utility::getInstance()->calcLoggedIn();
        $this->db->delete($id);
        return new JsonResponse('ok');
    }
    public function deleteDefinition(Request $request,$id){
        Utility::getInstance()->calcLoggedIn();
        $this->db->deleteDefinition($id);
        return new JsonResponse('ok');
    }
    public function getAuthors(Request $request){
        Utility::getInstance()->calcLoggedIn();
        Utility::getInstance()->checkRequiredFields(['orgId'],$request->query->all(),true);
        $orgId = $request->query->get('orgId');
        return new JsonResponse($this->db->getAuthorsForOrg($orgId));
    }
}
