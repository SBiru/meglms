<?php

namespace English3\Controller;

use Doctrine\DBAL\Connection;
use English3\Controller\Utility;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class LicensesController{

    public function __construct(Connection $reader) {
        $this->reader = $reader;
        $this->util = new Utility($reader);
        if (isset($_SESSION['USER']) && isset($_SESSION['USER']['ID'])) {
            $this->userId = $_SESSION['USER']['ID'];
            $this->loggedIn = true;
        } else {
            $this->loggedIn = false;
        }
    }

    public function checkUser() {
        if (!$this->loggedIn) {
            throw new BadRequestHttpException('Not logged in');
        }
    }
    private function checkAdmin($orgId){
        $id = $this->reader->fetchAssoc("SELECT id from user_admin_super WHERE user_id = :user_id",['user_id'=>$this->userId]);
        if(!$id){
            $id = $this->reader->fetchAssoc("SELECT id from user_admin_organizations WHERE userid = :user_id and organizationid = :orgId",['user_id'=>$this->userId,'orgId'=>$orgId]);
            if(!$id){
                throw new BadRequestHttpException("Must be a super admin");
            }

        }
    }

    private function prepareAndFetch($query, $paramsArray) {
        $preparedStatement = $this->reader->prepare($query);
        $preparedStatement->execute($paramsArray);
        return $preparedStatement->fetchAll();
    }

    public function generateLicenses(Request $request) {
        $this->checkUser();


        $body = json_decode($request->getContent());
        if(!(isset($body->batch_id) && $body->batch_id!="")){
            throw new BadRequestHttpException('Invalid batch id');
        }
        if(!(isset($body->org_id) && $body->org_id>0)){
            throw new BadRequestHttpException('Invalid org id');
        }
        $this->checkAdmin($body->org_id);

        $how_many = isset($body->how_many)?$body->how_many:0;
        $duration = isset($body->duration)?$body->duration:30;
        $type = isset($body->type)?$body->type:'days';
        $batch_id = $body->batch_id;
        $org_id = $body->org_id;
        $values = array();
        $me = $_SESSION['USER']['ID'];
        for($i =0;$i<$how_many;$i++){
            $key = $this->generate_key_string();
            $values[]="('{$key}','{$duration}','{$org_id}','{$batch_id}','{$type}','{$me}')";
        }
        if($how_many){
            $query = "INSERT INTO licenses (license,duration,org_id,batch_id,type,created_by) values ". implode(',',$values);
            $this->util->insert($query);

            if(isset($body->classes)){
                 $this->insertClasses($batch_id,$body->classes);
            }
        }


        return new JsonResponse(['status'=>'success','how_many'=>$how_many]);
    }

    private function insertClasses($batchId,$classes){
        foreach($classes as $class) {
            $groupid = 'null';
            $classid = $class->id;
            if (isset($class->groupid)) {
                $groupid = $class->groupid;
            }
            $values[]="('{$batchId}','{$classid}',{$groupid})";

        }
        if($classes){
            $query = "INSERT INTO license_classes (license_batchid,classid,groupid) values ". implode(',',$values);
            $this->reader->executeUpdate($query);
        }
    }
    public function checkLicenseFor(Request $request,$org_id,$user_id){
        $data = $this->prepareAndFetch(self::$queryUserLicense,['userId'=>$user_id]);
        if(!$data){
            return new JsonResponse(['error'=>'no_license','message'=>'No license was found']);
        }

        $expiry = new \DateTime($data[0]['expiry_date']);
        if($expiry<new \DateTime()){
            return new JsonResponse(['error'=>'license_expired','message'=>'Your license has expired']);
        }
        else{
            return new JsonResponse(['status'=>'success','expiry_date'=>$data[0]['expiry_date']]);
        }
    }
    public function validateLicense(Request $request){
        $body = json_decode($request->getContent());
        if(!isset($body->license))
            return new JsonResponse(['error'=>'No license provided']);
        $license = $this->validateLicenseQuery($body->license);

        if(!$license)
            return new JsonResponse(['error'=>'Invalid license']);

        if($license_id = $license[0]['user_id']){
            return new JsonResponse(['error'=>'Already validated']);
        }
        if(isset($body->user_id)){
            $license_id = $license[0]['id'];
            $this->updateLicense($license_id,$body->user_id,$license[0]);
            $this->resetTotalTime($body->user_id);
            return new JsonResponse(['status'=>'success','user_id'=>$body->user_id]);
        }
        $classes = self::_getClasses($license[0]['batch_id']);
        return new JsonResponse([
            'status'=>'success',
            'org_id'=>$license[0]['org_id'],
            'classes'=>$classes,
            'created_by'=>$license[0]['created_by']
        ]);
    }

    public function getLicenses(Request $request,$org_id){
        $this->checkUser();
        $this->checkAdmin($org_id);
        $data = $this->prepareAndFetch($this->queryOrgLicenses,['orgId'=>$org_id]);
        $batches = $this->prepareLicenses($data);
        return new JsonResponse($batches);
    }

    public static function _getClasses($batchId){
        $util = new Utility();
        $classes = $util->fetch(self::$queryGetClassesForBatch,['batchId'=>$batchId]);
        return $classes;
    }

    private function updateLicense($id,$userid,$license){
        $now = new \DateTime();
        $expiration = new \DateTime();
        $expiration->add(new \DateInterval("P".$license['duration']."D"));
        $this->reader->update('users',[
            'expiration_date'=>$expiration->format("Y-m-d H:i:s")
        ],['id'=>$userid]);
        $this->reader->update('licenses',[
            'user_id'=> $userid,
            'activated' => $now->format("Y-m-d H:i:s"),
            'expiry_date'=>$expiration->format("Y-m-d H:i:s")
        ], ['id'=>$id]);
    }
    private function resetTotalTime($id){
        $this->reader->update('user_sessions',[
              'total_time'=>'0'
            ],['userid'=>$id]
            );
    }
    private function validateLicenseQuery($license){
        $qb = $this->reader->createQueryBuilder();
        $qb->select('id,user_id,org_id,duration,class_id,group_id,batch_id','created_by');
        $qb->from('licenses');
        $qb->where('license = ?');
        $qb->setParameter(0,$license);
        $stmt = $qb->execute();
        return $stmt->fetchAll();
    }



    private function prepareLicenses($raw_data){
        $batches=array();
        foreach($raw_data as $row){
            if(!isset($batches[$row['batch_id']])){
                $batches[$row['batch_id']]=array(
                    'id'=>$row['batch_id'],
                    'duration'=>$row['duration'],
                    'type'=>$row['type'],

                    'licenses'=>array()
                );
                $classes = self::_getClasses($row['batch_id']);
                $batches[$row['batch_id']]['classes']=$classes;
                if(!$classes){
                    //Keeping the old way of getting groups/classes
                    if(!is_null($row['class_id'])){
                        $class = array(
                            'className'=>$row['className'],
                            'classId'=>$row['class_id'],
                        );
                        if(!is_null($row['group_id'])){

                            $class['groupName']=$row['groupName'];
                            $class['groupId']=$row['group_id'];

                        }
                        $batches[$row['batch_id']]['classes']=[$class];
                    }
                    /////////////////////////////////////////
                    else{
                        $batches[$row['batch_id']]['classes']= [
                            array(
                            'name'=>$row['orgClassName'],
                            'id'=>$row['placement_class_id'],
                            )
                        ];
                    }
                }

            }
            $licenses= &$batches[$row['batch_id']]['licenses'];
            $license=array(
                'key'=>$row['license'],
                'duration'=>$row['duration'],
                'activated'=>$row['activated'],
                'expiry_date'=>$row['expiry_date'],

                );
            if($row['fname']){
                $license['user']=array(
                    'fname'=>$row['fname'],
                    'lname'=>$row['lname']
                );
            }
            $licenses[]=$license;
        }
        return array_values($batches);
    }
    private function generate_key_string() {

        $tokens = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        $segment_chars = 5;
        $num_segments = 4;
        $key_string = '';

        for ($i = 0; $i < $num_segments; $i++) {

            $segment = '';

            for ($j = 0; $j < $segment_chars; $j++) {
                $segment .= $tokens[rand(0, 35)];
            }

            $key_string .= $segment;

            if ($i < ($num_segments - 1)) {
                $key_string .= '-';
            }

        }

        return $key_string;

    }
    /* QUERY: user's license */
    private static $queryGetClassesForBatch = <<<SQL
      SELECT c.id as classId, c.name as className,
            g.id as groupId, g.name as groupName
      FROM license_classes
      JOIN classes c on license_classes.classid = c.id
      LEFT JOIN groups g on  license_classes.groupid = g.id
      WHERE license_batchid = :batchId
SQL;
    /* QUERY: user's license */
    public static $queryUserLicense= <<<SQL
		SELECT *
		FROM licenses
		WHERE user_id = :userId
		ORDER BY expiry_date desc LIMIT 1;
SQL;
    /* QUERY: org licenses */
    private $queryOrgLicenses= <<<SQL
		SELECT l.*,
		fname,
		lname,
		o.placement_class_id,
		c.name as className,
		c2.name as orgClassName,
		g.name as groupName
		FROM licenses l
		LEFT JOIN users u ON u.id=l.user_id
		LEFT JOIN organizations o on o.id = l.org_id
		LEFT JOIN classes c on c.id = l.class_id
		LEFT JOIN classes c2 on c2.id = o.placement_class_id
		LEFT JOIN groups g on g.id = l.group_id
		WHERE org_id = :orgId
		ORDER BY batch_id;
SQL;


}
?>