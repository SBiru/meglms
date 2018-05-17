<?php
require_once('../../../../config.php');
require_once('./ExportBinLog.php');
$options = array();
foreach($argv as $arg){
    if(strtolower($arg)=='-d'){
        $options['debugModeOn'] = true;
    }
}
$exporter = new \English3\Bin\ExportBinLog\ExportBinLog($argv[1],$argv[2],$argv[3],$options);
$exporter->exportAllSinceLastSync();
?>