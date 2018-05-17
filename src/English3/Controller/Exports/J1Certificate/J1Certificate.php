<?php
namespace English3\Controller\Exports\J1Certificate;

use Dompdf\Dompdf;
use English3\Controller\Organization\OrganizationController;
use English3\Controller\ProficiencyTest\StudentTest;
use English3\Controller\UserMetaController;
use English3\Controller\Utility;

class J1Certificate
{
    private $userId;
    private $classId;
    private $interviewid;
    private $displayUnofficial = 'block';
    public function get($userId,$classId){
        $dompdf = $this->createPDF($userId,$classId);
        $dompdf->stream($this->interviewid. '_certificate.pdf');

    }
    public static function createCertificateFile($userId,$classId,$official=true){
        global $PATHS;
        $orgId = OrganizationController::_getOrgFromClassId($classId);
        if(!boolval(OrganizationController::_getField($orgId,'enable_certificate'))){
            return '';
        }
        $certificate = new J1Certificate();
        $certificate->setOfficial($official);
        $dompdf = $certificate->createPDF($userId,$classId);
        $filename = $PATHS->app_path . $PATHS->base_site_public_path . 'useruploads/certificate_'.($official?'':'unofficial').'_'.$userId.'-'.$classId.'.pdf';
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
        $certData = $this->loadCertData();
        $dompdf->loadHtml($this->prepareTemplate($certData));

        $dompdf->setPaper('A4');

        $dompdf->render();
        $this->interviewid = $certData['interviewid'];

        return $dompdf;
    }
    public function loadCertData($userId=null,$classId=null){
        if($userId){
            $this->userId = $userId;
        }
        if($classId){
            $this->classId = $classId;
        }
        $data = Utility::getInstance()->fetchRow("SELECT * FROM j1_certificate WHERE userid = ? and classId = ?",[$this->userId,$this->classId]);
        if($data === null){
            return $this->createCertData();
        }
        return $data;
    }
    private function createCertData(){

        $testData = $this->testData($this->userId,$this->classId);

        $userData = $this->userData($this->userId);

        if(!$testData['testName']){
            return;
        }
        Utility::getInstance()->reader->delete('j1_certificate',['userid'=>$this->userId,
            'classid'=>$this->classId]);
        Utility::getInstance()->reader->insert('j1_certificate',[
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
            'interviewid' => $this->userId.'-'.$this->classId,
            'score_description' => $testData['scoreDescription'],
            'evaluatorid' => str_pad($testData['evaluatorId'], 5, '0', STR_PAD_LEFT)

        ]);
        return $this->loadCertData();
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
        $template = str_replace('##score##',$certData['score'],$template);
        $template = str_replace('##score_description##',$certData['score_description'],$template);
        $template = str_replace('##display_unofficial##',$this->displayUnofficial,$template);

        return $template;
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