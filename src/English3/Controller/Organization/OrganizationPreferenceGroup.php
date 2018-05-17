<?php
/**
 * Created by IntelliJ IDEA.
 * User: denny
 * Date: 4/17/17
 * Time: 3:32 PM
 */

namespace English3\Controller\Organization;


use English3\Controller\Utility;
use Symfony\Component\HttpFoundation\JsonResponse;

class OrganizationPreferenceGroup{

    protected $orgId;
    protected $preferences = array();
    protected $defaults = array();
    protected $loaded = false;
    protected $orgFlag;
    public function __construct($orgId){
        $this->orgId = $orgId;
    }

    public function loadFromPreferencesArray(&$preferencesArray){
        $keys = $this->getAvailableKeys();
        foreach($keys as $key){
            if(array_key_exists($key,$preferencesArray)){
                $this->preferences[$key] = $this->prepareValue($key,$preferencesArray[$key]);
                unset($preferencesArray[$key]);
            }
        }
        $this->loaded = true;
        return $this;
    }
    public function apiLoad($orgId){
        $this->load($orgId);
        return new JsonResponse($this->getPreferences());
    }
    public function load($orgId=null){
        if($orgId){
            $this->orgId = $orgId;
        }
        if(!$this->isOrgFlagEnabled()){
            return $this;
        }
        $keys = '"'.implode('","',$this->getAvailableKeys()).'"';
        $query = str_replace(':keys',$keys,$this->queryGetPreferences);
        $data = Utility::getInstance()->fetch($query,['orgId'=>$this->orgId]);
        $this->preparePreferences($data);
        $this->loaded = true;
        return $this;
    }
    protected function isOrgFlagEnabled(){
        return boolval(OrganizationController::_getField($this->orgId,$this->orgFlag));
    }
    private function getAvailableKeys(){
        return array_keys($this->defaults);
    }
    protected function preparePreferences($data){
        foreach($data as $row){
            $this->preferences[$row['preference']] = $this->prepareValue($row['preference'],$row['value']);
        }
    }
    protected function prepareValue($key,$value){
        return $value;
    }
    public function save(){
        $values = $this->prepareValuesToSave();
        Utility::getInstance()->insert(sprintf($this->querySavePreferences,$values));
    }
    private function prepareValuesToSave(){
        $values = array();
        foreach($this->preferences as $preference=>$value){
            if(!$value && $value !==false){
                $this->removePreference($preference);
                continue;
            }
            $row = [$this->orgId,$preference,$value];
            $values[]='("' . implode('","',$row) . '")';
        }
        return implode(",",$values);
    }
    private function removePreference($preference){
        Utility::getInstance()->reader->delete('organization_preferences',[
            'preference'=>$preference,
            'org_id'=>$this->orgId
        ]);
    }
    public function getPreferences(){
        return array_merge($this->defaults,$this->preferences);
    }
    public function getDefaultPreferences(){
        return $this->defaults;
    }
    public function setPreferences($preferences){
        $this->preferences = $preferences;
        return $this;

    }

    protected $queryGetPreferences = <<<SQL
    SELECT preference,value FROM organization_preferences WHERE preference in (:keys) and org_id = :orgId
SQL;
    protected $querySavePreferences = <<<SQL
    INSERT INTO organization_preferences (org_id, preference, value) VALUES %s
    ON DUPLICATE KEY UPDATE value = values(value)
SQL;

}