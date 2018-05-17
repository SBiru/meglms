<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 3/28/17
 * Time: 6:19 PM
 */

namespace English3\Controller\Exports;


class TMPFile {
    private $tmpFolder = '/src/English3/Controller/Exports/tmp/';
    public $fileName;
    public function __construct($content,$filename){
        global $PATHS;
        $this->fileName = $PATHS->app_path . $this->tmpFolder . $filename;
        $file = fopen($this->fileName,'w');
        fwrite($file,$content);
        fclose($file);
    }
}