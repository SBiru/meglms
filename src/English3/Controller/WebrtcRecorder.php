<?php
/**
 * Created by IntelliJ IDEA.
 * User: denny
 * Date: 9/15/17
 * Time: 5:21 PM
 */

namespace English3\Controller;


use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class WebrtcRecorder
{
    public function startRecording($streamName){
        global $VIDEO;
        $extraOptions = [];
        if(@$_REQUEST['option']){
            $extraOptions['option'] = $_REQUEST['option'];
        }
        if(@isset($_REQUEST['segment'])){
            $extraOptions['segment'] = $_REQUEST['segment'];
        }
        return new Response($this->curl(
            $VIDEO->wowzaServerUrl.$this->createRecorderRESTUrl.$streamName,
            $this->curlCreateRecorderData($streamName,$extraOptions))
        );
    }
    public function stopRecording($streamName){
        global $VIDEO,$PATHS;
        $restUrl = str_replace('__stream__',$streamName,$this->stopRecorderRESTUrl);
        $res = $this->curl(
            $VIDEO->wowzaServerUrl.$restUrl,
            '',
            'PUT'
        );
        $maxTries = 2;
        if($PATHS->local_only){
            $filename = $PATHS->app_path . '/public/img/small.flv';
        }else {

            $filename = '/wowzaMediaContent/content/' . $streamName . '.flv';
        }
        $log = [];
        $flushed = file_exists($filename) && filesize($filename) > 200;


        while(!$flushed && $maxTries>0){
            $maxTries--;
            $log[]=['attempt'=>$maxTries,'res'=>$res,'time'=>date('Y-m-d H:i:s'),'file_exists'=>file_exists
            ($filename),'filesize'=>filesize($filename),'filename'=>$filename];
            $res = $this->tryToFlush($streamName);
            $maxTries2 = 2;
            while(!$flushed && $maxTries2>0){
                sleep(1);
                $flushed = file_exists($filename) && filesize($filename) > 200;
                $maxTries2--;
            }

        }
        if($flushed){
            return new Response($res);
        }else{
            return Utility::buildHTTPError('Could not process video',500,['res'=>$res,'url'=>$restUrl,'log'=>$log]);
        }

    }
    public function checkStreamSize($streamName,$echo=true){
        return new JsonResponse(['size'=>filesize('/wowzaMediaContent/content/'.$streamName.'.flv')]);
    }
    public function checkStreamStatus($streamName,$echo=true){
        global $VIDEO;
        $dataJson = json_decode($this->curl($VIDEO->wowzaServerUrl.$this->listStreamsRESTUrl,'','GET'),true);
        $streamInfo = null;
        $recorderInfo = null;
        foreach ($dataJson['instanceList'][0]['incomingStreams'] as $stream){
            if($stream['name']==$streamName){
                $streamInfo = $stream;
            }
        }
        foreach ($dataJson['instanceList'][0]['recorders'] as $recorder) {
            if ($recorder['recorderName'] == $streamName) {
                $recorderInfo = $recorder;
            }
        }
        $data = ['stream'=>$streamInfo,'recorder'=>$recorderInfo];
        if($echo){
            return new JsonResponse($data);
        }else{
            return $data;
        }

    }
    public function convertMp4($streamName){
        return new JsonResponse(['file'=>self::_convertMp4($streamName)]);
    }

    public static function _convertMp4($streamName,$fullPath=false){
        $flv_file_name = ($fullPath?'':'/wowzaMediaContent/content/').$streamName.'.flv';
        $mp4_file_name = ($fullPath?'':'/wowzaMediaContent/content/').$streamName.'.mp4';
        if(file_exists($flv_file_name)){
            $mp4convert = "/usr/bin/ffmpeg -y -i " . $flv_file_name . " -vcodec libx264 -crf 23 -preset medium -vsync 1 -r 25 -acodec aac -strict -2 -b:a 64k  -ar 44100 -ac 1 " . $mp4_file_name ;
            exec($mp4convert);
            if(file_exists($mp4_file_name)){
                return $mp4_file_name;
            }
        }
    }
    private function curl($url,$data_string,$method='POST'){
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data_string);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, array(
                'Content-Type: application/json',
                'Content-Length: ' . strlen($data_string),
                'Accept: application/json')

        );
        $res = curl_exec($ch);
        curl_close($ch);
        return $res;
    }
    private function tryToFlush($streamName){
        global $VIDEO;
        $res1  = $this->curl(
            $VIDEO->wowzaServerUrl.$this->createRecorderRESTUrl.$streamName,
            $this->curlCreateRecorderData($streamName,['option'=>'append'])
        );
        $ok = boolval($this->checkStreamStatus($streamName,false)['stream']);
        while(!$ok){
            sleep(1);
            $ok = boolval($this->checkStreamStatus($streamName,false)['stream']);
        }
        $restUrl = str_replace('__stream__',$streamName,$this->stopRecorderRESTUrl);
        $res2 = $this->curl(
            $VIDEO->wowzaServerUrl.$restUrl,
            '',
            'PUT'
        );

        return [$res1,$res2];
    }
    private function curlCreateRecorderData($streamName,$params = array()){
        $options = array_merge($this->defaultOptions,$params);
        if(@isset($options['segment'])){
            $streamName.='_'.$options['segment'];
        }
        return '{
  "instanceName": "",
  "fileVersionDelegateName": "",
  "serverName": "",
  "recorderName": "'.$streamName.'",
  
  "currentSize": 0,
  "segmentSchedule": "",
  "startOnKeyFrame": true,
  "outputPath":"/usr/local/WowzaStreamingEngine/content",
  "baseFile":"'.$streamName.'.flv",
  "fileFormat":"FLV",

  "saveFieldList": [
    ""
  ],

  "recordData": true,
  "applicationName": "webrtc",
  "moveFirstVideoFrameToZero": true,
  "recorderErrorString": "",
  "segmentSize": 0,
  "defaultRecorder": false,
  "splitOnTcDiscontinuity": false,
  "version": "",
  "baseFile": "",
  "segmentDuration": 0,
  "recordingStartTime": "",
  "fileTemplate": "${BaseFileName}_${SegmentNumber}",
  "backBufferTime": 0,
  "segmentationType": "",
  "currentDuration": 0,

  "recorderState": "",
  "option": "'.$options['option'].'"
}';
    }
    private $defaultOptions = ['option'=>'overwrite'];
    private $createRecorderRESTUrl = 'v2/servers/_defaultServer_/vhosts/_defaultVHost_/applications/webrtc/instances/_definst_/streamrecorders/';
    private $stopRecorderRESTUrl = 'v2/servers/_defaultServer_/vhosts/_defaultVHost_/applications/webrtc/instances/_definst_/streamrecorders/__stream__/actions/stopRecording';
    private $listStreamsRESTUrl = 'v2/servers/_defaultServer_/vhosts/_defaultVHost_/applications/webrtc/instances';
}