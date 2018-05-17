<?php

namespace English3\Controller\Users;


use English3\Controller\Utility;

use Phinx\Migration\Util;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class UserGuardiansArray extends UserGuardiansSQL {
    public $students;
    public function tempGetDupGuardians(Request $request){
        $checker = new DupGuardiansChecker();
        return new JsonResponse($checker->check());
    }
    public function getGuardiansGivenUserIds($userIds){
        $this->students=array();
        $data = parent::getGuardiansGivenUserIds($userIds);
        $this->prepareStudents($data);
        return $this->students;
    }
    private function prepareStudents($data){
        foreach($data as $entry){
            $this->createStudentIfNotExists($entry);
            if(!is_null(@$entry['parentId'])){
                $this->createGuardianForStudentIfNotExists($entry,'parent');
            }
            if(!is_null(@$entry['advisorId'])){
                $this->createGuardianForStudentIfNotExists($entry,'advisor');
            }
        }
    }
    private function createStudentIfNotExists($entry){
        if(!array_key_exists($entry['userId'], $this->students)){
            $this->students[$entry['userId']]= array(
                'id' => $entry['userId'],
                'first_name' => $entry['fname'],
                'last_name' => $entry['lname'],
                'name'=>$entry['lname'].', '.$entry['fname'],
                'fullName'=>$entry['fname'].' '.$entry['lname'],
                'advisors' => array(),
                'parents' => array(),
            );
        }
    }
    private function createGuardianForStudentIfNotExists($entry,$type){
        $guardian = array(
            'id'=>@$entry[$type.'Id'],
            'name'=>@$entry[$type.'Name'],
            'email'=>@$entry[$type.'Email']
        );
        if(!array_key_exists($guardian['id'], $this->students[$entry['userId']][$type.'s'])){
            $this->students[$entry['userId']][$type.'s'][$guardian['id']]=$guardian;
        }

    }

}

class UserGuardiansSQL{
    public function getGuardiansGivenUserIds($userIds){
        $query =$this->queryGetGuardians;
        $query.=' and u.id in (' . implode(',',$userIds) . ')';
        return Utility::getInstance()->fetch($query);
    }
    private $queryGetGuardians = <<<SQL
    SELECT DISTINCT
        u.fname,
		u.lname,
		 u.email,
		 u.id as userId,
		 guardian.id as parentId,
		 concat(guardian.fname,' ',guardian.lname) as parentName,
		 guardian.email as parentEmail,
		 advisor.id as advisorId,
		 concat(advisor.fname,' ',advisor.lname) as advisorName,
		 advisor.email as advisorEmail
		FROM users u
		LEFT JOIN user_guardians ug ON ug.userchildid = u.id
		LEFT JOIN users guardian ON guardian.id = ug.userid
		LEFT JOIN user_advisors ua ON ua.studentid = u.id
		LEFT JOIN users advisor ON advisor.id = ua.userid
		WHERE 1
SQL;

}

class DupGuardiansChecker{
    public function check(){
        $allGuardians = Utility::getInstance()->fetch('SELECT u.fname,u.lname,u.email,u.id FROM users u join user_guardians ug on ug.userid = u.id');
        $dupGuardians = array();
        foreach($allGuardians as $guardian){
            $guardianEmails = preg_split("/[,\/;]+/",$guardian['email']);
            foreach($guardianEmails as $email){
                $email  = trim($email);
                $emailRegex = "({$email})[[:space:]]*(,|$|\/|;)";
                $numberOfAccounts = Utility::getInstance()->fetchOne(self::$queryCheckAdvisorByEmail, array('email' => $emailRegex));
                if(intval($numberOfAccounts)>1){
                    Utility::addToObjectIfNotExists($guardian['id'],$guardian,$dupGuardians);
                    break;
                }
            }
        }
        return $dupGuardians;
    }
    protected static $queryCheckAdvisorByEmail = <<<SQL
		SELECT count(*)
		FROM users
		WHERE email REGEXP :email limit 1;
SQL;
}