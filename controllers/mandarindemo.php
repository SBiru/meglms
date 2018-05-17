<?php

$_SESSION['USER']['LOGGED_IN'] = true;
$_SESSION['USER']['ID'] = 13;
$_SESSION['USER']['FNAME'] = 'Mandarin';
$_SESSION['USER']['LNAME'] = 'Demo';
$_SESSION['USER']['EMAIL'] = 'mandarindemo@meglms.com';

header("Location: http://" . $_SERVER['HTTP_HOST'] . "/", 303);
exit();

?>