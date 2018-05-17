<?php
/**
 * Created by IntelliJ IDEA.
 * User: denny
 * Date: 5/10/17
 * Time: 11:06 AM
 */

namespace English3\Controller\Glossary\Words;


use English3\Controller\Glossary\Tags\GlossaryTags;
use English3\Controller\Utility;

class GlossaryWordsFilter
{
    public function filter($term, $limit=10, $page=1,$isRegex = false,$orgId,$ignoreIds='',$pageId=null){
        $query = str_replace('__term__',$term,$isRegex?$this->queryGetWordsWithRegex:$this->queryGetWords);
        return $this->filterWords($this->leftJoinPage($query,$pageId),['orgId'=>$orgId],$limit,$page,$ignoreIds);
    }
    public function filterByAuthor($id, $limit=10, $page=1,$orgId,$ignoreIds='',$pageId=null){
        $query = $this->queryGetWordsWithAuthor;
        return $this->filterWords($this->leftJoinPage($query,$pageId),['id'=>$id,'orgId'=>$orgId],$limit,$page,
            $ignoreIds);
    }
    private function leftJoinPage($query,$pageId){
        $select_page = '';
        $join_page = '';
        if($pageId){
            $select_page = ',g.id as selected';
            $join_page = ' left join glossary g on g.wordid = glossary_words.id and g.pageid='.$pageId;
        }
        $query = str_replace('__select_page__',$select_page,$query);
        $query = str_replace('__join_page__',$join_page,$query);
        return $query;
    }
    private function filterWords($query,$params,$limit,$page,$ignoreIds){
        $this->prepareQueryToIgnoreIds($query,$ignoreIds);
        $paginator = Utility::paginator($query,$params);
        $result = $paginator->getData($limit,$page);
        $result->data = $this->prepareWords($result->data);
        return $result;
    }
    private function prepareQueryToIgnoreIds(&$query,$ignoreIds){
        if($ignoreIds && (is_string($ignoreIds) || intval($ignoreIds))  ){
            $query.= " and id not in ($ignoreIds)";
        }
        $query.= ' ORDER  BY word';
    }
    private function prepareWords($rawWords){
        $words = [];
        foreach ($rawWords as $word){
            $words[]=GlossaryWordsDB::_get($word['id'],true);
        }
        return $words;
    }
    private $queryGetWords=<<<SQL
    SELECT glossary_words.id __select_page__ FROM glossary_words  __join_page__  where word like "%__term__%" and 
    org_id =:orgId 
SQL;
    private $queryGetWordsWithRegex=<<<SQL
    SELECT glossary_words.id __select_page__ FROM glossary_words __join_page__ where word regexp "__term__"  and 
    org_id =:orgId
SQL;
    private $queryGetWordsWithAuthor=<<<SQL
    SELECT DISTINCT glossary_words.id __select_page__ FROM glossary_words
    JOIN glossary_definitions d on glossary_words.id = d.word_id
     __join_page__ 
     where d.created_by = :id  and d.org_id 
    =:orgId
SQL;
}