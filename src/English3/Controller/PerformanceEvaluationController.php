<?php
namespace English3\Controller;

use Doctrine\DBAL\Connection;
use English3\Controller\Utility;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\Serializer\Encoder\JsonEncode;


class PerformanceEvaluationController
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
    public function getTeacherClasses(Request $request,$userId){
        $userId=$userId=='me'?$_SESSION['USER']['ID']:$userId;
        return new JsonResponse($this->util->fetch($this->queryGetMyClasses,['teacherId'=>$userId]));
    }
    public function getStudentsPerformance(Request $request,$userId){
        $userId=$userId=='me'?$_SESSION['USER']['ID']:$userId;
        $classId = $request->get('classId');
        $data = $this->util->fetch($this->queryGetStudentsPerformance,['teacherId'=>$userId,'classId'=>$classId]);
        $classes = array();
        $students = array();
        $userClasses = array();
        foreach($data as $row){
            if(!isset($classes[$row['classid']])){
                $classes[$row['classid']]=array(
                    'id'=>$row['classid'],
                    'name'=>$row['className'],
                    'courseId'=>$row['courseid'],
                    'categories'=>array()
                );
            }
            if(!isset($classes[$row['classid']]['categories'][$row['categoryId']])){
                $classes[$row['classid']]['categories'][$row['categoryId']]=array(
                    'id'=>$row['categoryId'],
                    'name'=>$row['categoryName']
                );
            }
            if(!isset($students[$row['userid']])){
                $students[$row['userid']]=array(
                    'id'=>$row['userid'],
                    'fname'=>$row['fname'],
                    'lname'=>$row['lname'],
                    'unCompletedGoals'=>$row['unCompletedGoals']
                );
            }
            if(!isset($userClasses[$row['classid']])){
                $userClasses[$row['classid']]=array('categories'=>array());
            }
            if(!isset($userClasses[$row['classid']]['categories'][$row['categoryId']])){
                $userClasses[$row['classid']]['categories'][$row['categoryId']]= array('students'=>array());
            }
            if(!isset($userClasses[$row['classid']]['categories'][$row['categoryId']]['students'][$row['userid']])){
                $studentInfo=array(
                    'completed'=>boolval($row['completed']),
                    'page'=>array(
                        'score'=>is_null($row['score'])?null:floatval($row['score']),
                        'maxScore'=>$row['max_score']===null?null:floatval($row['max_score']),
                        'minimum_score_for_completion'=>floatval($row['minimum_score_for_completion']),
                        'requireSubmission'=>$row['layout']!='CONTENT'||$row['allow_text_post']||$row['allow_video_post']||$row['allow_upload_post']||$row['allow_template_post'],
                        'rubricId'=>$row['rubricid'],
                        'id'=>$row['pageId']
                    )

                );
                if($row['minimum_score_for_completion'] && $row['score']){
                    $studentInfo['notAchievedMinimum']=floatval($row['score'])*100/floatval($row['max_score'])<floatval($row['minimum_score_for_completion']);
                    $studentInfo['completed']=true;
                }
                $userClasses[$row['classid']]['categories'][$row['categoryId']]['students'][$row['userid']]=$studentInfo;
            }
        }
        foreach($classes as &$class){
            $class['categories']=array_values($class['categories']);
        }
        return new JsonResponse(array(
           'classes'=>array_values($classes),
           'students'=>array_values($students),
           'userClasses'=>$userClasses
        ));
    }

    public function updatePerformance(Request $request){
        Utility::clearPOSTParams($request);
        $this->util->checkRequiredFields(['classId','catId','userId','isCompleted'],$request->request->all());
        $this->util->checkTeacher($request->request->get('classId'));
        $this->util->insert(
            $this->queryUpdateStudentPerformance,
            array(
                'classId'=>$request->request->get('classId'),
                'catId'=>$request->request->get('catId'),
                'userId'=>$request->request->get('studentId'),
                'teacherId'=>$_SESSION['USER']['ID'],
                'changed'=>(new \DateTime())->format('Y-m-d h:i:s'),
                'isCompleted'=>$request->request->get('isCompleted'),
            )
        );
        return new JsonResponse('ok');
    }
    private $queryGetStudentsPerformance = <<<SQL
    SELECT DISTINCT
      my_classes.classid,
      c.name as className,
      c.courseid,
      sc.id as categoryId,
      sc.name as categoryName,
      students.userid,
      s.fname,
      s.lname,
      pe.completed,
      gb.max_score,
      gb.score,
      pages.minimum_score_for_completion,
      pages.allow_template_post,
      pages.allow_text_post,
      pages.allow_upload_post,
      pages.allow_video_post,
      pages.layout,
      pages.id as pageId,
      pages.rubricid,
      count(goals.id) as unCompletedGoals
    FROM user_classes my_classes
    JOIN classes c ON my_classes.classid = c.id
    JOIN user_classes students ON students.classid = my_classes.classid and students.is_student = 1
    JOIN users s ON s.id = students.userid
    JOIN category_class cc ON cc.class_id = c.id
    JOIN summary_categories sc ON cc.category_id = sc.id
    JOIN pages ON pages.category_id = sc.id
    LEFT JOIN performance_evaluation pe ON pe.class_id = c.id and pe.category_id = sc.id and pe.user_id = students.userid
    LEFT JOIN goals ON students.userid = goals.user_id and goals.completed<>1
    LEFT JOIN gradebook gb ON gb.pageid = pages.id and s.id = gb.userid
    WHERE my_classes.is_teacher = 1 and my_classes.userid=:teacherId and if(:classId is not null,my_classes.classid = :classId,1)
    GROUP BY students.userid,c.id,sc.id
SQL;
    private $queryGetMyClasses = <<<SQL
      SELECT DISTINCT c.id, c.name
      FROM user_classes my_classes
      JOIN classes c ON my_classes.classid = c.id
      JOIN category_class cc ON cc.class_id = c.id
      JOIN pages ON pages.category_id = cc.category_id
      WHERE my_classes.is_teacher = 1 and my_classes.userid=:teacherId
      GROUP BY c.id
SQL;
    private $queryUpdateStudentPerformance=<<<SQL
    INSERT INTO performance_evaluation (class_id,category_id,user_id,teacher_id,changed,completed)
    VALUES (:classId,:catId,:userId,:teacherId,:changed,:isCompleted)
    ON DUPLICATE KEY UPDATE teacher_id = values(teacher_id), changed = values(changed), completed=values(completed)
SQL;

}
?>