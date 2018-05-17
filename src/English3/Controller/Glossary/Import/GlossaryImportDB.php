<?php

namespace English3\Controller\Glossary\Import;
use English3\Controller\Glossary\Tags\GlossaryTagsDB;
use English3\Controller\Glossary\Words\GlossaryWordsDB;
use English3\Controller\Utility;
use Symfony\Component\HttpFoundation\File\UploadedFile;


class GlossaryImportDB
{   private $db;
    private $util;
    /**
     * @var GlossaryTagsDB;
     */
    private $tagsDB;
    public function __construct(){
        $this->db = Utility::getInstance()->reader;
        $this->util = Utility::getInstance();
    }
    public function getPreviousFile($id){
        return $this->util->fetchRow($this->queryGetPreviousFile,['id'=>$id]);
    }
    public function getPreviousUploads($orgId){
        return $this->util->fetch($this->queryGetPreviousUploads,['id'=>$orgId]);
    }
    public function uploadFile($orgId,UploadedFile $file,$mappedEntries){
        $fileId = $this->saveUploadedFile($orgId,$file,count($mappedEntries));
        $this->saveMappedEntries($fileId,$mappedEntries);
        return $fileId;
    }
    private function saveUploadedFile($orgId,UploadedFile $file,$entryCount){
        $this->db->insert('glossary_upload_files',[
            'org_id'=>$orgId,
            'filename'=>$file->getClientOriginalName(),
            'ext'=>$file->guessExtension(),
            'size'=>$file->getSize(),
            'entries'=>$entryCount,
            'created_by'=>$_SESSION['USER']['ID']
        ]);
        return $this->db->lastInsertId();
    }

    private function saveMappedEntries($fileId,$mappedEntries){
        global $DB;
        $values = [];

        foreach ($mappedEntries as $entry){
            $values[]="'".implode("','",[
                $fileId,
                addslashes($entry['concept']),
                addslashes($entry['definition']) ,
                @$entry['tags']?json_encode($entry['tags']):null,
                @$entry['extra']?json_encode($entry['extra']):null,
            ])."'";
        }
        $values = "(". implode('),(',$values) .")";
        $this->util->insert("INSERT INTO glossary_upload_entries (file_id,word,description,tags,extra) VALUES $values");
    }
    public function removeUploadedFile($id){
        $this->db->delete('glossary_upload_files',['id'=>$id]);
        $this->db->delete('glossary_upload_entries',['file_id'=>$id]);
    }
    public function import($id,$defaultTags = []){
        $defaultTags = $defaultTags?:[];
        $wordDB = new GlossaryWordsDB();
        $this->tagsDB = new GlossaryTagsDB();
        $fileInfo = $this->getPreviousFile($id);
        $entries = $this->getEntries($id);
        $orgId = $fileInfo['org_id'];
        foreach ($entries as $entry){
            $wordDB->create($entry['word'],$entry['description'],$orgId);
            if($tags = $this->prepareTagsIfNeeded($entry,$defaultTags)){
                $this->tagsDB->assignTagsToDefinition($wordDB->lastDefinitionId,$tags);
            }
        }
        $this->removeUploadedFile($id);
    }
    private function getEntries($fileId){
        return $this->util->fetch($this->queryGetPreviousFileEntries,['id'=>$fileId]);
    }
    private function prepareTagsIfNeeded($entry,$defaultTags){

        if($tags = json_decode($entry['tags'])){
            $tags = array_map(function($tag){
                return $this->tagsDB->getOrCreateTagIdFromName($tag);
            },$tags);
        }else{
            $tags = [];
        }
        return array_merge($defaultTags,$tags);
    }
    private $queryGetPreviousFile = <<<SQL
    SELECT * FROM glossary_upload_files WHERE id = :id
SQL;
    private $queryGetPreviousUploads = <<<SQL
    SELECT * FROM glossary_upload_files WHERE org_id = :id ORDER BY created_on DESC
SQL;
    private $queryGetPreviousFileEntries = <<<SQL
    SELECT * FROM glossary_upload_entries WHERE file_id = :id
SQL;
}