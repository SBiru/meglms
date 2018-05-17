<?php
/**
 * Created by IntelliJ IDEA.
 * User: denny
 * Date: 5/15/17
 * Time: 3:49 PM
 */

namespace English3\Controller\Glossary;



use English3\Controller\Bitwise;
use English3\Controller\Organization\OrganizationController;
use English3\Controller\PageController;
use English3\Controller\PageTypePermissions;
use English3\Controller\Utility;

class GlossaryLinkOptions {
    private $pageId;
    private $key = 'glossary_link_option';
    public function __construct($pageId)
    {
        $this->pageId = $pageId;
    }
    private function prepareLinkOptions(){

        $pageTypes = new PageTypePermissions();
        foreach($pageTypes->getPermissionForOrg(OrganizationController::_getOrgFromPageId($this->pageId)) as $type=>$bit){
            if($type=='sub_unit' || $type=='glossary') continue;
            $this->LINK_OPTIONS[$type]=[
                'label'=>preg_replace_callback('/(_|^)(.)/',function($matches) {
                    return ($matches[1]!='_'?$matches[1]:' ').strtoupper($matches[2]);
                },$type),
                'bitval'=>$bit
            ];
        }
    }
    public function save($bitwiseValue){
        if(PageController::_getPageMeta($this->pageId,$this->key)===null){
            Utility::getInstance()->reader->insert('page_meta',[
                'pageid'=>$this->pageId,
                'meta_key'=>$this->key,
                'meta_value'=>$bitwiseValue
            ]);
        }else{
            Utility::getInstance()->reader->update('page_meta',[
                'meta_value'=>$bitwiseValue
            ],[
                'pageid'=>$this->pageId,
                'meta_key'=>$this->key
            ]);
        }
        return $bitwiseValue;

    }
    public function load(){
        $this->prepareLinkOptions();
        $bitwiseValue = PageController::_getPageMeta($this->pageId,$this->key);
        $options = Bitwise::bitToArray($bitwiseValue,$this->LINK_OPTIONS,'bitval',function($option,$checked){
            $option['checked']=boolval($checked);
            return $option;
        });
        return $options;
    }
    public function checkPageType($type){
        $options = $this->load();
        if(!$options[$type]){
            return false;
        }
        return boolval($options[$type]['checked']);
    }
    public static function _checkPageType($classId,$type){
        $glossaryId = Glossary::getForClassId($classId);
        if(!$glossaryId){
            return false;
        }
        $instance  = new self($glossaryId);
        return $instance->checkPageType($type);
    }

    private $LINK_OPTIONS;

    const CONTENT = 'content';
    const QUIZZES = 'quiz';
}