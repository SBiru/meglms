<?php

global $PATHS, $DB;

use English3\Controller\UserController;
use English3\Controller\Utility;

require __DIR__ . "/usertools/orm.php";

$orm = new PmOrm($_SESSION, $DB);

if (!$orm->logged_in) {
    exit();
}
$me = UserController::byId(\English3\Controller\Utility::getInstance()->reader,$orm->user_id);


$data = new \stdClass();
// an I a student in any classes?
$data->is_student = $orm->am_i_student();
// if I have children, list them. Otherwise FALSE
$data->children = $orm->get_children();
// if I have classes, enumerate them. {classid: [student, ...], ...}. Otherwise FALSE
$data->classes = $orm->get_all_classes();

// if I am a super admin, this is all users.
// If I am an org admin, this is all users in my org.
// If I am a guardian or adivisor, just my children
// Otherwise FALSE
if(!$me->amIJustGuardian()){
    $data->org = $orm->students_in_my_org();
}

Utility::sortBy($data->org,'fname');
$data->org = @array_values($data->org);
header('Content-Type: application/json');

print json_encode($data);

