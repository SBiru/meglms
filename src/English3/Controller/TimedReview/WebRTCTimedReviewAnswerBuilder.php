<?php

namespace English3\Controller\TimedReview;

use English3\Controller\WebrtcRecorder;


class WebRTCTimedReviewAnswerBuilder extends TimedReviewAnswerBuilder
{

    protected function createNextPromptAnswerChunk($promptPosition){
        $prompt = $this->prompts[$promptPosition];
        if(!$prompt->isInformation){
            if($this->answeredOnlyPromptPosition==0){
                $answerChunk = $this->studentVideoFile;
            }else{
                $filename = basename($this->studentVideoFile,'.mp4');
                $answerChunk = WebrtcRecorder::_convertMp4($filename. $this->version_sufix($this->answeredOnlyPromptPosition));
            }
            if(!$answerChunk) return null;
        };

        $promptFileName = $this->getPromptFileName($prompt);
        if(file_exists($promptFileName)){
            if($prompt->isInformation){
                if($prompt->type=='audio'){
                    $mp4File = PromptAnswerJoiner::convertMp3ToMp4($promptFileName,$this->createImageFromPrompt($prompt));
                    return file_exists($mp4File)?$mp4File:false;
                }
                if($prompt->type=='video'){
                    return $promptFileName;
                }
                if($prompt->type=='text'){
                    $duration = 5;
                    if($this->timeToPrepareValues[$promptPosition]){
                        $duration = $this->timeToPrepareValues[$promptPosition];
                    }
                    return PromptAnswerJoiner::createVideoFromImage($this->createImageFromPrompt($prompt),$duration);
                }
                return false;
            }
            $answerChunk = $this->joiner->createMergedChunkForType($this->timeToPrepareValues[$promptPosition],$promptFileName,$answerChunk,$prompt->type);
        }
        return $answerChunk;
    }
    private function version_sufix($position){

        return '_' . ($position - 1);
    }
}