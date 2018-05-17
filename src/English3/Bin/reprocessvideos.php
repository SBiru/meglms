<?php

require '../../../vendor/autoload.php';
require_once '../../../config.php';
require_once '../../English3/Util/FatalErrorMailer.php';
global $GLOBALS;
FatalErrorMailer::register();
$dbConn = new \Doctrine\DBAL\Connection([
    'host'      => $GLOBALS['DB']->host,
    'dbname'    => $GLOBALS['DB']->database,
    'user'      => $GLOBALS['DB']->user,
    'password'  => $GLOBALS['DB']->password,
    'charset'   => 'utf8'
],new \Doctrine\DBAL\Driver\PDOMySql\Driver());

\English3\Controller\Utility::getInstance($dbConn);


class ReprocessVideos{
    private $util;
    private $async;

    public function __construct()
    {
        $this->util = \English3\Controller\Utility::getInstance();
    }

    public function reprocess($ext = '.mov'){
        $files = $this->getFiles($ext);
        $this->reprocessFiles($files);
    }
    private function getFiles($ext){
        return $this->util->fetch("SELECT * FROM `filesuploaded` where ext like '%$ext%'");
    }
    private function reprocessFiles($files){
        foreach($files as $file){
            $this->reprocessFile($file);
        }
    }
    private function reprocessFile($file){
        $originalFile = '/var/www/html/prod_meglms/public/useruploads/'.$file['id'].$file['ext'];
        $mp4File = '/var/www/html/prod_meglms/public/useruploads/'.$file['id'].'.mp4';
        echo "starting $originalFile".PHP_EOL;
        \English3\Controller\Utility::convertToMp4($originalFile,$mp4File);
        echo "finalizing $originalFile".PHP_EOL;
    }

}
$options =  getopt('e:');
$reprocess = new ReprocessVideos();
$reprocess->reprocess($options['e']);


