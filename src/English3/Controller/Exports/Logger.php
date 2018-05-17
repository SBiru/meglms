<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 3/28/17
 * Time: 4:55 PM
 */

namespace English3\Controller\Exports;


use Symfony\Component\HttpKernel\Exception\HttpException;

class Logger {
    private static $folder = '/src/English3/Controller/Exports/tmp/';
    public static function error($message,$code = 400){
        self::log($message,self::ERROR);
        throw new HttpException($code,$message);
    }
    public static function log($message,$type=self::LOG){
        global $PATHS;
        $logFile = $PATHS->app_path. self::$folder . 'log';
        $f = fopen($logFile,'a');
        fwrite($f,sprintf("[%s][%s] %s ",$type,date('Y-m-d H:i:s'),$message).PHP_EOL);
        fclose($f);
    }
    const LOG = 'LOG';
    const ERROR = 'ERROR';
}
