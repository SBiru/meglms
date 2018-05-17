<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.2.9
 * Time: 07:44
 */

namespace English3\Controller\TimedReview\Test;


//class FakeStudentResponse {
//    public function prompts(){
//        $json = '[{"id":"11","answer":"","prompt":"","shortPrompt":"","type":"audio","time_limit":null,"time_pause":null,"groupid":"4","audioFile":"2016-09-02-26-mktfepbwoo.mp3"},{"id":"1","answer":"","prompt":"<p>This is a test</p>\n","shortPrompt":"<p>This is a test</p>\n","type":"video","time_limit":null,"time_pause":null,"groupid":"4","videoFile":"/public/uservids/Mike_Griffiths_02Sep2016_958am.mp4","videoThumbnailFile":"/public/uservidthumbnails/Mike_Griffiths_02Sep2016_958am.jpg"},{"id":"19","answer":"","prompt":"<p><span style=\"font-size: 26px; line-height: 41.6px;\">Teach the grammar principle in this section in 60 seconds or less.</span></p>\n","shortPrompt":"<p><span style=\"font-size: 26p...","type":"text","time_limit":null,"time_pause":null,"groupid":"4"}]';
//        return json_decode($json);
//    }
//    public function studentVideo(){
//        global $PATHS;
//        return $PATHS->app_path.'/public/timed-reviews-tmp/2016-08-18-55-ynvwajjule';
//    }
//    public function answerTimePositions(){
//        $json = '[{"timeStarted":1472834256399,"timeStopped":1472834258449,"duration":2050},{"timeStarted":1472834258449,"timeStopped":1472834259825,"duration":1376},{"timeStarted":1472834259825,"timeStopped":1472834265679,"duration":5854}]';
//        return json_decode($json);
//    }
//}
class FakeStudentResponse {
    public function prompts(){
        $json = '[{"id":"204","answer":"","prompt":"<p><span style=\"font-size:26px;\">Listen to&nbsp;and answer the question.</span></p>\n","shortPrompt":"<p><span style=\"font-size:26px...","type":"audio","time_limit":"45","time_pause":"2","groupid":"54","audioFile":"2016-05-27-58-gdvwulzjtr.mp3"},{"id":"202","answer":"","prompt":"<p><span style=\"font-size:26px;\">Listen to the group and add to what they have been saying.</span></p>\n","shortPrompt":"<p><span style=\"font-size:26px...","type":"video","time_limit":"40","time_pause":"3","groupid":"53","videoFile":"/public/uservids/Matthew_Heiner_27May2016_1132am.mp4","videoThumbnailFile":"/public/uservidthumbnails/Matthew_Heiner_27May2016_1132am.jpg"},{"id":"168","answer":"","prompt":"<p><span style=\"font-size:26px;\">Teach the grammar principle in this section in 60 seconds or less.</span></p>\n","shortPrompt":"<p><span style=\"font-size:26px...","type":"text","time_limit":"60","time_pause":null,"groupid":"48"}]';
        return json_decode($json);
    }
    public function studentVideo(){
        global $PATHS;
        return $PATHS->app_path.'/public/timed-reviews-tmp/2016-09-02-01-ewczdczusg';
    }
    public function answerTimePositions(){
        $json = '[{"timeStarted":1472827578350,"timeStopped":1472827580891,"duration":2541},{"timeStarted":1472827582897,"timeStopped":1472827584068,"duration":1171},{"timeStarted":1472827587071,"timeStopped":1472827588880,"duration":1809}]';
        return json_decode($json);
    }
}