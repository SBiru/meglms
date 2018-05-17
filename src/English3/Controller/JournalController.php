<?php

namespace English3\Controller;

use Doctrine\DBAL\Connection;
use English3\Controller\Utility;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\Serializer\Normalizer\GetSetMethodNormalizer;

class JournalController
{
    private $reader;
    public function __construct(Connection $reader){
        $this->reader = $reader;
    }
    public function get(Request $request,$id){
        $util = Utility::getInstance();
        $classId = ClassesController::_getFromPage($util->reader,$id);

        $studentCanAccess = $util->checkStudent($classId,null,false);
        if(!$studentCanAccess){
            $util->checkTeacher($classId);
        }

        return new JsonResponse(self::_get($id,$classId));
    }
    public static function _getStudentGrade($pageId,$userId){
        $util = Utility::getInstance();
        return $util->fetchOne(self::$queryGetJournalGrade,['pageId'=>$pageId,'userId'=>$userId]);
    }
    public static function _get($id,$classId=null){
        $util = Utility::getInstance();
        $pageInfo=PageController::_get($util->reader,$id);

        if(!$classId){
            $classId = ClassesController::_getFromPage($util->reader,$id);
        }
        $classCtrl = new ClassesController($util->reader);
        $class = $classCtrl->wrapClassObject($classCtrl::_getClass($classId));


        $isStudent = $util->me->isStudent($classId,false);

        $query = self::$queryGetJournal;

        if($isStudent && $pageInfo['isPrivate']){
            $query.=' AND p.userid = '.$util->me->user->getUserId();
        }

        $data = $util->fetch($query,['pageId'=>$id]);
        $students=array();

        foreach($data as $row){

            if(!$students[$row['studentId']]){
                $students[$row['studentId']]=array(
                    'id'=>$row['studentId'],
                    'fname'=>$row['studentFName'],
                    'lname'=>$row['studentLName'],
                    'journal'=>array(
                        'posts'=>array(),
                        'grade'=>null
                    )
                );
            }
            $posts = &$students[$row['studentId']]['journal']['posts'];
            if(!$posts[$row['postrootparentid']]) {
                $posts[$row['postrootparentid']] = array(
                    'history' => array()
                );
            }
            $post = array(
                'id'=>$row['id'],
                'rootId'=>$row['postrootparentid'],
                'message'=>$row['message'],
                'submitted'=>$row['created'],
                'feedback'=>array()
            );
            if($row['grade']){
                $post['feedback']=array(
                    'id'=>$row['feedbackId'],
                    'message'=>$row['feedbackMessage'],
                    'grade'=>floatval($row['grade']),
                    'submitted'=>$row['feedbackSubmitted'],
                    'teacher'=>array(
                        'id'=>$row['teacherId'],
                        'fname'=>$row['teacherFName'],
                        'lname'=>$row['teacherLName'],
                    )
                );
                $posts[$row['postrootparentid']]['lastGrade']=floatval($row['grade']);
            }

            $posts[$row['postrootparentid']]=array_merge($posts[$row['postrootparentid']],$post);
            $posts[$row['postrootparentid']]['history'][]=$post;

        }
        foreach($students as &$student){
            $student['journal']['posts']=array_values($student['journal']['posts']);
            if($pageInfo['gradingType']==='1'){
                $firstPost = $student['journal']['posts'][0];
                unset($firstPost['message']);
                unset($firstPost['submitted']);
                $student['journal']['gradeForWholeJournal']=$firstPost;
                if($firstPost['feedback']['grade']){
                    $student['journal']['grade']=$firstPost['feedback']['grade'];
                }

            }
            foreach($student['journal']['posts'] as &$post){
                if($pageInfo['gradingType']==='1'){
                    if(!isset($student['journal']['gradeForWholeJournal']['feedback']['submitted']) ||
                        $post['submitted']>$student['journal']['gradeForWholeJournal']['feedback']['submitted']
                    ){
                        $post['needingGrade']=true;
                        $student['needingGrade']=true;
                    }
                }else{
                    if($post['feedback']['grade']||$post['lastGrade']){
                        $grade=$post['feedback']['grade']?$post['feedback']['grade']:$post['lastGrade'];
                        if($student['journal']['grade']){
                            $student['journal']['grade']+=$grade;
                        }else{
                            $student['journal']['grade']=$grade;
                        }
                    }
                    if(!$post['feedback']['grade']){
                        $student['needingGrade']=true;
                    }
                }

            }

            if($student['journal']['grade'] && $pageInfo['maxPoints']){
                $grade = $student['journal']['grade'];
                $percGrade = $grade*100/$pageInfo['maxPoints'];
                $letterGrade = GradebookController::_getLetterGrade(intval($percGrade),$class['rubric']);
                $student['journal']['percGrade']=$percGrade;
                $student['journal']['letterGrade']=$letterGrade;
            }
        }
        return ['students'=>$students,'page'=>$pageInfo];
    }

    private static $queryGetJournal = <<<SQL
      SELECT
        p.id,
        p.postrootparentid,
        p.message,
        p.created,
        student.id as studentId,
        student.fname as studentFName,
        student.lname as studentLName,
        gp.grade,
        teacherPost.id as feedbackId,
        teacherPost.message as feedbackMessage,
        teacherPost.created as feedbackSubmitted,
        teacher.id as teacherId,
        teacher.fname as teacherFName,
        teacher.lname as teacherLName
      FROM posts p
      JOIN users student ON student.id = p.userid
      JOIN pages pg ON pg.id = p.pageid
      JOIN units u ON u.id = pg.unitid
      JOIN classes cl ON u.courseid = cl.courseid
      JOIN user_classes uc ON uc.classid = cl.id and uc.userid = p.userid
      LEFT JOIN grade_posts gp ON gp.post_id = p.id
      LEFT JOIN users teacher ON teacher.id = gp.user_id
      LEFT JOIN posts teacherPost ON gp.teacher_post_id = teacherPost.id
      WHERE
        pg.id = :pageId
        AND uc.is_student = 1

SQL;
    private static $queryGetJournalGrade = <<<SQL
    SELECT sum(p1.grade) from (SELECT gp.id,grade,postrootparentid
      FROM posts p
    JOIN grade_posts gp ON gp.post_id = p.id
    WHERE p.pageid = :pageId and p.userid = :userId) p1
    LEFT JOIN (SELECT gp.id,grade,postrootparentid
      FROM posts p
    JOIN grade_posts gp ON gp.post_id = p.id
    WHERE p.pageid = :pageId and p.userid = :userId) p2
        ON p1.postrootparentid = p2.postrootparentid and p2.id>p1.id
	WHERE p2.id is null
SQL;


}