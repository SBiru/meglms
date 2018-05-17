<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.4.8
 * Time: 20:52
 */

namespace English3\Controller\ProficiencyTest;


use English3\Controller\Utility;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class TestSchools {
    private $db;
    public function __construct(){
        $this->db = new TestSchoolsDB();
    }
    public function query(Request $request){
        $data = $this->db->query();
        return new JsonResponse($this->prepareSchoolFilters($data));
    }
    private function prepareSchoolFilters($data){
        $states = array();
        $countries = array();
        foreach($data as $i=>$schoolRow){
            Utility::addToObjectIfNotExists($schoolRow['country'],['name'=>$schoolRow['country'],'states'=>array()],$countries);
            Utility::addToObjectIfNotExists($schoolRow['state'],['name'=>$schoolRow['state'],'country'=>$schoolRow['country'],'schools'=>array()],$states);
            Utility::addToArrayIfNotExists($schoolRow['state'],$countries[$schoolRow['country']]['states']);
            Utility::addToArrayIfNotExists($i,$states[$schoolRow['state']]['schools']);
        }
        return ['schools'=>$data,'countries'=>$countries,'states'=>$states];
    }
    public function get(Request $request,$id){
        return new JsonResponse($this->db->get($id));
    }
    public function save(Request $request,$id){
        Utility::clearPOSTParams($request);
        $name = $request->request->get('name');
        $country = $request->request->get('country');
        $state = $request->request->get('state');
        try{
            $id = $this->db->save($id,$name,$country,$state);
            return new JsonResponse(['id'=>$id]);
        }catch(TestSchoolsException $e){
            return Utility::buildHTTPError($e->getMessage(),500,['showToUser'=>true]);
        }
    }
    public function delete(Request $request,$id){
        try{
            $this->db->remove($id);
            return new JsonResponse('ok');
        }catch(TestSchoolsException $e){
            return Utility::buildHTTPError($e->getMessage(),500,['showToUser'=>true]);
        }
    }
}

class TestSchoolsDB{
    public function query(){
        return Utility::getInstance()->fetch($this->queryGetSchools);
    }

    public function get($id){
        $school = Utility::getInstance()->fetchRow($this->queryGetSchool,['id'=>$id]);
        $school['admins']=$this->getAdmins($id);
        $school['tests']=$this->getTests($id);
        return $school;
    }
    private function getAdmins($id){
        $db = new TestSchoolsAdminsDB();
        return $db->getAdmins($id);
    }
    private function getTests($id){
        $db = new TestSchoolsSubmittedDB();
        return $db->getTests($id);
    }
    public function save($id,$name,$country,$state){
        if(!$name) throw new TestSchoolsException("Invalid school name");
        if($id=='new') {
            return $this->create($name,$country,$state);
        }else{
            return $this->update($id,$name,$country,$state);
        }
    }
    private function create($name,$country,$state){
        Utility::getInstance()->reader->insert('proficiency_test_schools',[
            'name'=>$name,
            'country'=>$country,
            'state'=>$state
        ]);
        return Utility::getInstance()->reader->lastInsertId();
    }
    private function update($id,$name,$country,$state){
        Utility::getInstance()->reader->update('proficiency_test_schools',[
            'name'=>$name,
            'country'=>$country,
            'state'=>$state
        ],['id'=>$id]);
        return $id;
    }
    public function remove($id){
        Utility::getInstance()->reader->delete('proficiency_test_schools',['id'=>$id]);
    }
    private $queryGetSchools = <<<SQL
    SELECT * FROM proficiency_test_schools;
SQL;
    private $queryGetSchool = <<<SQL
    SELECT * FROM proficiency_test_schools where id = :id;
SQL;

}
class TestSchoolsException extends \Exception{}