<?php

$_SESSION['USER']['LOGGED_IN'] = true;
$_SESSION['USER']['ID'] = 10;
$_SESSION['USER']['FNAME'] = 'French';
$_SESSION['USER']['LNAME'] = 'Demo';
$_SESSION['USER']['EMAIL'] = 'frenchdemo@meglms.com';

header("Location: http://" . $_SERVER['HTTP_HOST'] . "/", 303);
exit();

?>