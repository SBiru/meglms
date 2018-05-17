<?php
/**
 * Created by IntelliJ IDEA.
 * User: denny
 * Date: 9/8/17
 * Time: 12:46 PM
 */

namespace English3\Controller\ProficiencyTest\Exporter;


use English3\Controller\ProficiencyTest\StudentTest;
use English3\Controller\Utility;
use JsonSerializable;


class JsonExporter
{
    private $filterParams;
    public function __construct($filterParams)
    {
        $this->filterParams = $filterParams;
    }

    public function getE3PT(){
        $completedTests = JsonExporterSQL::getCompletedTestsForUser($_SESSION['USER']['ID']);
        return $this->groupAndBuildTestTakers($completedTests);
    }
    private function groupAndBuildTestTakers($completedTests){
        $entries = [];
        foreach ($completedTests as $test){
            $userEmail = explode(';',$test['email'])[0];
            $test['email'] = $userEmail;
            Utility::addToObjectIfNotExists($userEmail,new E3PTUserData($test,$this->filterParams),$entries);
            $this->addTestToUser($entries[$userEmail],$test);
        }
        return array_values($entries);
    }
    private function addTestToUser(E3PTUserData $user,$test){
        $user->addTest($test);
    }
}
class E3PTUserData implements JsonSerializable{
    private $id;
    private $fname;
    private $lname;
    private $date_of_birth;
    private $email;
    private $tests = [];
    private $filters;
    public function __construct($userData,$filters=[])
    {
        $this->id = $userData['id'];
        $this->fname = $userData['fname'];
        $this->lname = $userData['lname'];
        $this->email = $userData['email'];
        $this->date_of_birth = $userData['date_of_birth'];
        $this->filters = $filters;
    }

    public function addTest($test){
        $passed = true;
        $studentTest = new E3PTData($test['classid'],$test['id']);
        if($this->filters['from'] && $date = self::validateDate($this->filters['from'])){
            $passed = $passed && $studentTest->TestDate >= $date;
        }
        if($this->filters['to'] && $date = self::validateDate($this->filters['to'])){
            $passed = $passed && $studentTest->TestDate <= $date;
        }
        if($passed){
            $this->tests[] = $studentTest;
        }
    }
    private static function validateDate($dateString){
        try {
            $datetime = new \DateTime($dateString);
            return date('Y-m-d',$datetime->getTimestamp());
        } catch (\Exception $e) {
            return false;
        }
    }
    public function jsonSerialize() {
        return [
            'ID' => $this->id,
            'FirstName' => $this->fname,
            'LastName' => $this->lname,
            'DateOfBirth' => $this->date_of_birth,
            'Email' => $this->email,
            'Tests' => $this->tests,
        ];
    }
}
class E3PTData implements JsonSerializable{
    private $id;
    private $SpeakingScore = 0;
    private $WritingScore = 0;
    private $ReadingScore = 0;
    private $ListeningScore = 0;
    private $TotalScore = 0;
    public $TestDate;
    public function __construct($classId,$studentId)
    {
        $testData = new StudentTest($classId,$studentId);
        $this->prepareData($testData->load());
    }
    private function prepareData($data){
        $this->id = $data['id'].'-'.$data['classId'];
        foreach ($data['pageGroups'] as $pg){
            $field = $pg['name'] . 'Score';
            $this->$field = $pg['actualScore'];
        }
        $this->TestDate = date('Y-m-d',strtotime($data['submittedOn']));
        $this->TotalScore = $data['actualTotalScore'];
    }


    public function jsonSerialize() {
        return [
            'TestID' => $this->id,
            'TestDate' => $this->TestDate,
            'SpeakingScore' => $this->SpeakingScore,
            'WritingScore' => $this->WritingScore,
            'ReadingScore' => $this->ReadingScore,
            'ListeningScore' => $this->ListeningScore,
            'TotalScore' => $this->TotalScore,
        ];
    }
}
class JsonExporterSQL {
    public static function getCompletedTestsForUser($userId,$isJ1=false,$filters=[]){
        $query = <<<SQL
    SELECT DISTINCT 
      u.id,u.email,u.fname,u.lname,u.date_of_birth,
      uc.classid
    from users u
    join user_classes uc on u.id = uc.userid 
    join proficiency_classes pc on pc.classid = uc.classid
    join progress_report pr on pr.classid = uc.classid and pr.userid = uc.userid
    join classes c on c.id = uc.classid
    join proficiency_tests_submitted s on s.testid = uc.classid and s.userid = uc.userid
    join proficiency_schools_admins a on a.schoolid = s.schoolid 
    where pr.perc_completed_tasks = 100 and a.userid = :userId
    
SQL;

        $query .= ' and '. ($isJ1?'(c.is_j1_class = 1)':'(c.is_j1_class = 0 or c.is_j1_class is null)');


        return Utility::getInstance()->fetch($query,['userId'=>$userId]);
    }


}