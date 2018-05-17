<?php

$_SESSION['USER']['LOGGED_IN'] = true;
$_SESSION['USER']['ID'] = 14;
$_SESSION['USER']['FNAME'] = 'Japanese';
$_SESSION['USER']['LNAME'] = 'Demo';
$_SESSION['USER']['EMAIL'] = 'japanesedemo@meglms.com';

header("Location: http://" . $_SERVER['HTTP_HOST'] . "/", 303);
exit();

?>