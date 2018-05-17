<?php

$_SESSION['USER']['LOGGED_IN'] = true;
$_SESSION['USER']['ID'] = 6;
$_SESSION['USER']['FNAME'] = 'Spanish';
$_SESSION['USER']['LNAME'] = 'User';
$_SESSION['USER']['EMAIL'] = 'spanishdemo@meglms.com';

header("Location: http://" . $_SERVER['HTTP_HOST'] . "/", 303);
exit();

?>