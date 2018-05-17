<?php
/**
 * Created by IntelliJ IDEA.
 * User: denny
 * Date: 7/27/17
 * Time: 10:13 AM
 */

namespace English3\Controller\Forum;


use English3\Controller\Utility;

class ForumSettings{
    private $forumId;
    public $data;
    public $userData;
    public function __construct($forumId){
        $this->forumId = $forumId;
    }
    public function save($settings){
        $allowedSettings = [];
        if($settings['type']) $allowedSettings['type']=$settings['type'];
        if($settings['track_reading']) $allowedSettings['track_reading']=$settings['track_reading'];
        if($settings['subscription_mode']) $allowedSettings['subscription_mode']=$settings['subscription_mode'];
        if($settings['limit_editing_time']) $allowedSettings['limit_editing_time']=$settings['limit_editing_time'];
        Utility::getInstance()->reader->delete('forum_settings',['forumid'=>$this->forumId]);
        foreach($allowedSettings as $setting=>$value){
            Utility::getInstance()->reader->insert('forum_settings',[
                'forumid'=>$this->forumId,
                'setting'=>$setting,
                'value'=>$value
            ]);
        }
    }
    public function load(){
        $data = Utility::getInstance()->fetch("SELECT * FROM forum_settings where forumid = :id",
            ['id'=>$this->forumId]);
        $this->data = $this->prepareSettingsFromData($data);
        return $this->data;
    }
    private function prepareSettingsFromData($data){
        $settings = [];
        foreach ($data as $row){
            $settings[$row['setting']] = $row['value']==='1' || $row['value']==='0'?boolval($row['value']):$row['value'];
        }
        return $settings;
    }
    public function saveUserSettings($settings,$userId){
        $allowedSettings = [];
        if(isset($settings['track_reading'])) $allowedSettings['track_reading']=intval($settings['track_reading']);
        if(isset($settings['subscribe'])) $allowedSettings['subscribe']=intval($settings['subscribe']);
        Utility::getInstance()->reader->delete('forum_user_settings',['forumid'=>$this->forumId,'userid'=>$userId]);
        foreach($allowedSettings as $setting=>$value){
            Utility::getInstance()->reader->insert('forum_user_settings',[
                'forumid'=>$this->forumId,
                'userid'=>$userId,
                'setting'=>$setting,
                'value'=>$value
            ]);
        }
    }
    public function loadUserSettings($userId){
        $data = Utility::getInstance()->fetch("SELECT * FROM forum_user_settings where forumid = :id and userid = :userId",
            ['id'=>$this->forumId,'userId'=>$userId]);
        $settings = $this->prepareSettingsFromData($data);
        $forumSettings = $this->load();
        $settings['editable'] = [];
        if($forumSettings['subscription_mode']=='optional'||$forumSettings['subscription_mode']=='auto'){
            $settings['subscribe'] = isset($settings['subscribe'])?$settings['subscribe']:$forumSettings['subscription_mode']=='auto';
            $settings['editable']['subscribe']=true;
        }else{
            $settings['subscribe'] = $forumSettings['forced']?true:false;
        }
        if($forumSettings['track_reading']=='optional'){
            $settings['editable']['track_reading']=true;
            $settings['track_reading'] = $settings['track_reading']?:false;
        }else{

            $settings['track_reading'] = $forumSettings['track_reading']=='on'?true:false;
        }
        if(!count($settings['editable'])){
            unset($settings['editable']);
        }
        $classId = Utility::getInstance()->fetchOne('SELECT classid FROM forums WHERE id = '.$this->forumId);
        $settings['isTeacher'] = Utility::getInstance()->checkAdmin(null,true,false) ||
            boolval(Utility::getInstance()->fetchOne("SELECT is_teacher FROM user_classes where classid = :classId and userid = :userId and is_teacher = 1",
            ['classId'=>$classId,'userId'=>$_SESSION['USER']['ID']])
        );
        if($settings['isTeacher']){
            $settings['canDelete'] = true;
        }else{
            $settings['canDelete'] = $this->checkCanDeletePosts();
        }
        $this->userData = $settings;
        return $settings;
    }
    public function checkCanDeletePosts(){
        $pageId = Utility::getInstance()->fetchOne("SELECT pageid from forums where id = :forumId",
            ['forumId'=>$this->forumId]);
        return intval(Utility::getInstance()->fetchOne('select sum(flag) from ( select if(meta_value,meta_value,0) as flag FROM
  page_meta p where p.pageid = :pageId and p.meta_key=\'cannot_delete_posts\'
union
  Select o.can_delete_posts as flag from organizations o JOIN users u on u.organizationid = o.id
where u.id = :userId) a',['userId'=>$_SESSION['USER']['ID'],'pageId'=>$pageId])) >= 1;
    }
}
