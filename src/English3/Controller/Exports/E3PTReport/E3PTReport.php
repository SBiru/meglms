<?php
namespace English3\Controller\Exports\E3PTReport;

use Dompdf\Dompdf;
use English3\Controller\Organization\OrganizationController;
use English3\Controller\ProficiencyTest\StudentTest;
use English3\Controller\UserMetaController;
use English3\Controller\Utility;

class E3PTReport
{
    private $userId;
    private $classId;
    private $interviewid;
    private $displayUnofficial = 'block';
    public static function certFileName($userId,$classId,$official=true,$relative=false){
        global $PATHS;
        return ($relative?'':$PATHS->app_path) . $PATHS->base_site_public_path . 'useruploads/certificate_'.($official?'':'unofficial').'_'.$userId.'-'.$classId.'.pdf';
    }
    public function get($userId,$classId){
        $dompdf = $this->createPDF($userId,$classId);
        $dompdf->stream($this->interviewid. '_certificate.pdf');

    }
    public static function createCertificateFile($userId,$classId,$official=true,$relative = false){
        global $PATHS;
        $orgId = OrganizationController::_getOrgFromClassId($classId);
//        if(!boolval(OrganizationController::_getField($orgId,'enable_certificate'))){
//            return '';
//        }
        $certificate = new E3PTReport();
        $certificate->setOfficial($official);
        $dompdf = $certificate->createPDF($userId,$classId);
        $filename = self::certFileName($userId,$classId,$official,$relative);
        if(file_exists($filename)){
            unlink($filename);
        }
        $certificateFile = fopen($filename,'x');
        fwrite($certificateFile,$dompdf->output());
        fclose($certificateFile);
        return $filename;
    }

    public function setOfficial($isOfficial){
        $this->displayUnofficial=$isOfficial?'none':'block';
    }
    public function createPDF($userId,$classId){
        $this->userId = $userId;
        $this->classId = $classId;
        // instantiate and use the dompdf class

        $dompdf = new Dompdf();
        $certData = $this->createCertData();
        $dompdf->loadHtml($this->prepareTemplate($certData));

        $dompdf->setPaper('A4');

        $dompdf->render();
        $this->interviewid = $certData['interviewid'];

        return $dompdf;
    }
    private function createCertData(){

        $testData = $this->testData($this->userId,$this->classId);

        $userData = $this->userData($this->userId);

        if(!$testData['testName']){
            return;
        }
        return [
            'userid'=>$this->userId,
            'classid'=>$this->classId,
            'user_name' => $userData['name'],
            'user_picture' => $testData['userPicture'],
            'email' => $userData['email'],
            'nationality' => $userData['nationality'],
            'institution' => $userData['institution'] . (@$userData['ceeb']?" ({$userData['ceeb']})":''),
            'applicantid' => $userData['applicantid'],
            'date_of_birth' => date('d M Y',strtotime( $userData['date_of_birth'])),
            'language' => $userData['language'],
            'interview_date' => date('d M Y',strtotime( $testData['submittedOn'])),
            'score' => $testData['actualTotalScore'],
            'areas'=> $testData['pageGroups'],
            'interviewid' => $this->userId.'-'.$this->classId,
            'score_description' => $testData['scoreDescription'],
            'evaluatorid' => str_pad($testData['evaluatorId'], 5, '0', STR_PAD_LEFT)

        ];
    }

    private function prepareTemplate($certData){
        global $PATHS;
        $qrCodeFilename = $this->getQRCode($certData);
        $template = file_get_contents(__DIR__ . '/template/certificate.html');
        $template = str_replace('##logo##',$PATHS->app_path .'/src/English3/Controller/Exports/J1Certificate/template/green-logo.png',$template);
//        $template = str_replace('##qrcode##',$PATHS->app_path .'/src/English3/Controller/Exports/J1Certificate/template/QR_code_for_mobile_English_Wikipedia.svg.png',$template);
        $template = str_replace('##qrcode##',$qrCodeFilename,$template);
        $template = str_replace('##user_picture##',$PATHS->app_path .$certData['user_picture'],$template);
        $template = str_replace('##name##',$certData['user_name'],$template);
        $template = str_replace('##email##',$certData['email'],$template);
        $template = str_replace('##nationality##',$certData['nationality'],$template);
        $template = str_replace('##institution##',$certData['institution'],$template);
        $template = str_replace('##interviewid##',$certData['interviewid'],$template);
        $template = str_replace('##applicantid##',$certData['applicantid'],$template);
        $template = str_replace('##date_of_birth##',$certData['date_of_birth'],$template);
        $template = str_replace('##language##',$certData['language'],$template);
        $template = str_replace('##interview_date##',$certData['interview_date'],$template);
        $template = str_replace('##evaluatorid##',$certData['evaluatorid'],$template);
        $template = str_replace('##score_table##',$this->prepareScoreTable($certData),$template);
        $template = str_replace('##areas_table##',$this->prepareAreasTable($certData),$template);
        $template = str_replace('##display_unofficial##',$this->displayUnofficial,$template);

        return $template;
    }
    private function prepareScoreTable($certData){
        $header = ['<th>E3PT Score</th>'];
        $scores = ["<th>{$certData['score']}</th>"];
        foreach ($certData['areas'] as $i=>$area){
            $className = 'no-border';
            if($i== (count($certData['areas'])-1)){
                $className.=' border-left';
            }
            $header[] = "<th class='{$className}'>{$area['name']}</th>";
            $scores[] = "<th class='{$className}'>{$area['actualScore']}</th>";
        }
        $header = '<tr>'.implode('',$header).'</tr>';
        $scores = '<tr>'.implode('',$scores).'</tr>';
        return $header.$scores;
    }
    private function prepareAreasTable($certData){
        $areas = [];
        foreach ($certData['areas'] as $area){
            $areas[] = "
<tr>
    <td>{$area['name']}</td>
    <td>{$area['level']}</td>
    <td>{$area['details']}</td>
</tr>";
        }
        return implode('',$areas);
    }

    private function getQRCode($certData){
        global $PATHS;
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, 'https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=http%3A%2F%2Fenglish3.com%2Fvalidate%2F%23!%2Finterview%3Finterviewid%3D'.$certData['interviewid'].'&choe=UTF-8');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        $response = curl_exec($ch);
        curl_close ($ch);
        $saveto = $PATHS->app_path .'/src/English3/Controller/Exports/J1Certificate/template/certificate_'.$certData['interviewid'].'.png';
        if(file_exists($saveto)){
            unlink($saveto);
        }
        $fp = fopen($saveto,'x');
        fwrite($fp, $response);
        fclose($fp);
        return $saveto;
    }
    private function userData($userId){
        $data = UserMetaController::get($userId);
        unset($data['institution']);
        $data = array_merge($data,Utility::getInstance()->fetchRow($this->queryUser,['userId'=>$userId]));
        return $data;
    }
    private function testData($userId,$classId){
        $test = new StudentTest($classId,$userId);
        return $test->load();
    }

    private $queryUser = <<<SQL
    SELECT concat(lname, ', ',fname) as name, u.email, u.id as applicantid,date_of_birth,o.name as institution,u.organizationid,o.ceeb FROM users u
    join organizations o on o.id = u.organizationid 
    where u.id = :userId
SQL;

}