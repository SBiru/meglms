<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 2/21/17
 * Time: 1:06 PM
 */

namespace English3\Controller\QuizzesAndQuestions\QuestionTags;


use English3\Controller\Utility;

class QuestionTagsFinder {
    public function queryAllTags($term,$includeDefaults = false,$selectedTags='',$removeEmpty=false){
        $tags = $this->queryCustomTags($term,$selectedTags,$removeEmpty);
        if($includeDefaults){
            $tags = array_merge($tags,$this->queryDefaultTags($term,$selectedTags));
        }
        return $tags;
    }

    private function queryCustomTags($term,$selectedTags,$removeEmpty){
        return $this->queryTags($term,$this->querySearchTags,$selectedTags,$removeEmpty);
    }
    private function queryDefaultTags($term,$selectedTags){
        return $this->queryTags($term,$this->querySearchDefaultTags,$selectedTags);
    }
    private function queryTags($term,$query,$selectedTags,$removeEmpty=false){
        $term = str_replace(" ","%",$term);
        if($selectedTags){
            $this->whereAlreadySelectedQuestions($query,$selectedTags);
        }
        if($removeEmpty){
                $query.=' having questionCount > 0';
        }
        $query = str_replace("__term__",$term,$query);

        return Utility::getInstance()->fetch($query);
    }
    private function whereAlreadySelectedQuestions(&$query,$selectedTags){
        $questionsIds = $this->selectedQuestionIds($selectedTags);
        $query = str_replace('1','q.id in (' . implode(',',$questionsIds) . ')',$query);
    }
    private function selectedQuestionIds($selectedTags){
        $filter = new QuestionTagsFilter();
        return array_map(function($q){return $q['id'];},$filter->filterQuestions($selectedTags,0,1)->data);
    }

    private $querySearchTags=<<<SQL
    SELECT
    concat(tags.id,'_custom') as id,
    tags.name,
    'custom' as type,
    count(q.id) as questionCount
    FROM tags
    left join question_tags qt on qt.tag_id = tags.id
    left join questions q on q.id = qt.question_id
    left join classes c on c.id = q.class_id
    left join users u on u.id = q.modified_by
    where 1 and tags.name like "%__term__%" group by tags.id
SQL;
    private $querySearchDefaultTags = <<<SQL
select
  c.name,
  concat(c.id,'_class') as id,
  'class' as type,
  count(q.id) as questionCount
from questions q
  join classes c on c.id = q.class_id
  join users u on u.id = q.modified_by
where 1 and c.name like "%__term__%" group by c.id
UNION
select
  concat(u.fname,' ',u.lname) as name,
  concat(u.id,'_user') as id,
  'user' as type,
  count(q.id) as questionCount
from questions q
  join users u on u.id = q.modified_by
  join classes c on c.id = q.class_id
where 1 and concat(u.fname,' ',u.lname) like "%__term__%" group by u.id
SQL;
}