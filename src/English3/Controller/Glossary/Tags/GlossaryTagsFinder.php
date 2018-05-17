<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 2/21/17
 * Time: 1:06 PM
 */

namespace English3\Controller\Glossary\Tags;


use English3\Controller\Utility;

class GlossaryTagsFinder {
    private $limit;
    private $page;
    private $orgId;
    private $isRegex;
    private $period;
    public function queryAllTags($term,$orgId,$limit,$page=1,$selectedTags='',$removeEmpty=false,
                                 $isRegex =false,$period=null){
        $this->limit = $limit;
        $this->page = $page;
        $this->orgId = $orgId;
        $this->isRegex = $isRegex;
        $this->period = $period;
        $tags = $this->queryCustomTags($term,$selectedTags,$removeEmpty);
        return $tags;
    }
    public function queryAllTagsWithAuthor($author,$orgId,$limit,$page=1,$selectedTags='',$removeEmpty=false){
        $this->limit = $limit;
        $this->page = $page;
        $this->orgId = $orgId;
        $tags = $this->queryCustomTagsWithAuthor($author,$selectedTags,$removeEmpty);
        return $tags;
    }

    private function queryCustomTags($term,$selectedTags,$removeEmpty){
        if($this->period && (is_numeric($this->period) || $this->period=='all' )){
            $query = str_replace('order by g.name','order by g.created_on',$this->querySearchTags);
            if($this->period!=='all'){
                $query = str_replace('__term_filter__',"g.created_on BETWEEN NOW() - INTERVAL $this->period DAY AND NOW()",
                    $query);
            }else{
                $query = str_replace('__term_filter__','1',$query);
            }
        }else{
            if($this->isRegex){
                $query = str_replace('__term_filter__','g.name regexp "__term__"',$this->querySearchTags);
            }else{
                $query = str_replace('__term_filter__','g.name like "%__term__%"',$this->querySearchTags);
            }
        }


        return $this->queryTags($term,$query,$selectedTags,$removeEmpty);
    }
    private function queryCustomTagsWithAuthor($author,$selectedTags,$removeEmpty){
        return $this->queryTags('',str_replace('__term_filter__',"g.created_by = '$author'",$this->querySearchTags),
            $selectedTags,$removeEmpty);
    }
    private function queryTags($term,$query,$selectedTags,$removeEmpty=false){
        if(!$this->isRegex){
            $term = str_replace(" ","%",$term);
        }
        if($selectedTags){
            $this->whereAlreadySelected($query,$selectedTags);
        }
        if($removeEmpty){
            $query = str_replace("__empty__",' having count > 0',$query);
        }else{
            $query = str_replace("__empty__",'',$query);
        }
        $query = str_replace("__term__",$term,$query);
        if($this->limit){
            return $this->fetchWithPagination($query);
        }else{
            return Utility::getInstance()->fetch($query,['orgId'=>$this->orgId]);
        }
    }
    private function fetchWithPagination($query){
        $paginator = Utility::paginator($query,['orgId'=>$this->orgId]);
        return $paginator->getData($this->limit,$this->page);
    }
    private function whereAlreadySelected(&$query,$selectedTags){
        $questionsIds = $this->selectedIds($selectedTags);
        $query = str_replace('1','g.id in (' . implode(',',$questionsIds) . ')',$query);
    }
    private function selectedIds($selectedTags){
        $filter = new GlossaryTagsFilter();
        return array_map(function($q){return $q['id'];},$filter->filter($selectedTags,0,1,null,$this->orgId)->data);
    }

    private $querySearchTags=<<<SQL
    SELECT
    g.id,
    g.name,
    'custom' as type,
    count(distinct w.id) as count
    FROM glossary_tags g
    left join glossary_definition_tags dt on dt.tag_id = g.id
    left join glossary_definitions d on dt.definition_id = d.id
    left join glossary_words w on w.id = d.word_id
    where 1 and __term_filter__ and g.org_id = :orgId group by g.id __empty__ order by g.name
SQL;
}