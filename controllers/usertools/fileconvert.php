<?php
/*
Golabs 25/06/2015
This program take a file in a format and converts to other format for presentation.

How to run
$targetfileinfo = new FileConvert('fileFolder','filename','extension to convert','target folder of new file');

Sample
example $changefile = new FileConvert('e:\\','test.odt','html','e:\test');

some important data parameters.
important parameters
->error "tells of a error";
->convert "will give details about the conversion"
->file_saved "the new file name that is saved"
->file_savednlocation ="File and folder location folder/newiflename"


*/
class FileConvert
{
    public function __construct($targetlocation, $target, $format, $destination,$ext=0)
    {
        $this->targetprogram = 'C:\Program Files (x86)\LibreOffice 4\program\soffice.exe';
        if (!$this->checkwidnows()) {
//      $this->targetprogram =  'libreoffice';
        global $PATHS, $DB, $SECURITY;
        if(file_exists($PATHS->libre_path)){
        if (is_executable($PATHS->libre_path)){
            $this->targetprogram = $PATHS->libre_path;
        }
        else{
    exit('ERROR file is not execuitable');
    }
        }
        else{
        $this->targetprogram = "soffice";
    }
        }
        $this->error             = false;
        $this->targetlocation    = $targetlocation;
        $this->target            = $target;
        $this->format            = $format;
        $this->destinationfolder = $destination;
        $this->ext = $ext;
        $this->unique_id         = $this->generate_unique_id(8);
        $this->checkfile($this->targetlocation . $this->target);
       
        if ($this->error == false) {
            $this->file_parts = pathinfo($this->targetlocation . $this->target);
            $this->convert();
        }
    }
    
    private function generate_unique_id($unique_end_length)
    {
        if (intval($this->ext) > 0 )return '';
        $unique_end_length = intval($unique_end_length);
        $rand              = array(
            'a',
            'b',
            'c',
            'd',
            'e',
            'f',
            'g',
            'h',
            'i',
            'j',
            'k',
            'l',
            'm',
            'n',
            'o',
            'p',
            'k',
            'r',
            's',
            't',
            'u',
            'v',
            'w',
            'x',
            'y',
            'z'
        );
        
        $date = date("Y-m-d-s-");
        $str  = '';
        
        $length = count($rand) - 1;
        
        for ($i = 0; $i < $unique_end_length; $i++) {
            $str .= $rand[mt_rand(0, $length)];
        }
        
        return $date . $str;
    }
    
    private function checkfile($filename)
    {
        if (!file_exists($filename)) {
            $this->error     = true;
            $this->errortext = "The file $filename does not exist";
        }
        else{
            return 1;
        }
    }
    
    private function checkwidnows()
    {
        if (file_exists($this->targetprogram)) {
            return true;
        } else
            return false;
    }
    
    private function checkendslash($item)
    {
        if (!preg_match('@\/|//@', $item)) {
            $item = $item . '/';
        }
        return $item;
    }
    
    private function convert()
    {
        $whoami = trim(shell_exec('whoami'));
        putenv('HOME=/home/'.$whoami);
        if (preg_match('@\w@',$this->unique_id)){
            $this->unique_id .= $this->unique_id . '.';
        }
        $this->convert             = '"' . $this->targetprogram . '" --headless --convert-to '  . $this->format . ' --outdir "' . $this->destinationfolder . '" "' . $this->targetlocation . $this->target . '"';

        $this->shell_exec          = shell_exec($this->convert);
        $this->file_saved          = $this->file_parts['filename']  .'.'. $this->format;

        $this->file_savednlocation = $this->checkendslash($this->destinationfolder) . $this->file_saved;

        $check = $this->checkfile($this->file_savednlocation);
        chmod($this->file_savednlocation, 0777);
        if ($check == 1){
            $this->file_savednlocation_exists = 'true';
        }
        else{
            $this->file_savednlocation_exists = 'true';
        }
        $this->file_savednlocation_permission = substr(sprintf('%o', fileperms($this->file_savednlocation)), -4);
        $this->file_original_permission = substr(sprintf('%o', fileperms($this->targetlocation . $this->target)), -4);
        $this->file_original_location = $this->targetlocation . $this->target;
    }
}

