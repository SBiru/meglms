<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.5.8
 * Time: 12:13
 */

namespace English3\Controller\ProficiencyTest;


use English3\Controller\UserController;
use English3\Controller\Utility;

class TestSchoolsSubmittedDB{
    public function getTests($schoolId){
        return Utility::getInstance()->fetch($this->queryGetTests,['schoolId'=>$schoolId]);
    }
    public function addTest($schoolId,$userId,$testId){
        Utility::getInstance()->insert($this->queryAddTest,['schoolId'=>$schoolId,'userId'=>$userId,'testId'=>$testId]);
    }
    public function removeTest($schoolId,$userId,$testId){
        Utility::getInstance()->reader->delete('proficiency_tests_submitted',['schoolId'=>$schoolId,'userId'=>$userId,'testId'=>$testId]);
    }


    private $queryGetTests = <<<SQL
    SELECT c.name,
      users.id as userId,
      users.fname,
      users.lname,
      users.email,
      c.id as testId,
      max(g.submitted_on) as submittedOn
    FROM gradebook g
    JOIN users ON users.id = g.userid
    JOIN pages p ON p.id = g.pageid
    JOIN units u ON u.id = p.unitid
    JOIN classes c ON c.courseid = u.courseid
    JOIN proficiency_tests_submitted ps ON ps.testid = c.id and ps.userid = g.userid
    WHERE ps.schoolid = :schoolId
    group by ps.testid,ps.userid
SQL;
    private $queryAddTest = <<<SQL
    INSERT INTO proficiency_tests_submitted (schoolid,userid,testid) values (:schoolId,:userId,:testId)
    ON DUPLICATE KEY update testid = values(testid)
SQL;

}