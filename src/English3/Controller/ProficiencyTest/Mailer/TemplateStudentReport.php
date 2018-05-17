<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.16.8
 * Time: 19:39
 */

namespace English3\Controller\ProficiencyTest\Mailer;


use English3\Controller\ProficiencyTest\TestAttempts;

class TemplateStudentReport {
    private $studentTest;
    private $html;
    public function __construct($studentTest){
        $this->studentTest = $studentTest;
    }
    public function attachment(){
        global $PATHS;
        if(@$this->studentTest['idImage'] && file_exists($PATHS->app_path . $this->studentTest['idImage'])){
            return $PATHS->app_path . $this->studentTest['idImage'];
        }
    }
    public function createReport(){
        $this->html = '<div style="border: 1px solid #ddd;padding: 15px;">';
        $this->topContent();
        $this->testDetails();
        $this->html .= '</div>';
        return $this->html;
    }
    private function topContent(){
        $this->html .= '<div style="padding: 0 12px;">';
        $this->html .= '    <table style="width: 100%">';
        $this->html .= '        <tbody>';
        $this->html .= '            <tr>';
        $this->html .= '                <td style="vertical-align: middle;position: relative; width: 70%">';
        $this->studentInfo();
        $this->testSummary();
        $this->html .= '                </td>';
        $this->html .= '            </tr>';
        $this->html .= '        </tbody>';
        $this->html .= '    </table>';
        $this->html .= '</div>';
    }
    private function studentInfo(){
        $this->html .= '<div style="font-size: 25px;font-weight: bold;">' . $this->studentName() .'</div>';
        $this->html .= '<div style="font-size: 18px;">';
        $this->html .= '<div><span>' . $this->studentEmail() .'</span></div></div>';
    }
    private  function studentName(){
        return $this->studentTest['fname'] . ' ' . $this->studentTest['lname'];
    }
    private function studentEmail(){
        return TestAttempts::prepareEmail($this->studentTest['email']);
    }
    private function testSummary(){
        $this->html .= '<div style=" margin-top: 20px;position: relative;bottom: 0;  padding: 10px;border: 3px solid #dfdfdf;">';
        $this->html .= '    <div style="font-weight: bold;color: #5FC04F;font-size: 17px;">' . $this->testSummaryTop() . '</div>';
        $this->html .= '    <table style="border-collapse: collapse;width: 100%">';
        $this->html .= '        <tbody>';
        $this->html .= '            <tr>';
        $this->testSummaryAreaColumns();
        $this->testSummaryTotal();
        $this->html .= '            </tr>';
        $this->html .= '        </tbody>';
        $this->html .= '    </table>';
        $this->html .= '</div>';
    }
    private function testSummaryTop(){
        return $this->studentTest['testName'] . ' - ' . $this->studentTest['submittedOn'];
    }
    private function testSummaryAreaColumns(){
        foreach($this->studentTest['pageGroups'] as $pg){
            $this->html .= '<td style="    width: 20%;     border-top: initial;     text-align: center;     font-weight: bold;     color: #B1B1B1;     padding: 3px;     vertical-align: middle;">';
            $this->html .= '    <div>'. $pg['name'] .'</div>';
            $this->html .= '    <div >'. $pg['actualScore'] . '/' . $pg['maxScore'] .'</div>';
            $this->html .= '</td>';
        }
    }
    private function testSummaryTotal(){
        $this->html .= '<td style="    width: 20%;     border-top: initial;     text-align: center;     font-weight: bold;     color: #7D7D7D;     padding: 3px;     vertical-align: middle;">';
        $this->html .= '    <div>Total</div>';
        $this->html .= '    <div >'. $this->studentTest['actualTotalScore'] . '/' . $this->studentTest['maxTotalScore'] .'</div>';
        $this->html .= '</td>';
    }
    private function testDetails(){
        $this->html .= '<div style="padding: 0 15px;padding-top: 20px;">';
        $this->proficiencyAreaScoreLevel();
        $this->html .= '</div>';
    }
    private function proficiencyAreaScoreLevel(){
        foreach($this->studentTest['pageGroups'] as $pg){
            if(!$pg['area']){ continue; }
            $this->html .='<table style="width: 100%;border-collapse: collapse">';
            $this->html .='    <tbody>';
            $this->html .='        <tr>';
            $this->html .='            <th style="text-align: left; color: #5FC04F;background-color: #F7F7F7;width: 220px;border: 1px solid #ddd;padding: 4px;line-height: 1.42857143;vertical-align: top;">' . $pg['name']. ' Skills</th>';
            $this->html .='            <th style="text-align: left; color: #5FC04F;background-color: #F7F7F7;width: 150px;border: 1px solid #ddd;padding: 4px;line-height: 1.42857143;vertical-align: top;">Level</th>';
            $this->html .='            <th style="text-align: left; color: #5FC04F;background-color: #F7F7F7;width: 150px;border: 1px solid #ddd;padding: 4px;line-height: 1.42857143;vertical-align: top;">Comments</th>';
            $this->html .='        </tr>';
            $this->html .='        <tr>';
            $this->html .='            <td style="border: 1px solid #ddd;padding: 4px;     line-height: 1.42857143;">'. $pg['area'] .'</td>';
            $this->html .='            <td style="border: 1px solid #ddd;padding: 4px;     line-height: 1.42857143;">'. $pg['level'] .'</td>';
            $this->html .='            <td style="border: 1px solid #ddd;padding: 4px;     line-height: 1.42857143;">'. $pg['details'] .'</td>';
            $this->html .='        </tr>';
            $this->html .='    </tbody>';
            $this->html .='</table>';
        }
    }
}