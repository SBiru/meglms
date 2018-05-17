<?php

$_SESSION['USER']['LOGGED_IN'] = true;
$_SESSION['USER']['ID'] = 9;
$_SESSION['USER']['FNAME'] = 'Arabic';
$_SESSION['USER']['LNAME'] = 'Demo';
$_SESSION['USER']['EMAIL'] = 'arabicdemo@meglms.com';

header("Location: http://" . $_SERVER['HTTP_HOST'] . "/", 303);
exit();

?>