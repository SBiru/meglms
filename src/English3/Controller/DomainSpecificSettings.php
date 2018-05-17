<?php
/**
 * Created by IntelliJ IDEA.
 * User: ubuntu
 * Date: 19/12/17
 * Time: 14:52
 */

namespace English3\Controller;



class DomainSpecificSettings
{
    public static $conf;
    public static function getSignInHtml(){
        if($conf = self::loadDomainConf($_SERVER['HTTP_HOST'])){
            return $conf['signin'];
        }else{
            return 'signin.html';
        }
    }
    private static function loadConf(){
        global $PATHS;
        $domainsJsonFile = $PATHS->app_path . '/domains.json';
        if(file_exists($domainsJsonFile)){
            try{
                return json_decode(file_get_contents($domainsJsonFile),true);
            }catch(\Exception $exception){
                return null;
            }
        }
        return null;
    }
    private static function loadDomainConf($domain){
        if($conf = self::loadConf()){
            self::$conf = @$conf[$domain];
            return self::$conf;
        }else{
            return null;
        }
    }
}