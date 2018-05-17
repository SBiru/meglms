<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.18.8
 * Time: 20:37
 */

namespace English3\Controller\VideoRecorder;


use English3\Controller\TimedReview\TimedReviewAnswerBuilder;
use English3\Controller\Utility;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

class ReprocessVideos {
    private $tmpFlvFolder = '/public/uservidstmpflv/';
    private $vidsFolder = '/public/uservids/';
    private $forceOverwrite;
    private $includeThumbnail;
    private $log;
    public function appendPrompts(Request $request,$failId){
        $processer = new ReprocessAppendPrompt($failId);
        return new JsonResponse($processer->start());
    }
    public function appendPromptsFromData(Request $request){
        Utility::clearPOSTParams($request);
        $processer = new ReprocessAppendPrompt(0);
        $processer->setData($request->request->all());
        return new JsonResponse($processer->reprocess());
    }
    public function reprocess(Request $request){
        Utility::clearPOSTParams($request);
        $query = $this->prepareQueryFilters($request);
        if(!$query){
            return new Response("Make sure you are using at least one filter. \n classId,userId,pageId,postId");
        }
        $posts = Utility::getInstance()->fetch($query);
        $this->forceOverwrite = boolval($request->request->get('forceOverwrite'));
        $this->includeThumbnail = boolval($request->request->get('includeThumbnail'));
        $this->log=array(
            'success'=>array(),
            'error'=>array(),
            'debug'=>array()
        );
        $fileType = $request->request->get('type')?:'flv';
        $this->reprocessPostVideos($posts,$fileType);

        return new JsonResponse($this->log);
    }
    private function prepareQueryFilters(Request $request){
        $filters = '';
        $filters.= $request->request->get('classId')?" and p.classid = ".$request->request->get('classId'):'';
        $filters.= $request->request->get('pageId')?" and p.pageid = ".$request->request->get('pageId'):'';
        $filters.= $request->request->get('postId')?" and p.id = ".$request->request->get('postId'):'';
        $filters.= $request->request->get('userId')?" and p.userid = ".$request->request->get('userId'):'';
        if($filters == '')
        {
            return false;
        }
        return $this->queryGetPosts.$filters;
    }
    private function reprocessPostVideos($posts,$fileType){
        foreach($posts as $post){
            $this->log['debug'][]=$post;
            if($originalFile = $this->getOriginalFile($post['video_url'],$fileType)){
                if($this->isCurrentMp4Valid($post['video_url']) && !$this->forceOverwrite){
                    continue;
                }
                $this->reprocessVideo($originalFile,$post['video_url']);
                
            }
        }
    }
    private function getOriginalFile($video_url,$fileType){
        global $PATHS;
        $filename = str_replace('mp4',$fileType,basename($video_url));
        if(file_exists($PATHS->app_path.$this->tmpFlvFolder.$filename)){
            return $PATHS->app_path.$this->tmpFlvFolder.$filename;
        }
        if(file_exists($PATHS->app_path.$this->vidsFolder.$filename)){
            return $PATHS->app_path.$this->vidsFolder.$filename;
        }
        return false;
    }
    private function isCurrentMp4Valid($video_url){
        global $PATHS;
        return file_exists($PATHS->app_path.$video_url) && filesize($PATHS->app_path.$video_url)>0;
    }
    private function reprocessVideo($originalFile,$video_url){
        global $PATHS;
        $mp4convert = "/usr/bin/ffmpeg -y -i " . $originalFile . " -s 160x120 -ar 11025 -r 15 -maxrate 5k  -vb 100k " . $PATHS->app_path.$video_url;
        exec($mp4convert, $out, $ret);
        if($ret != 0){
            $this->log['error'][]=$mp4convert;
        }else{
            $this->log['success'][]=$mp4convert;
        }
    }


    private $queryGetPosts = <<<SQL
    SELECT video_url,video_thumbnail_url FROM posts p
    where video_url != ''
SQL;

}
Class ReprocessAppendPrompt {
    private $failId;
    private $timeToPrepareValues;
    private $prompts;
    private $answerTimePositions;
    private $studentVideoFile;
    public function __construct($failId,$isWebrtc)
    {
        $this->failId = $failId;
    }
    public function start(){
        $this->getInfo();
        return $this->reprocess();
    }
    public function setData($info){
        $this->timeToPrepareValues = json_decode($info['time_to_prepare_values']);
        $this->prompts = json_decode($info['prompts']);
        $this->answerTimePositions = json_decode($info['answer_time_positions']);
        $this->studentVideoFile = $info['video_url'];
    }
    private function getInfo(){
        $info = Utility::getInstance()->fetchRow($this->queryGetTimedInfo,['id'=>$this->failId]);
        $this->setData($info);
    }
    public function reprocess(){
        $builder = new TimedReviewAnswerBuilder($this->timeToPrepareValues,$this->prompts,$this->answerTimePositions,
            $this->studentVideoFile);
        //$this->adjustAnswerDuration($builder);
        return $builder->buildAnswer();
    }
    private function adjustAnswerDuration(TimedReviewAnswerBuilder $builder){
        $videoDuration = $builder->videoDurationInSeconds($this->studentVideoFile)*1000;
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

    private $queryGetTimedInfo = <<<SQL
    SELECT * FROM fail_timed_review_videos where id = :id
SQL;

}