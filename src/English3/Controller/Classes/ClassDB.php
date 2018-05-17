<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.18.4
 * Time: 16:42
 */

namespace English3\Controller\Classes;


use English3\Controller\ClassesController;
use English3\Controller\Utility;

class ClassDB {
    public $data;
    public function __construct($classId){
        $this->data = ClassesController::_getClass($classId);
    }
    public function update(){
        Utility::getInstance()->reader->update(
            'classes',
            $this->data,
            ['id'=>$this->data['id']]
        );
    }
}