<?php
    // poor man's ORM
use English3\Controller\Classes\CustomProgressBar;
use English3\Controller\ClassesController;
use English3\Controller\Utility;

class PmOrm {
    public function __construct ($sess, $DB) {
        $this->sess = $sess;
        $this->db = $DB;
        $this->calc_logged_in();
    }
    /*
     * DSerejo 2015-02-14
     */
    public function set_me($user_id){
        $is_valid = $this->query("SELECT count(*) FROM users WHERE users.id = {$user_id}")!=false;
        if($is_valid) $this->user_id = $user_id;
        return $is_valid;
    }
    public function who_am_i(){
        return $this->user_id;
    }

    public function query($query) {
        $rows = [];
        $result = $this->db->mysqli->query($query);

        if (!$result) {
            throw new Exception("Qatabase query failed with error: " . $this->db->mysqli->error . ".\n\nQuery: " .$query);
        }
        while($row = $result->fetch_assoc()) {
            $rows[] = $row;
        }
        return $rows;
    }
    /*
     * DSerejo 2015-02-14
     */
    public function query_no_result($query){
        $this->db->mysqli->query($query);
        if ($this->db->mysqli->errno!==0) {
            throw new Exception("Qatabase query failed with error: " . $this->db->mysqli->error . ".\n\nQuery: " .$query);
        }
        return true;
    }

    public function fetch_one($query) {
        $res = $this->query($query);
        if (!count($res)) return FALSE;
        return $res[0];
    }

    public function calc_logged_in() {
        $this->logged_in = $this->is_logged_in();
        if (!$this->logged_in) return;
        $this->user_id = intval($_SESSION['USER']['ID']);
    }
    public function get_classes_in_org($org_id){
        $query = "SELECT '--' as end_date,
            classes.id as class_id,
            classes.show_dates,
            classes.show_grades,
            classes.show_grades_as_score,
            classes.show_grades_as_letter,
            classes.show_grades_as_percentage,
            classes.a_plus_max,classes.a_plus_min,classes.a_max,classes.a_min,classes.a_minus_max,classes.a_minus_min,classes.b_plus_max,classes.b_plus_min,classes.b_max,classes.b_min,classes.b_minus_max,classes.b_minus_min,classes.c_plus_max,classes.c_plus_min,classes.c_max,classes.c_min,classes.c_minus_max,classes.c_minus_min,classes.d_plus_max,classes.d_plus_min,classes.d_max,classes.d_min,classes.d_minus_max,classes.d_minus_min,classes.use_grade_a_plus,classes.use_grade_a,classes.use_grade_a_minus,classes.use_grade_b_plus,classes.use_grade_b,classes.use_grade_b_minus,classes.use_grade_c_plus,classes.use_grade_c,classes.use_grade_c_minus,classes.use_grade_d_plus,classes.use_grade_d,classes.use_grade_d_minus,
            courses.id,
            courses.name,
            courses.description,
            courses.native_language,
            groups.id as groupid,
            groups.name as group_name,
            count(pages.id) as num_pages,
            unitCount.unitCount,
            count(super_units.id) as num_super_units,
            classes.use_super_units,
            '{$org_id}' as orgId,
            languages.rtl_support FROM classes
                LEFT JOIN courses on courses.id = classes.courseid
                LEFT JOIN departments on courses.departmentid = departments.id
                LEFT JOIN units on units.courseid=courses.id
                LEFT JOIN pages on pages.unitid = units.id
                LEFT JOIN organizations on organizations.id = departments.organizationid
                LEFT JOIN languages ON (courses.native_language = languages.language_id)
                LEFT JOIN groups ON groups.classid = classes.id
                LEFT JOIN
                    (SELECT courseid, COUNT(*) as unitCount FROM units GROUP BY courseid) unitCount
                    ON unitCount.courseid = classes.courseid
                LEFT JOIN super_units ON super_units.id = classes.id
                WHERE organizations.id = {$org_id} AND
                classes.is_active AND
                courses.is_active=1
                GROUP BY courses.id";

        return $this->query($query);
    }
    public function is_logged_in() {
        $sess = $this->sess;
        return isset($sess['USER']) &&
            isset($sess['USER']['LOGGED_IN']) &&
            isset($sess['USER']['ID']) &&
            $sess['USER']['ID'] > 0 &&
            $sess['USER']['LOGGED_IN']==true;
    }

    public function has_temp_password() {
        $sess = $this->sess;
        return isset($sess['USER']['TEMP_PWD']) && $sess['USER']['TEMP_PWD'];
    }
    public function license_expired() {
        $sess = $this->sess;
        return isset($sess['TMP_USER']);
    }

    // created for grades-classes.pnp
    public function am_i_super_user() {
        return count($this->query("SELECT
            *
            FROM user_admin_super
            WHERE user_id={$this->user_id}"));
    }
    public function am_i_organization_admin() {
        $organization_id = $this->my_org(false)["id"];
        return count($this->query("SELECT
        id
        FROM user_admin_organizations
        WHERE userid={$this->user_id} and organizationid = {$organization_id}"));

    }
    public function am_i_site_admin() {
        return \English3\Controller\UserController::isSiteAdmin($this->user_id);
    }

    public function am_i_student() {
        return count($this->query("
            SELECT classid as cid
            FROM user_classes
            WHERE userid={$this->user_id} and is_student=1
            ")) > 0;
    }
    public function am_i_edit_teacher($class_id=0){
        if($class_id>0){
            return count($this->query("
            SELECT classid as cid
            FROM user_classes
            WHERE classid={$class_id} and userid={$this->user_id} and is_edit_teacher=1
            ")) > 0;
        }
        return count($this->query("
            SELECT classid as cid
            FROM user_classes
            WHERE userid={$this->user_id} and is_edit_teacher=1
            ")) > 0;
    }
    public function am_i_teacher_supervisor(){
        return count($this->query("SELECT
            id
            FROM users
            WHERE id={$this->user_id} and teacher_supervisor=1"));
    }
    public function am_i_parent(){
        $guardian = count($this->query("SELECT
            id
            FROM user_guardians
            WHERE userid={$this->user_id}"));
        $advisor = count($this->query("SELECT
            *
            FROM user_advisors
            WHERE userid={$this->user_id}"));
        $site_admin = \English3\Controller\UserController::isSiteAdmin($this->user_id);
        return $guardian || $advisor || $site_admin;
    }
    public function am_i_active_for($class_id,$group_id=''){
        if($this->am_i_super_user() || $this->am_i_organization_admin())
            return true;

        return count($this->query("
            SELECT classid as cid
            FROM user_classes
            WHERE userid={$this->user_id}
              and is_observer=0
              and classid={$class_id}
              and (groupid is null or groupid='{$group_id}'
            ")) > 0;
    }
    public function am_i_active_for_page($page_id){
        if($this->am_i_super_user() || $this->am_i_organization_admin())
            return true;

        return count($this->query("
            SELECT classid as cid
            FROM pages p
            join units u on u.id = p.unitid
            join classes c on u.courseid = c.courseid
            join user_classes uc on uc.classid = c.id
            WHERE userid={$this->user_id}
              and is_observer=0
              and p.id = {$page_id}
            ")) > 0;
    }
    public function am_i_teacher($class_id=0){
        if($class_id>0){
            return count($this->query("
            SELECT classid as cid
            FROM user_classes
            WHERE classid={$class_id} and userid={$this->user_id} and is_teacher=1
            ")) > 0;
        }
        return count($this->query("
            SELECT classid as cid
            FROM user_classes
            WHERE userid={$this->user_id} and is_teacher=1
            ")) > 0;
    }

    public function am_i_teacher_of($studentId,$classId){
        return $this->am_i_teacher($classId) and count($this->query("
            SELECT classid as cid
            FROM user_classes
            WHERE classid={$classId} AND userid={$studentId} and is_student=1
            ")) > 0;
    }

    public function am_i_in_classes() {
        return count($this->query("
            SELECT classid as cid 
            FROM user_classes
            WHERE userid={$this->user_id}
            ")) > 0;
    }

    public function am_i_just_parent() {
        return !$this->am_i_super_user() && !$this->am_i_in_classes();
    }

    public function my_org($admin = true) {
        if($admin){
            return $this->fetch_one("SELECT
            organizationid as id
            FROM user_admin_organizations
            WHERE userid={$this->user_id}
            LIMIT 1");
        }
        else{
            return $this->fetch_one("SELECT
            organizationid as id
            FROM users WHERE users.id = {$this->user_id}");
        }


    }

    public function get_all_students() {
        return $this->query("SELECT
            users.id,
            users.created,
            fname,
            lname,
            is_active,
            is_logged_in,
            email,
            organizationid
            FROM users");
    }

    public function students_in_my_org($admin = true) {
        $util = new Utility();
        $util->calcLoggedIn();
        if ($this->am_i_super_user()) {
            return $this->get_all_students();
        }
        $org = $util->me->user->getOrgId();
        if($util->me->amIOrgAdmin($org)){
            return $this->query("SELECT
            users.id,
            users.created,
            fname,
            lname,
            is_active,
            is_logged_in,
            email,
            organizationid
            FROM users
            WHERE organizationid={$org}");
        }else if($this->am_i_parent()){
            return $this->get_children();
        }


    }

    public function am_i_parent_of($user_id) {
        $children = $this->query("SELECT
            *
            FROM user_guardians
            WHERE
                userchildid={$user_id} AND
                userid={$this->user_id}
            ");
        return count($children) > 0;
    }
    public function am_i_child_of($user_id){
        return $this->query("SELECT count(*)
            FROM user_guardians
            WHERE
                userchildid={$this->user_id} AND
                userid={$user_id}
            ") != false;
    }

    public function get_children() {
        $children_guardians = $this->query("SELECT
                users.id,
                users.created,
                fname,
                lname,
                is_active,
                is_logged_in,
                email,
                organizationid
            FROM users
            JOIN user_guardians ON (user_guardians.userchildid=users.id)
            WHERE
                user_guardians.userid={$this->user_id}
            ORDER BY users.lname ASC");
        $children_advisors = $this->query("SELECT * FROM (SELECT
                users.id,
                users.created,
                fname,
                lname,
                is_active,
                is_logged_in,
                email,
                organizationid
            FROM users
            JOIN user_advisors ON (user_advisors.studentid=users.id)
            WHERE
                user_advisors.userid={$this->user_id}
            UNION SELECT
             users.id,
             users.created,
             fname,
             lname,
             is_active,
             is_logged_in,
             email,
             organizationid
              FROM  user_admin_sites us
              JOIN sites s on s.id = us.siteid
              JOIN site_users su on su.site_id = s.id
              JOIN users ON users.id = su.user_id
              WHERE us.userid = {$this->user_id}
            ) users
              GROUP BY users.id
            ORDER BY users.lname ASC");
        $children = array();
        foreach($children_advisors as $child){
            if(!isset($children[$child['id']])){
                $children[$child['id']] = $child;
            }
        }
        foreach($children_guardians as $child){
            if(!isset($children[$child['id']])){
                $children[$child['id']] = $child;
            }
        }
        $children = array_values($children);
        if (count($children) == 0) return FALSE;
        return $children;
    }

    /*
     * DSerejo 2015-02-14
     */
    public function get_guardians(){
        $guardians = $this->query("SELECT
                users.id,
                users.created,
                fname,
                lname,
                is_active,
                is_logged_in,
                email,
                organizationid
            FROM users
            JOIN user_guardians ON (user_guardians.userid=users.id)
            WHERE
                user_guardians.userchildid={$this->user_id}
            ORDER BY users.lname ASC");
        if (count($guardians) == 0) return FALSE;
        return $guardians;
    }

    public function get_all_classes() {

        $students =  $this->query(<<<SQL
            select
                users.id,
                users.created,
                fname,
                lname,
                gender,
                s.name as siteName,
                is_active,
                is_logged_in,
                email,
                organizationid,
                students.classid,
                students.groupid,
                students.is_suspended
            FROM users
            JOIN (
                SELECT userid, classid,is_student,groupid,is_suspended FROM user_classes
                JOIN (
                SELECT classid as cid, groupid as gid from user_classes where userid={$this->user_id} and is_teacher=1
                ) as mine on mine.cid = classid and (gid=groupid or groupid is null)
            ) as students on students.userid=users.id
            LEFT JOIN site_users su ON su.user_id = users.id
            LEFT JOIN sites s ON s.id = su.site_id
            WHERE students.is_student = 1
            GROUP BY students.classid,students.groupid,users.id;
SQL
        );
        if (count($students) == 0) return FALSE;
        $classes = [];

        foreach ($students as $student) {
            $id = $student["groupid"]?$student["classid"].'-'.$student["groupid"]:$student["classid"];
            if (!isset($classes[$id])) {
                $classes[$id] = ['students'=>[], 'id'=>$id];
            }
            $classes[$id]['students'][] = $student;
        }
        $classlist = [];

        foreach ($classes as $cid => $class) {
            $originalCId = $cid;
            $groupid="";
            if(strpos($cid,'-')!==false){
                $groupid=explode('-',$cid)[1];
                $cid=explode('-',$cid)[0];
            }
            $class_data = $this->fetch_one("SELECT 
                classes.id as class_id,
                classes.show_dates,
                classes.show_grades,
                classes.show_grades_as_score,
                classes.show_grades_as_letter,
                classes.show_grades_as_percentage,
                courses.id as course_id,
                classes.name,
                courses.name as course_name,
                courses.description as course_description,
                courses.native_language,
                groups.name as group_name,
                groups.id as group_id,
                '--' as end_date,
                languages.rtl_support,
                unitCount.unitCount
                FROM classes
                JOIN courses ON (classes.courseid=courses.id)
                LEFT JOIN languages ON (courses.native_language = languages.language_id)
                LEFT JOIN groups ON groups.id = '{$groupid}'
                LEFT JOIN
                    (SELECT courseid, COUNT(*) as unitCount FROM units GROUP BY courseid) unitCount
                    ON unitCount.courseid = classes.courseid
                WHERE
                    classes.id={$cid} AND
                    classes.is_active=1");
            if (!$class_data) {
                continue;
            };

            foreach ($class_data as $key => $val) {
                $classes[$originalCId][$key] = $val;
            }
            $classlist[] = $classes[$originalCId];
        }

        return $classlist;
    }
    public function get_assignments_for_class($class_id,$user_id){

        $query = "SELECT
		assignments.*
		,sum(if(time_out is not null,timestampdiff(second,time_in,time_out),0))  as duration,
		count(v.id) as vocab_max_points,
        count(qq.id) as quiz_max_points
        FROM (SELECT
        p.moduleid,
        p.layout,
		p.id as page_id,
		p.is_gradeable,
		{$user_id} as userid,
		units.name as unitPosition,
		units.description as unit,
		units.id as unitid,
        pagegroupid,
        p.name as name,
        p.position as page_position,
        ca.points as ca_points,
        quiz_scores.max_points,
        ca.due as due,
        gp.id as notification_id,
        if(gp.id is null,'0','1') as has_feedback,
        teacher_notes,
        posts.created as submitted,
        p.quiz_id,
        if(grade is null,score,grade) as score,
        quiz_scores.submitted as quiz_submitted_date,
        show_dates,
        show_grades
         FROM pages p
        left join units on units.id = p.unitid
        left join classes on classes.courseid=units.courseid
        left JOIN class_assignments ca ON p.id = ca.page_id
        LEFT JOIN (select * from posts order by id desc) posts on posts.pageid = p.id
        LEFT JOIN (select * from grade_posts order by id desc) gp on posts.id = gp.post_id
        LEFT JOIN quiz_scores on p.id = quiz_scores.quiz_id
        where classes.id = {$class_id} and
            (quiz_scores.user_id = {$user_id} or quiz_scores.user_id is null) and
            (posts.userid = {$user_id} or posts.userid is null)
            group by p.id
        order by gp.created DESC) as assignments
        LEFT JOIN activity_history ah on ah.pageid = assignments.page_id and ah.userid = assignments.userid
        LEFT JOIN vocabularies v on v.module_id = assignments.moduleid and layout='VOCAB_QUIZ'
        LEFT JOIN quiz_questions qq on qq.quiz_id = assignments.quiz_id
        group by page_id
        order by unitPosition,page_position ";
        $assignments = $this->query($query);
        $response = array();
        $units=array();
        foreach($assignments as $assignment){
            $max_points = $assignment['ca_points']?$assignment['ca_points']:$assignment['max_points'];
            $max_points = $max_points?$max_points:$assignment['quiz_max_points'];
            $max_points = $max_points?$max_points:$assignment['vocab_max_points'];
            $assignment['max_points'] = $max_points?$max_points:null;

            if(!isset($units[$assignment['unitid']])) {
                $units[$assignment['unitid']] = array(
                    'id' => $assignment['unitid'],
                    'name' => $assignment['unit'],
                    'position' => $assignment['unitPosition'],
                    'pageGroups' => array()
                );
            }
        $pageGroups = &$units[$assignment['unitid']]['pageGroups'];

        if($assignment['pagegroupid'] >0){
            if(!isset($pageGroups[$assignment['pagegroupid']])){
                $pageGroups[$assignment['pagegroupid']]=array('id'=>$assignment['pagegroupid'],
                    'pages'=>array(),
                );
            }
            $pages = &$pageGroups[$assignment['pagegroupid']]['pages'];
            $pages[] = $assignment;
        }
        else{
            if(!isset($pageGroups[$assignment['page_id']])){
                $pageGroups[$assignment['page_id']]=array('id'=>$assignment['page_id'],
                    'pages'=>array(),
                );
            }
            $pageGroups[$assignment['page_id']]['info']=$assignment;
        }


            $response[]=$assignment;
        }
        return ['units'=>$units,'assignments'=>$response];
    }
    public function get_teachers_for_class($class_id){
        return $this->query("SELECT
                users.id,
                users.created,
                fname,
                lname,
                is_active,
                is_logged_in,
                email,
                organizationid
            FROM users
            JOIN user_classes ON (user_classes.userid = users.id)
            WHERE
                user_classes.classid = {$class_id} AND
                user_classes.is_teacher = 1");
    }

    public function get_students_for_class($class_id,$groupid) {
        $iamteacher = $this->fetch_one("SELECT
            count(*)
            FROM user_classes
            WHERE
                userid={$this->user_id} AND
                classid={$class_id} AND
                is_teacher = 1");
        if (!$iamteacher) return FALSE;
        if($groupid)
        {
            $Where_Groupid = "AND user_classes.groupid='{$groupid}'";
        }else{
            $Where_Groupid = "";
        }
        return $this->query("SELECT
                users.id,
                users.created,
                fname,
                lname,
                is_active,
                is_logged_in,
                email,
                organizationid
            FROM users
            JOIN user_classes ON (user_classes.userid = users.id)
            WHERE
                user_classes.classid = {$class_id} AND
                user_classes.is_student = 1 {$Where_Groupid}");
    }

    // used course.php
    public function get_my_classes($teacher=false,$student=false,$include_groups=true) {
        return $this->get_classes_for($this->user_id, $teacher,$student,$include_groups);
    }
    public function get_my_info(){
        return $this->fetch_one("SELECT * FROM users WHERE users.id = {$this->user_id}");
    }
    public function get_preferences(){
        $data = $this->query("SELECT * FROM user_preferences where user_id = {$this->user_id}");
        $preferences = array();
        foreach($data as $row){
            $preferences[$row['preference']] = $row['value'];
        }
        return $preferences;
    }
    public function get_translations(){
        $result = $this->query("SELECT
                        localize_navs.language, translation, nav_key
                        FROM localize_navs
                        JOIN user_preferences on user_preferences.value = localize_navs.language and user_preferences.user_id={$this->user_id}
                        WHERE (user_preferences.preference = 'language' and user_preferences.user_id = {$this->user_id}) or localize_navs.language = 'en'
                        ");

        if (count($result) == 0) return FALSE;
        $translations = array(
            'en'=>array(),
            'user_language'=>array(),
            'language'=>''

            );
        foreach ($result as $row) {
            if($translations['language']==""){
                $translations['language']=$row['language'];
            }
            if($row['language']=='en'){
                $translations['en'][$row['nav_key']] = $row['translation'];
            }
            else{
                $translations['user_language'][$row['nav_key']] = $row['translation'];
            }

        }
        return $translations;
    }

    public function am_admin_for($user_id) {
        if ($user_id == $this->user_id) return true;
        if ($this->am_i_super_user()) return true;
        if ($this->am_i_parent_of($user_id)) return true;
    }
    // taughtOnly => 1 for editor, 2 for normal teacher
    public function get_classes_for($user_id, $taughtOnly,$studentOnly=false,$includeGroups=false,
                                    $includeInactive=false,$includeStudents=false) {
        // If the $taughtOnly variable is true, we adda WHERE clause filter to only show courses that the user
        // is a teacher of.
        $taughtClassesOnlyWhereClause = " AND users.id={$user_id}";
        $studentClassesOnlyWhereClause='';
        $inactiveWhereClause = $includeInactive?'':' AND ((classes.is_active AND courses.is_active=1) OR user_classes.is_student=0) ';
        if($taughtOnly){
            if($this->am_i_super_user()){
                $taughtClassesOnlyWhereClause='';
            }
            else if($this->am_i_organization_admin() || $this->am_i_teacher_supervisor()){
                $classes = $this->get_classes_in_org($this->my_org(false)["id"]);
            }
            else{
                //1 for course_editor, 2 for grader
                if($taughtOnly===2){
                    $taughtClassesOnlyWhereClause = " AND users.id={$user_id} AND (user_classes.is_teacher=1 or user_classes.is_observer=1)";
                }
                else{
                    $taughtClassesOnlyWhereClause = " AND users.id={$user_id} AND (user_classes.is_edit_teacher=1 or user_classes.is_observer=1)";
                }

            }
        }
        if($studentOnly){
            $taughtClassesOnlyWhereClause="";
            $studentClassesOnlyWhereClause = " AND users.id={$user_id} AND (user_classes.is_student=1 or user_classes.is_observer=1)";
        }
        if($includeGroups){
            $group_join="LEFT join groups on (groups.id=user_classes.groupid)";
            $group_name=",groups.name as group_name";
            $groupby = ",groupid";
        }
        else{
            $group_join="";
            $group_name="";
            $groupby="";
        }

                if ($this->am_i_student()){
            $sqlpages = "SELECT unitid, COUNT(pages.id) as num_pages from user_classes,classes,courses,units,pages
WHERE
user_classes.userid = {$this->user_id}
AND
user_classes.classid=classes.id
AND
classes.courseid=courses.id
AND
units.courseid = courses.id
AND
pages.unitid = units.id
GROUP BY unitid";

$unitCount = "SELECT units.courseid, COUNT(*) as unitCount
from 
classes,courses,units
WHERE
classes.courseid=courses.id
AND
units.courseid = courses.id
GROUP BY units.courseid";
        }
        else
        {
            $sqlpages = 'SELECT unitid, COUNT(pages.id) as num_pages FROM pages GROUP BY unitid';
            $unitCount = 'SELECT courseid, COUNT(*) as unitCount FROM units GROUP BY courseid';
        }

        if(!isset($classes)) $classes = $this->query("SELECT
            '--' as end_date,
            classes.id as class_id,
            classes.show_dates,
            classes.show_grades,
            classes.show_grades_as_score,
            classes.show_grades_as_letter,
            classes.show_grades_as_percentage,
            classes.show_final_grade,
            classes.show_table_of_contents,
            classes.a_plus_max,classes.a_plus_min,classes.a_max,classes.a_min,classes.a_minus_max,classes.a_minus_min,classes.b_plus_max,classes.b_plus_min,classes.b_max,classes.b_min,classes.b_minus_max,classes.b_minus_min,classes.c_plus_max,classes.c_plus_min,classes.c_max,classes.c_min,classes.c_minus_max,classes.c_minus_min,classes.d_plus_max,classes.d_plus_min,classes.d_max,classes.d_min,classes.d_minus_max,classes.d_minus_min,classes.use_grade_a_plus,classes.use_grade_a,classes.use_grade_a_minus,classes.use_grade_b_plus,classes.use_grade_b,classes.use_grade_b_minus,classes.use_grade_c_plus,classes.use_grade_c,classes.use_grade_c_minus,classes.use_grade_d_plus,classes.use_grade_d,classes.use_grade_d_minus,
            classes.created as created,
            organizations.use_custom_progress_bar,
            organizations.custom_progress_bar,
            courses.id,
            courses.id as courseid,
            courses.name,
            courses.description,
            courses.native_language,
            languages.rtl_support,
            user_classes.is_teacher,
            user_classes.is_student,
            user_classes.is_edit_teacher,
            user_classes.is_suspended,
            user_classes.finished_the_class,
            user_classes.groupid,
            COUNT(users.id) AS studentCount,
           num_pages.num_pages,
            unitCount.unitCount,
            organizations.id as orgId,
            pr.perc_expected_tasks,
            pr.perc_completed_tasks,
            pr.perc_completed_score,
            classes.is_active as is_active,
            classes.use_super_units,
            count(distinct super_units.id) as num_super_units
            {$group_name}
            FROM users
                JOIN user_classes ON (users.id=user_classes.userid)
                JOIN classes ON (user_classes.classid=classes.id)
                JOIN courses ON (classes.courseid=courses.id)
                JOIN departments ON courses.departmentid = departments.id
                JOIN organizations on departments.organizationid = organizations.id
                LEFT JOIN progress_report pr ON pr.classid=classes.id and pr.userid = users.id
                LEFT JOIN units ON (units.courseid = courses.id)
                LEFT JOIN super_units ON super_units.classid = classes.id
        LEFT JOIN
                    (".$sqlpages.") num_pages
                    ON units.id = num_pages.unitid
                {$group_join}
                LEFT JOIN languages ON (courses.native_language = languages.language_id)
        LEFT JOIN
                    (".$unitCount.") unitCount
                    ON unitCount.courseid = classes.courseid

            WHERE 1 ".$inactiveWhereClause.$taughtClassesOnlyWhereClause.$studentClassesOnlyWhereClause."

            GROUP BY class_id {$groupby}
            ORDER BY courses.name ASC");
//                users.id={$this->user_id} AND

        foreach ($classes as &$class) {
            if($includeGroups && $class['group_name']){
                $class['name'] =$class['name']." - ".$class['group_name'];
                $class['id']=$class['id'].'-'.$class['groupid'];
            }
            $util = Utility::getInstance();
            $classCtrl = new ClassesController($util->reader);
            $class['rubric']=$classCtrl->wrapClassObject($class)['rubric'];
            $class['use_custom_progress_bar']=boolval(@$class['use_custom_progress_bar']);
            $class['perc_expected_tasks']=intval(@$class['perc_expected_tasks']);
            $class['perc_completed_tasks']=intval(@$class['perc_completed_tasks']);
            if($class['use_custom_progress_bar']){
                $progressBar = CustomProgressBar::fromString($class['custom_progress_bar']);
                $class['custom_progress_bar'] = $progressBar->toArray();
            }

                $query = <<<SQL
            SELECT users.fname, users.lname, users.id,users.email
FROM user_classes
JOIN users on users.id = userid
WHERE is_teacher = 1
AND classid = {$class['class_id']}
SQL;
                if($includeGroups){
                    $query.=" AND (groupid='{$class['groupid']}' or groupid is null)";
                }
                $teachers = $this->query($query);
                $class['teachers'] = $teachers;

                if($includeStudents){
                    $query = <<<SQL
            SELECT users.fname, users.lname, users.id,users.email, concat(users.lname,', ',users.fname) as name
FROM user_classes
JOIN users on users.id = userid
WHERE is_student = 1
AND classid = {$class['class_id']}
SQL;
                    $students = $this->query($query);
                    $class['students'] = $students;

                }

        }

        return $classes;
    }
}
