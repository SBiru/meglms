<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.20.7
 * Time: 16:18
 */

namespace English3\Controller\ProficiencyTest;


use English3\Controller\Utility;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class TestClasses {
    private $userId;
    private $isJ1;
    private $isE3PT;
    public function __construct($userId = null){
        if(!$userId){
            $userId = $_SESSION['USER']['ID'];
        }
        $this->isJ1 = boolval(@$_REQUEST['isJ1']);
        $this->isE3PT = boolval(@$_REQUEST['isE3PT']);
        $this->userId = $userId;
    }
    public function getAll($forTeacher){
        $query = $this->isJ1?$this->queryGetJ1Classes:$this->queryGetTestClasses;
        $join = $this->isJ1?' where c.is_j1_class=1':($this->isE3PT?'where (c.is_j1_class is null or c.is_j1_class = 0)
        ':'');
        if(!Utility::getInstance()->checkAdmin(null,false,false) && $forTeacher){
           $join= ' LEFT JOIN user_classes uc on uc.classid = c.id WHERE (uc.is_test_admin=1 or uc.is_teacher=1) and uc.userid = '.$this->userId;
           if($this->isJ1){
               $join.= ' and c.is_j1_class = 1';
           }
           if($this->isE3PT){
               $join.= ' and (c.is_j1_class is null or c.is_j1_class = 0)';
            }
        }
        $query = str_replace('__JOIN__',$join,$query);

        return Utility::getInstance()->fetch($query);
    }
    public function removeClass(Request $request, $classId){
        Utility::getInstance()->reader->delete('proficiency_classes',['classid'=>$classId]);
        return new JsonResponse('ok');
    }
    public function addClass(Request $request){
        Utility::clearPOSTParams($request);
        $classId = $request->request->get('classId');
        Utility::getInstance()->reader->insert('proficiency_classes',['classid'=>$classId]);
        return new JsonResponse('ok');
    }
    public function saveTag(Request $request,$classId){
        Utility::clearPOSTParams($request);
        $tag = $request->request->get('tag');
        Utility::getInstance()->reader->update('proficiency_classes',['tag'=>$tag],['classid'=>$classId]);
        return new JsonResponse('ok');
    }
    private $queryGetTestClasses = <<<SQL
    SELECT distinct c.id, c.name,pc.tag FROM classes c
    JOIN proficiency_classes pc on pc.classid = c.id
    __JOIN__
SQL;
    private $queryGetJ1Classes = <<<SQL
    SELECT distinct c.id, c.name FROM classes c
    __JOIN__
SQL;
    public static $queryIsProficiencyTeacher = <<<SQL
    SELECT uc.id FROM user_classes uc JOIN
    proficiency_classes pc on pc.classid = uc.classid
    where uc.is_teacher = 1 and uc.userid = :userId limit 1
SQL;
    public static $queryIsNonProficiencyTeacher = <<<SQL
    SELECT uc.id FROM user_classes uc left JOIN
    proficiency_classes pc on pc.classid = uc.classid
    where uc.is_teacher = 1 and uc.userid = :userId and pc.id is null limit 1
SQL;


}