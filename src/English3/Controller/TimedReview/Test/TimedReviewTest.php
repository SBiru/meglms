<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.2.9
 * Time: 07:41
 */

namespace English3\Controller\TimedReview\Test;


use English3\Controller\TimedReview\TimedReviewAnswerBuilder;
use English3\Controller\Utility;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

class TimedReviewTest {
    private $studentResponse;
    private $logger;
    public function __construct(){
        $this->studentResponse = new FakeStudentResponse();
        $this->logger = new Logger();
    }
    public function run(Request $request){
        $mp4File = $this->convertMp4();
        $mp4FileWithPrompts = $this->testAppendPrompts($mp4File);

        unlink($mp4File);
        unlink($mp4FileWithPrompts);
        return new Response($this->logger->writeResponse());
    }
    private function convertMp4(){
        $mp4FileName = $this->studentResponse->studentVideo().'.mp4';
        Utility::convertToMp4($this->studentResponse->studentVideo().'.flv',$mp4FileName,false);
        $this->logger->addStep('Converting flv to mp4',filesize($mp4FileName)>500);
        return $mp4FileName;
    }
    private function testAppendPrompts($mp4File){
        $builder = new TimedReviewAnswerBuilder($this->studentResponse->prompts(),$this->studentResponse->answerTimePositions(),$mp4File);
        $mp4FileWithPrompts = $builder->buildAnswer();
        $this->logger->addStep('Appending prompts',filesize($mp4FileWithPrompts)>500);
        return $mp4FileWithPrompts;
    }
}
