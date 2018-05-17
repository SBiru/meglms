<?php
use English3\Controller\Exports\E3PTReport\E3PTReport;

if($_REQUEST['redirect']){
    E3PTReport::createCertificateFile($_REQUEST['userid'],$_REQUEST['classid'],true);
    $filename = E3PTReport::certFileName($_REQUEST['userid'],$_REQUEST['classid'],true,true);

    header("Location: http://" . $_SERVER['HTTP_HOST'] . "/resource/?type=pdf&src=" . $filename, 303);
    exit();
}
$cert = new E3PTReport();
$cert->setOfficial(true);
$cert->get($_REQUEST['userid'],$_REQUEST['classid']);