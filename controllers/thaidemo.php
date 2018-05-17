<?php

$_SESSION['USER']['LOGGED_IN'] = true;
$_SESSION['USER']['ID'] = 5;
$_SESSION['USER']['FNAME'] = 'Thai';
$_SESSION['USER']['LNAME'] = 'User';
$_SESSION['USER']['EMAIL'] = 'thaidemo@meglms.com';

header("Location: http://" . $_SERVER['HTTP_HOST'] . "/", 303);
exit();

?>