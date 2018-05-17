<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 2/21/17
 * Time: 1:06 PM
 */

namespace English3\Controller\Glossary\Tags;


use English3\Controller\Glossary\Words\GlossaryWordsDB;
use English3\Controller\QuestionController;
use English3\Controller\Utility;
use Symfony\Component\Config\Definition\Exception\Exception;

class GlossaryTagsFilter {
    public function filter($tags, $limit, $page, $ignoreIds = null,$orgId,$pageId=null){
        $result = $this->filterIds($tags,$limit,$page,$ignoreIds,$orgId,$pageId);
        $result->data = $this->prepareFromIds($result->data);
        return $result;
    }
    public function filterIds($tags, $limit, $page, $ignoreIds = null,$orgId,$pageId){
        $tags = explode(',',$tags);
        $query = $this->prepareQueryWithTags($tags,$pageId);
        if($ignoreIds){
            $this->ignoreIds($query,$ignoreIds);
        }
        $paginator = Utility::paginator($query,['orgId'=>$orgId]);
        return $paginator->getData($limit,$page);
    }
    public static function filterCount($tags){
        $self = new self();
        $query = $self->prepareQueryWithTags($tags);
        $stmt = Utility::getInstance()->fetch($query,[],false);
        return $stmt->rowCount();
    }
    private function prepareQueryWithTags($tags,$pageId=null){
        $query = $this->leftJoinPage($this->querySearchQuestionBase,$pageId);
        $tags = array_map(function($t){
            return intval($t);
        },$tags);
        sort($tags);

        $tagsStr = implode(',',$tags);
        $query = str_replace('__ids__',$tagsStr,$query);
        $query = str_replace('__total__',count($tags),$query);
        return $query;
    }
    private function leftJoinPage($query,$pageId){
        $select_page = '';
        $join_page = '';
        if($pageId){
            $select_page = ',g.id as selected';
            $join_page = ' left join glossary g on g.wordid = w.id and g.pageid='.$pageId;
        }
        $query = str_replace('__select_page__',$select_page,$query);
        $query = str_replace('__join_page__',$join_page,$query);
        return $query;
    }

    private function ignoreIds(&$query,$ids){
        $query.= " and q.id not in ($ids)";
    }
    private function prepareFromIds($ids){
        $words = [];
        foreach($ids as $id){
            $includeTags = true;
            $w = GlossaryWordsDB::_get($id['id'],$includeTags);
            if(@$id['selected']){
                $w['selected'] = boolval($id['selected']);
            }
            $words[]=$w;
        }
        return $words;
    }
    private $querySearchQuestionBase = <<<SQL
    select distinct w.* __select_page__ from glossary_words w
    join glossary_definitions d on w.id = d.word_id
  join glossary_definition_tags dt on dt.definition_id = d.id
  __join_page__
    WHERE 1 and tag_id in (__ids__) and d.org_id = :orgId
      group by w.id
    HAVING COUNT(w.id)=__total__
SQL;


}
