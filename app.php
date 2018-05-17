<?php

require_once __DIR__.'/vendor/autoload.php';
require_once('config.php');
require_once(__DIR__.'/controllers/usertools/session.php');
session_start();

/*
Golabs
Closing Session write so the session file is not locked and causing
a file grid block wait time while files process and close the session file and release the lock.
See also session.php to rerun write to file.
*/
 if (!preg_match('@/signout|signin|notifications|editorganizationuser|course/@',@$_SERVER['REQUEST_URI'])){
session_write_close();
}


//ErrorHandler::register();

global $app;
$app = new Silex\Application();
$app['debug'] = true;

$app->register(new Silex\Provider\DoctrineServiceProvider(), array(
    'dbs.options' => array (
        'mysql_read' => array(
            'driver'    => 'pdo_mysql',
            'host'      => $GLOBALS['DB']->host,
            'dbname'    => $GLOBALS['DB']->database,
            'user'      => $GLOBALS['DB']->user,
            'password'  => $GLOBALS['DB']->password,
            'charset'   => 'utf8',
        ),
        'mysql_write' => array(
            'driver'    => 'pdo_mysql',
            'host'      => $GLOBALS['DB']->host,
            'dbname'    => $GLOBALS['DB']->database,
            'user'      => $GLOBALS['DB']->user,
            'password'  => $GLOBALS['DB']->password,
            'charset'   => 'utf8',
        ),
    ),
));
$app['controllers.example'] = $app->factory(function () {
    return new \English3\Controller\ExampleController();
});

$app['controllers.assignments'] = $app->factory(function () use ($app) {
    return new \English3\Controller\AssignmentsController($app['dbs']['mysql_read']);
});
$app['controllers.canvastemplates'] = $app->factory(function () use ($app) {
    return new \English3\Controller\CanvasTemplates\CanvasTemplates($app['dbs']['mysql_read']);
});
$app['controllers.classes'] = $app->factory(function () use ($app) {
    return new \English3\Controller\ClassesController($app['dbs']['mysql_read']);
});
$app['controllers.exemptedassignments'] = $app->factory(function () use ($app) {
    return new \English3\Controller\Classes\CreditedExemptedAssignments($app['dbs']['mysql_read']);
});
$app['controllers.userclassduration'] = $app->factory(function () use ($app) {
    return new \English3\Controller\Classes\UserClassDuration($app['dbs']['mysql_read']);
});
$app['controllers.userclass'] = $app->factory(function () use ($app) {
    return new \English3\Controller\Classes\UserClass($app['dbs']['mysql_read']);
});
$app['controllers.userduedates'] = $app->factory(function () use ($app) {
    return new \English3\Controller\Users\UserDueDates($app['dbs']['mysql_read']);
});
$app['controllers.useralerts'] = $app->factory(function () use ($app) {
    return new \English3\Controller\Users\Alerts\UserAlertsApi($app['dbs']['mysql_read']);
});
$app['controllers.userguardians'] = $app->factory(function () use ($app) {
    return new \English3\Controller\Users\UserGuardiansArray($app['dbs']['mysql_read']);
});

$app['controllers.posts'] = $app->factory(function () use ($app) {
    return new \English3\Controller\PostsController($app['dbs']['mysql_read']);
});
$app['controllers.postviews'] = $app->factory(function () use ($app) {
    return new \English3\Controller\Posts\PostViews($app['dbs']['mysql_read']);
});
$app['controllers.graderactivitiesstudent'] = $app->factory(function () use ($app) {
    return new \English3\Controller\Grader\GraderActivitiesForStudent($app['dbs']['mysql_read']);
});
$app['controllers.reports'] = $app->factory(function () use ($app) {
    return new \English3\Controller\ReportsController($app['dbs']['mysql_read']);
});
$app['controllers.enabledreports'] = $app->factory(function () use ($app) {
    return new \English3\Controller\Organization\EnabledReports($app['dbs']['mysql_read']);
});
$app['controllers.dashboardreport'] = $app->factory(function () use ($app) {
    return new \English3\Controller\Reports\DashboardReport($app['dbs']['mysql_read']);
});
$app['controllers.chat'] = $app->factory(function () use ($app) {
    return new \English3\Controller\Chat\ChatApi($app['dbs']['mysql_read']);
});

$app['controllers.automatedalerts'] = $app->factory(function () use ($app) {
    return new \English3\Controller\AutomatedAlerts\AutomatedAlertsAPI();
});
$app['controllers.user'] = $app->factory(function () use ($app) {
    return new \English3\Controller\UserController($app['dbs']['mysql_read']);
});$app['controllers.usersupload'] = $app->factory(function () use ($app) {
    return new \English3\Controller\UploadUsersController($app['dbs']['mysql_read']);
});

$app['controllers.useractivity'] = $app->factory(function () use ($app) {
    return new \English3\Controller\UserActivityController($app['dbs']['mysql_read']);
});
$app['controllers.attendance'] = $app->factory(function () use ($app) {
    return new \English3\Controller\AttendanceController($app['dbs']['mysql_read']);
});
$app['controllers.attendanceReport'] = $app->factory(function () use ($app) {
    return new \English3\Controller\Reports\StudentAttendanceReport($app['dbs']['mysql_read']);
});
$app['controllers.attendanceapproval'] = $app->factory(function () use ($app) {
    return new \English3\Controller\Attendance\AttendanceApproval($app['dbs']['mysql_read']);
});
$app['controllers.attendancesync'] = $app->factory(function () use ($app) {
    return new \English3\Controller\Attendance\AttendanceSync($app['dbs']['mysql_read']);
});
$app['controllers.attendancemissingchecker'] = $app->factory(function () use ($app) {
    return new \English3\Controller\Attendance\MissingAttendanceChecker($app['dbs']['mysql_read']);
});

$app['controllers.categories'] = $app->factory(function () use ($app) {
    return new \English3\Controller\SummaryCategoriesController($app['dbs']['mysql_read']);
});
$app['controllers.goals'] = $app->factory(function () use ($app) {
    return new \English3\Controller\GoalController($app['dbs']['mysql_read']);
});
$app['controllers.xlstest'] = $app->factory(function () use ($app) {
    return new \English3\Util\E3Excel\XLSTest($app['dbs']['mysql_read']);
});$app['controllers.gradesxlsexporter'] = $app->factory(function () use ($app) {
    return new \English3\Controller\Reports\GradesXLSExporter($app['dbs']['mysql_read']);
});
$app['controllers.performance'] = $app->factory(function () use ($app) {
    return new \English3\Controller\PerformanceEvaluationController($app['dbs']['mysql_read']);
});
$app['controllers.htmltemplate'] = $app->factory(function () use ($app) {
    return new \English3\Controller\HtmlmeglmsTemplateController($app['dbs']['mysql_read']);
});
$app['controllers.page'] = $app->factory(function () use ($app) {
    return new \English3\Controller\PageController($app['dbs']['mysql_read']);
});
$app['controllers.import_course'] = $app->factory(function () use ($app) {
    return new \English3\Controller\ImportCourseController($app['dbs']['mysql_read']);
});
$app['controllers.upload_moodle'] = $app->factory(function () use ($app) {
    return new \English3\Controller\UploadMoodleController($app['dbs']['mysql_read']);
});
$app['controllers.powerschool'] = $app->factory(function () use ($app) {
    return new \English3\Controller\PowerSchoolController($app['dbs']['mysql_read']);
});
$app['controllers.finalgrades'] = $app->factory(function () use ($app) {
    return new \English3\Controller\Exports\FinalGradeExporter($app['dbs']['mysql_read']);
});
$app['controllers.attendanceexporter'] = $app->factory(function () use ($app) {
    return new \English3\Controller\Exports\AttendanceExporter($app['dbs']['mysql_read']);
});
$app['controllers.wordbank'] = $app->factory(function () use ($app) {
    return new \English3\Controller\PasswordBankController($app['dbs']['mysql_read']);
});
$app['controllers.session'] = $app->factory(function () use ($app) {
    return new \English3\Controller\SessionController($app['dbs']['mysql_read']);
});
$app['controllers.licenses'] = $app->factory(function () use ($app) {
    return new \English3\Controller\LicensesController($app['dbs']['mysql_read']);
});
$app['controllers.group'] = $app->factory(function () use ($app) {
    return new \English3\Controller\GroupController($app['dbs']['mysql_read']);
});
$app['controllers.notifications'] = $app->factory(function () use ($app) {
    return new \English3\Controller\NotificationsController($app['dbs']['mysql_read']);
});
$app['controllers.timed_review'] = $app->factory(function () use ($app) {
    return new \English3\Controller\TimedReviewController($app['dbs']['mysql_read']);
});
$app['controllers.timed_review_test'] = $app->factory(function () use ($app) {
    return new \English3\Controller\TimedReview\Test\TimedReviewTest($app['dbs']['mysql_read']);
});
$app['controllers.standard'] = $app->factory(function () use ($app) {
    return new \English3\Controller\StandardController($app['dbs']['mysql_read']);
});
$app['controllers.usermeta'] = $app->factory(function () use ($app) {
    return new \English3\Controller\UserMetaController($app['dbs']['mysql_read']);
});
$app['controllers.test'] = $app->factory(function () use ($app) {
    return new \English3\Controller\ProficiencyTest\TestApi($app['dbs']['mysql_read']);
});
$app['controllers.testscoreranges'] = $app->factory(function () use ($app) {
    return new \English3\Controller\ProficiencyTest\ScoreRange\Category($app['dbs']['mysql_read']);
});
$app['controllers.testscorerangeslevel'] = $app->factory(function () use ($app) {
    return new \English3\Controller\ProficiencyTest\ScoreRange\Level($app['dbs']['mysql_read']);
});
$app['controllers.testschools'] = $app->factory(function () use ($app) {
    return new \English3\Controller\ProficiencyTest\TestSchools($app['dbs']['mysql_read']);
});
$app['controllers.testschoolsadmins'] = $app->factory(function () use ($app) {
    return new \English3\Controller\ProficiencyTest\TestSchoolsAdmins($app['dbs']['mysql_read']);
});
$app['controllers.testschoolssubmitted'] = $app->factory(function () use ($app) {
    return new \English3\Controller\ProficiencyTest\TestSchoolsSubmitted($app['dbs']['mysql_read']);
});
$app['controllers.test_paymentReceived'] = $app->factory(function () use ($app) {
    return new \English3\Controller\ProficiencyTest\PaymentReceived($app['dbs']['mysql_read']);
});
$app['controllers.test_completed'] = $app->factory(function () use ($app) {
    return new \English3\Controller\ProficiencyTest\Mailer\EmailCompletedTest($app['dbs']['mysql_read']);
});
$app['controllers.testclasses'] = $app->factory(function () use ($app) {
    return new \English3\Controller\ProficiencyTest\TestClasses($app['dbs']['mysql_read']);
});

$app['controllers.classmeta'] = $app->factory(function () use ($app) {
    return new \English3\Controller\ClassMetaController($app['dbs']['mysql_read']);
});

$app['controllers.rubric'] = $app->factory(function () use ($app) {
    return new \English3\Controller\RubricsController($app['dbs']['mysql_read']);
});
$app['controllers.teacherresponses'] = $app->factory(function () use ($app) {
    return new \English3\Controller\TeacherResponsesController($app['dbs']['mysql_read']);
});
$app['controllers.testbank'] = $app->factory(function () use ($app) {
    return new \English3\Controller\TestbankController($app['dbs']['mysql_read']);
});
$app['controllers.quiz'] = $app->factory(function () use ($app) {
    return new \English3\Controller\QuizController($app['dbs']['mysql_read']);
});
$app['controllers.question'] = $app->factory(function () use ($app) {
    return new \English3\Controller\QuestionController($app['dbs']['mysql_read']);
});
$app['controllers.calculatedsimplequestion'] = $app->factory(function () use ($app) {
    return new \English3\Controller\QuizzesAndQuestions\Questions\Calculated\CalculatedSimple\CalculatedSimpleAPI($app['dbs']['mysql_read']);
});
$app['controllers.calculatedmultiquestion'] = $app->factory(function () use ($app) {
    return new \English3\Controller\QuizzesAndQuestions\Questions\Calculated\CalculatedMultiChoice\CalculatedMultiChoiceAPI($app['dbs']['mysql_read']);
});
$app['controllers.questiontags'] = $app->factory(function () use ($app) {
    return new \English3\Controller\QuizzesAndQuestions\QuestionTags\QuestionTags($app['dbs']['mysql_read']);
});
$app['controllers.glossarytags'] = $app->factory(function () use ($app) {
    return new \English3\Controller\Glossary\Tags\GlossaryTags($app['dbs']['mysql_read']);
});
$app['controllers.glossarywords'] = $app->factory(function () use ($app) {
    return new \English3\Controller\Glossary\Words\GlossaryWords($app['dbs']['mysql_read']);
});
$app['controllers.glossaryimport'] = $app->factory(function () use ($app) {
    return new \English3\Controller\Glossary\Import\GlossaryImport($app['dbs']['mysql_read']);
});
$app['controllers.glossary'] = $app->factory(function () use ($app) {
    return new \English3\Controller\Glossary\Glossary($app['dbs']['mysql_read']);
});
$app['controllers.clone'] = $app->factory(function () use ($app) {
    return new \English3\Controller\CloneController($app['dbs']['mysql_read']);
});
$app['controllers.importbinlog'] = $app->factory(function () use ($app) {
    return new \English3\Bin\ImportBinLog\ImportBinLog($app['dbs']['mysql_read']);
});
$app['controllers.exportbinlog'] = $app->factory(function () use ($app) {
    return new \English3\Bin\ExportBinLog\ExportBinLog($app['dbs']['mysql_read']);
});
$app['controllers.menu'] = $app->factory(function () use ($app) {
    return new \English3\Controller\MenuController($app['dbs']['mysql_read']);
});
$app['controllers.announcements'] = $app->factory(function () use ($app) {
    return new \English3\Controller\AnnouncementsController($app['dbs']['mysql_read']);
});
$app['controllers.organization'] = $app->factory(function () use ($app) {
    return new \English3\Controller\Organization\OrganizationController($app['dbs']['mysql_read']);
});
$app['controllers.site'] = $app->factory(function () use ($app) {
    return new \English3\Controller\SiteController($app['dbs']['mysql_read']);
});
$app['controllers.siteadmin'] = $app->factory(function () use ($app) {
    return new \English3\Controller\Admin\SiteAdmin($app['dbs']['mysql_read']);
});
$app['controllers.superunits'] = $app->factory(function () use ($app) {
    return new \English3\Controller\Classes\ClassSuperUnits();
});
$app['controllers.superunit'] = $app->factory(function () use ($app) {
    return new \English3\Controller\Classes\SuperUnitAPI();
});
$app['controllers.department'] = $app->factory(function () use ($app) {
    return new \English3\Controller\DepartmentController($app['dbs']['mysql_read']);
});
$app['controllers.gradebook'] = $app->factory(function () use ($app) {
    return new \English3\Controller\GradebookController($app['dbs']['mysql_read']);
});
$app['controllers.gradebookcontrollercategories'] = $app->factory(function () use ($app) {
    return new \English3\Controller\Gradebook\GradebookControllerCategories($app['dbs']['mysql_read']);
});
$app['controllers.gradebookcategories'] = $app->factory(function () use ($app) {
    return new \English3\Controller\Gradebook\GradebookCategories($app['dbs']['mysql_read']);
});
$app['controllers.journal'] = $app->factory(function () use ($app) {
    return new \English3\Controller\JournalController($app['dbs']['mysql_read']);
});
$app['controllers.reprocessvideo'] = $app->factory(function () use ($app) {
    return new \English3\Controller\VideoRecorder\ReprocessVideos($app['dbs']['mysql_read']);
});
$app['controllers.coursedescription'] = $app->factory(function () use ($app) {
    return new \English3\Controller\Pages\CourseDescription($app['dbs']['mysql_read']);
});
if (preg_match('@/api/reprocess-videos@',@$_SERVER['REQUEST_URI'])){
    $app->post('/api/reprocess-videos/append-prompts',[$app['controllers.reprocessvideo'],'appendPromptsFromData']);
    $app->get('/api/reprocess-videos/append-prompts/{failId}',[$app['controllers.reprocessvideo'],'appendPrompts']);
    $app->post('/api/reprocess-videos',[$app['controllers.reprocessvideo'],'reprocess']);
}
if (preg_match('@/classmeta/@',@$_SERVER['REQUEST_URI'])){
$app->post('/classmeta/{id}',[$app['controllers.classmeta'],'save']);
$app->get('/classmeta/{id}',[$app['controllers.classmeta'], 'getMeta']);
$app->delete('/classmeta/{id}',[$app['controllers.classmeta'],'deleteMeta']);
}
else if (preg_match('@/api\/gradesxls@',@$_SERVER['REQUEST_URI'])) {
    $app->post('/api/gradesxls', [$app['controllers.gradesxlsexporter'], 'get']);
}
else if (preg_match('@/api\/journal@',@$_SERVER['REQUEST_URI'])) {
    $app->get('/api/journal/{id}', [$app['controllers.journal'], 'get']);
}
else if (preg_match('@/api\/departments@',@$_SERVER['REQUEST_URI'])) {
    $app->get('/api/departments', [$app['controllers.department'], 'getDepartments']);
    $app->get('/api/departments/{deptId}/users', [$app['controllers.department'], 'getUsers']);
}
else if (preg_match('@/api\/organizations\/.*\/departments@',@$_SERVER['REQUEST_URI'])) {
    $app->get('/api/organizations/{orgId}/departments', [$app['controllers.department'], 'getOrgDepartments']);
}
else if (preg_match('@/api\/?.*\/automated-alerts@',@$_SERVER['REQUEST_URI'])){
    $app->get('/api/automated-alerts/{alertId}/run', [$app['controllers.automatedalerts'], 'runAlert']);
    $app->post('/api/automated-alerts/{alertId}', [$app['controllers.automatedalerts'], 'update']);
    $app->delete('/api/automated-alerts/{alertId}', [$app['controllers.automatedalerts'], 'remove']);
    $app->post('/api/automated-alerts', [$app['controllers.automatedalerts'], 'save']);
    $app->get('/api/organizations/{orgId}/automated-alerts', [$app['controllers.automatedalerts'], 'queryOrgAlerts']);
}
else if (preg_match('@/api\/dashboard-report@',@$_SERVER['REQUEST_URI'])){
    $app->get('/api/dashboard-report/help', [$app['controllers.dashboardreport'], 'help']);
    $app->get('/api/dashboard-report/school', [$app['controllers.dashboardreport'], 'getBySchool']);
    $app->get('/api/dashboard-report', [$app['controllers.dashboardreport'], 'get']);


}
else if (preg_match('@/api\/compliance-dashboard@',@$_SERVER['REQUEST_URI'])){
    $app['controllers.compliancedashboard'] = $app->factory(function () use ($app) {
        return new \English3\Controller\Organization\ComplianceDashboard($app['dbs']['mysql_read']);
    });
    $app->get('/api/compliance-dashboard/classes', [$app['controllers.compliancedashboard'], 'getClassesResponse']);
    $app->get('/api/compliance-dashboard/classes/{classId}', [$app['controllers.compliancedashboard'], 'getClassResponse']);
    $app->get('/api/compliance-dashboard/users', [$app['controllers.compliancedashboard'], 'getUsersResponse']);
    $app->get('/api/compliance-dashboard/users/{userId}', [$app['controllers.compliancedashboard'], 'getUserResponse']);


}
else if (preg_match('@/api\/reports\/org\/all@',@$_SERVER['REQUEST_URI'])){
    $app->put('/api/reports/org/all', [$app['controllers.reports'], 'updateAll']);
}
else if (preg_match('@/api\/reports@',@$_SERVER['REQUEST_URI'])){
    $app->put('/api/reports/org/{orgId}', [$app['controllers.reports'], 'update']);
    $app->post('/api/reports/dept/{deptId}', [$app['controllers.reports'], 'updateDepartment']);
    $app->get('/api/reports/org/{orgId}', [$app['controllers.enabledreports'], 'apiLoad']);
    $app->get('/api/reports/1', [$app['controllers.reports'], 'getReport1']);
    $app->get('/api/reports/2', [$app['controllers.reports'], 'getReport2']);
    $app->get('/api/reports/3', [$app['controllers.reports'], 'getReport3']);
    $app->get('/api/reports/4', [$app['controllers.reports'], 'getReport4']);
    $app->get('/api/reports/students', [$app['controllers.reports'], 'getReportStudents']);
    $app->get('/api/reports/perc-behind-dist', [$app['controllers.reports'], 'getStudentProgressDistribution']);
    $app->get('/api/reports/class-summary', [$app['controllers.reports'], 'getClassSummary']);
    $app->get('/api/reports/time-spent/{classId}', [$app['controllers.reports'], 'getTimeSpentInCourse']);
    $app->get('/api/reports/different-pages/{classId}', [$app['controllers.reports'], 'getDifferentPagesViewed']);
    $app->get('/api/reports/posts-per-student/{classId}', [$app['controllers.reports'], 'getPostsPerStudent']);
    $app->get('/api/reports/notloggedin', [$app['controllers.reports'], 'hasNotLoggedIn']);
    $app->post('/api/reports/export/activity', [$app['controllers.reports'], 'exportActivityReport']);
}

else if (preg_match('@/api\/organizations\/.*\/advisors@',@$_SERVER['REQUEST_URI'])) {
    $app->get('/api/organizations/{orgId}/advisors',[$app['controllers.organization'], 'getAdvisors']);
}
else if (preg_match('@/api\/organizations\/.*\/sites@',@$_SERVER['REQUEST_URI'])) {
    $app->get('/api/organizations/{orgId}/sites', [$app['controllers.site'], 'getOrgSites']);
    $app->post('/api/organizations/{orgId}/sites', [$app['controllers.site'], 'create']);
    $app->put('/api/organizations/{orgId}/sites', [$app['controllers.site'], 'update']);
    $app->put('/api/organizations/{orgId}/sites/blackouts', [$app['controllers.site'], 'updateBlackoutDates']);
}
else if (preg_match('@/api\/organizations\/.*\/announcements@',@$_SERVER['REQUEST_URI'])) {
    $app->get('/api/organizations/{orgid}/announcements',[$app['controllers.announcements'],'query']);
    $app->get('/api/organizations/{orgid}/announcements/general',[$app['controllers.announcements'],'queryGeneralAnnouncements']);
    $app->get('/api/organizations/{orgid}/announcements/class/{classid}',[$app['controllers.announcements'],'queryClassAnnouncements']);
    $app->post('/api/organizations/{orgid}/announcements',[$app['controllers.announcements'],'create']);
    $app->put('/api/organizations/{orgid}/announcements/{id}',[$app['controllers.announcements'],'update']);
    $app->post('/api/organizations/{orgid}/announcements/{id}/viewed',[$app['controllers.announcements'],'viewed']);
    $app->delete('/api/organizations/{orgid}/announcements/{id}',[$app['controllers.announcements'],'delete']);
    $app->get('/api/organizations/{orgid}/announcements/{id}/students',[$app['controllers.announcements'],'loadStudents']);
}
else if (preg_match('@/api\/organizations\/.*\/exports/final-grades@',@$_SERVER['REQUEST_URI'])) {
    $app->get('/api/organizations/{orgId}/exports/final-grades/download',[$app['controllers.finalgrades'], 'download']);
    $app->get('/api/organizations/{orgId}/exports/final-grades/history',[$app['controllers.finalgrades'], 'history']);
    $app->get('/api/organizations/{orgId}/exports/final-grades/pending',[$app['controllers.finalgrades'], 'pending']);
    $app->post('/api/organizations/{orgId}/exports/final-grades',[$app['controllers.finalgrades'], 'export']);
}
else if (preg_match('@/api\/organizations\/.*\/exports/attendance@',@$_SERVER['REQUEST_URI'])) {
    $app->get('/api/organizations/{orgId}/exports/attendance/download',[$app['controllers.attendanceexporter'], 'download']);
    $app->get('/api/organizations/{orgId}/exports/attendance/history',[$app['controllers.attendanceexporter'], 'history']);
    $app->get('/api/organizations/{orgId}/exports/attendance/pending',[$app['controllers.attendanceexporter'], 'pending']);
    $app->get('/api/organizations/{orgId}/exports/attendance/test',[$app['controllers.attendanceexporter'], 'test']);
    $app->post('/api/organizations/{orgId}/exports/attendance',[$app['controllers.attendanceexporter'], 'export']);
}
else if (preg_match('@/api\/organizations\/.*\/imports/@',@$_SERVER['REQUEST_URI'])) {
    $app->post('/api/organizations/{orgId}/imports/powerschool',[$app['controllers.powerschool'], 'importFromJson']);

}
else if (preg_match('@/api\/organizations\/.*\/powerschool/@',@$_SERVER['REQUEST_URI'])) {
    $app->post('/api/organizations/{orgId}/powerschool/test',[$app['controllers.powerschool'], 'testSync']);
}
else if (preg_match('@/api\/organizations\/.*\/word-bank@',@$_SERVER['REQUEST_URI'])) {
    $app->get('/api/organizations/{orgId}/word-bank',[$app['controllers.wordbank'], 'allWords']);
    $app->get('/api/organizations/{orgId}/word-bank/random/{limit}',[$app['controllers.wordbank'], 'getRandomWords']);
    $app->post('/api/organizations/{orgId}/word-bank',[$app['controllers.wordbank'], 'addWord']);
    $app->delete('/api/organizations/{orgId}/word-bank/{wordId}',[$app['controllers.wordbank'], 'deleteWord']);
}
else if (preg_match('@/api\/organizations\/.*\/htmltemplate@',@$_SERVER['REQUEST_URI'])) {
    $app->get('/api/organizations/{orgid}/htmltemplate',[$app['controllers.htmltemplate'], 'getTemplates']);
}
else if (preg_match('@/api\/canvas-templates@',@$_SERVER['REQUEST_URI'])) {
    $app->get('/api/canvas-templates/{id}',[$app['controllers.canvastemplates'], 'load']);
    $app->get('/api/canvas-templates/{id}/properties',[$app['controllers.canvastemplates'], 'loadProperties']);
    $app->post('/api/canvas-templates/{id}/clone',[$app['controllers.canvastemplates'], '_clone']);
    $app->delete('/api/canvas-templates/{id}',[$app['controllers.canvastemplates'], 'remove']);
    $app->get('/api/canvas-templates',[$app['controllers.canvastemplates'], 'loadAll']);
    $app->post('/api/canvas-templates',[$app['controllers.canvastemplates'], 'save']);
}
else if (preg_match('@/api\/organizations/@',@$_SERVER['REQUEST_URI'])) {
    $app->get('/api/organizations/{id}',[$app['controllers.organization'],'get']);
    $app->post('/api/organizations/{id}',[$app['controllers.organization'],'update']);
    $app->post('/api/organizations/{id}/preferences',[$app['controllers.organization'],'updatePreferences']);
    $app->get('/api/organizations/{orgId}/users', [$app['controllers.organization'], 'getUsers']);
    $app->get('/api/organizations/{orgId}/classes', [$app['controllers.organization'], 'getClasses']);
    $app->get('/api/organizations/{id}/quizzes',[$app['controllers.quiz'],'getOrgQuizzes']);
    $app->get('/api/organizations/{id}/posts/needing-grade', [$app['controllers.posts'], 'needingGradeForOrg']);
    $app->put('/api/organizations/{id}/pagepermissions',[$app['controllers.organization'],'updatePagePermissions']);
    $app->put('/api/organizations/{orgId}/blackouts', [$app['controllers.organization'], 'updateBlackoutDates']);
    $app->get('/api/organizations/{orgId}/rubrics', [$app['controllers.rubric'], 'getOrgRubrics']);
}
else if (preg_match('@/api\/sites/@',@$_SERVER['REQUEST_URI'])) {
    $app->put('/api/sites/{id}/blackouts', [$app['controllers.site'], 'updateBlackoutDates']);
    $app->post('/api/sites/{siteId}/admins', [$app['controllers.siteadmin'], 'save']);
    $app->delete('/api/sites/{siteId}/admins/{userId}', [$app['controllers.siteadmin'], 'remove']);
    $app->get('/api/sites/{siteId}/admins', [$app['controllers.siteadmin'], 'getUsersForSite']);

}
else if (preg_match('@/api\/rubrics@',@$_SERVER['REQUEST_URI'])) {
    $app->get('/api/rubrics', [$app['controllers.rubric'], 'getRubrics']);
}
else if (preg_match('@/api/timed-review/@',@$_SERVER['REQUEST_URI'])){
    $app->post('/api/timed-review/groups/{id}', [$app['controllers.timed_review'], 'saveGroup']);
    $app->post('/api/timed-review/prompts/{id}', [$app['controllers.timed_review'], 'savePrompt']);
    $app->post('/api/timed-review/prompts/{id}/move', [$app['controllers.timed_review'], 'movePrompt']);
    $app->delete('/api/timed-review/prompts/{id}', [$app['controllers.timed_review'], 'removePrompt']);
    $app->delete('/api/timed-review/groups/{id}', [$app['controllers.timed_review'], 'removeGroup']);
    $app->get('/api/timed-review/groups', [$app['controllers.timed_review'], 'getGroups']);
    $app->get('/api/timed-review/groups/{id}', [$app['controllers.timed_review'], 'getGroup']);

}
else if (preg_match('@/timed_review/@',@$_SERVER['REQUEST_URI'])){
    $app->get('/timed_review/{page_id}', [$app['controllers.timed_review'], 'getTimedReviewForPage'])
        ->convert('page_id', function ($page_id) {
            return (int)$page_id;
        });

    $app->post('/timed_review/{page_id}/post', [$app['controllers.timed_review'], 'postOnTimedReview']);
}
else if (preg_match('@/api/timed_reviews/@',@$_SERVER['REQUEST_URI'])){
    $app->get('/api/timed_reviews/test', [$app['controllers.timed_review_test'], 'run']);
}
else if (preg_match('@/timed_reviews/@',@$_SERVER['REQUEST_URI'])){

    $app->get('/timed_reviews/{id}', [$app['controllers.timed_review'], 'getTimedReview']);
    $app->get('/timed_reviews/', [$app['controllers.timed_review'], 'getTimedReviews']);
    $app->post('/timed_reviews/{review_id}', [$app['controllers.timed_review'], 'updateTimedReview']);
    $app->delete('/timed_reviews/{id}', [$app['controllers.timed_review'], 'deleteTimedReview']);
    $app->post('/timed_reviews/', [$app['controllers.timed_review'], 'createTimedReview']);

}

else if (preg_match('@/standards/@',@$_SERVER['REQUEST_URI'])){
    $app->post('/standards/{org}', [$app['controllers.standard'], 'createStandard']);
    $app->get('/standards/{org}/{id}', [$app['controllers.standard'], 'getStandard']);
    $app->get('/standards/{org}', [$app['controllers.standard'], 'getStandards']);
    $app->delete('/standards/{id}', [$app['controllers.standard'], 'deleteStandard']);
    $app->post('/standards/{org}/{id}', [$app['controllers.standard'], 'updateStandard']);
}
else if (preg_match('@/standard-links@',@$_SERVER['REQUEST_URI'])){
    $app->post('/standard-links', [$app['controllers.standard'], 'linkStandard']);
    $app->delete('/standard-links', [$app['controllers.standard'], 'unlinkStandard']);
    $app->get('/standard-links', [$app['controllers.standard'], 'linkedStandard']);

}
else if (preg_match('@/usermeta/@',@$_SERVER['REQUEST_URI'])){
    $app->post('/usermeta/{id}', [$app['controllers.usermeta'], 'save']);
    $app->get('/usermeta/{id}', [$app['controllers.usermeta'], 'getMeta']);
    $app->delete('/usermeta/{id}', [$app['controllers.usermeta'], 'deleteMeta']);
}
else if (preg_match('@/rubrics/@',@$_SERVER['REQUEST_URI'])){
    $app->post('/rubrics/{org}', [$app['controllers.rubric'], 'createRubric']);
    $app->get('/rubrics/{id}', [$app['controllers.rubric'], 'getRubric']);

    $app->delete('/rubrics/{id}', [$app['controllers.rubric'], 'deleteRubric']);
    $app->post('/rubrics/{org}/{id}', [$app['controllers.rubric'], 'updateRubric']);
}
else if (preg_match('@/rubric-grades@',@$_SERVER['REQUEST_URI'])){
    $app->get('/rubric-grades', [$app['controllers.rubric'], 'getGradeRubric']);
    $app->post('/rubric-grades', [$app['controllers.rubric'], 'saveGradeRubric']);

}
else if (preg_match('@/fix@',@$_SERVER['REQUEST_URI'])){
    $app->get('/fix/quizzes/{pageId}', [$app['controllers.quiz'], 'fixAttemptIssue']);

}
else if (preg_match('@/classes\/.*\/assignments@',@$_SERVER['REQUEST_URI'])) {
    $app->get('/classes/{classId}/assignments', [$app['controllers.classes'], 'getAssignments']);
    $app->get('/classes/{classId}/assignments/exempts/{userId}', [$app['controllers.exemptedassignments'], 'getExemptsForUser']);
    $app->get('/classes/{classId}/assignments/{assignmentId}/exempts', [$app['controllers.exemptedassignments'], 'getExempts']);
    $app->put('/classes/{classId}/assignments/{assignmentId}/exempts', [$app['controllers.exemptedassignments'], 'updateExempts']);
    $app->post('/classes/{classId}/assignments/exempts/{userId}', [$app['controllers.exemptedassignments'], 'updateExemptPages']);
    $app->post('/classes/{classId}/assignments/{assignmentId}/exempts/{userId}', [$app['controllers.exemptedassignments'], 'exemptUser']);
    $app->delete('/classes/{classId}/assignments/{assignmentId}/exempts/{userId}', [$app['controllers.exemptedassignments'], 'unexemptUser']);
}
else if (preg_match('@/classes\/.*\/super-units@',@$_SERVER['REQUEST_URI'])) {
    $app->get('/classes/{classId}/super-units', [$app['controllers.superunits'], 'getSuperUnitsReq']);

}
else if (preg_match('@/api/classes\/.*\/forum/notifications@',@$_SERVER['REQUEST_URI'])) {
    $app['controllers.forumNotifications'] = $app->factory(function () use ($app) {
        return new \English3\Controller\Forum\ForumNotifications($app['dbs']['mysql_read']);
    });
    $app->get('/api/classes/{classId}/forum/notifications', [$app['controllers.forumNotifications'], 'load']);
}
else if (preg_match('@/api/grader/forum@',@$_SERVER['REQUEST_URI'])) {
    $app['controllers.forum'] = $app->factory(function () use ($app) {
        return new \English3\Controller\Forum\ForumGraderAPI($app['dbs']['mysql_read']);
    });
    $app->get('/api/grader/forum/all/{courseId}', [$app['controllers.forum'], 'loadStudentPostsForClass']);
    $app->get('/api/grader/forum/{pageId}', [$app['controllers.forum'], 'loadStudentPosts']);
    $app->get('/api/grader/forum/topic/{topicId}/{userId}', [$app['controllers.forum'], 'loadUserTopicPosts']);
    $app->post('/api/grader/forum/post/{postId}/{userId}', [$app['controllers.forum'], 'gradePost']);
    $app->post('/api/grader/forum/{forumId}/{userId}', [$app['controllers.forum'], 'gradeForum']);
}
else if (preg_match('@/api/classes\/.*\/forum@',@$_SERVER['REQUEST_URI'])) {
    $app['controllers.forum'] = $app->factory(function () use ($app) {
        return new \English3\Controller\Forum\Forum($app['dbs']['mysql_read']);
    });
    $app->get('/api/classes/{classId}/forum', [$app['controllers.forum'], 'loadForums']);
    $app->post('/api/classes/{classId}/forum', [$app['controllers.forum'], '_createForum']);
    $app->get('/api/classes/{classId}/forum/{id}/participants', [$app['controllers.forum'], 'loadParticipants']);
    $app->post('/api/classes/{classId}/forum/post', [$app['controllers.forum'], 'savePost']);
    $app->put('/api/classes/{classId}/forum/post', [$app['controllers.forum'], 'editPost']);
    $app->delete('/api/classes/{classId}/forum/post/{id}', [$app['controllers.forum'], 'deletePost']);
    $app->get('/api/classes/{classId}/forum/{pageId}/topics', [$app['controllers.forum'], 'loadTopics']);
    $app->post('/api/classes/{classId}/forum/{forumId}/settings', [$app['controllers.forum'], '_saveSettings']);
    $app->post('/api/classes/{classId}/forum/{forumId}/settings/{userId}', [$app['controllers.forum'], '_saveUserSettings']);
    $app->get('/api/classes/{classId}/forum/topic/{id}', [$app['controllers.forum'], 'loadTopic']);
    $app->get('/api/classes/{classId}/forum/topic/{id}/export', [$app['controllers.forum'], 'exportTopic']);
}

else if (preg_match('@/classes\/.*\/has-timed-review@',@$_SERVER['REQUEST_URI'])) {
    $app->get('/classes/{classId}/has-timed-review', [$app['controllers.classes'], 'hasTimedReview']);

}
else if (preg_match('@/api/super-unit@',@$_SERVER['REQUEST_URI'])) {
    $app->post('/api/super-unit', [$app['controllers.superunit'], 'create']);
    $app->post('/api/super-unit/{id}', [$app['controllers.superunit'], 'update']);
    $app->get('/api/super-unit/{id}', [$app['controllers.superunit'], 'get']);
    $app->delete('/api/super-unit/{id}', [$app['controllers.superunit'], 'delete']);
}
else if (preg_match('@/api/gradebook@',@$_SERVER['REQUEST_URI'])) {
    $app->get('/api/gradebook/download/xls', [$app['controllers.gradesxlsexporter'], 'get']);
    $app->post('/api/gradebook/download', [$app['controllers.gradebook'], 'downloadAsCsv']);


}
else if (preg_match('@/api/export@',@$_SERVER['REQUEST_URI'])) {
    $app['controllers.tableofcontents'] = $app->factory(function () use ($app) {
        return new \English3\Controller\Exports\TableContentsExporter($app['dbs']['mysql_read']);
    });
    $app->post('/api/export/table-of-contents', [$app['controllers.tableofcontents'], 'writeFile']);

}
else if (preg_match('@/api/progress-report@',@$_SERVER['REQUEST_URI'])){
    $app->post('/api/progress-report/send-email', [$app['controllers.gradebook'], 'sendReportToUsers']);
}
else if (preg_match('@/classes\/.*\/gradebook@',@$_SERVER['REQUEST_URI'])) {
    $app->get('/classes/{classId}/gradebook/categories', [$app['controllers.gradebookcategories'], 'load']);
    $app->post('/classes/{classId}/gradebook/categories', [$app['controllers.gradebookcategories'], 'save']);
    $app->post('/classes/{classId}/gradebook', [$app['controllers.gradebook'], 'recalculateClass']);
    $app->get('/classes/{classId}/gradebook', [$app['controllers.gradebook'], 'get']);

}
else if (preg_match('@/api\/proficiency-test\/?.*\/score-ranges@',@$_SERVER['REQUEST_URI'])) {
    $app->get('/api/proficiency-test/{testId}/score-ranges', [$app['controllers.testscoreranges'], 'getAll']);
    $app->delete('/api/proficiency-test/score-ranges/{id}', [$app['controllers.testscoreranges'], 'remove']);
    $app->post('/api/proficiency-test/{testId}/score-ranges', [$app['controllers.testscoreranges'], 'save']);
    $app->post('/api/proficiency-test/score-ranges/{categoryId}/level', [$app['controllers.testscorerangeslevel'], 'save']);
    $app->delete('/api/proficiency-test/score-ranges/level/{id}', [$app['controllers.testscorerangeslevel'], 'remove']);
}
else if (preg_match('@/api\/proficiency-test\/school\/.*\/admin@',@$_SERVER['REQUEST_URI'])) {
    $app->get('/api/proficiency-test/school/{schoolId}/admin', [$app['controllers.testschoolsadmins'], 'getAdmins']);
    $app->post('/api/proficiency-test/school/{schoolId}/admin/{userId}', [$app['controllers.testschoolsadmins'], 'addAdmin']);
    $app->delete('/api/proficiency-test/school/{schoolId}/admin/{userId}', [$app['controllers.testschoolsadmins'], 'removeAdmin']);
}
else if (preg_match('@/api\/proficiency-test\/school\/.*\/submitted@',@$_SERVER['REQUEST_URI'])) {
    $app->get('/api/proficiency-test/school/{schoolId}/submitted', [$app['controllers.testschoolssubmitted'], 'getTests']);
    $app->post('/api/proficiency-test/school/{schoolId}/submitted/{userId}', [$app['controllers.testschoolssubmitted'], 'addTest']);
    $app->delete('/api/proficiency-test/school/{schoolId}/submitted/{userId}/{testId}', [$app['controllers.testschoolssubmitted'], 'removeTest']);
}
else if (preg_match('@/api\/proficiency-test\/school@',@$_SERVER['REQUEST_URI'])) {
    $app->get('/api/proficiency-test/school/{id}', [$app['controllers.testschools'], 'get']);
    $app->get('/api/proficiency-test/school', [$app['controllers.testschools'], 'query']);
    $app->post('/api/proficiency-test/school/{id}', [$app['controllers.testschools'], 'save']);
    $app->delete('/api/proficiency-test/school/{id}', [$app['controllers.testschools'], 'delete']);
}
else if (preg_match('@/api\/proficiency-test\/@',@$_SERVER['REQUEST_URI'])) {

    $app->post('/api/proficiency-test/new-user', [$app['controllers.test_paymentReceived'], 'createUserIfNeeded']);
    $app->post('/api/proficiency-test/user/{userId}/completed/{classId}', [$app['controllers.test_completed'], 'studentCompletedTest']);
    $app->post('/api/proficiency-test/enrollment', [$app['controllers.test_paymentReceived'], 'enrollUserIfNeeded']);
    $app->get('/api/proficiency-test/checkemail', [$app['controllers.test_paymentReceived'], 'checkEmail']);
    $app->post('/api/proficiency-test/new-attempt', [$app['controllers.test_paymentReceived'], 'createNewAttempt']);
}
else if (preg_match('@/api\/test\/@',@$_SERVER['REQUEST_URI'])) {
    $app->get('/api/test/classes', [$app['controllers.test'], 'getClasses']);
    $app->delete('/api/test/classes/{classId}', [$app['controllers.testclasses'], 'removeClass']);
    $app->post('/api/test/classes/{classId}/tag', [$app['controllers.testclasses'], 'saveTag']);
    $app->post('/api/test/classes', [$app['controllers.testclasses'], 'addClass']);
    $app->post('/api/test/{groupId}/admins/{userId}', [$app['controllers.test'], 'addTestAdmin']);
    $app->delete('/api/test/{groupId}/admins/{userId}', [$app['controllers.test'], 'removeTestAdmin']);
    $app->get('/api/test/status', [$app['controllers.test'], 'checkTestStatus']);
    $app->post('/api/test/{classId}/export', [$app['controllers.test'], 'exportClass']);
    $app->post('/api/test/export', [$app['controllers.test'], 'export']);

    $app->post('/api/test/share-results', [$app['controllers.test'], 'send']);

    $app->get('/api/test/{studentId}', [$app['controllers.test'], 'get']);
    $app->get('/api/test/{studentId}/all', [$app['controllers.test'], 'all']);
    $app->get('/api/test/{studentId}/submission', [$app['controllers.test'], 'getSubmission']);

}
else if (preg_match('@/api\/e3pt\/@',@$_SERVER['REQUEST_URI'])) {
    $app->get('/api/e3pt/export', [$app['controllers.test'], 'exportE3PT']);
}
else if (preg_match('@/api\/user\/.*\/sites-admin@',@$_SERVER['REQUEST_URI'])) {
    $app->get('/api/user/{userId}/sites-admin', [$app['controllers.siteadmin'], 'getSitesForUser']);
    $app->delete('/api/user/{userId}/sites-admin', [$app['controllers.siteadmin'], 'removeAllSitesFromUser']);
}
else if (preg_match('@/api\/user\/.*\/gradebook@',@$_SERVER['REQUEST_URI'])) {
    $app->get('/api/user/{userId}/gradebook-categories', [$app['controllers.gradebookcontrollercategories'], 'getForUser']);
    $app->get('/api/user/{userId}/gradebook', [$app['controllers.gradebook'], 'getForUser']);

}
else if (preg_match('@/api\/user\/websocket-token@',@$_SERVER['REQUEST_URI'])) {
    $app->get('/api/user/websocket-token',[$app['controllers.user'],'getWebsocketToken']);
}
else if (preg_match('@/api\/user\/.*\/progress-report@',@$_SERVER['REQUEST_URI'])) {
    $app->get('/api/user/{userId}/progress-report', [$app['controllers.gradebook'], 'getProgressReportForUser']);
}
else if (preg_match('@/classes\/.*\/progress-report@',@$_SERVER['REQUEST_URI'])) {
    $app->get('/classes/{classId}/progress-report', [$app['controllers.gradebook'], 'getProgressReport']);
    $app->get('/classes/{classId}/progress-report/{userId}', [$app['controllers.gradebook'], 'getProgressReportForUserClass']);
    $app->get('/classes/{id}/progress-report/csv/{date}', [$app['controllers.gradebook'], 'getHistoryProgressReportCsv']);
    $app->get('/classes/{id}/progress-report/csv', [$app['controllers.gradebook'], 'getProgressReportCsv']);

}
else if (preg_match('@/classes\/.*\/groups@',@$_SERVER['REQUEST_URI'])) {
    $app->get('/classes/{classid}/groups', [$app['controllers.group'], 'getGroups']);
    $app->get('/classes/{classid}/groups/{groupid}', [$app['controllers.group'], 'getGroup']);

}
else if (preg_match('@/classes\/.*\/users@',@$_SERVER['REQUEST_URI'])) {

    $app->get('/classes/{id}/users', [$app['controllers.classes'], 'getClassUsers']);
    $app->delete('/classes/{classId}/users/{userId}', [$app['controllers.classes'], 'deleteUserData']);
}
else if (preg_match('@/classes\/.*\/durations@',@$_SERVER['REQUEST_URI'])) {
    $app->put('/classes/{classId}/durations', [$app['controllers.classes'], 'updateDurations']);
}

else if (preg_match('@/classes\/.*\/duration@',@$_SERVER['REQUEST_URI'])) {
    $app->get('/classes/{classId}/duration/{userId}', [$app['controllers.userclassduration'], 'getClassDuration']);
    $app->post('/classes/{classId}/duration/{userId}', [$app['controllers.userclassduration'], 'updateClassDuration']);
}
else if (preg_match('@/api/classes\/.*\/user@',@$_SERVER['REQUEST_URI'])) {
    $app->get('/api/classes/{classId}/user/{userId}/dates', [$app['controllers.userclass'], 'getStartEndDate']);
    $app->post('/api/classes/{classId}/user/{userId}/dates', [$app['controllers.userclass'], 'saveStartEndDate']);
}
else if (preg_match('@/classes\/.*\/grades@',@$_SERVER['REQUEST_URI'])) {
    $app->post('/classes/{classId}/grades', [$app['controllers.classes'], 'finalizeGrades']);
    $app->get('/classes/{id}/grades', [$app['controllers.classes'], 'exportGrades']);
    $app->post('/classes/{id}/grades/import', [$app['controllers.classes'], 'importGrades']);
}

else if (preg_match('@/classes\/.*\/duedates@',@$_SERVER['REQUEST_URI'])) {
    $app->post('/classes/{classId}/duedates/{userId}', [$app['controllers.classes'], 'calculateDueDates']);
    $app->delete('/classes/{classId}/duedates/{userId}', [$app['controllers.classes'], 'unsetDueDates']);
}
else if (preg_match('@/classes\/.*\/csv@',@$_SERVER['REQUEST_URI'])) {
    $app->get('/classes/{id}/csv', [$app['controllers.classes'], 'getGradebookCSV']);
    $app->get('/classes/{id}/enrollment/csv', [$app['controllers.classes'], 'exportEnrollmentAsCsv']);
}

else if (preg_match('@/api\/classes/@',@$_SERVER['REQUEST_URI'])) {
    $app->get('/api/classes/advisees', [$app['controllers.classes'], 'getAdviseesClasses']);
    $app->get('/api/classes/{id}/menu', [$app['controllers.menu'], 'get']);
    $app->get('/api/classes/{classId}/passwords', [$app['controllers.classes'], 'getPasswords']);
    $app->post('/api/classes/{classId}/passwords', [$app['controllers.page'], 'updatePasswords']);
    $app->get('/api/classes/{id}/pages', [$app['controllers.classes'], 'getClassWithPages']);
    $app->get('/api/classes/{classId}/categories', [$app['controllers.categories'], 'getCategories']);
    $app->get('/api/classes/{id}/posts/needing-grade', [$app['controllers.posts'], 'needingGradeForClass']);
    $app->get('/api/classes/{classId}/posts/resubmissions', [$app['controllers.posts'], 'resubmissions']);
}
else if (preg_match('@/api/students-performance@',@$_SERVER['REQUEST_URI'])) {
    $app->post('/api/students-performance/update',[$app['controllers.performance'], 'updatePerformance']);
}
else if (preg_match('@/api/user\/.*\/students-performance@',@$_SERVER['REQUEST_URI'])) {
    $app->get('/api/user/{userId}/students-performance',[$app['controllers.performance'], 'getStudentsPerformance']);
    $app->get('/api/user/{userId}/students-performance/classes',[$app['controllers.performance'], 'getTeacherClasses']);
}
else if (preg_match('@/classes@',@$_SERVER['REQUEST_URI'])){
    $app->get('/classes', [$app['controllers.classes'], 'getClasses']);
    $app->get('/classes/{id}', [$app['controllers.classes'], 'getClasses']);
    $app->post('/classes/overrides', [$app['controllers.classes'], 'setScoreOverride']);
}
else if (preg_match('@/api/quiz@',@$_SERVER['REQUEST_URI'])){
    $app->get('/api/quiz/{id}',[$app['controllers.quiz'], 'get']);
}
else if (preg_match('@/api/questions/calculated-simple@',@$_SERVER['REQUEST_URI'])){
    $app->get('/api/questions/calculated-simple/validate',[$app['controllers.calculatedsimplequestion'], 'validateAndFindParameters']);
    $app->get('/api/questions/calculated-simple/generate',[$app['controllers.calculatedsimplequestion'], 'generateSets']);
    $app->get('/api/questions/calculated-simple/calculate',[$app['controllers.calculatedsimplequestion'], 'calculateSet']);

}
else if (preg_match('@/api/questions/calculated-multi@',@$_SERVER['REQUEST_URI'])){
    $app->post('/api/questions/calculated-multi/validate',[$app['controllers.calculatedmultiquestion'], 'validateAndFindParameters']);
    $app->post('/api/questions/calculated-multi/generate',[$app['controllers.calculatedmultiquestion'], 'generateSets']);
    $app->post('/api/questions/calculated-multi/calculate',[$app['controllers.calculatedmultiquestion'], 'calculateSet']);
}
else if (preg_match('@/api/questions\/?.*\/tags@',@$_SERVER['REQUEST_URI'])){
    $app->post('/api/questions/{id}/tags',[$app['controllers.questiontags'], 'saveQuestionTags']);
    $app->post('/api/questions/tags',[$app['controllers.questiontags'], 'create']);
    $app->get('/api/questions/tags/filter',[$app['controllers.questiontags'], 'queryQuestions']);
    $app->get('/api/questions/tags',[$app['controllers.questiontags'], 'query']);
}
else if (preg_match('@/api/questions@',@$_SERVER['REQUEST_URI'])){
    $app->get('/api/questions/checkBlank',[$app['controllers.question'], 'checkBlankQuestions']);
    $app->put('/api/questions',[$app['controllers.question'], 'update']);
    $app->get('/api/questions/{id}',[$app['controllers.question'], 'get']);
    $app->post('/api/questions/{id}/page-question',[$app['controllers.question'], 'gradePageQuestion']);
}

else if (preg_match('@/api/glossary\/?.*\/tags@',@$_SERVER['REQUEST_URI'])){
    $app->get('/api/glossary/{id}/tags',[$app['controllers.glossary'], 'getAvailableTags']);
    $app->post('/api/glossary/{id}/tags',[$app['controllers.glossarytags'], 'saveDefinitionTags']);
    $app->post('/api/glossary/tags',[$app['controllers.glossarytags'], 'create']);
    $app->put('/api/glossary/tags/{id}',[$app['controllers.glossarytags'], 'update']);
    $app->delete('/api/glossary/tags/{id}',[$app['controllers.glossarytags'], 'remove']);
    $app->get('/api/glossary/tags/authors',[$app['controllers.glossarytags'], 'getAuthors']);
    $app->get('/api/glossary/tags/filter',[$app['controllers.glossarytags'], 'queryWords']);
    $app->get('/api/glossary/tags',[$app['controllers.glossarytags'], 'query']);

}
else if (preg_match('@/api/glossary/import@',@$_SERVER['REQUEST_URI'])){
    $app->post('/api/glossary/import/upload',[$app['controllers.glossaryimport'], 'uploadFile']);
    $app->get('/api/glossary/import/upload/previous',[$app['controllers.glossaryimport'], 'getPreviousUploads']);
    $app->delete('/api/glossary/import/{id}',[$app['controllers.glossaryimport'], 'removeUploadedFile']);
    $app->post('/api/glossary/import/{id}',[$app['controllers.glossaryimport'], 'import']);
}
else if (preg_match('@/api/glossary/definitions@',@$_SERVER['REQUEST_URI'])){
    $app->post('/api/glossary/definitions/{id}',[$app['controllers.glossarywords'], 'updateDefinition']);
    $app->delete('/api/glossary/definitions/{id}',[$app['controllers.glossarywords'], 'deleteDefinition']);
}
else if (preg_match('@/api/glossary/words@',@$_SERVER['REQUEST_URI'])){
    $app->post('/api/glossary/words/{id}',[$app['controllers.glossarywords'], 'update']);
    $app->get('/api/glossary/words/authors',[$app['controllers.glossarywords'], 'getAuthors']);
    $app->get('/api/glossary/words/{id}',[$app['controllers.glossarywords'], 'get']);
    $app->delete('/api/glossary/words/{id}',[$app['controllers.glossarywords'], 'delete']);
    $app->post('/api/glossary/words',[$app['controllers.glossarywords'], 'create']);
    $app->get('/api/glossary/words',[$app['controllers.glossarywords'], 'query']);


}
else if (preg_match('@/api/glossary@',@$_SERVER['REQUEST_URI'])){
    $app->get('/api/glossary/{id}',[$app['controllers.glossary'], 'get']);
    $app->post('/api/glossary/{id}',[$app['controllers.glossary'], 'save']);
    $app->post('/api/glossary/{id}/remove',[$app['controllers.glossary'], 'remove']);
    $app->get('/api/glossary/{id}/link',[$app['controllers.glossary'], 'loadLinkOptions']);
    $app->post('/api/glossary/{id}/link',[$app['controllers.glossary'], 'saveLinkOptions']);
    $app->post('/api/glossary/{id}/process',[$app['controllers.glossary'], 'processWords']);
    $app->get('/api/glossary/{id}/toggle-definition',[$app['controllers.glossary'], 'toggleDefinition']);

}
else if (preg_match('@/api/attendance@',@$_SERVER['REQUEST_URI'])) {
    $app->post('/api/attendance/export',[$app['controllers.attendance'], 'export']);
    $app->get('/api/attendance/layouts',[$app['controllers.attendance'], 'getLayouts']);
    $app->get('/api/attendance/layouts/{id}',[$app['controllers.attendance'], 'getLayout']);
    $app->post('/api/attendance/layouts',[$app['controllers.attendance'], 'saveLayout']);
    $app->delete('/api/attendance/layouts/{id}',[$app['controllers.attendance'], 'deleteLayout']);
    $app->post('/api/attendance',[$app['controllers.attendance'], 'all']);
    $app->get('/api/attendance/missing/org/{orgId}/check',[$app['controllers.attendancemissingchecker'], 'check']);
    $app->get('/api/attendance/missing/org/{orgId}',[$app['controllers.attendancemissingchecker'], 'get']);
    $app->post('/api/attendance/missing/org/{orgId}',[$app['controllers.attendancemissingchecker'], 'update']);
    $app->post('/api/attendance/missing',[$app['controllers.attendance'], 'getMissing']);

    $app->get('/api/attendance/sync-history',[$app['controllers.attendancesync'], 'syncHistoryRequest']);
    $app->get('/api/attendance/queue',[$app['controllers.attendancesync'], 'syncQueue']);
}
else if (preg_match('@/api/user\/.*\/categories@',@$_SERVER['REQUEST_URI'])) {
    $app->get('/api/user/{userId}/categories',[$app['controllers.categories'], 'getUserClassesCategories']);
}

else if (preg_match('@/api/user\/.*\/goals@',@$_SERVER['REQUEST_URI'])) {
    $app->get('/api/user/{userId}/goals',[$app['controllers.goals'], 'getStudentGoals']);
    $app->post('/api/user/{userId}/goals',[$app['controllers.goals'], 'save']);
    $app->post('/api/user/{userId}/goals/{goalId}',[$app['controllers.goals'], 'markAsCompleted']);
    $app->post('/api/user/{userId}/goals/{goalId}/comment',[$app['controllers.goals'], 'saveComment']);
    $app->delete('/api/user/{userId}/goals/{goalId}',[$app['controllers.goals'], 'deleteGoal']);
}
else if (preg_match('@/api/user\/.*\/attendance@',@$_SERVER['REQUEST_URI'])) {
    $app->post('/api/user/{userId}/attendance',[$app['controllers.attendance'], 'save']);
    $app->get('/api/user/{userId}/attendance',[$app['controllers.attendance'], 'get']);
    $app->get('/api/user/{userId}/attendance/report',[$app['controllers.attendanceReport'], 'get']);
    $app->post('/api/user/{userId}/attendance/approved',[$app['controllers.attendanceapproval'], 'approveAttendancesRequest']);
    $app->get('/api/user/{userId}/attendance/approved',[$app['controllers.attendanceapproval'], 'getApprovedAttendancesRequest']);
}
else if (preg_match('@/api/user\/.*\/due_dates@',@$_SERVER['REQUEST_URI'])){
    $app->post('/api/user/{userId}/due_dates',[$app['controllers.userduedates'], 'setManualDueDatesFromRequest']);
}
else if (preg_match('@/api/user/me/alerts@',@$_SERVER['REQUEST_URI'])){
    $app->post('/api/user/me/alerts',[$app['controllers.useralerts'], 'save']);
    $app->get('/api/user/me/alerts',[$app['controllers.useralerts'], 'get']);
    $app->post('/api/user/me/alerts/load',[$app['controllers.useralerts'], 'loadAlert']);
    $app->post('/api/user/me/alerts/download',[$app['controllers.useralerts'], 'download']);
    $app->post('/api/user/me/alerts/log-access',[$app['controllers.useralerts'], 'logAccess']);
}
else if (preg_match('@/api/user@',@$_SERVER['REQUEST_URI'])){
    $app->get('/api/user',[$app['controllers.user'], 'getUser']);
    $app->get('/api/users',[$app['controllers.user'], 'getUsers']);
    $app->post('/api/users',[$app['controllers.user'], 'getSpecificUsers']);
    $app->post('/api/users/upload/{orgId}/preview',[$app['controllers.usersupload'], 'preview']);
    $app->post('/api/users/upload/{orgId}/import',[$app['controllers.usersupload'], 'import']);
    $app->get('/api/users/upload/template',[$app['controllers.usersupload'], 'template']);
    $app->get('/api/user/{id}',[$app['controllers.user'], 'getUser']);
    $app->put('/api/user/{id}',[$app['controllers.user'], 'updateUser']);
    $app->get('/api/user/{id}/history',[$app['controllers.useractivity'], 'get']);
    $app->get('/api/user/{id}/history/all',[$app['controllers.useractivity'], 'getAllHistoryForClass']);
    $app->get('/api/user/{id}/time-spent',[$app['controllers.useractivity'], 'getTotalTimeSpent']);
    $app->post('/api/user/{id}/menu',[$app['controllers.user'], 'setMenuPreference']);
    $app->post('/api/user/{id}/gradermenu',[$app['controllers.user'], 'setGraderMenuPreference']);
    $app->get('/api/user/{id}/students',[$app['controllers.user'], 'getStudents']);

}
else if (preg_match('@/pages\/.*\/versions@',@$_SERVER['REQUEST_URI'])){
    $app['controllers.pageversions'] = $app->factory(function () use ($app) {
        return new \English3\Controller\Pages\PageVersions($app['dbs']['mysql_read']);
    });
    $app->get('/api/pages/{id}/versions',[$app['controllers.pageversions'], 'load']);
    $app->post('/api/pages/{id}/versions',[$app['controllers.pageversions'], 'save']);
}
else if (preg_match('@/pages\/.*\/coursedescription@',@$_SERVER['REQUEST_URI'])){
    $app->get('/api/pages/{id}/coursedescription',[$app['controllers.coursedescription'], 'load']);
}
else if (preg_match('@/pages\/.*\/userinformation@',@$_SERVER['REQUEST_URI'])){
    $app['controllers.userinformation'] = $app->factory(function () use ($app) {
        return new \English3\Controller\Pages\UserInformation($app['dbs']['mysql_read']);
    });
    $app->get('/api/pages/{id}/userinformation',[$app['controllers.userinformation'], 'load']);
    $app->post('/api/pages/{id}/userinformation',[$app['controllers.userinformation'], 'save']);
}
else if (preg_match('@/pages/@',@$_SERVER['REQUEST_URI'])){

    $app->get('/api/pages/{id}',[$app['controllers.page'], 'get']);
    $app->get('/api/pages/{pageId}/attempts',[$app['controllers.quiz'], 'getAllAttempts']);
    $app->put('/api/pages/{id}/attempts/{userId}',[$app['controllers.page'], 'giveExtraAttempt']);
    $app->put('/api/pages/{id}/unit/{unitId}',[$app['controllers.page'], 'moveToUnit']);
    $app->put('/api/pages/{id}/move',[$app['controllers.page'], 'movePage']);
    $app->get('/api/pages/{id}/posts/needing-grade', [$app['controllers.posts'], 'needingGradeForPage']);
    $app->get('/api/pages/{pageId}/posts', [$app['controllers.posts'], 'getPagePosts']);
    $app->get('/api/pages/{id}/grademax', [$app['controllers.page'], 'updateMaxScore']);

}
else if (preg_match('@/courses/@',@$_SERVER['REQUEST_URI'])){
    $app->post('/api/courses/{courseId}/testbanks',[$app['controllers.testbank'], 'create']);
    $app->get('/api/courses/{courseId}/testbanks/{bankId}',[$app['controllers.testbank'], 'get']);
    $app->post('/api/courses/{courseId}/testbanks/{bankId}/questions',[$app['controllers.testbank'], 'addQuestions']);
    $app->post('/api/courses/{courseId}/quizzes',[$app['controllers.quiz'], 'create']);
}
else if (preg_match('@/api/import/binlog@',@$_SERVER['REQUEST_URI'])){
    $app->post('api/import/binlog',[$app['controllers.importbinlog'], 'import']);
    $app->get('api/import/binlog/status',[$app['controllers.importbinlog'], 'getStatus']);
}
else if (preg_match('@/api/export/binlog@',@$_SERVER['REQUEST_URI'])){
    $app->get('api/export/binlog/status',[$app['controllers.exportbinlog'], 'getStatus']);
}
else if (preg_match('@/imports@',@$_SERVER['REQUEST_URI'])){
    $app->get('/api/imports',[$app['controllers.import_course'], 'get']);
    $app->post('/api/imports',[$app['controllers.import_course'], 'import']);
    $app->delete('/api/imports/{mapFile}',[$app['controllers.import_course'], 'discard']);
    $app->post('/api/imports/moodle',[$app['controllers.upload_moodle'], 'read']);
    $app->get('/api/imports/test',[$app['controllers.import_course'], 'test']);
    $app->post('/api/imports/powerschool',[$app['controllers.powerschool'], 'import']);


}
else if (preg_match('@/licenses/@',@$_SERVER['REQUEST_URI'])){
    $app->post('/api/licenses/generate',[$app['controllers.licenses'],'generateLicenses']);
    $app->post('/api/licenses/generate/{org_id}',[$app['controllers.licenses'],'generateLicenses']);
    $app->post('/api/licenses/validate',[$app['controllers.licenses'],'validateLicense']);
    $app->get('/api/licenses/{org_id}/{user_id}',[$app['controllers.licenses'],'checkLicenseFor']);
    $app->get('/api/licenses/{org_id}',[$app['controllers.licenses'],'getLicenses']);
}
else if (preg_match('@/api/htmltemplate/@',@$_SERVER['REQUEST_URI'])){
    $app->post('/api/htmltemplate/{id}',[$app['controllers.htmltemplate'], 'addhtmltemplate']);
    $app->post('/api/htmltemplate/{target}',[$app['controllers.htmltemplate'], 'edithtmltemplates']);
    $app->get('/api/htmltemplate/{id}/{tmpid}',[$app['controllers.htmltemplate'], 'deletehtmltemplates']);
}
else if (preg_match('@/teacher-responses/@',@$_SERVER['REQUEST_URI'])) {
    $app->get('/api/teacher-responses/{org_id}',[$app['controllers.teacherresponses'],'getTeachers']);
}
else if (preg_match('@/api/chat/@',@$_SERVER['REQUEST_URI'])) {
    $app->get('/api/chat/{room}/log/download',[$app['controllers.chat'],'downloadRoomLog']);
    $app->get('/api/chat/{room}/log',[$app['controllers.chat'],'loadRoomLog']);
    $app->get('/api/chat/unread-messages',[$app['controllers.chat'],'getUnreadMessages']);
    $app->get('/api/chat/group-rooms',[$app['controllers.chat'],'loadGroupRooms']);
    $app->get('/api/chat/offline-users',[$app['controllers.chat'],'getOfflineUsers']);
    $app->get('/api/chat/all-online',[$app['controllers.chat'],'getAllConnectedUsers']);
}
else if (preg_match('@/api/checker/@',@$_SERVER['REQUEST_URI'])) {
    $app->get('/api/checker/dup-guardians',[$app['controllers.userguardians'],'tempGetDupGuardians']);
}
else if (preg_match('@/group/@',@$_SERVER['REQUEST_URI'])) {
    $app->post('/api/group/{classid}',[$app['controllers.group'],'createGroup']);
    $app->get('/api/group/{classid}',[$app['controllers.group'],'getGroups']);
    $app->delete('/api/group/{classid}/{id}',[$app['controllers.group'],'deleteGroup']);
    $app->put('/api/group/{classid}/{id}',[$app['controllers.group'],'saveGroup']);
    $app->post('/api/group/{classid}/{id}/start-date',[$app['controllers.group'], 'setStartDate']);

}
else if (preg_match('@/notifications/student-feedback@',@$_SERVER['REQUEST_URI'])) {
    $app->get('/notifications/student-feedback/{postId}',[$app['controllers.notifications'],'getStudentFeedback']);
}
else if (preg_match('@/clone/@',@$_SERVER['REQUEST_URI'])) {
    $app->post('/api/clone/page/{id}',[$app['controllers.clone'],'clonePage']);
    $app->post('/api/clone/pagegroup/{id}',[$app['controllers.clone'],'clonePagegroup']);
    $app->post('/api/clone/unit/{id}',[$app['controllers.clone'],'cloneUnit']);
    $app->post('/api/clone/course/{id}',[$app['controllers.clone'],'cloneCourse']);
    $app->post('/api/clone/timed_group/{id}',[$app['controllers.clone'],'cloneTimedGroup']);
    $app->post('/api/clone/timed_prompt/{id}',[$app['controllers.clone'],'cloneTimedPrompt']);
}
else if (preg_match('@/api/gradermenu/@',@$_SERVER['REQUEST_URI'])){
    $app->get('/api/gradermenu/{courseId}/user/{userId}', [$app['controllers.graderactivitiesstudent'], 'needingGrade']);
    $app->get('/api/gradermenu/archive/{courseId}/user/{userId}', [$app['controllers.graderactivitiesstudent'], 'archive']);

}
else if (preg_match('@/posts@',@$_SERVER['REQUEST_URI'])){
    $app->get('/api/posts/count-needing-grade', [$app['controllers.posts'], 'countNeedingGrade']);
    $app->get('/api/posts/count-needing-grade-no-menu', [$app['controllers.posts'], 'countNoMenuNeedingGrade']);
    $app->post('/api/posts/{postId}/seen', [$app['controllers.postviews'], 'newVisualization']);
    $app->get('/api/posts/{postId}/seen', [$app['controllers.postviews'], 'getViews']);
    $app->get('/api/posts/{postId}/htmlresponse', [$app['controllers.canvastemplates'], 'getUserResponse']);

}
else if (preg_match('@/api/webrtc-recorder@',@$_SERVER['REQUEST_URI'])){
    $app['controllers.webrtc_recorder'] = $app->factory(function () use ($app) {
        return new \English3\Controller\WebrtcRecorder($app['dbs']['mysql_read']);
    });
    $app->get('/api/webrtc-recorder/{streamName}/status',[$app['controllers.webrtc_recorder'], 'checkStreamStatus']);
    $app->get('/api/webrtc-recorder/{streamName}/size',[$app['controllers.webrtc_recorder'], 'checkStreamSize']);
    $app->get('/api/webrtc-recorder/{streamName}/start',[$app['controllers.webrtc_recorder'], 'startRecording']);
    $app->get('/api/webrtc-recorder/{streamName}/stop',[$app['controllers.webrtc_recorder'], 'stopRecording']);
    $app->get('/api/webrtc-recorder/{streamName}/mp4',[$app['controllers.webrtc_recorder'], 'convertMp4']);
}
else if (@$_SERVER['REQUEST_URI'] == '/') {
    //do nothing
    }
else {
    $app->match('/example', array($app['controllers.example'], 'getExampleAction'));
    $app->match('/assignments', array($app['controllers.assignments'], 'getAssignmentsAction'));
    $app->match('/notification', array($app['controllers.notifications'], 'getNotificationAction'));
    $app->get('/timeout',[$app['controllers.session'], 'timeleft']);
    $app->get('/stoptimeout',[$app['controllers.session'], 'stop']);
}


$app->match('{url}', function () use ($app) {
    // Start Of Web App
    // Everything Routes Through Here That Is Not A Static File


    function trace($message, $silent) {
        if($silent) {
            print "<!--<pre>";
            print_r($message);
            print "</pre>-->";
        } else {
            print "<pre>";
            print_r($message);
            print "</pre>";
        }
    }

    function error404() {
        header("HTTP/1.0 404 Not Found");
        print "<DOCTYPE! html>";
        print "<html>";
        print "<head>";
        print "<title>MEG LMS</title>";
        print "</head>";
        print "<body>";
        print "<span>Page Requested Could Not Be Found!</span>";
        trace(@$_SERVER['REQUEST_URI'], 1);
        print "</body>";
        print "</html>";
    }

    function errorTechnical($error) {
        print "<DOCTYPE! html>";
        print "<html>";
        print "<head>";
        print "<title>MEG LMS</title>";
        print "</head>";
        print "<body>";
        print "<span>Page Is Experiencing Technical Difficulties!</span>";
        trace($error, 1);
        print "</body>";
        print "</html>";
    }

    function route($routing, $uri) {
        global $PATHS, $DB, $SECURITY;

        foreach($routing as  $route => $controller) {
            if(preg_match($route, $uri) === 1) {
                if(file_exists(dirname(__FILE__) . "/controllers/" . $controller)) {
                    include_once(dirname(__FILE__) . "/controllers/" .$controller);
                    exit();
                }
            }
        }

        error404();
        exit();
    }

    function connectToDB() {
        global $DB;

        $mysqli = new mysqli($DB->host, $DB->user, $DB->password, $DB->database);

        if ($mysqli->connect_errno) {
            errorTechnical("Failed to connect to MySQL: (" . $mysqli->connect_errno . ") " . $mysqli->connect_error);
            exit(); }

        /* change character set to utf8 */
        if (!$mysqli->set_charset("utf8")) {
            errorTechnical("Failed to connect to MySQL: " . $mysqli->error);
            exit();
        }

        return $mysqli;
    }

    function connectToDBPDO() {
        global $DB;
        $dsn = "mysql:host=$DB->host;dbname=$DB->database;charset=utf8";
        $pdo = new PDO($dsn, $DB->user, $DB->password);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        return $pdo;
    }

    $routing = array(
        '/^\/filesandfolders\//'=> 'filefolder.php',
        '/^\/user\//'=> 'user.php',
        '/^\/apply\//'=> 'apply.php',
        '/^\/test\//'=> 'test.php',
        '/^\/grades-assignments\//'=> 'grades-assignments.php',

        '/^\/signin\//'=> 'signin.php',
        '/^\/new-license\/?/'=> 'new-license.php',
        '/^\/home\/?/'=> 'splash.php',
        '/^\/home-test\/?/'=> 'splash.php',
        '/^\/dashboard\/?/'=> 'splash.php',
        '/^\/account\/?/'=> 'account.php',
        '/^\/payment\/?/'=> 'payment.html',

        '/^\/signout\/?/'=> 'signout.php',
        '/^\/email\//'=> 'email.php',
        '/^\/history\//'=> 'history.php',

        '/^\/testbank\//'                   => 'testbank.php',
        '/^\/service.course\//'             => 'service.course.php',
        '/^\/service.testbank.nav.banks\//' => 'service.testbank.nav.banks.php',
        '/^\/service.testbank.nav.tests\//' => 'service.testbank.nav.tests.php',
        '/^\/service.testbank.objective\//' => 'service.testbank.objective.php',
        '/^\/service.testbank.question\//'  => 'service.testbank.question.php',
        '/^\/service.testbank.bank\//'      => 'service.testbank.bank.php',
        '/^\/service.testbank.test\//'      => 'service.testbank.test.php',

        '/^\/vocab\//'=> 'vocab.php',

        // nimble knowledge
        '/^\/lesson_listening\//'=> 'lesson_listening.php',
        '/^\/listening_practice\//'=> 'listening_practice.php',
        '/^\/reading_practice\//'=> 'reading_practice.php',
        '/^\/inLessonActivity\//'=> 'in_lesson_activity.php',
        '/^\/nimbleknowledge_lesson\//'=> 'nimbleknowledge_lesson.php',

        '/^\/editpage\//'=> 'editpage.php',
        '/^\/studentactivity\//'=> 'StudentActivityTrack.php',
        '/^\/xlstest\/?/'=> 'xlstest.php',
        '/^\/phpinfo\/?/'=> '../src/English3/Util/phpinfo.php',
        '/^\/seeit\//'=> 'seeit.php',
        '/^\/flashit\//'=> 'flashit.php',
        '/^\/flashitaudio\//'=> 'flashitaudio.php',
        '/^\/content\//'=> 'content.php',
        '/^\/quiz\//'=> 'quiz.php',
        '/^\/quizlist\//'=> 'quiz_list.php',
        '/^\/chat\//'=> 'chat.php',
        '/^\/fabric\/?/'=> 'fabric.php',
        '/^\/externallink\//'=> 'externallink.php',
        '/^\/menu\//'=> 'menu.php',
        '/^\/courseclass\//'=> 'courseclass.php',
        '/^\/organizationuser\//'=> 'organizationuser.php',
        '/^\/gradermenu\//'=> 'gradermenu.php',
        '/^\/languages\//'=> 'languages.php',
        '/^\/organization\//'=> 'organization.php',
        '/^\/department\//'=> 'department.php',
        '/^\/courseadmin\//'=> 'courseadmin.php',
        '/^\/course\/students\//'=> 'grades-classes.php',
        '/^\/course\//'=> 'course.php',
        '/^\/post\//'=> 'post.php',
        '/^\/graderpost\//'=> 'graderpost.php',
        '/^\/filesupload\/?/'=> 'filesupload.php',
        '/^\/htmlmeglmstemplate\//'=> 'htmlmeglmstemplate.php',
        '/^\/graderquiz\//'=> 'graderquiz.php',
        '/^\/preference\//'=> 'preference.php',
        '/^\/thaidemo\//'=> 'thaidemo.php',
        '/^\/j1-certificate\/?/'=> 'j1-certificate.php',
        '/^\/e3pt-report\/?/'=> 'e3pt-report.php',
        '/^\/spanishdemo\//'=> 'spanishdemo.php',
        '/^\/hrdemo\//'=> 'hrdemo.php',
        '/^\/arabicdemo\//'=> 'arabicdemo.php',
        '/^\/frenchdemo\//'=> 'frenchdemo.php',
        '/^\/portuguesedemo\//'=> 'portuguesedemo.php',
        '/^\/koreandemo\//'=> 'koreandemo.php',
        '/^\/mandarindemo\//'=> 'mandarindemo.php',
        '/^\/japanesedemo\//'=> 'japanesedemo.php',
        '/^\/guatemala\//'=> 'guatemalademo.php',
        '/^\/utility\//'=> 'utility.php',
        '/^\/notifications\//'=> 'notifications.php',
        '/^\/editor\//'=> 'editor.php',
        '/^\/superadmin\//'=> 'superadmin.php',
        '/^\/grader\//'=> 'grader.php',
        '/^\/grades\//'=> 'grades.php',
        '/^\/gradebook\//'=> 'gradebook.php',
        '/^\/performance-evaluation\/?/'=> 'performance-evaluation.php',
        '/^\/attendance\/?/'=> 'attendance.php',
        '/^\/singlepage\//'=> 'singlepage.php',
        '/^\/standard\//'=> 'standard.php',
        '/^\/rubrics\//'=> 'rubrics.php',
        '/^\/editcourseclassuser\//'=> 'editcourseclassuser.php',
        '/^\/showTemplateResponse\//'=> 'show-template-response.php',
        '/^\/editcourseclass\//'=> 'editcourseclass.php',
        '/^\/editorganizationuser\//'=> 'editorganizationuser.php',
        '/^\/editenrollment\//'=> 'editenrollment.php',
        '/^\/editorganization\//'=> 'editorganization.php',
        '/^\/editdepartment\//'=> 'editdepartment.php',
        '/^\/editcourse\//'=> 'editcourse.php',
        '/^\/editunit\//'=> 'editunit.php',
        '/^\/resource\//'=> 'resource.php',
        '/^\/editterm\//'=> 'editterm.php',
        '/^\/uploadckeditormedia\//'=> 'uploadckeditormedia.php',
        '/^\/upload\//'=> 'upload.php',
        '/^\/ScormCloudController\//' => 'ScormCloudController.php',
        '/^\/index\.html/'=> 'index.php',
        '/^\/index\.php/'=> 'index.php',
        '/^\/#?\?/'=> 'index.php',
        '/^\/#/'=> 'index.php',
        '/^\/$/'=> 'index.php',

        '/^\/PSmatch\//'=> 'psmatch.php',
        '/^\/PScontrols\//'=> 'pscontrols.php',
        '/^\/ps_services\//'=> 'service.powerschool.php',
        '/^\/j1-dashboard\//'=> 'splash.php'

    );
    $GLOBALS['DB']->mysqli = connectToDB();
    $GLOBALS['DB']->pdo = connectToDBPDO();
    checkTimeout($app['dbs']['mysql_read']);
    route($routing, @$_SERVER['REQUEST_URI']);
})
    ->assert('url', '.*')
;

$app->after(function () use ($app) {
    checkTimeout($app['dbs']['mysql_read']);
});
return $app;

