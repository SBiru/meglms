<?php
namespace English3\Controller;

use Doctrine\DBAL\Connection;
use English3\Controller\Utility;

use English3\Model\User;
use Phinx\Migration\Util;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;

class UploadUsersController
{

    private $reader;
    private $util;
    private $requiredFields;
    private $options;
    private $orgId;


    public function __construct(Connection $reader)
    {
        $this->reader = $reader;
        $this->util = Utility::getInstance();
        $this->createRequiredFields();

    }
    public function template(Request $request){
        $template = "firstname,lastname,email,gender,phone,password,designator,coursegroup1,coursegroup2,language,expiration_date,role,action";
        return Utility::buildFileResponse($template,"user_upload.csv");
    }
    public function import(Request $request,$orgId){
        $this->util->checkAdmin($orgId);
        Utility::clearPOSTParams($request);
        $this->orgId=$orgId;

        $userActions = $request->request->get('userActions');
        $options = json_decode($request->request->get('options'),true);
        if($userActions=='reloadFile'){
            $request->request->set('limit',-1);
            $request->request->set('delimiter',$options['delimiter']);
            $userActions = $this->preview($request,$orgId,false);
        }
        $this->createDefaultOptions();
        $this->options = array_merge($this->options,$request->request->get('options'));
        $result = array();
        foreach($userActions as $email=>&$user){
            foreach($user['actions'] as &$action){
                if($action['errors']) continue;
                list($skipped,$dbUser) = $this->performAction($action,$user['db'],$user['justCreated']);
                if(is_null($user['justCreated']) && !is_null($dbUser)){
                    $user['justCreated'] = $dbUser;
                }
                if(!$skipped){
                    $result[]=$action;
                }

            }
        }
        return new JsonResponse(['result'=>$result]);
    }
    public function preview(Request $request,$orgId,$echo=true){
        $this->util->checkAdmin($orgId);

        $originalFile = $request->files->get('file');
        Utility::clearPOSTParams($request);

        $delimiter = $request->request->has('delimiter')?$request->request->get('delimiter'):',';
        $encoding = $request->request->has('encoding')?$request->request->get('enconding'):'utf-8';
        $limit = $request->request->has('limit')?$request->request->get('limit'):'10';
        if($echo==false){
            $limit=-1;
        }
        list($users,$all)=$this->readFile($originalFile,$delimiter,$encoding,$limit);
        if(isset($users['error'])){
            return Utility::buildHTTPError($users['error']);
        }
        $errors = $this->validateUpload($users);
        foreach($errors as $error){
            foreach($error['actionIndexes'] as $actionIndex){
                $action = &$users[$actionIndex['email']]['actions'][$actionIndex['actionPosition']];
                $this->addError($action,$error['error']);
            }
        }
        if($echo){
            return new JsonResponse(['users'=>$users,'all'=>$all]);
        }
        else{
            return $users;
        }

    }

    private function readFile($file,$delimiter,$enconding,$limit){
        $handle = fopen($file, "r");
        if ($handle) {
            $header = fgetcsv($handle,0,$delimiter);

            if($field = $this->checkRequiredFields($header)!==false){
                return array('error'=>$field.' is required');
            }

            $users = array();
            $i = 0;

            while (($line = fgetcsv($handle,0,$delimiter)) !== false && ($i<$limit || $limit==-1)) {
                $i++;
                $mappedLine = $this->mapLine($header,$line);
                if(!isset($users[$mappedLine['email']])){
                    $users[$mappedLine['email']] = array('actions'=>array());
                }
                $mappedLine['csvRowIndex']=$i;
                $users[$mappedLine['email']]['actions'][]=$mappedLine;
            }
            if(fgetcsv($handle,0,$delimiter) !== false){
                $all=false;
            }else{
                $all=true;
            }
            fclose($handle);
            return array($users,$all);
        } else {
            return array('error'=>'Could not open file');
        }
    }
    private function performAction(&$row,$dbUser=null,$justCreatedUser=null){

        //Starting with user personal data
        $createdUser = null;
        $skipped = true;

        //if the user doesn't exist in the db and the upload type is not update only, we create a new user
        //the justCreatedUser is used for users that were created during the process. It's useful for when
        //the user actions need to be in more than one row and the upload type is add new only.
        //In this case, if we simply update the dbUser, it would skip all rows expect by the first one.

        if(is_null($dbUser) && $this->options['type']!=$this->uploadType['update_only']){
            $createdUser = $justCreatedUser?$justCreatedUser:$this->createUser($row);
            if(in_array($row['action'],['L','D','UL']) || $this->hasCourseGroupField($row)){
                $this->updateUserEnrollment($createdUser,$row);
            }
            $skipped=false;
        }

        if(!is_null($dbUser) && $this->options['type']!=$this->uploadType['add_only']){
            $this->updateUserAccount($dbUser,$row);
            if(in_array($row['action'],['L','D','UL']) || $this->hasCourseGroupField($row)){
                $this->updateUserEnrollment($dbUser,$row);
            }
            $skipped=false;
        }

        return array($skipped,$createdUser);
    }

    private function createUser(&$row){
        $row['password'] = !$row['password'] || $row['password']==''?Utility::generatePassword(7):$row['password'];
        $row['language'] = !$row['language'] || $row['language']==''?'en':$row['language'];
        $filteredRow = array_filter($row);
        $newUserParams = array(
            'fname'=>$filteredRow['firstname'],
            'lname'=>$filteredRow['lastname'],
            'email'=>$mysql_email = strtolower(trim($filteredRow['email'])),
            'preferred_language'=>$filteredRow['language'],
            'organizationid'=>$this->orgId,
            'gender'=>$filteredRow['gender'],
            'phone'=>$filteredRow['phone']?:'' ,
            'expiration_date'=>$filteredRow['expiration_date'],
            'password'=>$row['password']
        );
        $id = UserController::_createUser($newUserParams);
        return $this->wrapUser($this->util->fetchRow(self::$queryGetUser,['id'=>$id]));
    }
    private function updateUserEnrollment($dbUser,&$row){
        $action = $row['action']?$row['action']:'E';
        if($courseFields = array_filter(
            array_keys($row),
            function ($field){
                return strpos($field,'coursegroup')!==false;
            }
        )){
            if($action=='E'){
                if($dbUser['id']){
                    $this->enrollToClasses($dbUser['id'],$courseFields,$row);
                }
            }else if($action=='U'){
                $this->unenrollFromClasses($dbUser['id'],$courseFields,$row);
            }
            else if($action=='UN'){
                $this->unSuspendClasses($dbUser['id'],$courseFields,$row);
            }
            else if($action=='S'){
                $this->suspendFromClasses($dbUser['id'],$courseFields,$row);
            }
        }
    }
    private function updateUserAccount($dbUser,$row){
        $action = $row['action']?$row['action']:'E';
        if($action=='D'){
            $this->util->insert(self::$queryDeleteUserAccount,['userId'=>$dbUser['id']]);
            return;
        }
        if($action=='L'){
            $this->util->insert(self::$queryLockUserAccount,['userId'=>$dbUser['id']]);

        }
        if($action=='UL'){
            $this->util->insert(self::$queryUnlockUserAccount,['userId'=>$dbUser['id']]);
        }
        if($this->options['existing_details']!=$this->existingUser['no_changes']){
            $this->updateUserPersonal($dbUser,$row);
        }
        if($this->options['existing_password']!=$this->existingPassword['no_changes']){
            $this->updateUserPassword($dbUser,$row);
        }
    }

    private function updateUserPassword($dbUser,&$row){
        global $SECURITY;
        $row['password'] = !$row['password'] || $row['password']==''?Utility::generatePassword(7):$row['password'];
        $salt = Utility::generatePassword(44);
        $password = md5($SECURITY->salt . $salt . $row['password']);
        $this->util->reader->update('users',
            array(
                'password'=>$password,
                'salt_for_password'=>$salt
            ),
            array('id'=>$dbUser['id'])
        );
    }
    private function updateUserPersonal($dbUser,$row){
        $rowPersonalInfo = array();
        $dbUserExistingFields = array();
        foreach($row as $key=>$value){
            if(in_array($key,array_keys($dbUser)) && $value!=null && $value!=''){
                $rowPersonalInfo[$key]=$value;
            }
        }
        foreach($dbUser as $key=>$value){
            if($value!=null && $value!=''){
                $dbUserExistingFields[$key]=$value;
            }
        }
        if($this->options['existing_details']==$this->existingUser['override']){
            $dbUser = array_merge($dbUser,$dbUserExistingFields,$rowPersonalInfo);
        }else if($this->options['existing_details']==$this->existingUser['fill_missing']) {
            $dbUser = array_merge($dbUser,$rowPersonalInfo,$dbUserExistingFields);
        }

        $this->util->reader->update('users',
            array(
                'fname'=>$dbUser['firstname'],
                'lname'=>$dbUser['lastname'],
                'phone'=>$dbUser['phone']?:'',
                'gender'=>$dbUser['gender'],
                'expiration_date'=>$dbUser['expiration_date'],
            ),
            array('id'=>$dbUser['id'])
        );
        if($dbUser['language']){
            $this->util->reader->update('user_preferences',
                array('value'=>$dbUser['language']),
                array('user_id'=>$dbUser['id'],'preference'=>'language')
            );
        }
    }
    private function suspendFromClasses($userId,$courseFields,$row){
        foreach($courseFields as $field) {
            $i = str_replace('coursegroup','',$field);
            $classId = $row['designator']=='group'?$row['course'.$i]:$row[$field];
            $groupId = $row['designator']=='group'?$row[$field]:null;
            $this->util->insert(self::$querySuspendFromClasses,array(
                'userId' => $userId,
                'classId' => $classId,
                'groupId'=>$groupId
            ));
        }
    }
    private function unSuspendClasses($userId,$courseFields,$row){
        foreach($courseFields as $field) {
            $i = str_replace('coursegroup','',$field);
            $classId = $row['designator']=='group'?$row['course'.$i]:$row[$field];
            $groupId = $row['designator']=='group'?$row[$field]:null;
            $this->util->insert(self::$queryUnSuspendFromClasses,array(
                'userId' => $userId,
                'classId' => $classId,
                'groupId'=>$groupId
            ));
        }
    }
    private function unenrollFromClasses($userId,$courseFields,$row){
        foreach($courseFields as $field) {
            $i = str_replace('coursegroup','',$field);
            $classId = $row['designator']=='group'?$row['course'.$i]:$row[$field];
            $groupId = $row['designator']=='group'?$row[$field]:null;
            \English3\Controller\Classes\UserClassHistory::addToUserClassHistory($userId,$classId,$groupId);
            $this->util->insert(self::$queryUnenrollUserFromClasses,array(
                'userId' => $userId,
                'classId' => $classId,
                'groupId'=>$groupId
            ));
        }
    }
    private function enrollToClasses($userId,$courseFields,$row){
        foreach($courseFields as $field){
            $i = str_replace('coursegroup','',$field);
            $classId = $row['designator']=='group'?$row['course'.$i]:$row[$field];
            $groupId = $row['designator']=='group'?$row[$field]:null;
            if(!$classId) continue;
            $enrollmentExists=$this->util->fetchOne(self::$queryGetUserClassesData,
                array(
                    'userId'=>$userId,
                    'classId'=>$classId,
                    'groupId'=>$groupId
                ),
                'id');
            if($enrollmentExists){

            }
            else{
                $roles = explode(',',$row['role']);

                $query = "INSERT INTO user_classes (userid,classid";
                $query.=$row['designator']=='group'?',groupid':'';
                foreach($roles as $role){
                    $query.=','.$this->userRoles[$role];
                }
                $query.=") values ('{$userId}','{$classId}'";
                $query.=$row['designator']=='group'?",'{$groupId}'":'';
                foreach($roles as $role){
                    $query.=',1';
                }
                $query.=")";

                $this->util->reader->executeUpdate($query);
            }
        }

    }
    private function hasCourseGroupField($row){
        foreach(array_keys($row) as $key){
            if(strpos($key,'coursegroup')!==false && $row[$key]!=''){
                return true;
            }
        }
        return false;
    }
    private function createRequiredFields(){
        $this->requiredFields = array(
            'firstname',
            'lastname',
            'email'
        );
    }
    private function checkRequiredFieldsForRow(&$row){
        foreach($this->requiredFields as $field){
            if(!isset($row[$field]) || $row[$field]==''){
                $this->addError($row,$field." is required");
            }
        }
    }
    private function checkRequiredFields($header){
        foreach($this->requiredFields as $field){
            if(array_search($field,$header)===false){
                return $field;
            }
            return false;
        }
    }
    private function addError(&$action,$error){
        if(!isset($action['errors'])){
            $action['errors']=array();
        }
        $action['errors'][]=$error;
    }
    private function mapLine($header,$line){
        $obj = array();
        foreach($header as $i=>$field){
            if(isset($line[$i]));
            $obj[$field]=$line[$i];
        }
        return $obj;
    }
    private function validateUpload(&$users){
        $emailsToFilter = array_keys($users);
        $emailsToFilter = ' ("'.implode('","',$emailsToFilter).'")';

        $data = $this->util->fetch(self::$queryGetUsers.$emailsToFilter);
        $dbUsers = array();
        foreach($data as $row){
            $user = $this->wrapUser($row);
            $dbUsers[$row['email']]=$user;
            if(isset($users[$row['email']])){
                $users[$row['email']]['db']=$user;
            }
        }
        list($classesToBeChecked,$groupsToBeChecked,$userClassesToBeChecked,$userGroupsToBeChecked) = $this->getClassesToBeChecked($users);
        $errors = $this->checkClasses($classesToBeChecked,$users);
        $errors = array_merge($errors,$this->checkClasses($classesToBeChecked,$users));
        $errors = array_merge($errors,$this->checkGroups($groupsToBeChecked,$users));
        $errors = array_merge($errors,$this->checkUserGroups($userGroupsToBeChecked));
        $errors = array_merge($errors,$this->checkUserClasses($userClassesToBeChecked));
        return $errors;
    }
    private function checkClasses($classesToBeChecked,$users){
        $errorClasses = array();
        $data = $this->util->fetch(self::$queryValidateClasses,['ids'=>implode(',',array_keys($classesToBeChecked))]);
        $dataIds = array_map(function($row){
            return $row['id'];
        },$data);
        foreach($classesToBeChecked as $id=>$actionIndexes){
            if(($i = array_search($id,$dataIds))!==false){

                //we need to check if there is any enrollment action.
                // If so, we need to check if the class uses groups.
                // If the class uses groups, we have an error, because the designator should be 'group' instead of 'course'
                $errorIndexes = array();
                foreach($actionIndexes as $actionIndex){
                    $csvRow = $users[$actionIndex['email']]['actions'][$actionIndex['actionPosition']];
                    if(!isset($csvRow['action']) || $csvRow['action']==''){
                        //we found and enrollment action

                        if($data[$i]['groupid']){
                            //the class uses groups, so we have an error here
                            $errorIndexes[]=$actionIndexes;
                        }
                    }
                }
                if(count($errorIndexes)){

                }
                $errorClasses[]=array(
                    'id'=>$id,
                    'actionIndexes'=>$errorIndexes,
                    'error'=>"Class " . $id . " uses groups. Make sure you are using the 'group' designator",
                    'type'=>'class2'
                );
            }else{
                $errorClasses[]=array(
                    'id'=>$id,
                    'actionIndexes'=>$actionIndexes,
                    'error'=>"Class " . $id . " not found",
                    'type'=>'class1'
                );
            }
        }
        return $errorClasses;
    }
    private function checkGroups($groupsToBeChecked,&$users){
        $errorGroups = array();
        $data = $this->util->fetch(self::$queryValidateGroups,['ids'=>implode(',',array_keys($groupsToBeChecked))]);
        $dataIds = array_map(function($row){
            return $row['id'];
        },$data);
        foreach($groupsToBeChecked as $id=>$actionIndexes){

            if( ($dataRow =array_search($id,$dataIds))!==false){
                foreach($actionIndexes as $actionIndex){
                    $action = &$users[$actionIndex['email']]['actions'][$actionIndex['actionPosition']];
                    $groupFieldIndex = null;
                    foreach($action as $field=>$value){
                        if(strpos($field,'coursegroup')!==false && $value==$id){
                            $groupFieldIndex = str_replace('coursegroup','',$field);
                            break;
                        }
                    }
                    if($groupFieldIndex){
                        $action['course'.$groupFieldIndex]=$data[$dataRow]['classid'];
                    }
                }
            }else{
                $errorGroups[]=array(
                    'id'=>$id,
                    'actionIndexes'=>$actionIndexes,
                    'error'=>"Group " . $id . " not found",
                    'type'=>'group'
                );
            }
        }
        return $errorGroups;
    }
    private function checkUserGroups($userGroupsToBeChecked){
        $errorGroups = array();
        $data = $this->util->fetch(self::$queryValidateUserGroups,['ids'=>implode(',',array_keys($userGroupsToBeChecked))]);
        $dataIds = array_map(function($row){
            return $row['id'];
        },$data);
        foreach($userGroupsToBeChecked as $id=>$actionIndexes){
            if(array_search($id,$dataIds)===false){
                $errorGroups[]=array(
                    'id'=>$id,
                    'actionIndexes'=>$actionIndexes,
                    'error'=>"User is not enrolled to group " . explode('-',$id)[1],
                    'type'=>'usergroup'

                );
            }
        }
        return $errorGroups;
    }
    private function checkUserClasses($userClassesToBeChecked){
        $errorClasses = array();
        $data = $this->util->fetch(self::$queryValidateUserClasses,['ids'=>implode(',',array_keys($userClassesToBeChecked))]);
        $dataIds = array_map(function($row){
            return $row['id'];
        },$data);
        foreach($userClassesToBeChecked as $id=>$actionIndexes){
            if(array_search($id,$dataIds)===false){
                $errorClasses[]=array(
                    'id'=>$id,
                    'actionIndexes'=>$actionIndexes,
                    'error'=>"User is not enrolled to class " . explode('-',$id)[1],
                    'type'=>'userclass'
                );
            }
        }
        return $errorClasses;
    }

    private function checkActionField(&$row,$user){
        if(isset($row['action']) && $row['action']!='' && !in_array($row['action'],$this->acceptableActions)){
            $this->addError($row,"Invalid action");
        }
        if(isset($row['action']) && $row['action']!='' && !$user['db']){
            $this->addError($row,"User not found");
        }
    }
    private function checkLanguageField(&$row){
        if(isset($row['language']) && $row['language']!='' && !in_array($row['language'],$this->acceptableLanguages)){
            $this->addError($row,"Invalid language");
        }
    }
    private function checkRoleField(&$row){
        if(isset($row['role']) && $row['role']!='' && !in_array($row['role'],$this->acceptableRoles)){
            $this->addError($row,"Invalid role");
        }
        if(!isset($row['role']) || $row['role']=='' && $this->hasCourseGroupField($row)){
            $this->addError($row,"Invalid role");
        }
    }
    private function checkExpirationDateField(&$row){
        if(isset($row['expiration_date']) && $row['expiration_date']!='' && !preg_match('/[0-9]{4}-[0-9]{2}-[0-9]{2}/',$row['expiration_date'])){
            $this->addError($row,"Invalid expiration date");
        }
    }
    private function getClassesToBeChecked(&$users){
        $classesToBeChecked = array();
        $groupsToBeChecked = array();
        $userClassesToBeChecked = array();
        $userGroupsToBeChecked = array();
        foreach($users as $email=>&$user){
            foreach($user['actions'] as $i=>&$action){
                $this->checkActionField($action,$user);
                $this->checkLanguageField($action);
                $this->checkRoleField($action);
                $this->checkExpirationDateField($action);
                $this->checkRequiredFieldsForRow($action);
                if($courseFields = array_filter(
                    array_keys($action),
                    function ($field){
                        return strpos($field,'coursegroup')!==false;
                    }
                )){
                    $actionIndex = array(
                        'email'=>$email,
                        'actionPosition'=>$i
                    );
                    foreach($courseFields as $field){
                        if(!$id = intval($action[$field])) continue;

                        $validateUserClass = false;
                        //If the action is Unenroll, Unsuspend or Suspend, we need to
                        // validate if the user is enrolled in that class or group.
                        if(in_array($action['action'],['U','UN','S'])){
                            $validateUserClass = true;
                        }
                        if($action['designator']==='group'){
                            if(!isset($groupsToBeChecked[$id])){
                                $groupsToBeChecked[$id]=array();
                            }
                            $groupsToBeChecked[$id][]=$actionIndex;
                            if($validateUserClass){
                                $userGroup = $user['db']['id'].'-'.$id;
                                if(!isset($userClassesToBeChecked[$userGroup])){
                                    $userGroupsToBeChecked[$userGroup]=array();
                                    $userGroupsToBeChecked[$userGroup][]=$actionIndex;
                                }
                            }
                        }else if($action['designator']==='course'){
                            if(!isset($classesToBeChecked[$id])){
                                $classesToBeChecked[$id]=array();
                            }
                            $classesToBeChecked[$id][]=$actionIndex;
                            if($validateUserClass){
                                $userClass = $user['db']['id'].'-'.$id;
                                if(!isset($userClassesToBeChecked[$userClass])){
                                    $userClassesToBeChecked[$userClass]=array();
                                    $userClassesToBeChecked[$userClass][]=$actionIndex;
                                }
                            }
                        }

                    }
                }
            }
        }
        return array($classesToBeChecked,$groupsToBeChecked,$userClassesToBeChecked,$userGroupsToBeChecked);
    }
    private function wrapUser($row){
        return array(
            'id'=>$row['id'],
            'firstname'=>$row['fname'],
            'lastname'=>$row['lname'],
            'email'=>$row['email'],
            'phone'=>$row['phone'],
            'organizationid'=>$row['organizationid'],
            'created'=>$row['created'],
            'gender'=>$row['gender'],
            'language'=>$row['language'],
            'expiration_date'=>$row['expiration_date'],
        );
    }
    private function createDefaultOptions(){
        $this->options=[
            'type'=>2, //Add new and update existing users
            'existing_details'=>1, //No changes
            'existing_password'=>1, //No changes
        ];
    }

    private static $queryGetUsers = <<<SQL
        SELECT * FROM users WHERE email in
SQL;
    private static $queryGetUser = <<<SQL
        SELECT * FROM users WHERE id = :id
SQL;
    private static $queryValidateClasses = <<<SQL
        SELECT classes.id,groups.id as groupid
        FROM classes
        LEFT JOIN groups ON groups.classid = classes.id
         WHERE classes.id in (:ids)
        GROUP BY classes.id
SQL;
    private static $queryValidateGroups = <<<SQL
        SELECT id,classid FROM groups WHERE id in (:ids)
SQL;
    private static $queryValidateUserGroups = <<<SQL
        SELECT concat_ws('-',userid,groupid)  as id FROM user_classes WHERE concat_ws('-',userid,groupid) in (:ids)
SQL;
    private static $queryValidateUserClasses = <<<SQL
        SELECT concat_ws('-',userid,classid) as id FROM user_classes WHERE concat_ws('-',userid,classid) in (:ids)
SQL;

    private static $queryUnSuspendFromClasses = <<<SQL
        UPDATE user_classes SET is_suspended = 0 WHERE userid = :userId and classid = :classId and if(:groupId,groupid=:groupId,1)
SQL;
    private static $querySuspendFromClasses = <<<SQL
        UPDATE user_classes SET is_suspended = 1 WHERE userid = :userId and classid = :classId and if(:groupId,groupid=:groupId,1)
SQL;
    private static $queryUnenrollUserFromClasses = <<<SQL
        DELETE FROM user_classes WHERE userid = :userId and classid = :classId and if(:groupId,groupid=:groupId,1)
SQL;
    public static $queryGetUserClassesData = <<<SQL
	SELECT * FROM user_classes WHERE userid=:userId and classid=:classId and if(:groupId,groupid=:groupId,1)
SQL;
    public static $queryDeleteUserAccount = <<<SQL
	DELETE users, uc FROM users
	LEFT JOIN user_classes uc ON uc.userid = users.id
	 WHERE users.id = :userId
SQL;
    public static $queryLockUserAccount = <<<SQL
	UPDATE users SET is_active=0 WHERE id = :userId
SQL;
    public static $queryUnlockUserAccount = <<<SQL
	UPDATE users SET is_active=1 WHERE id = :userId
SQL;

    private $acceptableLanguages = array("ar","de","en","es","fr","jp","km","ko","pt","th","vi","zh");
    private $acceptableActions = array('S','L','D','U','UN','UL');
    private $acceptableRoles = array('S','E','T','O','T,E','E,T');
    private $uploadType = array(
        'add_only'=>1,
        'add_and_update'=>2,
        'update_only'=>3,
    );
    private $existingUser = array(
        'no_changes'=>1,
        'override'=>2,
        'fill_missing'=>3,
    );
    private $existingPassword = array(
        'no_changes'=>1,
        'update'=>2,
    );
    private $userRoles = array(
        'E'=>'is_edit_teacher',
        'T'=>'is_teacher',
        'S'=>'is_student',
        'O'=>'is_observer',
    );
}
?>