<?php

namespace English3\Controller;

use Doctrine\DBAL\Connection;
use English3\Model\User;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class ClassMetaController{
    private $read;

    public function __construct(Connection $read)
    {
        $this->read = $read;
        if (isset($_SESSION['USER']) && isset($_SESSION['USER']['ID'])) {
            $this->userId = $_SESSION['USER']['ID'];
            $this->loggedIn = true;
        } else {
            $this->loggedIn = false;
        }
    }
    public function checkUser(){
        if (!$this->loggedIn) {
            throw new BadRequestHttpException('Not logged in');
        }
    }
    public static function unsetTeacherProfile($classId){
        $u = Utility::getInstance();
        $courseId = ClassesController::_getCourseId($classId);
        $fields = ['office_hours','v_office_hours','v_office_url','profile_picture','teacher'];
        foreach ($fields as $field){
            $u->reader->delete('class_meta',['classid'=>$courseId,'meta_key'=>$field]);
        }
    }
    public static function setTeacherProfile($classId,$teacherId){
        self::unsetTeacherProfile($classId);
        $u = Utility::getInstance();
        $courseId = ClassesController::_getCourseId($classId);
        $userMeta = UserMetaController::_get($teacherId);
        $fields = ['office_hours','v_office_hours','v_office_url','profile_picture'];
        $u->reader->insert('class_meta',['classid'=>$courseId,'meta_key'=>'teacher','meta_value'=>$teacherId]);
        $u->reader->insert('class_meta',['classid'=>$courseId,'meta_key'=>'show_for_student','meta_value'=>1]);
        foreach ($fields as $field){
            if(@isset($userMeta[$field])){
                $u->reader->insert('class_meta',['classid'=>$courseId,'meta_key'=>$field,'meta_value'=>$userMeta[$field]]);
            }
        }
    }

    public function save(Request $request,$id){
        $this->checkUser();
        $body = json_decode($request->getContent(),true);
        $oldValues = $this->getMeta($request,$id,false);
        unset($body['classId']);
        foreach(array_keys($body) as $key){
            if(array_key_exists($key,$oldValues)){
                $this->read->update('class_meta',['meta_value'=>$body[$key]],['id'=>$oldValues[$key]['meta_id']]);
            }
            else{
                $this->read->insert('class_meta',['classid'=>$id,'meta_key'=>$key,'meta_value'=>$body[$key]]);
            }
        }
        return new JsonResponse(['status'=>'success']);
    }

    public function getMeta(Request $request,$id,$echo=true){
        $this->checkUser();

        $body = json_decode($request->getContent(),true);

        $query = 'select id,meta_key,meta_value from class_meta
                  where classid=:id';
        $prepare = ['id'=>$id];
        if(count($body)>0) {
            $keys =implode("','",array_keys($body));
            $query .= " and meta_key in ('{$keys}')";

        }

        $data = $this->read->fetchAll($query, $prepare);

        $meta = array(''=>'');
        if($data) {
            foreach ($data as $row) {
                if($row['meta_key']==='ignore_profile'){
                    $row['meta_value'] = boolval($row['meta_value']);
                }
                $meta[$row['meta_key']] = array('meta_id' => $row['id'], 'meta_value' => $row['meta_value']);
            }
        }

        if($meta['teacher'] && !$meta['ignore_profile']['meta_value']){
            $meta['v_office_hours'] = ['meta_value'=> UserMetaController::getField($meta['teacher']['meta_value'],'v_office_hours')];
            $meta['office_hours'] = ['meta_value'=> UserMetaController::getField($meta['teacher']['meta_value'],'office_hours')];
            $meta['v_office_url'] = ['meta_value'=> UserMetaController::getField($meta['teacher']['meta_value'],'v_office_url')];

        }

        if($echo) return new JsonResponse($meta);
        return $meta;
    }
    public function deleteMeta(Request $request,$id){
        $this->checkUser();
        $body = json_decode($request->getContent(),true);
        $oldValues = $this->getMeta($request,$id,false);
        foreach(array_keys($body) as $key){
            if(array_key_exists($key,$oldValues)){
                $this->read->delete('class_meta',['id'=>$oldValues[$key]['meta_id']]);
            }
        }
        return new JsonResponse(['status'=>'success']);
    }
}
?>