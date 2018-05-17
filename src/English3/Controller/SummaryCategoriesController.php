<?php
namespace English3\Controller;

use Doctrine\DBAL\Connection;
use English3\Controller\Utility;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\Serializer\Encoder\JsonEncode;


class SummaryCategoriesController
{
    /**
     * @var Connection
     */
    private $read;
    private $util;


    public function __construct(Connection $read)
    {
        $this->read = $read;
        $this->util = Utility::getInstance();
    }
    public function getCategories(Request $request,$classId){
        $this->util->checkTeacher($classId);
        $orgId = ClassesController::_getOrgId($this->read,$classId);
        $data = $this->util->fetch($this->queryGetCategories,['classId'=>$classId,'orgId'=>$orgId]);

        $orgCategories = array();
        $courseCategories = array();
        foreach ($data as $row) {
            if(boolval($row['is_course_level'])){
                $courseCategories[]=$row;
            }else{
                $orgCategories[]=$row;
            }
        }
        return new JsonResponse(['org'=>$orgCategories,'course'=>$courseCategories]);
    }
    public function getClassCategories(Request $request,$classId){
        if(!$this->util->checkTeacher($classId,null,false)){
            $this->util->checkStudent($classId,null);
        }
        $data = $this->util->fetch($this->queryGetClassesCategories,['classId'=>$classId]);
        $class = $this->wrapClasses($data);
        if(count($class)){
            $class = $class[0];
        }
        return new JsonResponse($class);
    }
    public function getClassesCategories(Request $request){
        Utility::clearPOSTParams($request);
        $classes = $request->request->get('classes');
        $data = $this->util->reader->fetchAll($this->queryGetClassesCategories,['classId'=>$classes],['classId'=>\Doctrine\DBAL\Connection::PARAM_STR_ARRAY]);
        return new JsonResponse($this->wrapClasses($data));
    }
    public function getUserClassesCategories(Request $request,$userId){
        Utility::clearPOSTParams($request);
        $userId=$userId=='me'?$_SESSION['USER']['ID']:$userId;
        $this->userId = $userId;
        $data = $this->util->fetch($this->queryGetUserClassesCategories,['userId'=>$userId]);
        $classes = array_values($this->wrapClasses($data));
        $needGradebook = false;
        foreach ($classes as $class) {
            if(!count($class['categories'])){
                $needGradebook=true;
                break;
            }
        }
        if($needGradebook){
            $this->gbCtrl = new GradebookController($this->read);
            $gradebook = $this->gbCtrl->_getGradebookForUser($userId);
            $classes = array_map(function($class) use($gradebook){
                if(count($class['categories']) || !$class['isStudent']){
                    return $class;
                }else{
                    return $this->wrapClassesFromGradebook($class,$gradebook);
                }
            },$classes);
        }

        return new JsonResponse($classes);
    }
    private function wrapClassFromGradebook($class,$gradebookClass){
        $categories = array();
        foreach($gradebookClass['units'] as $u){
            $unit = array(
                'id'=>$u['id'],
                'name'=>$u['description'],
                'completed'=>true,
                'position'=>intval($u['position'])
            );
            $i=0;
            $unit['pages']=call_user_func_array('array_merge',
                array_map(function($pg) use(&$unit,&$i){

                    return array_map(function($p) use(&$unit,&$i){
                        if(!$p['score']){
                            $unit['completed']=false;
                        }
                        $i++;
                        $page =array(
                            'id'=>$p['id'],
                            'name'=>$p['name'],
                            'score'=>$p['score'],
                            'max_score'=>$p['maxScore'],
                            'due_date'=>$p['due_date'],
                            'post_feedback_id'=>$p['postFeedbackId'],
                            'is_exempt'=>$p['isExempt'],
                            'is_score_override'=>$p['isScoreOverride'],
                            'has_quiz_feedback'=>$p['hasQuizFeedback'],
                            'layout'=>$p['layout'],
                            'minimum_score_for_completion'=>intval($p['minimum_score_for_completion']),
                            'orderPages'=>$i
                        );
                        if($page['minimum_score_for_completion'] && $page['score']){
                            $perc =@$page['maxScore']?floatval($page['score'])/floatval($page['maxScore'])*100:0;
                            $page['minimumNotAchieved']=$perc<intval($page['minimum_score_for_completion']);
                        }
                        return $page;
                    },$pg['pages']);
                },$u['pagegroups'])
            );
            $categories[]=$unit;
        }
        $class['categories']=$categories;
        return $class;
    }
    private function wrapClassesFromGradebook($class,$gradebook){
        $gradebookClass = current(array_filter($gradebook['classes'],function($gbClass) use($class){
            return $gbClass['id']==$class['id'];
        }));

        if($gradebookClass && $gradebookClass['units']){
            return $this->wrapClassFromGradebook($class,$gradebookClass);
        }
        else{
            $this->gbCtrl->_recalculate($this->userId,null,$class['id']);
            $gradebookClass=$this->gbCtrl->_getGradebookForUser($this->userId,$class['id']);
            if(count($gradebookClass['classes'])) {
                return $this->wrapClassFromGradebook($class,$gradebookClass['classes'][0]);
            }
        }
    }
    private function wrapClasses($data){
        $classes = array();
        foreach($data as $row){
            if(!isset($classes[$row['classId']])){
                $classes[$row['classId']]=array(
                    'id'=>$row['classId'],
                    'name'=>$row['className'],
                    'courseId'=>$row['courseid'],
                    'show_grades'=>boolval($row['show_grades']),
                    'show_dates'=>boolval($row['show_dates']),
                    'show_grades_as_percentage'=>boolval($row['show_grades_as_percentage']),
                    'show_grades_as_score'=>boolval($row['show_grades_as_score']),
                    'show_table_of_contents'=>array_key_exists('show_table_of_contents',$row)?boolval(@$row['show_table_of_contents']):null,
                    'show_grades_as_letter'=>boolval($row['show_grades_as_letter']),
                    'total_tasks'=>intval($row['total_tasks']),
                    'completed_tasks'=>intval($row['completed_tasks']),
                    'perc_completed_tasks'=>intval($row['perc_completed_tasks']),
                    'categories'=>array(),
                );
                if(isset($row['isActive'])){
                    $classes[$row['classId']]['isActive']=boolval($row['isActive']);
                }
                if(isset($row['is_student'])){
                    $classes[$row['classId']]['isStudent']=boolval($row['is_student']);
                    $classes[$row['classId']]['isTeacher']=!boolval($row['is_student']);
                }
                if(isset($row['groupId'])){
                    $classes[$row['classId']]['courseId'].='-'.$row['groupId'];
                    $classes[$row['classId']]['name'].='-'.$row['groupName'];
                }
            }
            $categories = &$classes[$row['classId']]['categories'];

            if(!isset($categories[$row['id']]) && $row['id']){
                $categories[$row['id']]=array(
                    'id'=>$row['id'],
                    'name'=>$row['name'],
                    'completed'=>boolval($row['completed']),
                    'pages'=>array(),
                );
                $pages = &$categories[$row['id']]['pages'];
                if($row['pageId']){
                    $page = array(
                        'id'=>$row['pageId'],
                        'name'=>$row['pageName'],
                        'score'=>$row['score'],
                        'max_score'=>$row['max_score'],
                        'due_date'=>$row['due_date'],
                        'post_feedback_id'=>$row['post_feedback_id'],
                        'is_exempt'=>$row['is_exempt'],
                        'is_score_override'=>$row['is_score_override'],
                        'has_quiz_feedback'=>$row['has_quiz_feedback'],
                        'orderPages'=>intval($row['orderPages']),
                        'minimum_score_for_completion'=>intval($row['minimum_score_for_completion']),
                        'layout'=>$row['layout']
                    );
                    if($page['minimum_score_for_completion'] && $page['score']){
                        $page['minimumNotAchieved']=floatval($page['score'])/floatval($row['max_score'])*100<intval($page['minimum_score_for_completion']);
                    }
                    $pages[]=$page;
                }
            }


        }

        return $classes;
    }


    private $queryGetClassesCategories = <<<SQL
    SELECT sc.*,
      c.id as classId,
      c.name as className,
      p.id as pageId,
      p.name as pageName
       FROM summary_categories sm
    JOIN category_class cc ON cc.category_id = sm.id
     JOIN classes c ON cc.class_id = c.id
     JOIN units ON c.courseid = units.courseid
     JOIN pages p ON p.unitid = units.id and sm.id = p.category_id

     WHERE c.id in (:classId)
SQL;
    private $queryGetUserClassesCategories = <<<SQL
    SELECT DISTINCT sc.*,
      c.id as classId,
      c.name as className,
      c.courseid,
      c.show_grades_as_percentage,
      c.show_grades_as_score,
      c.show_grades_as_letter,
      c.show_grades,
      c.show_dates,
      c.show_table_of_contents,
      p.id as pageId,
      p.name as pageName,
      is_student,
      (not uc.is_suspended and c.is_active) as isActive,
      pe.completed,
      g.post_feedback_id,
      g.score,
      g.max_score,
      g.due_date,
      g.is_exempt,
      g.is_score_override,
      g.has_quiz_feedback,
      p.minimum_score_for_completion,
      p.layout,
      pr.perc_completed_tasks,
      pr.total_tasks,
      pr.completed_tasks,
      gr.id as groupId,
      gr.name as groupName,
      units.position*100 + p.position as orderPages
       FROM classes c
    LEFT JOIN category_class cc ON cc.class_id = c.id

     LEFT JOIN summary_categories sc ON cc.category_id = sc.id
     LEFT JOIN pages p ON sc.id = p.category_id
     LEFT JOIN units ON units.id = p.unitid
     JOIN user_classes uc ON uc.classid = c.id
     LEFT JOIN groups gr ON uc.groupid = gr.id
     LEFT JOIN performance_evaluation pe ON uc.userid = pe.user_id and cc.category_id=pe.category_id and c.id = pe.class_id
     LEFT JOIN gradebook g ON g.userid = uc.userid and p.id = g.pageid
     LEFT JOIN progress_report pr ON pr.classid = c.id and pr.userid = uc.userid
     WHERE uc.userid = :userId
SQL;
    private $queryGetCategories = <<<SQL
    SELECT sc.* FROM summary_categories sc
    LEFT JOIN category_class cc ON cc.category_id = sc.id
    WHERE (sc.is_course_level = 0 OR cc.class_id = :classId) and sc.orgid = :orgId
SQL;


}