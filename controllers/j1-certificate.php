<?php
use English3\Controller\Exports\J1Certificate\J1Certificate;

$cert = new J1Certificate();
$cert->setOfficial(true);
$cert->get($_REQUEST['userid'],$_REQUEST['classid']);