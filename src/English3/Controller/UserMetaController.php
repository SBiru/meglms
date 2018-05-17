<?php

namespace English3\Controller;

use Doctrine\DBAL\Connection;
use Phinx\Util\Util;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class UserMetaController{
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
    public function save(Request $request,$id){
        $this->checkUser();
        $body = json_decode($request->getContent(),true);
        $oldValues = $this->getMeta($request,$id,false);
        unset($body['userId']);
        foreach(array_keys($body) as $key){
            if(array_key_exists($key,$oldValues)){
                $this->read->update('user_meta',['meta_value'=>$body[$key]],['id'=>$oldValues[$key]['meta_id']]);
            }
            else{
                $this->read->insert('user_meta',['userid'=>$id,'meta_key'=>$key,'meta_value'=>$body[$key]]);
            }
        }
        return new JsonResponse(['status'=>'success']);
    }

    public function getMeta(Request $request,$id,$echo=true){
        $this->checkUser();

        $id=$id=='me'?$this->userId:$id;

        $body = json_decode($request->getContent(),true);

        $query = 'select id,meta_key,meta_value from user_meta
                  where userid=:id';
        $prepare = ['id'=>$id];
        if(count($body)>0) {
            $keys =implode("','",array_keys($body));
            $query .= " and meta_key in ('{$keys}')";

        }

        $data = $this->read->fetchAll($query, $prepare);

        $meta = array(''=>'');
        if($data) {
            foreach ($data as $row) {
                if(array_search($row['meta_key'],$this->booleans)!==false){
                    $row['meta_value'] = boolval($row['meta_value']);
                }
                $meta[$row['meta_key']] = array('meta_id' => $row['id'], 'meta_value' => $row['meta_value']);
            }
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
                $this->read->delete('user_meta',['id'=>$oldValues[$key]['meta_id']]);
            }
        }
        return new JsonResponse(['status'=>'success']);
    }
    public static function getField($userId,$field){
        return Utility::getInstance()->fetchOne("SELECT meta_value FROM user_meta where userid = $userId and meta_key = '$field'");
    }
    public static function get($userId)
    {
        $array = [];
        $data = Utility::getInstance()->fetch("SELECT meta_value,meta_key FROM user_meta where userid = $userId");
        foreach ($data as $row){
            $array[$row['meta_key']] = $row['meta_value'];
        }
        return $array;
    }
    private $booleans = ['disable_j1_graded_email','disable_e3pt_graded_email','disable_j1_submitted_email',
        'disable_teacher_notifications_email','disable_student_notifications_email','disable_student_post_notifications_email'];
}
?>