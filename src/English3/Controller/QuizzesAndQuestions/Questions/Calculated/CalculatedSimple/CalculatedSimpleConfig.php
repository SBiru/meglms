<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.19.3
 * Time: 18:33
 */

namespace English3\Controller\QuizzesAndQuestions\Questions\Calculated\CalculatedSimple;


use English3\Controller\Utility;
use Phinx\Migration\Util;
use Symfony\Component\Config\Definition\Exception\Exception;
use Symfony\Component\Debug\Exception\ClassNotFoundException;

class CalculatedSimpleConfig {
    public $tolerance;
    public $decimalsType;
    public $params;
    public $numberOfSets;
    public $formula;
    public $decimals;
    public function __construct($array){
        try{
            //Utility::getInstance()->checkRequiredFields($this->requiredFields,$array,true);
        }catch(Exception $e){
            throw new CalculatedSimpleException($e->getMessage());
        }

        $this->tolerance = ToleranceFactory::createWithType($array['toleranceType'],$array['tolerance'],$array['decimals']);
        $this->decimalsType = $array['decimalsType'];
        $this->decimals = $array['decimals'];
        $this->params = json_decode($array['params'],true);
        $this->numberOfSets = isset($array['numberOfSets'])?$array['numberOfSets']:1;
        $this->formula = $array['formula'];
    }
    
    private $requiredFields =['toleranceType','tolerance','decimals','formula'];
}