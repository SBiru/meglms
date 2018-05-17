<?php
namespace English3\Controller\ProficiencyTest\Exporter;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;

require_once $_SERVER['DOCUMENT_ROOT'].'/lib/fpdf/fpdf.php';

class PdfExporter extends \FPDF {
    private $GARBAGE_FILES=array();
    public function fromImageData($data){
        if(gettype($data)!='array'){
            $data=[$data];
        }
        $pdf = new \FPDF();
        $pdf->AddPage('l');
        $pdf->SetCompression(false);
        $this->addImagesToPdf($pdf,$data);

        $fileContent = $pdf->Output('S');
        $this->clearGarbage();
        return $this->buildFileResponse($fileContent,'test.pdf');
    }
    private function clearGarbage(){
        array_walk($this->GARBAGE_FILES,function($f){
            unlink($f);
        });
    }
    private function addImagesToPdf(\FPDF $pdf,$images){
        foreach($images as $image){

            $imageName = $this->imageFromData($image);
            $size = getimagesize($imageName);
            $pdf->Image($imageName,0,0,$size[0]/2.83);

        }
    }
    private  function imageFromData($data){
        global $PATHS;
        list($type, $data) = explode(';', $data);
        list(, $data)      = explode(',', $data);
        $data = base64_decode($data);
        $im = imagecreatefromstring($data);
        if($im){
            $finfo = new \finfo(FILEINFO_MIME_TYPE);
            $img_type = $finfo->buffer($data);
            $date=new \DateTime();
            $filename = 'tmp_img'.$date->format("YmdHis");
            $savedFilename = $this->saveImage($img_type,$im,$PATHS->app_path . $PATHS->base_site_public_path . "useruploads/" . $filename);
            imagedestroy($im);
            $this->GARBAGE_FILES[]=$savedFilename;
            return $savedFilename;
        }
    }
    private function saveImage($img_type,$im,$filename){
        if(!substr($img_type,0,8)=='image/'){
            return false;
        }
        $ext = explode('/',$img_type)[1];
        switch($ext){
            case 'png':
                $filename.='.png';
                imagepng($im,$filename);
                return $filename;
            case 'jpeg':
                $filename.='.jpg';
                imagejpeg($im,$filename);
                return $filename;
            case 'gif':
                $filename.='.gif';
                imagegif($im,$filename);
                return $filename;
            default:
                return false;
        }
    }
    private function buildFileResponse($content,$filename){
        $headers = array(
            'Content-Description'=>'File Transfer',
            'Content-Type'=>'application/octet-stream',
#            'Content-Disposition'=> 'attachment, filename=S3S.cfg',
            'Content-Length'=> ''.strlen($content),
            'Cache-Control'=> 'must-revalidate, post-check=0, pre-check=0',
            'Expires'=> '0',
            'Pragma'=> 'public',
        );
        $response = new Response($content,200,$headers);
        $d = $response->headers->makeDisposition(
            ResponseHeaderBag::DISPOSITION_ATTACHMENT,
            $filename
        );
        $response->headers->set('Content-Disposition', $d);
        return $response;
    }
}