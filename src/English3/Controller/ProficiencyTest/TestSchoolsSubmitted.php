<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.5.8
 * Time: 11:39
 */

namespace English3\Controller\ProficiencyTest;


use English3\Controller\ClassesController;
use English3\Controller\GradebookController;
use English3\Controller\ProficiencyTest\Mailer\EmailUsers;
use English3\Controller\ProficiencyTest\Mailer\TemplateGradedTestEmailForAdmins;
use English3\Controller\UserController;
use English3\Controller\Utility;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class TestSchoolsSubmitted {
    private $db;
    public function __construct(){
        $this->db = new TestSchoolsSubmittedDB();
    }
    public function getTests(Request $request, $schoolId){
        $tests = $this->db->getTests($schoolId);
        if($request->query->get("includeGradebook")){
            $tests = $this->includeTestsGradebook($tests);
        }
        return new JsonResponse($tests);
    }
    public function addTest(Request $request, $schoolId,$userId){
        Utility::clearPOSTParams($request);
        $testId = $request->request->get('testId');
        if(!$testId){
            return Utility::buildHTTPError("Invalid testid",500,['showToUser'=>true]);
        }
        if(!boolval(Utility::getInstance()->fetchOne('SELECT id FROM proficiency_tests_submitted ps where userid = :userId and testid = :testId and schoolid = :schoolId',['schoolId'=>$schoolId,'userId'=>$userId,'testId'=>$testId]))){
            $this->sendEmailToAdmins($schoolId,$userId,$testId);
        }
        $this->db->addTest($schoolId,$userId,$testId);
        return new JsonResponse('ok');
    }
    public function removeTest(Request $request, $schoolId,$userId,$testId){
        $this->db->removeTest($schoolId,$userId,$testId);
        return new JsonResponse('ok');
    }
    private function includeTestsGradebook($tests){
        $container = array();
        foreach($tests as $test){
            $this->addTestIfNecessary($container,$test);
            $studentTest = $this->getTestGradebook($test);
            $container[$test['testId']]['students'][]=$studentTest;
            if(@$container[$test['testId']]['isJ1']===null){
                $container[$test['testId']]['isJ1'] = boolval(@$studentTest['isJ1']);
            }
        }
        return array_values($container);
    }
    private function addTestIfNecessary(&$container,$test){
        Utility::addToObjectIfNotExists($test['testId'],['name'=>$test['name'],'id'=>$test['testId'],'students'=>array()],$container);
    }
    private function getTestGradebook($test){
        $ctrl = new GradebookController(Utility::getInstance()->reader);
        $gb = $ctrl->_getGradebookForUser($test['userId'],$test['testId']);
        $gb = array_merge($gb,array_values($gb['classes'])[0]);
        $gb['firstName']=$gb['fname'];
        $gb['lastName']=$gb['lname'];
        $gb['testId']=$gb['id'];
        $gb['id']=$test['userId'];
        unset($gb['classes']);
        return $gb;
    }


    private function sendEmailToAdmins($schoolId,$userId,$testId){
        $userCtrl = UserController::byId(Utility::getInstance()->reader,$userId);
        $student = $userCtrl->user;
        $adminsCtrl = new TestSchoolsAdminsDB();
        $class = ClassesController::_getClass($testId);
        foreach($adminsCtrl->getAdmins($schoolId) as $adminRow){
            if(!!EmailUsers::canSendE3PTAdmin($adminRow['id'])){
                continue;
            }
            $adminCtrl = UserController::byId(Utility::getInstance()->reader,$adminRow['id']);
            $admin = $adminCtrl->user;
            $mailer = new TemplateGradedTestEmailForAdmins($admin,$student,$class);
            $mailer->send();
        }
    }
}

class TestSchoolsSubmittedException extends \Exception{}