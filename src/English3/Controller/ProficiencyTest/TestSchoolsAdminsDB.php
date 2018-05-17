<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.5.8
 * Time: 12:15
 */

namespace English3\Controller\ProficiencyTest;


use English3\Controller\Utility;

class TestSchoolsAdminsDB {
    public function getAdmins($schoolId){
        return Utility::getInstance()->fetch($this->queryGetAdmins,['schoolId'=>$schoolId]);
    }
    public function addAdmin($schoolId,$userId){
        if(!$schoolId){
            throw new TestSchoolsAdminsException("Could not add admin. Please try to re-open the window");
        }
        Utility::getInstance()->insert($this->queryAddAdmin,['schoolId'=>$schoolId,'userId'=>$userId]);

    }
    public function removeAdmin($schoolId,$userId){
        Utility::getInstance()->reader->delete('proficiency_schools_admins',['schoolId'=>$schoolId,'userId'=>$userId]);
    }
    private $queryGetAdmins = <<<SQL
    SELECT u.id,u.fname,u.lname,u.email FROM users u
    JOIN proficiency_schools_admins pa ON pa.userid = u.id
    WHERE pa.schoolid = :schoolId
SQL;
    private $queryAddAdmin = <<<SQL
    INSERT INTO proficiency_schools_admins (schoolid,userid) values (:schoolId,:userId)
    ON DUPLICATE KEY update userid = values(userid)
SQL;

}