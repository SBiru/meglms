<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 2/21/17
 * Time: 1:06 PM
 */

namespace English3\Controller\QuizzesAndQuestions\QuestionTags;


use English3\Controller\QuestionController;
use English3\Controller\Utility;
use Symfony\Component\Config\Definition\Exception\Exception;

class QuestionTagsFilter {
    public function filterQuestions($tags,$limit,$page,$ignoreIds = null){
        $result = $this->filterQuestionIds($tags,$limit,$page,$ignoreIds);
        $result->data = $this->prepareQuestionsFromIds($result->data);
        return $result;
    }
    public function filterQuestionIds($tags,$limit,$page,$ignoreIds = null,$random=false){
        $tags = explode(',',$tags);
        $query = $this->prepareQueryWithTags($tags);
        if($ignoreIds){
            $this->ignoreIds($query,$ignoreIds);
        }
        if($random){
            $query.= ' order by rand()';
        }
        $paginator = Utility::paginator($query,[]);
        return $paginator->getData($limit,$page);
    }
    public static function filterQuestionCount($tags){
        $self = new self();
        $query = $self->prepareQueryWithTags($tags);
        $stmt = Utility::getInstance()->fetch($query,[],false);
        return $stmt->rowCount();
    }
    private function prepareQueryWithTags($tags){
        $query = $this->querySearchQuestionBase;
        foreach ($tags as $tag) {
            $parts = explode('_',$tag);
            if(count($parts)!=2){
                throw new Exception('Invalid tag '.$tag);
            }
            $this->addNewFilterToQuery($parts[0],$parts[1],$query);
        }
        return $query;
    }
    private function addNewFilterToQuery($id,$tagType,&$query){
        switch($tagType){
            case 'custom':
                $query.= ' and qt.tag_id = '.$id;
                break;
            case 'user':
                $query.= ' and u.id = '.$id;
                break;
            case 'class':
                $query.= ' and c.id = '.$id;
                break;
            default:
                break;
        }
    }
    private function ignoreIds(&$query,$ids){
        $query.= " and q.id not in ($ids)";
    }
    private function prepareQuestionsFromIds($ids){
        $questions = [];
        foreach($ids as $id){
            $includeTags = true;
            $questions[]=QuestionController::_get($id['id'],$includeTags);
        }
        return $questions;
    }
    private $querySearchQuestionBase = <<<SQL
    select distinct q.*  from questions q
  LEFT join users u on u.id = q.modified_by
  LEFT join classes c on c.id = q.class_id
  left join question_tags qt on qt.question_id = q.id
  WHERE 1
SQL;


}
