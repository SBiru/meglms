<?php

namespace English3\Controller\Organization;

use Doctrine\DBAL\Connection;
use English3\Controller\ClassesController;
use English3\Controller\UserController;
use English3\Controller\Utility;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;

class OrganizationController
{

    private $reader;
    private static $util;
    public function __construct(Connection $reader)
    {
        $this->reader = $reader;
        self::$util = new Utility($reader);
    }
    public function get(Request $request,$id){
//        self::$util->checkAdmin($id);
        if(!$id){
            if(!$request->query->has('unitId')){
                throw new HttpException(400, 'Must provide org id or unit id');
            }
            $id = self::$util->fetchOne(self::$queryGetOrgFromUnit,['unitId'=>$request->query->get('unitId')],'organizationid');
        }
        return new JsonResponse(self::_get($id));
    }
    public static function _getAdmins($orgId){
        return Utility::getInstance()->fetch(self::$queryGetAdmins,['orgId'=>$orgId]);
    }
    public function getAdvisors(Request $request, $orgId){
        $util = Utility::getInstance();
        $util->checkAdmin($orgId);
        return new JsonResponse(self::_getAdvisors($orgId));
    }
    public function getClasses(Request $request, $orgId){
        if(boolval($request->query->get('isEditTeacher'))){
            $classes = self::_getOrgClasses($orgId,'is_edit_teacher',true,null,true);
        }
        else if(boolval($request->query->get('isTeacher'))){
            $classes = self::_getOrgClasses($orgId,'is_teacher',true,null,true);
        }
        else if(boolval($request->query->get('isStudent'))){
            $classes = self::_getOrgClasses($orgId,'is_student',true,null,true);
        }
        else if(boolval($request->query->get('isObserver'))){
            $classes = self::_getOrgClasses($orgId,'is_observer',true,null,true);
        }
        else{
            $classes = self::_getOrgClasses($orgId,null,true,null,true);
        }

        $result = array();
        foreach($classes as $class){
            $result[]=array(
                'id'=>$class['id'],
                'name'=>$class['name'],
                'courseId'=>$class['courseid'],
                'groupId'=>@$class['groupId'],
                'groupName'=>@$class['groupName'],
                'exclude_from_alerts'=>$class['exclude_from_alerts'],
                'orgId'=>@$class['orgid'],
                'fullname'=>@$class['fullname'],
                'studentCount'=>$class['studentCount']
            );
        }
        return new JsonResponse($result);
    }
    public function getUsers(Request $request, $orgId){
        $filter = new UserFilter();
        return $filter->getUsers($request->query->all(),$orgId);
    }
    public function updatePreferences(Request $request,$id){
        self::$util->checkAdmin($id);
        $body = json_decode($request->getContent(),true);
        $deleteAll = $body['deleteAll'];
        unset($body['id']);
        unset($body['deleteAll']);
        if(count($body)){
            $this->_updatePreferences($id,$body,$deleteAll);
        }
        return new JsonResponse(['ok'=>true]);
    }
    public function update(Request $request,$id){
        $util = new Utility();
        $util->checkAdmin($id);
        $body = json_decode($request->getContent(),true);
        unset($body['sortUsersByOptions']);
        unset($body['sortPostsByOptions']);
        unset($body['editable_preferences_in_details']);

        if(isset($body['preferences'])){
            $this->_updatePreferences($id,$body['preferences'],false);
            unset($body['preferences']);
        }
        if(isset($body['blackouts']) && (gettype($body['blackouts'])=="array" || gettype($body['blackouts'])=="object")){
            $body['blackouts']=json_encode($body['blackouts']);
        }

        //checking for required fields
        $required = ['name'];
        $this->checkRequiredFields($required,$body);

        //verifying if we are changing the showFinalGradeFlag
        $oldFlag = $util->fetchOne(self::$queryGetOrg,['orgId'=>$id],'show_final_grade')==1;
        if($oldFlag!=$body['show_final_grade']){
            $this->updateFinalGradeFlag($body['show_final_grade'],$id);
        }
        $body['page_password_config']=isset($body['page_password_config'])?json_encode($body['page_password_config']):null;
        $body['custom_progress_bar']=isset($body['custom_progress_bar'])?json_encode($body['custom_progress_bar']):null;

        $this->prepareAndSavePreferenceGroups($id,$body);
        $this->validatePasswordExpiration($body,$id);

        $this->reader->update('organizations',$body,['id'=>$id]);

        return new JsonResponse(['ok'=>true]);
    }
    private function prepareAndSavePreferenceGroups($id,&$body){
        $styles = new OrganizationStyleCustomization($id);
        $styles->setPreferences($body['styleSettings'])->save();

        $reports = new EnabledReports($id);
        $reports->setPreferences($body['enabledReports'])->save();

        $usersToLogInAsOthers = new AllowedUsersToLogInAsOthers($id);
        $usersToLogInAsOthers->setPreferences($body['allowedUsersToLogInAsOthers'])->save();

        unset($body['styleSettings']);
        unset($body['defaultStyleSettings']);
        unset($body['enabledReports']);
        unset($body['allowedUsersToLogInAsOthers']);
    }
    public function updatePagePermissions(Request $request,$id){
        $util = new Utility();
        $util->checkAdmin($id);

        $body = json_decode($request->getContent(),true);

        $required = ['page_type_permissions'];
        $this->checkRequiredFields($required,$body);

        $util->reader->update('organizations',$body,['id'=>$id]);
        return new JsonResponse(['ok'=>true]);
    }
    public function updateBlackoutDates(Request $request,$orgId){
        $util = new Utility();
        $util->checkAdmin($orgId);

        $body = json_decode($request->getContent(),true);

        $required = ['blackouts'];
        $this->checkRequiredFields($required,$body);
        $blackouts = json_encode($body['blackouts']);
        $util->reader->update('organizations',['blackouts'=>$blackouts],['id'=>$orgId]);
        return new JsonResponse(['ok'=>true]);
    }
    private static function getPasswordExpiration(&$org){
        $timeData = json_decode($org['password_expiration_time'],true);
        if($org['password_expiration_type']=='fixed'){
            $org['password_expiration_dates']=$timeData;
            unset($org['password_expiration_time']);
        }elseif($org['password_expiration_type']=='dynamic'){
            $org['password_expiration_time']=$timeData['time'];
            $org['password_expiration_unit']=$timeData['unit'];
        }
        $org['password_expiration_users']=json_decode($org['password_expiration_users'],true);
    }
    private function validatePasswordExpiration(&$body,$id){

        if(boolval($body['enable_password_expiration'])){
            $original = json_decode(json_encode($body),true);
            if(!isset($body['password_expiration_type']) ||$body['password_expiration_type']=='' ){
                $body['enable_password_expiration']=false;
                unset($body['password_expiration_type']);
                unset($body['password_expiration_dates']);
                unset($body['password_expiration_time']);
                unset($body['password_expiration_unit']);
                return;
            }elseif($body['password_expiration_type']=='fixed'){
                unset($body['password_expiration_time']);
                unset($body['password_expiration_unit']);
                $body['password_expiration_time']=json_encode($body['password_expiration_dates']);
                unset($body['password_expiration_dates']);
                $body['password_expiration_users']=json_encode($body['password_expiration_users']);

            }elseif($body['password_expiration_type']=='dynamic'){
                $body['password_expiration_time']=json_encode(
                    array(
                        'unit'=>$body['password_expiration_unit'],
                        'time'=>$body['password_expiration_time']
                    )
                );
                unset($body['password_expiration_unit']);
                unset($body['password_expiration_dates']);
                $body['password_expiration_users']=json_encode($body['password_expiration_users']);
            }
            $old_password_expiration_time = self::_getField($id,'password_expiration_time');
            if($body['password_expiration_time']!=$old_password_expiration_time){
                $this->updatePwdExpirationDates($id,$original);
            }
        }
    }
    private function updatePwdExpirationDates($id,$body){
        $affectedUsers=$body['password_expiration_users'];

        $query = self::$queryGetUsersAs . ' and organizationid = :orgId';
        if($affectedUsers['teachers'] && !$affectedUsers['students'] ){
            $query.= " and user_classes.is_teacher=1";
        }
        if($affectedUsers['students'] && !$affectedUsers['teachers'] ){
            $query.= " and user_classes.is_student=1";
        }
        if($affectedUsers['students'] && $affectedUsers['teachers'] ){
            $query.= " and (user_classes.is_student=1 or user_classes.is_teacher=1)";
        }

        $users = Utility::getInstance()->fetch($query,['orgId'=>$id]);

        $users = implode(',',array_map(function($user) use ($body){
            $passwordSetOn = $user['password_set_on']?$user['password_set_on']:$user['created'];
            $newExpirationDate = UserController::getNewExpirationDate($body,new \DateTime($passwordSetOn));
            return "('".implode("','",array(
                $user['id'],
                date('Y-m-d',$newExpirationDate->getTimestamp()),
                $passwordSetOn,
            ))."')" ;
        },$users));

        $queryUpdate = 'INSERT INTO users (id,password_expires_on,password_set_on) values ' . $users;
        $queryUpdate.= 'ON DUPLICATE KEY UPDATE password_expires_on = values(password_expires_on),password_set_on = values(password_set_on)';

        Utility::getInstance()->insert($queryUpdate);

    }
    private function checkRequiredFields($required,$body){
        foreach($required as $field){
            if(!isset($body[$field])){
                Utility::buildHTTPError($field . ' is required',400);
            }
        }
    }
    private function updateFinalGradeFlag($showFinalGrade,$orgId){
        $util = new Utility();
        $util->insert(self::$queryUpdateFinalGrade,[
            'orgId'=>$orgId,
            'showFinalGrade'=>$showFinalGrade
        ]);
    }
    public static function _get($id,$includePreferences = true){
        $util = Utility::getInstance();
        $org = $util->fetchRow(self::$queryGetOrg,['orgId'=>$id]);
        $org['blackouts'] = json_decode(@$org['blackouts']);
        $org['use_splash']=boolval(@$org['use_splash']);
        $org['white_label']=boolval(@$org['white_label']);
        $org['is_active']=boolval(@$org['is_active']);
        $org['show_final_grade']=boolval(@$org['show_final_grade']);
        $org['can_delete_posts']= boolval(@$org['can_delete_posts']);
        $org['save_deleted_posts']= boolval(@$org['save_deleted_posts']);
        $org['teacher_can_edit_classes']= boolval(@$org['teacher_can_edit_classes']);
        $org['calculate_progress']= boolval(@$org['calculate_progress']);
        $org['disallow_email']= boolval(@$org['disallow_email']);
        $org['hide_grades_page']= boolval(@$org['hide_grades_page']);
        $org['can_edit_profile']= boolval(@$org['can_edit_profile']);
        $org['disable_account_emails']= boolval(@$org['disable_account_emails']);
        $org['hide_actual_score']= boolval(@$org['hide_actual_score']);
        $org['show_overall_score']= boolval(@$org['show_overall_score']);
        $org['hide_grade_clompleted_word']= boolval(@$org['hide_grade_clompleted_word']);
        $org['hide_expected_by_today']= boolval(@$org['hide_expected_by_today']);
        $org['hide_completed_so_far']= boolval(@$org['hide_completed_so_far']);
        $org['hide_progress']= boolval(@$org['hide_progress']);
        $org['hide_projected_end_date']= boolval(@$org['hide_projected_end_date']);
        $org['hide_expected_end_date']= boolval(@$org['hide_expected_end_date']);
        $org['show_gender']= boolval(@$org['show_gender']);
        $org['show_site']= boolval(@$org['show_site']);
        $org['hide_all_messages']= boolval(@$org['hide_all_messages']);
        $org['enable_reports']= boolval(@$org['enable_reports']);
        $org['enable_fix_quizzes']= boolval(@$org['enable_fix_quizzes']);
        $org['enable_attendance']= boolval(@$org['enable_attendance']);
        $org['category_dashboard']= boolval(@$org['category_dashboard']);
        $org['compliance_dashboard']= boolval(@$org['compliance_dashboard']);
        $org['use_my_alerts']= boolval(@$org['use_my_alerts']);
        $org['use_reports']= boolval(@$org['use_reports']);
        $org['use_j1_dashboard']= boolval(@$org['use_j1_dashboard']);
        $org['enable_certificate']= boolval(@$org['enable_certificate']);
        $org['use_e3pt_dashboard']= boolval(@$org['use_e3pt_dashboard']);
        $org['enable_password_expiration']= boolval(@$org['enable_password_expiration']);
        $org['show_resubmit_button']= boolval(@$org['show_resubmit_button']);
        $org['show_password_manager']= boolval(@$org['show_password_manager']);
        $org['page_password_config']= json_decode(@$org['page_password_config']);
        $org['custom_progress_bar']= json_decode(@$org['custom_progress_bar']);
        $org['use_custom_progress_bar']= boolval(@$org['use_custom_progress_bar']);
        $org['enable_chat_app']= boolval(@$org['enable_chat_app']);
        $org['enable_attendance_warning']= boolval(@$org['enable_attendance_warning']);
        $org['use_alert_splash']= boolval(@$org['use_alert_splash']);
        $org['enable_gradebook_categories']= boolval(@$org['enable_gradebook_categories']);
        $org['enable_credited_assignments']= boolval(@$org['enable_credited_assignments']);
        $org['hide_eng_menu']= boolval(@$org['hide_eng_menu']);
        $org['show_user_profile']= boolval(@$org['show_user_profile']);
        $org['show_breadcrumbs']= boolval(@$org['show_breadcrumbs']);
        $org['show_unit_tabs']= boolval(@$org['show_unit_tabs']);
        $org['allow_users_to_log_in_as_others']= boolval(@$org['allow_users_to_log_in_as_others']);
        if(@$_REQUEST['classId']){
            $flag = ClassesController::getClassField($_REQUEST['classId'],'show_unit_tabs');
            if($flag!==null){
                $org['show_unit_tabs'] = boolval($flag);
            }
        }
        $org['enable_post_email_notifications']= boolval(@$org['enable_post_email_notifications']);
        $org['sortUsersByOptions']=self::$sortUsersByOptions;
        $org['sortPostsByOptions']=self::$sortPostsByOptions;
        if(@$org['enable_password_expiration']){
            self::getPasswordExpiration($org);
        }

        $orgTemplate = new OrganizationEmailTemplate(@$org['logo'],'http://'.@$org['domain']);
        if(!@$org['email_header_template']){
            $org['email_header_template'] = $orgTemplate->defaultHeaderTemplate();
        }if(!@$org['email_footer_template']){
            $org['email_footer_template'] = $orgTemplate->defaultFooterTemplate();
        }


        if($includePreferences){
            self::includePreferences($id,$org);

        }
        $org['editable_preferences_in_details'] = [
            'submit_file_automatically',
            'use_course_policies',
            'use_school_handbook',
            'school_handbook',
            'course_policies',
            'use_webrtc'
        ];
        return $org;
    }

    private static function includePreferences($id,&$org){
        $org['preferences']=self::_getPreferences($id);
        $styles = new OrganizationStyleCustomization($id);
        $org['styleSettings'] = $styles->loadFromPreferencesArray($org['preferences'])->getPreferences();
        $org['defaultStyleSettings'] = $styles->getDefaultPreferences();

        $reports = new EnabledReports($id);
        $org['enabledReports'] = $reports->loadFromPreferencesArray($org['preferences'])->getPreferences();

        $usersToLogInAsOthers = new AllowedUsersToLogInAsOthers($id);
        $org['allowedUsersToLogInAsOthers'] = $usersToLogInAsOthers->loadFromPreferencesArray($org['preferences'])->getPreferences();
    }
    public static function isAttendanceWarningEnabled($userId){
        return boolval(Utility::getInstance()->fetchOne(self::$isAttendanceWarningEnabled,['userId'=>$userId]));
    }
    public static function _getFromUnit($id){
        $util = Utility::getInstance();
        return $util->fetchOne(self::$queryGetOrgFromUnit,['unitId'=>$id]);
    }
    public static function _getField($id,$field){
        $util = Utility::getInstance();
        return $util->fetchOne(self::$queryGetOrg,['orgId'=>$id],$field);
    }
    public static function shouldSendNotifications($orgId){
        return boolval(self::_getField($orgId,'enable_post_email_notifications'));
    }
    public static function isGradebookCategoriesEnabled($orgId){
        return boolval(self::_getField($orgId,'enable_gradebook_categories'));
    }
    private static function _getPreferences($id){
        $data = Utility::getInstance()->fetch(self::$queryGetOrgPreferences,['orgId'=>$id]);
        $preferences = array();
        foreach($data as $row){
            if(array_search($row['preference'],self::$booleanPreferences)!==false){
                $row['value']=boolval($row['value']);
            }
            $preferences[$row['preference']]=$row['value'];
        }
        foreach(self::$defaultPreferences as $key=>$val){
            if(!isset($preferences[$key])){
                $preferences[$key] = $val;
            }
        }
        return $preferences;
    }
    public static function _getPreferencesField($id,$field){
        $data = Utility::getInstance()->fetch(self::$queryGetOrgPreferences. " and preference = '{$field}'",['orgId'=>$id]);
        $preferences = array();
        foreach($data as $row){
            if(array_search($row['preference'],self::$booleanPreferences)!==false){
                $row['value']=boolval($row['value']);
            }
            $preferences[$row['preference']]=$row['value'];
        }
        if(!isset($preferences[$field]) && isset(self::$defaultPreferences[$field])){
            $preferences[$field] = self::$defaultPreferences[$field];
        }
        return $preferences[$field];
    }

    private function _updatePreferences($id,$preferences,$deleteAll=true){
        if($deleteAll){
            $this->reader->delete('organization_preferences',['org_id'=>$id]);
        }else{
            foreach($preferences as $key=>$value){
                $this->reader->delete('organization_preferences',['org_id'=>$id,'preference'=>$key]);
            }
        }

        $values = array();
        foreach($preferences as $key=>$value){
            $values[]="({$id},'{$key}','{$value}')";
        }
        $insertQuery = "INSERT INTO organization_preferences (org_id,preference,value) values " . implode(',',$values);
        self::$util->insert($insertQuery);
    }
    public static function _canDeleteOwnPosts($orgId){
        $orgInfo = self::_get($orgId,false);
        return $orgInfo['can_delete_posts'];
    }
    public static function _getOrgFromPostId($postId){
        $util = new Utility();
        return $util->fetchOne(self::$queryGetOrgFromPost,['postId'=>$postId]);
    }
    public static function _getOrgFromPageId($pageId){
        $util = new Utility();
        return $util->fetchOne(self::$queryGetOrgFromPage,['pageId'=>$pageId]);
    }
    public static function _getOrgFromUserId($userId){
        return Utility::getInstance()->fetchOne("SELECT organizationid from users where id = $userId ");
    }
    public static function _getOrgFromClassId($classId){
        $util = new Utility();
        return $util->fetchOne(self::$queryGetOrgFromClass,['classId'=>$classId]);
    }
    public static function _getOrgClasses($orgId,$userRole='is_teacher',$acceptAdmin=true,UserController $me= null,$includeGroups=false){
        $util = new Utility();
        //getting org classes for user
        if(is_null($me)){
            $me = UserController::me($util->reader);
        }
        //getting org classes for admin users
        if($acceptAdmin && $util->checkAdmin(null,false,false)){
            $me = $util->me;
            $data = $util->fetch(self::$queryGetClasses);
        }
        else if($acceptAdmin && $util->checkAdmin($orgId,true,false)){
            $me = $util->me;
            $data = $util->fetch(self::$queryGetOrgClasses,['orgId'=>$orgId]);

        }
        else{
            //where conditions
            if($userRole=='is_teacher'){
                $where = ' and is_teacher=1';
            }
            else if($userRole=='is_edit_teacher'){
                $where = ' and is_edit_teacher=1';
            }
            else if($userRole=='is_student'){
                $where = ' and is_student=1';
            }
            else if($userRole=='is_observer'){
                $where = ' and is_observer=1';
            }
            $data = $util->fetch(self::$queryGetOrgClassesForUser . $where,['orgId'=>$orgId,'userId'=>$me->user->getUserId()]);
        }


        $classes = array();
        foreach($data as $row){
            if($includeGroups && !is_null($row['groupId'])){
                $row['fullid']=$row['courseid'].'-'.$row['groupId'];
                $row['fullname']=$row['name'].' - '.$row['groupName'];
            }else{
                /*
                Golabs fix 15/07/2015
                Set $row['fullid'] to $row['courseid']
                original was just $row['courseid']; showing
                */
                 $row['fullid'] = $row['courseid'];
            }

            if(!isset($classes[$row['fullid']])){
                $classes[$row['fullid']]=$row;
            }
        }
        return array_values($classes);


    }
    public static function _getAdvisors($orgId){
        $util = Utility::getInstance();

        $data =  $util->fetch(self::$queryGetAdvisors,['orgId'=>$orgId]);
        $users = [];
        if($data) {
            foreach ($data as $row) {
                if(!isset($users[$row['id']])){
                    $users[$row['id']] = UserController::_wrapUserObject($row);
                    $users[$row['id']]['students']=array();
                }
                if(boolval($_REQUEST['trackAttendance']) && (!boolval($row['track_attendance']) || ($row['attendance_withdraw_date'] && strtotime($row['attendance_withdraw_date']) < time()))){
                    continue;
                }
                $users[$row['id']]['students'][]=array(
                    'firstName'=>$row['studentFname'],
                    'lastName'=>$row['studentLname'],
                    'externalId'=>$row['studentExternalId'],
                    'email'=>$row['studentEmail'],
                    'id'=>$row['studentId']
                );
            }
        }
        return array_values($users);
    }
    public static function _getEditUsers($orgId){
        $util = Utility::getInstance();

        $data =  $util->fetch(self::$queryGetEditUsers,['orgId'=>$orgId]);
        $users = [];
        if($data) {
            foreach ($data as $row) {
                $users[] = UserController::_wrapUserObject($row);
            }
        }
        return $users;
    }
    private static $sortUsersByOptions = array(
        array(
            'id'=>'fname',
            'text'=>'First Name'
        ),
        array(
            'id'=>'lname',
            'text'=>'Last Name'
        )
    );
    private static $sortPostsByOptions = array(
        array(
            'id'=>'asc',
            'text'=>'Oldest to newest'
        ),
        array(
            'id'=>'desc',
            'text'=>'Newest to oldest'
        )
    );
    private static $booleanPreferences = [
        'enable_final_grades_export',
        'submit_file_automatically',
        'enable_attendance_export',
        'use_course_policies',
        'use_school_handbook',
        'use_webrtc'
    ];
    private static $defaultPreferences = [
        'splash_page_type'=>'activities',
        'submit_file_automatically'=>true,
        'use_webrtc' => false
    ];
    public static $queryGetOrg=<<<SQL
      SELECT * FROM organizations WHERE id = :orgId
SQL;
    private static $queryGetOrgPreferences=<<<SQL
      SELECT * FROM organization_preferences WHERE org_id = :orgId
SQL;
    private static $queryGetOrgFromUnit=<<<SQL
      SELECT d.organizationid
        FROM units
        JOIN courses on units.courseid = courses.id
        JOIN departments d on d.id = courses.departmentid
        WHERE units.id = :unitId
SQL;
    private static $queryGetOrgFromClass=<<<SQL
      SELECT d.organizationid
        FROM classes
        JOIN courses on classes.courseid = courses.id
        JOIN departments d on d.id = courses.departmentid
        WHERE classes.id = :classId
SQL;
    private static $queryGetOrgFromPost=<<<SQL
      SELECT d.organizationid
        FROM posts
        JOIN pages on posts.pageid = pages.id
        JOIN units on units.id = pages.unitid
        JOIN courses on units.courseid = courses.id
        JOIN departments d on d.id = courses.departmentid
        WHERE posts.id = :postId
SQL;
    private static $queryGetOrgFromPage=<<<SQL
      SELECT d.organizationid
        FROM pages
        JOIN units on units.id = pages.unitid
        JOIN courses on units.courseid = courses.id
        JOIN departments d on d.id = courses.departmentid
        WHERE pages.id = :pageId
SQL;

    /*Getting all classes in organization*/
    public static $queryGetOrgClasses = <<<SQL
      SELECT classes.*,groups.id as groupId, groups.name as groupName,count(uc.id) as studentCount
      FROM classes
        JOIN courses on courses.id = classes.courseid
        JOIN departments on departments.id = courses.departmentid
        LEFT join groups on groups.classid = classes.id
        LEFT join user_classes uc on uc.classid=classes.id and uc.is_student=1
        WHERE departments.organizationid = :orgId
        GROUP BY classes.id,groups.id;
SQL;
    /*Getting all classes in organization*/
    public static $queryGetClasses = <<<SQL
      SELECT classes.*,groups.id as groupId, groups.name as groupName,count(uc.id) as studentCount ,departments.organizationid as orgid 
      FROM classes
        JOIN courses on courses.id = classes.courseid
        JOIN departments on departments.id = courses.departmentid
        LEFT join groups on groups.classid = classes.id
        LEFT join user_classes uc on uc.classid=classes.id and uc.is_student=1
        GROUP BY classes.id,groups.id;
SQL;
    /*Getting all classes in organization for a specific user (additional where clauses may be appended,
    like "and is_teacher=1")*/
    private static $queryGetOrgClassesForUser = <<<SQL
      SELECT classes.*,groups.id as groupId, groups.name as groupName
      FROM classes
        JOIN courses on courses.id = classes.courseid
        JOIN departments on departments.id = courses.departmentid
        JOIN user_classes on classes.id = user_classes.classid
        LEFT join groups on groups.id = user_classes.groupid
        WHERE departments.organizationid = :orgId and user_classes.userid = :userId
SQL;
    /*Updating final grade flag for all classes in that org*/
    private static $queryUpdateFinalGrade = <<<SQL
      UPDATE classes
       JOIN courses on classes.courseid = courses.id
       JOIN departments on courses.departmentid = departments.id
       JOIN organizations on organizations.id = departments.organizationid
      SET classes.show_final_grade = :showFinalGrade
       WHERE organizations.id = :orgId
SQL;
    private static $queryGetEditUsers = <<<SQL
    SELECT DISTINCT u.id,
          u.fname,
          u.lname,
          u.email
      FROM users u
      JOIN user_classes uc on uc.userid = u.id
      WHERE u.organizationid = :orgId and uc.is_edit_teacher = 1
SQL;
    private static $queryGetAdvisors = <<<SQL
    SELECT DISTINCT u.id,
          u.fname,
          u.lname,
          u.email,
          s.track_attendance,
          s.attendance_withdraw_date,
          s.id as studentId,
          s.fname as studentFname,
          s.lname as studentLname,
          s.external_id as studentExternalId,
          s.email as studentEmail
      FROM users u
      JOIN user_advisors ua on ua.userid = u.id
      JOIN users s on s.id=ua.studentid
      left JOIN user_classes uc ON s.id = uc.userid
      left join user_attendance_only_classes uac on s.id = uac.userid
      WHERE u.organizationid = :orgId and (uc.userid is not null or uac.userid is not null)
SQL;

    private static $queryGetAdmins = <<<SQL
    SELECT u.id,u.email,u.fname,u.lname FROM
    user_admin_organizations uo
    join users u on u.id = uo.userid
    where uo.organizationid = :orgId
SQL;
    private static $isAttendanceWarningEnabled = <<<SQL
    SELECT enable_attendance_warning FROM organizations o
    join users on users.organizationid = o.id
    where users.id = :userId
SQL;


}
class UserFilter {
    private $filter_join = '';
    private $filter_where = '';
    public function getUsers($params, $orgId){
        $util = Utility::getInstance();
        $notInSites = boolval(@$params['notInSites']);
        $asTeacher = boolval(@$params['asTeacher']);
        $asEditTeacher = boolval(@$params['asEditTeacher']);
        $query = self::$queryGetUsers;
        if($notInSites) {
            $query = self::$queryGetUsersNotInSites;
        }else if($asTeacher){
            if(Utility::getInstance()->checkAdmin(null,false,false)){
                $query = self::$queryGetUsersAs . " and user_classes.is_teacher=1";
            }else{
                $query = self::$queryGetUsersAs . " and organizationid = :orgId and user_classes.is_teacher=1";
            }

        }
        else if($asEditTeacher){
            if(Utility::getInstance()->checkAdmin(null,false,false)) {
                $query = self::$queryGetUsersAs . " and user_classes.is_edit_teacher=1";
            }else{
                $query = self::$queryGetUsersAs . " and organizationid = :orgId  and user_classes.is_edit_teacher=1";
            }
        }
        $this->filterSiteIfNeeded($params);
        $this->filterCourseIfNeeded($params);
        $this->filterStudentIfNeeded($params);
        $this->replaceJoinsAndWheres($query);
        $users = $util->fetch(
            $query.' order by fname',
            array('orgId' => $orgId)
        );
        $result = array();
        $indexedResult = array();
        foreach ($users as $i => $user) {
            $result[] = array(
                'id' => intval($user['id']),
                'firstName' => $user['fname'],
                'lastName' => $user['lname'],
                'email' => $user['email']
            );
            $indexedResult[$user['id']]=$i;
        }
        if(boolval($params['includeClasses'])){
            $ids=array_map(function($v){return $v['id'];},$users);
            $query = self::$queryGetUsersClasses . ' and uc.userid in (' . implode(',',$ids).')';
            $data = $util->fetch($query);
            foreach($data as $row){
                if(!isset($result[$indexedResult[$row['userid']]]['classes'])){
                    $result[$indexedResult[$row['userid']]]['classes']=array();
                }
                $result[$indexedResult[$row['userid']]]['classes'][]=$row;
            }
        }

        return new JsonResponse($result);
    }
    private function filterSiteIfNeeded($params){
        if($id = @$params['siteId']){
            $this->filter_join = ' join user_classes uc on user_classes.classid = uc.classid join site_users su on su.user_id = uc.userid';
            $this->filter_where = " and uc.is_student = 1 and su.site_id = $id";
        }
    }
    private function filterCourseIfNeeded($params){
        if($id = @$params['classId']){
            $this->filter_where = ' and user_classes.classid = '.$id;
        }

    }
    private function filterStudentIfNeeded($params){

    }
    private function replaceJoinsAndWheres(&$query){
        $query = str_replace('__filter_join__',$this->filter_join,$query);
        $query = str_replace('__filter_where__',$this->filter_where,$query);
    }
    private static $queryGetUsers = <<<SQL
        SELECT *
        FROM users
        WHERE organizationid = :orgId
SQL;
    private static $queryGetUsersAs = <<<SQL
        SELECT DISTINCT users.*
        FROM users
        JOIN user_classes on users.id = user_classes.userid
        __filter_join__
        WHERE 1 __filter_where__
SQL;
    private static $queryGetUsersNotInSites = <<<SQL
        SELECT *
        FROM users
        WHERE organizationid = :orgId AND id NOT IN (
            SELECT user_id FROM site_users
        )
SQL;
    private static $queryGetUsersClasses = <<<SQL
    SELECT DISTINCT
        c.id,
        c.name,
        c.courseid as courseId,
        g.id as groupId,
        g.name as groupName,
        uc.is_student,
        uc.is_teacher,
        uc.is_edit_teacher,
        uc.is_observer,
        uc.userid
        FROM user_classes uc
        JOIN classes c on uc.classid = c.id
        LEFT JOIN groups g ON g.id = uc.groupid
        WHERE 1
SQL;
}
?>

