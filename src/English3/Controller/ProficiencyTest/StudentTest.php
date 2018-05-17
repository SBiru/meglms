<?php
namespace English3\Controller\ProficiencyTest;
use English3\Controller\GradebookController;
use English3\Controller\GradebookGradesStyleExporter;
use English3\Controller\Organization\OrganizationController;
use English3\Controller\ProficiencyTest\ScoreRange\CategoryDB;
use English3\Controller\ProficiencyTest\ScoreRange\LevelDB;
use English3\Controller\RubricsController;
use English3\Controller\Utility;
use Symfony\Component\HttpFoundation\Request;

class StudentTest {
    private $classId;
    private $studentId;
    public $hasFinishedSubmitting = true;
    public function __construct($classId,$studentId){
        $this->classId = $classId;
        $this->studentId = $studentId;
    }
    public function load(){
        $gradebook = $this->getGradebook();
        return $this->prepareTestDetails($gradebook);
    }
    private function getGradebook(){
        $controller = new GradebookController(Utility::getInstance()->reader);
        return $controller->_getGradebookForUser($this->studentId,$this->classId);
    }
    private function prepareTestDetails($gradebook){
        $testDetails = $this->getTestInfo($gradebook);

        $class = array_values($gradebook['classes'])[0];
        $this->lastSubmissionDate = null;
        $testDetails['pageGroups'] = $this->preparePageGroupsFromClass($class);
        if(count($testDetails['pageGroups'])==0){
            $this->hasFinishedSubmitting = false;
        }
        $testDetails['submittedOn'] = $this->lastSubmissionDate? date('d-M-Y',$this->lastSubmissionDate):'';
        list($totalScore,$actualTotalScore,$maxTotalScore) = $this->calculateClassScore($testDetails['pageGroups']);
        $testDetails['totalScore'] = is_nan($totalScore)?0:round($totalScore);
        $testDetails['actualTotalScore'] = $actualTotalScore;
        $testDetails['maxTotalScore'] = $maxTotalScore;
        $status = $this->checkClassStatus($testDetails['pageGroups']);
        $testDetails['finishedGradeClass'] = $status['finishedGrade'];
        $testDetails['hasFinishedSubmitting'] = $this->hasFinishedSubmitting;
        $testDetails['hasStarted'] = $status['hasStarted'] || boolval(Utility::getInstance()->fetchOne("SELECT id FROM posts WHERE userid='{$this->studentId}' and classid='{$this->classId}' limit 1"));
        $testDetails['testName'] = $class['className'];
        $testDetails['classId'] = $class['id'];
        $testDetails['groupId'] = @$class['groupId'];
        $testDetails['isJ1'] = @$class['isJ1'];
        $testDetails['courseId'] = $class['courseId'];
        $testDetails['idImage'] = $this->getIdImage($class['id'],$this->studentId);
        $testDetails['commercialUrl'] = ProficiencyTestProducts::commercialUrlForClassId($testDetails['classId']);
        $testDetails['additionalComments']= $this->getAdditionalComments($class['id'],$this->studentId,$testDetails['pageGroups']);
        $orgId = OrganizationController::_getOrgFromClassId($testDetails['classId']);
        $testDetails['enableCertificate'] = @boolval(OrganizationController::_getField($orgId,'enable_certificate'));
        $testDetails['scoreDescription'] = $this->getScoreDescription($class['id'],$this->studentId);
        $testDetails['userPicture'] = $this->getUserPicture($class['id'],$this->studentId);

        $testDetails['evaluatorId'] = $this->getEvaluatorId($class['id'],$this->studentId);


        if($this->studentId && $_SESSION['USER']['ID'] && $practiceTestId = self::getPracticeTest($this->classId,
                $this->studentId)){
            $ctrl = new self($practiceTestId,$this->studentId);
            $a =  $ctrl->load();
            $testDetails['practiceTest'] = $a;
        }

        return $testDetails;
    }
    private function getIdImage($classId,$studentId){
        global $PATHS;
        $url = Utility::getInstance()->fetchOne($this->queryGetIDImage,['classId'=>$classId,'userId'=>$studentId]);
        if($PATHS->local_only){
//            $url = 'http://elearn.english3.com'.$url;
        }
        return $url;
    }
    private function getUserPicture($classId,$studentId){
        $url = Utility::getInstance()->fetchOne($this->queryGetUserPicture,['classId'=>$classId,'userId'=>$studentId]);

        return $url;
    }
    private function getEvaluatorId($classId,$studentId){
        $id = Utility::getInstance()->fetchOne($this->queryGetEvaluatorId,['classId'=>$classId,'userId'=>$studentId]);

        return $id;
    }
    private function getScoreDescription($classId,$studentId){
        $pageData = Utility::getInstance()->fetchRow($this->queryGetTimedReviewPage,['classId'=>$classId]);
        if(@!$pageData['rubricid']){
            return '';
        }

        $rubricCtrl = new RubricsController(Utility::getInstance()->reader);
        $grade = $rubricCtrl->getGradeRubricJSON(['pageid'=>$pageData['id'],'userid'=>$studentId,'groupBy'=>'postid']);
        $grade = end($grade);
        $rubric = $rubricCtrl->getRubric(new Request(),$pageData['rubricid'],false);

        $description = '';
        foreach ($grade['rows'] as $rubricitem){
            $description .= $rubric['grid']['items'][$rubricitem['row']][$rubricitem['col']]['text'];
        }
        return $description;
    }

    private function getTestInfo($gradebook){
        unset($gradebook['classes']);
        $gradebook['name'] = $gradebook['fname'].' '.$gradebook['lname'];
        return $gradebook;
    }
    private function preparePageGroupsFromClass($class){
        $pageGroups = [];
        foreach($class['units'] as $unit){
            foreach($unit['pagegroups'] as $pg){
                if($pg['id']){
                    $this->preparePageGroup($pg,$pageGroups);
                }
            }
        }
        return $pageGroups;
    }
    private function preparePageGroup($pg,&$pageGroups){
        $total = 0;
        $maxScore = 0;
        $finishedGrade = true;
        $submissions = array();
        foreach($pg['pages'] as &$page){
            if(@$page['score']>0){
                $page['score'] = round($page['score'],1);

            }
            $total+=floatVal($page['score']);
            $maxScore+=floatVal($page['maxScore']);
            if($page['score']===null){
                $finishedGrade = false;
            }
            if(!$page['needingGrade']){
                $this->hasFinishedSubmitting = false;
            }
            if($page['submittedOn']){
                $this->getPageSubmissions($page,$submissions);
            }else{
                $submissions[]=$page;
            }
            $this->checkLastSubmissionDate($page);
        }
        if($maxScore>0){
            $reportLevelAndComments = ProficiencyAreaRangeCalculator::getLevel($pg['id'],$total);
            $reportLevelAndComments=$reportLevelAndComments?:[];
            $pageGroups[]=array_merge([
                'name'=>$pg['name'],
                'score'=>round($total*100/$maxScore,1),
                'actualScore'=>$total,
                'maxScore'=>$maxScore,
                'finishedGrade'=>$finishedGrade,
                'submissions'=>$submissions
            ],$reportLevelAndComments);
        }
    }

    private function calculateClassScore($pageGroups){
        $totalScore = 0;
        $actualTotalScore = 0;
        $maxTotalScore = 0;
        foreach($pageGroups as $pg){
            $totalScore+=$pg['score'];
            $actualTotalScore+=$pg['actualScore'];
            $maxTotalScore+=$pg['maxScore'];
        }
        return [$totalScore/count($pageGroups),$actualTotalScore,$maxTotalScore];
    }
    private function checkClassStatus($pageGroups){
        $finishedGrade = true;
        $hasStarted = false;
        foreach($pageGroups as $pg){
            if($pg['finishedGrade']===false){
                $finishedGrade=false;
            }
            if(count($pg['submissions']) && $this->checkPageGroupStatus($pg)){
                $hasStarted = true;
            }
            if($hasStarted && !$finishedGrade){
                break;
            }
        }
        return ['finishedGrade'=>$finishedGrade,'hasStarted'=>$hasStarted];
    }
    private function checkPageGroupStatus($pg){
        foreach($pg['submissions'] as $submission){
            if($submission['score']!== null){
                return true;
            }
        }
        return false;
    }
    private function getPageSubmissions($page,&$submissions){
        $page['submittedOn'] = $this->formatDate($page['submittedOn']);
        switch($page['layout']){
            case 'QUIZ':
                $this->getQuizSubmissions($page,$submissions);
                break;
            case 'CONTENT':
            case 'TIMED_REVIEW':
                $page['postId']=$this->getPostId($page);
                $page['type']=$this->isVideoSubmission($page)?'video':'essay';
            if($page['type']=='video' && $postId = $page['postId']){
                    $postData = Utility::getInstance()->fetchRow("SELECT video_url,video_thumbnail_url FROM posts WHERE id = $postId");
                    $page['video_url'] = $postData['video_url'];
                    $page['video_thumbnail_url'] = $postData['video_thumbnail_url'];
            }
                if($page['postId']){
                    $submissions[]=$page;
                }

                break;
            default:
                break;
        }
    }
    private function formatDate($date){
        return $date?date('d-M-Y H:i:s',strtotime($date)):'';
    }
    private function getPostId($page){
        return Utility::getInstance()->fetchOne('SELECT id FROM posts where userid = :userId and pageid = :pageId order by id desc limit 1',['pageId'=>$page['id'],'userId'=>$this->studentId]);
    }
    private function isVideoSubmission($page){
        return boolval(Utility::getInstance()->fetchOne('SELECT allow_video_post FROM pages where id = :pageId',['pageId'=>$page['id']]));
    }
    private function getQuizSubmissions($page,&$submissions){
        $quizSubmissions = $this->getSubmissionQuestions($page['id']);
        foreach($quizSubmissions as $sub){
            $p = $page;
            $p['questionId']=$sub['question_id'];
            $p['submittedOn'] = $this->formatDate($sub['submited']);
            $p['type'] = $sub['type']=='essay'?'essay':'video';
            $submissions[]=$p;
        }
    }
    private function getSubmissionQuestions($pageId){
        return Utility::getInstance()->fetch($this->queryGetSubmissionQuestions,['userId'=>$this->studentId,'pageId'=>$pageId]);
    }
    private function checkLastSubmissionDate($page){
        if($this->lastSubmissionDate === null || strtotime($page['submittedOn']) > $this->lastSubmissionDate){
            $this->lastSubmissionDate = strtotime($page['submittedOn']);
        }
    }
    public function getAdditionalComments($classId,$userId){
        $data = Utility::getInstance()->fetch($this->queryGetAdditionalComments,['userId'=>$userId,'classId'=>$classId]);
        $sections = array();
        foreach($data as $row){
            if($row['id']){
                Utility::addToObjectIfNotExists($row['id'],['name'=>$row['name'],'comments'=>''],$sections);
                $sections[$row['id']]['comments'].= " ".$row['teacher_notes'];
            }
        }
        return $sections;
    }
    private static function getPracticeTest($j1ClassId,$userId){
        return intval(Utility::getInstance()->fetchOne(self::$getPracticeTestQuery,[
            'userId'=>$userId,
            'j1ClassId'=>$j1ClassId
        ]));
    }

    private static $getPracticeTestQuery = <<<SQL
    SELECT uc.classid FROM user_classes uc
    join products p on p.practice_group_id = uc.groupid
    where uc.userid = :userId and p.classid = :j1ClassId
SQL;

    private $queryGetSubmissionQuestions = <<<SQL
    SELECT qr.question_id,q.type,qr.submited from quiz_responses qr
    join questions q on q.id = qr.question_id
    where
      qr.quiz_id = :pageId and qr.user_id = :userId
      and q.type in ('essay','studentvideoresponse')
      and qr.response is not NULL
      and qr.response not like '%"videofilename":null%'
SQL;
    private $queryGetIDImage = <<<SQL
    SELECT upload_url FROM posts
    JOIN pages p on p.id = posts.pageid
    JOIN page_meta pm on pm.meta_key = 'is_id_verification' and pm.pageid = p.id
    JOIN units u on p.unitid = u.id
    JOIN classes c ON c.courseid = u.courseid
    WHERE pm.meta_value = 1 and c.id = :classId and posts.userid = :userId
    LIMIT 1
SQL;
    private $queryGetUserPicture = <<<SQL
    SELECT upload_url FROM posts
    JOIN pages p on p.id = posts.pageid
    JOIN units u on p.unitid = u.id
    JOIN classes c ON c.courseid = u.courseid
    WHERE p.layout='PICTURE' and c.id = :classId and posts.userid = :userId
    LIMIT 1
SQL;
    private $queryGetEvaluatorId = <<<SQL
    SELECT t.id FROM posts
    JOIN pages p on p.id = posts.pageid
    JOIN grade_posts gp on gp.post_id = posts.id
    join users t on t.id = gp.user_id;
    JOIN units u on p.unitid = u.id
    JOIN classes c ON c.courseid = u.courseid
    WHERE  and c.id = :classId and posts.userid = :userId
    LIMIT 1
SQL;
    private $queryGetTimedReviewPage = <<<SQL
    SELECT p.id,p.rubricid FROM pages p
    JOIN units u on p.unitid = u.id
    JOIN classes c ON c.courseid = u.courseid
    WHERE p.layout='TIMED_REVIEW' and c.id = :classId and is_gradeable = 1
    LIMIT 1
SQL;

    private $queryGetAdditionalComments = <<<SQL
    SELECT pg.name,pg.id,gp.teacher_notes FROM posts p
    join grade_posts gp on gp.post_id = p.id
    join pages on pages.id = p.pageid
    left join pages pg on pg.id = pages.pagegroupid
    where p.userid = :userId and p.classid = :classId and gp.teacher_notes <> ''
SQL;

}
class ProficiencyAreaRangeCalculator{
    public static function getLevel($pageGroupId,$score){
        $categoryId = self::getCategoryIdForPageGroup($pageGroupId);
        if($categoryId){
            $area = CategoryDB::get($categoryId);
            $levels = LevelDB::getLevels($categoryId);
            $level =self::findLevel($levels,$score);
            return [
                'area'=>$area['name'],
                'level'=>$level['name'],
                'details'=>$level['details']
            ];
        }
    }
    private static function getCategoryIdForPageGroup($pgId){
        return Utility::getInstance()->fetchOne('SELECT meta_value FROM page_meta WHERE meta_key = "proficiency_area" and pageid = :pageId',['pageId'=>$pgId]);
    }
    private static function findLevel($levels,$score){
        foreach($levels as $level){
            if($score>= floatval($level['min']) && $score<= floatval($level['max'])){
                return $level;
            }
        }
    }

}
