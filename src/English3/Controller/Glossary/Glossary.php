<?php
namespace English3\Controller\Glossary;
use English3\Controller\ClassesController;
use English3\Controller\Glossary\Tags\GlossaryTags;
use English3\Controller\Glossary\Words\GlossaryWordsDB;
use English3\Controller\JournalController;
use English3\Controller\Utility;
use English3\Controller\VideoRecorder\ReprocessVideos;
use Kahlan\Reporter\Json;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class Glossary
{
    private $pageId;
    private $paginator;
    private $loaded = false;
    public function __construct($pageId=null){
        $this->pageId = $pageId;
    }
    public function get(Request $request,$id){
        $this->pageId = $id;
        $limit = $request->get('limit');
        $page = $request->get('page');
        $term = $request->get('term');
        $onlySelected = boolval($request->get('onlySelected'));
        $tags = $request->get('tags');
        $isRegex = boolval($request->get('isRegex'));
        if($tags){
            return new JsonResponse($this->getWordsWithTags($limit,$page,$tags,$onlySelected));
        }
        return new JsonResponse($this->getWords($limit,$page,$term,$isRegex,$onlySelected));
    }
    public function save(Request $request,$id){
        Utility::clearPOSTParams($request);
        $util =Utility::getInstance();
        $util->checkRequiredFields(['words'],$request->request->all(),true);
        $pageId = $id;
        $util->checkTeacher(ClassesController::_getFromPage($util->reader,$pageId));
        $wordIds = $request->request->get('words');
        $this->pageId=$pageId;
        $this->addWords($wordIds);
        return new JsonResponse('ok');
    }
    public function remove(Request $request,$id){
        Utility::clearPOSTParams($request);
        $util =Utility::getInstance();
        $util->checkRequiredFields(['wordIds'],$request->request->all(),true);
        $pageId = $id;
        $util->checkTeacher(ClassesController::_getFromPage($util->reader,$pageId));
        $wordIds = $request->request->get('wordIds');
        $this->pageId=$pageId;
        $this->removeWords($wordIds);
        return new JsonResponse('ok');
    }
    public function toggleDefinition(Request $request,$id){
        $util =Utility::getInstance();
        $util->checkRequiredFields(['definitionId','isSelected'],$request->query->all(),true);
        if($request->get('isSelected')=='true'){
            Utility::getInstance()->reader->insert('glossary_page_definitions',
                [
                    'page_id'=>$id,
                    'definition_id'=>$request->get('definitionId')
                ]);
        }else{
            Utility::getInstance()->reader->executeUpdate(
                'DELETE FROM glossary_page_definitions Where page_id = :page_id and definition_id = :definition_id',
                [
                    'page_id'=>$id,
                    'definition_id'=>$request->get('definitionId')
                ]);
        }
        return new JsonResponse('ok');
    }

    public function addWords($words){
        $wordIds = [];
        $values = implode(',',array_map(function($word) use(&$wordIds){
            $id = is_array($word)?$word['id']:$word;
            $wordIds[]=$id;
            return "($this->pageId,$id)";
        },$words));
        $query = str_replace('__values__',$values,$this->queryInsertWords);
        Utility::getInstance()->insert($query);
        Utility::getInstance()->insert(str_replace('__wordIds__',implode(',',$wordIds),
            $this->queryInsertAllDefinitions),['page_id'=>$this->pageId]);

    }
    public function removeWords($wordIds){
        foreach ($wordIds as $id) {
            Utility::getInstance()->reader->delete('glossary',[
                'pageid'=>$this->pageId,
                'wordid'=>$id
            ]);
        }
    }
    public function load($term='',$isRegex=false){
        $this->loaded = true;
        $where = '';
        if($term){
            if($isRegex){
                $where.=" and w.word regexp '$term'";
            }else{
                $where.=" and w.word like '%$term%'";
            }
        }
        $query = str_replace('__where__',$where,$this->queryLoadWords);
        $this->paginator = Utility::paginator($query,['pageId'=>$this->pageId]);
    }
    public function loadWithTags($tags){
        $this->loaded = true;
        if($tags){
            $where = " and dt.tag_id in ($tags)";
        }else{
            $where = '';
        }


        $query = str_replace('__where__',$where,$this->queryLoadWordsWithTags);
        $this->paginator = Utility::paginator($query,['pageId'=>$this->pageId]);
    }
    public function getWords($limit=10,$page=1,$term='',$isRegex=false,$onlySelected = false){
        if(!$this->loaded){
            $this->load($term,$isRegex);
        }
        $result = $this->paginator->getData($limit,$page);
        foreach ($result->data as &$word) {
            $word = GlossaryWordsDB::_get($word['id'],true,$this->pageId,$onlySelected);
        }
        return $result;
    }
    public function getWordsWithTags($limit=10,$page=1,$tags,$onlySelected = false){
        if(!$this->loaded){
            $this->loadWithTags($tags);
        }
        $result = $this->paginator->getData($limit,$page);
        foreach ($result->data as &$word) {
            $word = GlossaryWordsDB::_get($word['wordid'],true,$this->pageId,$onlySelected);
        }
        return $result;
    }

    public function loadLinkOptions(Request $request,$id){
        $linkOptions = new GlossaryLinkOptions($id);
        return new JsonResponse($linkOptions->load());
    }
    public function saveLinkOptions(Request $request,$id){
        Utility::clearPOSTParams($request);
        $linkOptions = new GlossaryLinkOptions($id);
        return new JsonResponse($linkOptions->save($request->request->get('bitval')));
    }
    public function processWords(Request $request,$id){
        Utility::clearPOSTParams($request);
        $links = new GlossaryLinks($id);
        return new JsonResponse($links->processText($request->request->get("text")));
    }


    public static function getForClassId($classId){
        $pages = Utility::mapIds(Utility::getInstance()->fetch(Glossary::$queryGetGlossaryPagesForClass,
            ['classId'=>$classId]));
        if(count($pages)){
            return $pages[0];
        }
    }

    public function getAvailableTags(Request $request,$id){
        return new JsonResponse(Utility::getInstance()->fetch($this->queryGetAvailableTags,['pageId'=>$id]));
    }
    private $queryInsertWords = <<<SQL
    INSERT IGNORE INTO glossary (pageid,wordid) values __values__;
SQL;
    private $queryInsertAllDefinitions = <<<SQL
    INSERT IGNORE INTO glossary_page_definitions (page_id,definition_id) SELECT :page_id,id FROM 
    glossary_definitions d where d.word_id in (__wordIds__);
SQL;
    private $queryLoadWords = <<<SQL
    SELECT w.* FROM glossary g
    join glossary_words w on w.id = g.wordid
    where pageid = :pageId __where__
    order by w.word
SQL;
    private $queryLoadWordsWithTags = <<<SQL
    SELECT distinct g.wordid FROM glossary g
    join glossary_words w on w.id = g.wordid
    join glossary_definitions d on d.word_id = g.wordid
    join glossary_definition_tags dt on dt.definition_id = d.id
    where pageid = :pageId __where__
    order by w.word
SQL;
    public static $queryGetGlossaryPagesForClass = <<<SQL
    SELECT p.id FROM pages p
    JOIN units u on p.unitid = u.id
    JOIN classes c on c.courseid = u.courseid
    where c.id = :classId and p.layout = 'GLOSSARY'
SQL;

    private $queryGetAvailableTags = <<<SQL
    SELECT t.id,t.name,count(distinct g.wordid) as count From glossary_tags t
    join glossary_definition_tags dt on dt.tag_id = t.id
    join glossary_definitions d on d.id = dt.definition_id
    join glossary g on d.word_id = g.wordid
    where g.pageid = :pageId group by t.id order by t.name
SQL;

}
