<?php

namespace English3\Controller;

use Doctrine\DBAL\Connection;
use English3\Controller\Utility;
use Phinx\Migration\Util;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;

class DepartmentController {


    private $reader;


    public function __construct(Connection $reader) {
        $this->reader = $reader;
    }
    public function getDepartments(Request $request){
        $util = new Utility();
        $util->checkAdmin(null,false);
        return new JsonResponse(self::_getDepartments());

    }
    public function getOrgDepartments(Request $request,$orgId){
        $util = new Utility();
        $util->checkAdmin($orgId);

        if($orgId=='me'){
            $orgId = $util->me->user->getOrgId();
        }

        return new JsonResponse(self::_getDepartments($orgId));
    }
    public function getUsers(Request $request,$deptId){
        $util = new Utility();
        $orgId = $util->fetchOne(self::$queryGetDepartment,['deptId'=>$deptId],'organizationid');
        $util->checkAdmin($orgId);

        return new JsonResponse(self::_getUsers($deptId,$request->query->get('role')));
    }




    public static function _getDepartments($orgId = null){
        $util = new Utility();
        if($orgId){
            return $util->fetch(self::$queryGetOrgDepartments,['orgId'=>$orgId]);
        }
        else{
            return $util->fetch(self::$queryGetDepartments);
        }
    }
    public static function _getClasses($deptId){
        $util = new Utility();
        $data =  $util->fetch(self::$queryGetClasses,['deptId'=>$deptId]);
        $classes = [];
        $classCtrl = new ClassesController($util->reader);
        foreach($data as $row){
            $classes[] = $classCtrl->wrapClassObject($row);
        }
        return $classes;
    }

    public static function _getUsers($deptId,$role = null){
        $util = new Utility();
        

        if($role){
            switch($role){
                case 'edit_teacher':
                    $where = ' and uc.is_edit_teacher=1';
                    break;
                case 'teacher':
                    $where = ' and uc.is_teacher=1';
                    break;
                case 'student':
                    $where = ' and uc.is_student=1';
                    break;
                case 'observer':
                    $where = ' and uc.is_observer=1';
                    break;
                default:
                    $where = ' and uc.is_edit_teacher=1';
            }
        }
        else{
            $where = '';
        }

        $data =  $util->fetch(self::$queryGetUsers.$where,['deptId'=>$deptId]);
        $users = [];
        
        if($data) {
            foreach ($data as $row) {
                $users[] = UserController::_wrapUserObject($row);
            }
        }
        return $users;
    }


    private static $queryGetDepartment = <<<SQL
    SELECT * FROM departments WHERE id = :deptId;
SQL;
    private static $queryGetOrgDepartments = <<<SQL
    SELECT * FROM departments WHERE organizationid = :orgId;
SQL;
    private static $queryGetDepartments = <<<SQL
    SELECT * FROM departments;
SQL;
    private static $queryGetClasses = <<<SQL
    SELECT c.* FROM classes c
     JOIN courses on c.courseid = courses.id
	 LEFT JOIN user_classes uc ON uc.classid = c.id
     WHERE courses.departmentid
SQL;
    private static $queryGetUsers = <<<SQL
    SELECT DISTINCT u.id,
          u.fname,
          u.lname,
          u.email
      FROM users u
      JOIN departments d on d.organizationid = u.organizationid
      JOIN user_classes uc on uc.userid = u.id
      WHERE d.id = :deptId

SQL;



}