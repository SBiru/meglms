<?php

$_SESSION['USER']['LOGGED_IN'] = true;
$_SESSION['USER']['ID'] = 12;
$_SESSION['USER']['FNAME'] = 'Korean';
$_SESSION['USER']['LNAME'] = 'Demo';
$_SESSION['USER']['EMAIL'] = 'koreandemo@meglms.com';

header("Location: http://" . $_SERVER['HTTP_HOST'] . "/", 303);
exit();

?>