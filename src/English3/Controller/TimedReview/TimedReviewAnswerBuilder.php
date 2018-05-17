<?php

namespace English3\Controller\TimedReview;

use English3\Controller\TimedReviewController;
use English3\Controller\Utility;
use English3\Util\TextImageCreator;

define('VIDEOWIDTH',320);
define('VIDEOHEIGHT',240);
class TimedReviewAnswerBuilder {
    protected $prompts;
    protected $joiner;
    protected $splitter;
    protected $timeToPrepareValues;
    protected $answerTimePositions;
    protected $studentVideoFile;
    protected $ajustedVideoFile;
    protected $answeredOnlyPromptPosition = 0;
    public function __construct($timeToPrepareValues,$prompts,$answerTimePositions,$studentVideoFile){
        $this->timeToPrepareValues = $timeToPrepareValues;
        $this->prompts = $prompts;
        $this->joiner = new PromptAnswerJoiner();
        $this->splitter = new AnswerSplitter($studentVideoFile,$answerTimePositions);
        $this->answerTimePositions = $answerTimePositions;
        $this->studentVideoFile = $studentVideoFile;
        $this->adjustAnswerDuration();
        TempFolder::checkTempFolder();

    }

    private function adjustAnswerDuration(){
        $videoDuration = $this->joiner->videoDurationInSeconds($this->studentVideoFile)*1000;
        $totalAnswerDuration = $this->getTotalAnswerDuration();
        if($totalAnswerDuration>$videoDuration){
            $delayPerAnswer = ($totalAnswerDuration-$videoDuration)/count($this->answerTimePositions);
            foreach ($this->answerTimePositions as &$answer){
                $answer->duration= $answer->duration - $delayPerAnswer;
            }
        }
    }
    private function getTotalAnswerDuration(){
        $total = 0;
        foreach ($this->answerTimePositions as $answer){
            $total+=$answer->duration;
        }
        return $total;
    }
    public function buildAnswer(){
        $chunkFiles = array();
        $this->adjustAudio($this->studentVideoFile);
        $this->splitter->setStudentFile($this->ajustedVideoFile);
        foreach($this->prompts as $i=>$prompt){
            $chunk = $this->createNextPromptAnswerChunk($i);
            if($chunk){
                $chunkFiles[]=$chunk;
            }
            if(!$prompt->isInformation){
                $this->answeredOnlyPromptPosition++;
            }

        }
        if(count($chunkFiles)>1){
            $file = PromptAnswerJoiner::joinVideos($chunkFiles,false);
        }else{
            $file = $chunkFiles[0];
            FileGarbage::removeFile($file);

        }
        if(file_exists($file)){
            FileGarbage::clean();
        }
        return $file;
    }
    protected function createNextPromptAnswerChunk($promptPosition){
        $timeToPrepareValue = $this->timeToPrepareValues[$promptPosition];
        $prompt = $this->prompts[$promptPosition];
        $promptFileName = $this->getPromptFileName($prompt);
        if(!$prompt->isInformation){
            $answerChunk = $this->splitter->splitIndividualAnswerChunk($promptPosition);
        }

        if(file_exists($promptFileName)){
            if($prompt->isInformation){
                if($prompt->type=='audio'){
                    $mp4File = PromptAnswerJoiner::convertMp3ToMp4($promptFileName,$this->createImageFromPrompt($prompt));
                    return file_exists($mp4File)?$mp4File:false;
                }
                if($prompt->type=='video'){
                    return $promptFileName;
                }
                return false;
            }
            if(!$answerChunk){
                if($prompt->type=='video'){
                    return false;
                }
                else if($prompt->type=='audio'){
                    $mp4File = PromptAnswerJoiner::convertMp3ToMp4($promptFileName,$this->createImageFromPrompt($prompt));
                    return file_exists($mp4File)?$mp4File:false;
                }
                else{
                    return false;
                }

            }
            $answerChunk = $this->joiner->createMergedChunkForType($timeToPrepareValue,$promptFileName,$answerChunk,$prompt->type);
        }
        return $answerChunk;
    }


    protected function getPromptFileName($prompt){
        global $PATHS;
        if($prompt->type=='video') return $PATHS->app_path.$prompt->videoFile;
        if($prompt->type=='audio') return $PATHS->app_path.$PATHS->base_site_public_path.'useruploads/'.$prompt->audioFile;
        if($prompt->type=='text') return $this->createImageFromPrompt($prompt);
    }
    protected function createImageFromPrompt($prompt){
        global $PATHS;
        require_once($PATHS->app_path.'/lib/simple_html_dom.php');
        $html = str_get_html($prompt->prompt);
        $filename = $this->createImageFromText($html->plaintext);
        return $filename;
    }
    private function createImageFromText($text){
        $imageCreator = new TextImageCreator(['width'=>VIDEOWIDTH,'height'=>VIDEOHEIGHT]);
        $filename = FileGarbage::randomFileName('png');
        $imageCreator->createSimpleTextImage($filename,$text);
        FileGarbage::addFile($filename);
        return $filename;
    }
    public function saveFailedVideo($userid,$pageid){
        Utility::getInstance()->reader->insert('fail_timed_review_videos',[
            'userid'=>$userid,
            'pageid'=>$pageid,
            'video_url'=>$this->studentVideoFile,
            'time_to_prepare_values'=>json_encode($this->timeToPrepareValues),
            'prompts'=>json_encode($this->prompts),
            'answer_time_positions'=>json_encode($this->answerTimePositions),
        ]);
    }
    public function createLogFile($userid,$pageid){
        $fileObject =[
            'userid'=>$userid,
            'pageid'=>$pageid,
            'video_url'=>$this->studentVideoFile,
            'time_to_prepare_values'=>json_encode($this->timeToPrepareValues),
            'prompts'=>json_encode($this->prompts),
            'answer_time_positions'=>json_encode($this->answerTimePositions),
        ];
        $fileName = date('YmdHis').'-'.$userid;
        TempFolder::checkTempFolder();
        $f = fopen(TempFolder::$TEMP_FOLDER.'/'.$fileName,'w');
        fwrite($f,json_encode($fileObject));
        fclose($f);
    }
    public function saveAttempt($postid){
        $fileObject =[
            'video_url'=>$this->studentVideoFile,
            'time_to_prepare_values'=>json_encode($this->timeToPrepareValues),
            'prompts'=>json_encode($this->prompts),
            'answer_time_positions'=>json_encode($this->answerTimePositions),
        ];
        Utility::getInstance()->insert("INSERT INTO post_meta (post_id, meta_key, meta_value) VALUES 
          (?,?,?)",[$postid,'timed_review_attempt',json_encode($fileObject)]
        );

    }
    public function videoDurationInSeconds($file){
        return $this->joiner->videoDurationInSeconds($file);
    }
    private function adjustAudio($file){
        global $PATHS;
        $level = $this->audioLevelInDb($file);
        if($adjustValue = abs(floatval($level))){
            $adjustValue = $adjustValue - 15; #fixing the output volume level to ~ 15dB
            $adjustedVideo = FileGarbage::randomFileName('mp4');
            $cmd = "/usr/bin/ffmpeg -i $file -af \"volume={$adjustValue}dB\" -c:v copy $adjustedVideo";
            Logger::execDebug($cmd, $out, $ret);
            FileGarbage::addFile($adjustedVideo);
            $this->ajustedVideoFile = $adjustedVideo;
        }else{
            $this->ajustedVideoFile = $file;
        }

    }
    private function audioLevelInDb($file){
        return Logger::execDebug("/usr/bin/ffmpeg -i $file -af \"volumedetect\" -f null /dev/null/ 2>&1 | grep mean_volume | cut -d ' ' -f 5");

    }


}
class TempFolder {
    public static  function checkTempFolder(){
        global $PATHS;
        self::$TEMP_FOLDER = $PATHS->app_path.$PATHS->base_site_public_path.'timed-reviews-tmp';
        if (!file_exists(self::$TEMP_FOLDER)) {
            mkdir(self::$TEMP_FOLDER, 0777, true);
        }
    }
    public static $TEMP_FOLDER ;
}
class FileGarbage {
    public static function addFile($fileName){
        self::$files[]=$fileName;
    }
    public static function removeFile($fileName){
        $index = array_search($fileName,self::$files);
        if($index!==false){
            unset(self::$files[$index]);
        }
    }
    public static function clean(){
        array_walk(self::$files,function($f){
            unlink($f);
        });
    }
    public static function randomFileName($extension){
        return TempFolder::$TEMP_FOLDER.'/'.TimedReviewController::generateUnique(10).'.'.$extension;
    }
    private static $files = array();
}
class AnswerSplitter{
    private $studentVideoFile;
    private $answerTimePositions;
    private $totalProcessedTime;
    public function __construct($studentVideoFile,$answerTimePositions){
        $this->studentVideoFile = $studentVideoFile;
        $this->answerTimePositions = $answerTimePositions;
        $this->totalProcessedTime = 0;
    }
    public function setStudentFile($file){
        $this->studentVideoFile = $file;
    }

    public function splitIndividualAnswerChunk($position){
        if($this->answerTimePositions[$position]->duration<1000){
            $this->totalProcessedTime+=$this->answerTimePositions[$position]->duration;
            return false;
        }
        list ($startTime,$endTime)=$this->answerStartEndTimes($position);
        return FileSplitter::createChunkFile($this->studentVideoFile,$startTime,$endTime);
    }

    private function answerStartEndTimes($position){
        $answerInfo = $this->answerTimePositions[$position];
        $startTime = TimeFormatter::formatMillisecondsToTime($this->totalProcessedTime);
        $this->totalProcessedTime+=$answerInfo->duration;
        $endTime = TimeFormatter::formatMillisecondsToTime($answerInfo->duration);
        return array($startTime,$endTime);
    }

}
class FileSplitter {

    public static function createChunkFile($sourceFile,$startTime,$endTime){
        global $PATHS;
        $chunkName = TimedReviewController::generateUnique(10).'.mp4';
        $destFile = TempFolder::$TEMP_FOLDER.'/'.$chunkName;
        if($PATHS->local_only){
            $cmd = sprintf("/usr/bin/ffmpeg -i %s -ss %s  -t %s -strict -2 %s 2> /dev/null ",$sourceFile,$startTime,
                $endTime,$destFile);
        }else{
            $cmd = sprintf("/usr/bin/ffmpeg -i %s -ss %s  -t %s %s 2> /dev/null ",$sourceFile,$startTime,$endTime,$destFile);
        }

        Logger::execDebug($cmd, $out, $ret);
        FileGarbage::addFile($destFile);
        return $destFile;
    }

}
class PromptAnswerJoiner{
    public function createMergedChunkForType($timeToPrepareValue,$promptFileName,$answerFileName,$type){
        if($type=='audio') return $this->createMergedAudioChunk($promptFileName,$answerFileName,$timeToPrepareValue);
        if($type=='video') return $this->createMergedVideoChunk($promptFileName,$answerFileName,$timeToPrepareValue);
        if($type=='text') return $this->createMergedImageChunk($promptFileName,$answerFileName);
    }
    private function createMergedAudioChunk($promptFileName,$answerFileName,$timeToPrepareValue){
        return self::mergeVideoWithAudio($answerFileName,$promptFileName,$timeToPrepareValue);
    }
    private function createMergedImageChunk($promptFileName,$answerFileName){
        return self::mergeVideoWithImage($answerFileName,$promptFileName);
    }
    private function createMergedVideoChunk($promptFileName,$answerFileName,$timeToPrepareValue){
        $promptDuration = $this->videoDurationInSeconds($promptFileName);
        return self::mergeTwoVideos($answerFileName,$promptFileName,$promptDuration,$timeToPrepareValue);
    }
    public static function convertMp3ToMp4($promptFileName,$image){
        global $PATHS;
        $destFile = TempFolder::$TEMP_FOLDER.'/'.TimedReviewController::generateUnique(10).'.mp4';
        $cmd = "/usr/bin/ffmpeg -loop 1 -r ntsc -i $image  -i $promptFileName -c:a copy -c:v libx264 -preset fast -threads 0 -shortest $destFile 2> /dev/null";
        Logger::execDebug($cmd, $out, $ret);
        FileGarbage::addFile($destFile);
        return $destFile;

    }
    public static function joinVideos($videos,$addToGarbage=true){
        global $PATHS;
        $destFile = TempFolder::$TEMP_FOLDER.'/'.TimedReviewController::generateUnique(10).'.mp4';
        $inputStr = implode(" -i ",$videos);
        $n = count($videos);
        $filter = self::createConcatFilters($n);
        if($PATHS->local_only){
            $cmd = "/usr/bin/ffmpeg -i $inputStr -filter_complex \"$filter concat=n=$n:v=1:a=1 [v] [a] \" -map '[v]' -map '[a]' -async 1 -strict -2 $destFile 2> /dev/null ";
        }else{
            $cmd = "/usr/bin/ffmpeg -i $inputStr -filter_complex \"$filter concat=n=$n:v=1:a=1 [v] [a] \" -map '[v]' -map '[a]' -async 1 $destFile 2> /dev/null ";
        }

        Logger::execDebug($cmd, $out, $ret);
        if($addToGarbage){
            FileGarbage::addFile($destFile);
        }
        return $destFile;
    }
    private static function createConcatFilters($n){
        $filter = '';
        for($i = 0;$i<$n;$i++){
            $filter.="[$i:v:0]setdar=4/3, scale=".VIDEOWIDTH.":".VIDEOHEIGHT." [v$i] ,";
        }
        for($i = 0;$i<$n;$i++){
            $filter.="[v$i] [$i:a:0] ";
        }
        return $filter;
    }
    public static function mergeVideoWithImage($videoInput,$imageInput){
        $destFile = TempFolder::$TEMP_FOLDER.'/'.TimedReviewController::generateUnique(10).'.mp4';
        $cmd = "/usr/bin/ffmpeg -i $videoInput -i $imageInput -filter_complex '[0:v]scale=".VIDEOWIDTH.":".VIDEOHEIGHT."[v1],[v1]pad=".(2*VIDEOWIDTH).":".VIDEOHEIGHT."[int];[1:v]scale=".VIDEOWIDTH.":".VIDEOHEIGHT."[v2];[int][v2]overlay=W/2:0[vid];[vid]scale=".VIDEOWIDTH.":".VIDEOHEIGHT."[fv]' -map [fv] -map 0:a -async 1 $destFile 2> /dev/null ";
        Logger::execDebug($cmd, $out, $ret);
        FileGarbage::addFile($destFile);
        return $destFile;
    }
    public static function createVideoFromImage($imageInput,$durationInSeconds){
        $destFile = TempFolder::$TEMP_FOLDER.'/'.TimedReviewController::generateUnique(10).'.mp4';
        $cmd = "ffmpeg  -f lavfi -i anullsrc -loop 1 -i $imageInput -c:v libx264 -t $durationInSeconds -pix_fmt yuv420p -vf scale=".VIDEOWIDTH.":".VIDEOHEIGHT." -map 0:a -map 1:v  $destFile";
        Logger::execDebug($cmd, $out, $ret);
        FileGarbage::addFile($destFile);
        return $destFile;
    }
    public static function mergeVideoWithAudio($videoInput,$audioInput,$timeToPrepareValue){
        $destFile = TempFolder::$TEMP_FOLDER.'/'.TimedReviewController::generateUnique(10).'.mp4';
        if($timeToPrepareValue>0) {
            $duration = PromptAnswerJoiner::videoDurationInSeconds($audioInput);
            $cmd = "/usr/bin/ffmpeg -i $videoInput -i $audioInput -filter_complex '[0:v]scale=".VIDEOWIDTH.":".VIDEOHEIGHT.",setpts=PTS+$duration/TB[v];[1:a][0:a] concat=n=2:v=0:a=1 [a]' -map [v] -map [a] -async 1 $destFile 2> /dev/null";
        }else{
            $cmd = "/usr/bin/ffmpeg -i $videoInput -i $audioInput -filter_complex '[1:a]apad[r];[0:a][r]amerge[a]' -map 0:v -map [a] $destFile 2> /dev/null ";
        }
        Logger::execDebug($cmd, $out, $ret);
        FileGarbage::addFile($destFile);
        return $destFile;
    }
    public static function mergeTwoVideos($input1,$input2,$promptDuration,$timeToPrepareValue){
        global $PATHS;
        $destFile = TempFolder::$TEMP_FOLDER.'/'.TimedReviewController::generateUnique(10).'.mp4';
        if($timeToPrepareValue>0) {
            $tempThumbFile = FileGarbage::randomFileName('jpg');
            shell_exec("/usr/bin/ffmpeg -i $input1 -deinterlace -an -ss 0 -t 00:00:10 -r 1 -y -vcodec mjpeg -f mjpeg $tempThumbFile 2>&1");
            FileGarbage::addFile($tempThumbFile);
            if($PATHS->local_only){
                $cmd = "/usr/bin/ffmpeg -i $input1 -i $input2 -i $tempThumbFile -filter_complex \"nullsrc=size="
                    .VIDEOWIDTH."x".VIDEOHEIGHT." [b];[2:v]scale=".(VIDEOWIDTH/2)."x".VIDEOHEIGHT."[img];[b][img]overlay[base];[0:v] setpts=PTS+$promptDuration/TB, scale=".(VIDEOWIDTH/2)."x".VIDEOHEIGHT." [left];[1:v] setpts=PTS-STARTPTS, scale=".(VIDEOWIDTH/2)."x".VIDEOHEIGHT." [right];[base][left] overlay=shortest=1 [tmp1];[tmp1][right]overlay=x=".(VIDEOWIDTH/2)."[v];[1:a][0:a] concat=n=2:v=0:a=1 [a]\" -map [v] -map [a] -async 1 -strict -2 $destFile 2> /dev/null";
            }else{
                $cmd = "/usr/bin/ffmpeg -i $input1 -i $input2 -i $tempThumbFile -filter_complex \"nullsrc=size=".VIDEOWIDTH."x".VIDEOHEIGHT." [b];[2:v]scale=".(VIDEOWIDTH/2)."x".VIDEOHEIGHT."[img];[b][img]overlay[base];[0:v] setpts=PTS+$promptDuration/TB, scale=".(VIDEOWIDTH/2)."x".VIDEOHEIGHT." [left];[1:v] setpts=PTS-STARTPTS, scale=".(VIDEOWIDTH/2)."x".VIDEOHEIGHT." [right];[base][left] overlay=shortest=1 [tmp1];[tmp1][right]overlay=x=".(VIDEOWIDTH/2)."[v];[1:a][0:a] concat=n=2:v=0:a=1 [a]\" -map [v] -map [a] -async 1 $destFile 2> /dev/null";
            }

        }else {
            $cmd = "/usr/bin/ffmpeg -i $input1 -i $input2 -filter_complex \"nullsrc=size=".VIDEOWIDTH."x".VIDEOHEIGHT." [base];[0:v] setpts=PTS-STARTPTS,scale=".(VIDEOWIDTH/2)."x".VIDEOHEIGHT." [left];[1:v] setpts=PTS-STARTPTS,scale=".(VIDEOWIDTH/2)."x".VIDEOHEIGHT." [right];[base][left] overlay=shortest=1 [tmp1];[tmp1][right]overlay=x=".(VIDEOWIDTH/2)."[v];[1:a]apad[r];[0:a][r]amerge[a]\" -map [v] -map [a] $destFile 2> /dev/null ";
        }
        Logger::execDebug($cmd, $out, $ret);
        FileGarbage::addFile($destFile);
        return $destFile;
    }
    private function videoDurationInMilliseconds($file){
        $time = Logger::execDebug("/usr/bin/ffmpeg -i $file 2>&1 | grep 'Duration' | cut -d ' ' -f 4 | sed s/,//");
        return TimeFormatter::convertTimeToMilliseconds($time);
    }
    public function videoDurationInSeconds($file){
        $time = Logger::execDebug("/usr/bin/ffmpeg -i $file 2>&1 | grep 'Duration' | cut -d ' ' -f 4 | sed s/,//");
        $durationParts = explode(":",$time);
        $hours = $durationParts[0];
        $minutes = $durationParts[1];
        $seconds = intval($durationParts[2]);
        $ms = floatval($durationParts[2])-$seconds;
        $duration = ($hours * 3600 + $minutes * 60 + $seconds)+ $ms;
        return $duration;
    }


}
class TimeFormatter
{
    public static function formatMillisecondsToTime($input)
    {
        $uSec = $input % 1000;
        $input = floor($input / 1000);
        $seconds = $input % 60;
        $input = floor($input / 60);
        $minutes = $input % 60;
        $input = floor($input / 60);
        $hours = $input;
        return sprintf("%02d:%02d:%02d.%03d", $hours, $minutes, $seconds, $uSec);
    }

    public static function convertTimeToMilliseconds($input)
    {
        $durationParts = explode(":", $input);
        $hours = $durationParts[0];
        $minutes = $durationParts[1];
        $seconds = intval($durationParts[2]);
        $ms = floatval($durationParts[2])-$seconds;
        return ($hours * 3600 + $minutes * 60 + $seconds) * 1000 + $ms;
    }
}
class Logger{
    public static function debug($message){
        file_put_contents(self::debugFile(), $message."\n", FILE_APPEND);
    }
    public static function execDebug($cmd,&$out=null,&$ret=null){
        if(self::$DEBUG_MODE){
            $resp = exec($cmd, $out, $ret);
            self::debug("Trying command: ".$cmd."\nret: " .$ret."\n");
            return $resp;
        }
    }

    private static function debugFile(){
        return TempFolder::$TEMP_FOLDER.'/'.'debug.log';
    }
    private static $DEBUG_MODE = true;
}
?>