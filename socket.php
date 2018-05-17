<?php

require 'vendor/autoload.php';
require_once 'config.php';
require_once 'src/English3/Util/FatalErrorMailer.php';
global $GLOBALS;
FatalErrorMailer::register();
$_SESSION['USER']  = ['ID'=>'2'];
$dbConn = new \Doctrine\DBAL\Connection([
    'host'      => $GLOBALS['DB']->host,
    'dbname'    => $GLOBALS['DB']->database,
    'user'      => $GLOBALS['DB']->user,
    'password'  => $GLOBALS['DB']->password,
    'charset'   => 'utf8'
],new \Doctrine\DBAL\Driver\PDOMySql\Driver());

\English3\Controller\Utility::getInstance($dbConn);

$loop = React\EventLoop\Factory::create();
$brokerServer = new \English3\WebSocket\BrokerServer($loop);
$brokerServer->start();
$loop->run();

