<?php
/**
 * Created by IntelliJ IDEA.
 * User: denny
 * Date: 5/26/17
 * Time: 3:59 PM
 */

namespace English3\Controller\Glossary\Import;


use SimpleXMLElement;
use Symfony\Component\Config\Definition\Exception\Exception;
use Symfony\Component\HttpFoundation\File\UploadedFile;

class GlossaryXMLParser
{
    private $file;
    private $mappedEntries = [];
    public function __construct(UploadedFile $file){
        $this->file = $file;
    }
    public function parse(){
        $element = $this->getXMLObject();
        $this->mapEntries($element);
        return $this->mappedEntries;
    }
    private function getXMLObject(){
        $this->validateFile();
        $handle = fopen($this->file->getPathname(),'r');
        $content=fread($handle,$this->file->getSize());
        fclose($handle);
        $object =  simplexml_load_string($content);
        if(!$object){
            throw new Exception("Not a valid xml");
        }
        return $object;
    }
    private function validateFile(){
        if($this->file->guessExtension()!='xml'){
            throw new Exception("Invalid file type.");
        }
    }
    private function mapEntries(SimpleXMLElement $element){
        $entries = $element->INFO->ENTRIES;
        $this->mappedEntries = [];
        foreach ($entries->children() as $entry){
            $mappedEntry = [
                'concept'=>(string)$entry->CONCEPT,
                'definition'=>(string)$entry->DEFINITION
            ];

            $this->mapEntryCategoriesIfNeeded($entry,$mappedEntry);
            $this->mapEntryFilesIfNeeded($entry,$mappedEntry);
            $this->mappedEntries[]=$mappedEntry;
        }
    }
    private function mapEntryCategoriesIfNeeded(SimpleXMLElement $entry,&$mappedEntry){
        $tags = [];
        foreach ($entry->CATEGORIES->children() as $category){
            $tags[]=(string)$category->NAME;
        }
        if(count($tags)){
            $mappedEntry['tags']=$tags;
        }
    }
    private function mapEntryFilesIfNeeded(SimpleXMLElement $entry,&$mappedEntry){
        if($entry->ENTRYFILES->count()) {
            $mappedEntry['files'] = json_decode(json_encode($entry->ENTRYFILES), true);
        }
    }
}