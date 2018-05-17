<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.13.6
 * Time: 08:17
 */

namespace English3\Controller\AutomatedAlerts\Alerts;




class AlertTypes {
    private static $type;
    private function __construct($type){
        self::$type = $type;
    }
    public static function getAlertClass(){
        return self::$type;
    }
    public static function fromString($type){
        if(!self::$acceptableTypes[$type]){
            throw new AlertTypeException("Invalid alert type ". $type);
        }
        return new self(self::$acceptableTypes[$type]);
    }

    public static $acceptableTypes = array(
        'PERC_BEHIND'=>'\English3\Controller\AutomatedAlerts\Alerts\BehindInCourses',
        'NOT_LOGGED_IN'=>'\English3\Controller\AutomatedAlerts\Alerts\NotLoggedIn',
        'AVG_COURSE_GRADE'=>'\English3\Controller\AutomatedAlerts\Alerts\AvgCourseGrade',
        'TARGET_BEHIND'=>'\English3\Controller\AutomatedAlerts\Alerts\TargetBehind',
        'FINAL_EXAM'=>'\English3\Controller\AutomatedAlerts\Alerts\FinalExam',
        'MISSING_ATTENDANCE'=>'\English3\Controller\AutomatedAlerts\Alerts\MissingAttendance',
        'NEW_STUDENTS'=>'\English3\Controller\AutomatedAlerts\Alerts\NewStudents',
        'WITHDRAWN_STUDENTS'=>'\English3\Controller\AutomatedAlerts\Alerts\WithdrawnStudents',
        'ASSIGNMENT_AVG'=>'\English3\Controller\AutomatedAlerts\Alerts\AvgAssignmentGrade'
    );
}
class AlertTypeException extends \Exception{}