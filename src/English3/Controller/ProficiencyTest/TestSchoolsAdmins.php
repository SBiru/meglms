<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.5.8
 * Time: 11:39
 */

namespace English3\Controller\ProficiencyTest;


use English3\Controller\Utility;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class TestSchoolsAdmins {
    private $db;
    public function __construct(){
        $this->db = new TestSchoolsAdminsDB();
    }
    public function getAdmins(Request $request, $schoolId){
        return new JsonResponse($this->db->getAdmins($schoolId));
    }
    public function addAdmin(Request $request, $schoolId,$userId){
        $this->db->addAdmin($schoolId,$userId);
        return new JsonResponse('ok');
    }
    public function removeAdmin(Request $request, $schoolId,$userId){
        $this->db->removeAdmin($schoolId,$userId);
        return new JsonResponse('ok');
    }
    public static function schoolAdmin($userId){
        return Utility::getInstance()->fetchOne('SELECT schoolid FROM proficiency_schools_admins WHERE userid = :id LIMIT 1',['id'=>$userId]);
    }
}

class TestSchoolsAdminsException extends \Exception{}