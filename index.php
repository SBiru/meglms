<?php
ob_start("ob_gzhandler");

$app = require_once __DIR__.'/app.php';

$app->run();
?>

