<?php


namespace English3\Controller\QuizzesAndQuestions\QuestionTags;

use English3\Controller\Utility;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class QuestionTags {
    /**
     * @var QuestionTagsDB
     */
    private $db;

    /**
     * @var QuestionTagsFinder
     */
    private $finder;

    /**
     * @var QuestionTagsFilter
     */
    private $filter;

    public function __construct(){
        $this->db = new QuestionTagsDB();
        $this->finder = new QuestionTagsFinder();
        $this->filter = new QuestionTagsFilter();
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

    public function saveQuestionTags(Request $request,$id){
        Utility::getInstance()->calcLoggedIn();
        Utility::clearPOSTParams($request);
        Utility::getInstance()->checkRequiredFields(['tags'],$request->request->all(),true);
        $tags = $request->request->get('tags');
        return new JsonResponse($this->db->assignTagsToQuestion($id,$tags));
    }


    public function query(Request $request){
        Utility::getInstance()->calcLoggedIn();
        Utility::getInstance()->checkRequiredFields(['term'],$request->query->all(),true);
        $term = $request->query->get('term');
        $includeDefaults = $request->query->get('includeDefaults');
        $selectedTags = $request->query->get('selectedTags');
        $removeEmpty = $request->query->get('removeEmpty');
        return new JsonResponse($this->finder->queryAllTags($term,$includeDefaults,$selectedTags,$removeEmpty));
    }
    public function queryQuestions(Request $request){
        Utility::getInstance()->calcLoggedIn();
        Utility::getInstance()->checkRequiredFields(['tags','limit','page'],$request->query->all(),true);
        $tags = $request->query->get('tags');
        $page = $request->query->get('page');
        $limit = $request->query->get('limit');
        $ignoreIds = $request->query->get('ignoreIds');
        return new JsonResponse($this->filter->filterQuestions($tags,$limit,$page,$ignoreIds));
    }

    public static function getQuestionFixedTags($question){
        $data = Utility::getInstance()->fetchRow(self::$queryGetQuestionTags,['questionId'=>$question['id']]);
        $tags = [];
        foreach($data as $tag){
            $tags[]=$tag;
        }
        return $tags;
    }
    public static function getQuestionCustomTags($question){
        return Utility::getInstance()->fetch(self::$queryGetQuestionCustomTags,['questionId'=>$question['id']]);
    }
    public static function prepareTagsForRandomPrompt($tags){
        $tagsForPrompt = new TagsForRandomPrompt();
        return $tagsForPrompt->prepare($tags);
    }

    private static $queryGetQuestionTags=<<<SQL
	select concat(u.fname,' ',u.lname) as userName,c.name as className  from questions q
  join users u on u.id = q.modified_by
  join classes c on c.id = q.class_id
  where q.id = :questionId;
SQL;
    private static $queryGetQuestionCustomTags=<<<SQL
	select tags.id,tags.name from tags
		join question_tags qt on qt.tag_id = tags.id
	where qt.question_id = :questionId
SQL;
}

class TagsForRandomPrompt{
    public function prepare($tags){
        $tags = explode(',',$tags);
        $html = '';
        foreach($tags as $tag){
            $html.= $this->createTagElement($tag);
        }
        return $html;
    }
    private function createTagElement($tag){
        list($id,$type) = explode('_',$tag);
        $tagClassName = $this->getTagClassName($type);
        $tagName = $this->getTagName($id,$type);
        return "<span class=\"label label-primary {$tagClassName}\">{$tagName}</span>";
    }
    private function getTagClassName($type){
        return $type=='custom'?'custom-tags':'default-tags';
    }
    private function getTagName($id,$type){
        switch($type){
            case 'user':
                return $this->getUserName($id);
            case 'class':
                return $this->getClassName($id);
            case 'custom':
                return $this->getCustomTagName($id);
        }
    }
    private function getCustomTagName($id){
        return Utility::getInstance()->fetchOne('select name from tags where id = :id',['id'=>$id]);
    }
    private function getUserName($id){
        return Utility::getInstance()->fetchOne("select concat(fname,' ',lname) from users where id = :id",['id'=>$id]);
    }
    private function getClassName($id){
        return Utility::getInstance()->fetchOne('select name from classes where id = :id',['id'=>$id]);
    }
}