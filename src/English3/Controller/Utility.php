<?php

namespace English3\Controller;

use Doctrine\DBAL\Connection;
use Symfony\Component\Config\Definition\Exception\Exception;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\HttpKernel\Exception\HttpException;
use ZipArchive;

class Utility {

	public $reader;
	public static $instance;
	public function __construct(Connection $reader=null,UserController $me=null) {
		global $app;
		if(is_null($reader)){
			$reader = $app['dbs']['mysql_read'];
		}
		$this->reader = $reader;
		$this->me=$me;
	}
	public static function getInstance(Connection $reader = null){
		if(!self::$instance){
			self::$instance = new Utility($reader);
		}
		return self::$instance;
	}
    public static function moveToHistory($table,$historyTable,$id){
        $data = Utility::getInstance()->fetchRow("SELECT * FROM {$table} WHERE id = :id",['id'=>$id]);
        $allowedColumns = Utility::getInstance()->getTableColumns($table);
        $historyData = array_intersect_key($data, array_flip($allowedColumns));
        if(boolval(Utility::getInstance()->fetchOne("SELECT * FROM {$historyTable} WHERE id = :id",['id'=>$id]))){
            Utility::getInstance()->reader->update($historyTable,$historyData,['id'=>$id]);
        }else{
            Utility::getInstance()->reader->insert($historyTable,$historyData);
        }

        Utility::getInstance()->reader->delete($table,['id'=>$id]);
    }
    public function getTableColumns($table){
        global $DB;
        $query = "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '{$DB->database}' AND TABLE_NAME = '{$table}'";
        $columns = $this->fetch($query);
        $resp = [];
        foreach ($columns as $column){
            $resp[]=$column['COLUMN_NAME'];
        }
        return $resp;
    }
	/**
	 * Returns results from executing $query, as array
	 *
	 */
	public function fetch($query = null, $paramsArray = array(),$fetch=true) {
		$preparedStatement = $this->reader->prepare($query);
		$preparedStatement->execute($paramsArray);
		if($fetch){
			return $preparedStatement->fetchAll();
		}else{
			return $preparedStatement;
		}

	}
    public function fetch2($query = null, $paramsArray = array(),$fetch=true) {
        $preparedStatement = $this->reader->prepare($query);
        $preparedStatement->executeQuery($paramsArray);
        if($fetch){
            return $preparedStatement->fetchAll();
        }else{
            return $preparedStatement;
        }

    }

	/**
	 * Returns first row of results
	 *
	 */
	public function fetchRow($query = null, $paramsArray = array()) {
		$preparedStatement = $this->reader->prepare($query);
		$preparedStatement->execute($paramsArray);
		$result = $preparedStatement->fetchAll();
		return ($result)? $result[0] : null;
	}

	/**
	 * Returns first item under fieldName $name, or first item in first row if
	 * $name is null
	 *
	 */
	public function fetchOne($query = null, $paramsArray = array(), $name = null) {
		$preparedStatement = $this->reader->prepare($query);
		$preparedStatement->execute($paramsArray);
		$result = $preparedStatement->fetchAll();
		if(!$result || ($name != null && !array_key_exists($name, $result[0]))) {
			return null;
		} else if ($name != null && array_key_exists($name, $result[0])) {
			return $result[0][$name];
		} else {
			return array_shift($result[0]);
		}
	}

	/**
	 * Returns true on success, false on failure
	 *
	 */
	public function execute($query = null, $paramsArray = array()) {
		$preparedStatement = $this->reader->prepare($query);
		return $preparedStatement->execute($paramsArray);
	}
    
    /*
     * Insert, Update, Deletes and returns the number of affected rows
     * 
     * 
     * */
    public function executeUpdate($query = null, $paramsArray = array()) {
		return  $this->reader->executeUpdate($query,$paramsArray);
	}

	/**
	 * Returns id of latest record inserted, false on failure
	 *
	 */
	public function insert($query = null, $paramsArray = array()) {
		$preparedStatement = $this->reader->prepare($query);
		if(!$preparedStatement->execute($paramsArray)) {
			return false;
		}
		return $this->reader->lastInsertId();
	}

	/**
	 * Symfony2 cannot accept /json requests normally. This function clears the params
	 * DIRECTLY in the $request. Does not have a result to return.
	 *
	 * Must remain static (only needs passed param, and will always change)
	 *
	 */
	public static function clearPOSTParams(Request &$request) {
		if (0 === strpos($request->headers->get('Content-Type'), 'application/json')) {
			$postData = json_decode($request->getContent(), true);
			$request->request->replace(is_array($postData) ? $postData : array());
		}
	}

	// adding attributes to media objects

	// inserting preload="none" for video and audio tags
	//type should be "video", "audio" or "both"
	public static function addMediaAttribute($content,$type="both",$options=null){
		$default = [
			'preload'=>'none',
		];
		if($type=='video'){
			$default['class']='video-js vjs-default-skin';
		}

		if ($options != null){
		foreach($options as $key => $value){
			$default[$key]= $value;
		}
	}

		$attrs = '';
		foreach($default as $key => $value){
			$attrs = "{$key}=\"{$value}\" ";
		}

		if($type==='video' || $type==='both'){
			$content = str_replace('<video','<video '. $attrs,$content);
		}
		if($type==='audio' || $type==='both'){
			$content = str_replace('<audio','<audio '. $attrs,$content);
		}
		return $content;
	}
    public static function mapIds($array){
	    return array_map(function($a){
	        return $a['id'];
        },$array);
    }
    public static function isSiteAdmin($id=null){
        if(!$id){
            $id = $_SESSION['USER']['ID'];
        }
        return boolval(Utility::getInstance()->fetchOne("SELECT id from user_admin_sites WHERE userid = :id",['id'=>$id ]));
    }
    public  static function isAdvisor($id = null){
        if(!$id){
            $id = $_SESSION['USER']['ID'];
        }
        return boolval(Utility::getInstance()->fetchOne(UserController::$queryIsAdvisor,['userId'=>$id]));
    }
	public static function groupBy($array,$lambda){
		$grouped = array();
		foreach($array as $item){
			$key = $lambda($item);
			if(!isset($grouped[$key])){
				$grouped[$key]=array();
			}
			$grouped[$key][]=$item;
		}
		return $grouped;
	}
	public static function findWhere($array,$filter){
		foreach($array as $item) {
			$found = true;
			foreach($filter as $key=>$value){
				if(!isset($item[$key]) || $item[$key]!=$value){
					$found=false;
				}
			}
			if($found){
				return $item;
			}
		}
		return null;
	}

	//Permissions
	public function calcLoggedIn($throwError=true)
	{
		if(is_null($this->me)){
			$this->me = UserController::me($this->reader);
		}
		if (!$this->me) {
			if($throwError){
				throw new HttpException(401, 'Not logged in');
			}else{
				return false;
			}
		}
		return true;
	}
	public static function isAdminOrOrgAdmin($userId){
		return boolval(Utility::getInstance()->fetchOne("select ua.user_id from user_admin_super ua where user_id = :userId
						union
						select uo.userid from user_admin_organizations uo where userid = :userId
						limit 1",['userId'=>$userId]));

	}

	public function checkAdmin($orgId = null, $acceptOrgAdmin = true,$throwError=true)
	{
		$this->calcLoggedIn();
		if (!($this->me->amISuperUser() ||
			($acceptOrgAdmin && $this->me->amIOrgAdmin($orgId))
		)
		) {
			if($throwError){
				self::buildHTTPError('Must be an admin',403);
			}
			else {
				return false;
			}

		}
		return true;
	}
    public static function isTeacher($userId,$classId){
	    return boolval(self::getInstance()->fetchOne("SELECT id FROM user_classes where userid = $userId and classId = $classId and is_teacher = 1"));
    }
    public static function isTeacherForAny($userId){
	    return boolval(self::getInstance()->fetchOne("SELECT id FROM user_classes where userid = $userId  and (is_teacher = 1 or is_test_admin = 1)"));
    }
    public static function isSchoolAdmin($userId){
	    return boolval(self::getInstance()->fetchOne("SELECT id FROM proficiency_schools_admins where userid = $userId"));
    }
	public function checkTeacher($classid, $orgid=null,$throwError=true)
	{
		if(is_null($orgid)){
			$orgid = ClassesController::_getOrgId($this->reader,$classid);
		}
		$this->calcLoggedIn();
		if (!$this->me->isTeacher($classid, true, $orgid)) {
			if($throwError){
				self::buildHTTPError('Not a teacher for this class',403);
			}else{
				return false;
			}
		}
		return true;
	}
	//required => array of strings
	//body => array
	public function checkRequiredFields($required,$body,$throw=false){
		foreach($required as $field) {
			if (!isset($body[$field])) {
				if($throw){
					throw new Exception($field . ' is required');
				}else{
					return self::buildHTTPError($field . ' is required', 400);
				}
			}
		}
	}
	public function checkStudent($classid, $orgid,$throwError=true)
	{
		$this->calcLoggedIn();
		if (!$this->me->isStudent($classid, $orgid?true:false, $orgid)) {
			if($throwError){
				throw new HttpException(403, 'Not a student for this class');
			}else{
				return false;
			}
		}
		return true;
	}
	public function checkEditTeacher($classid, $orgid=null,$throwError=true)
	{
		$this->calcLoggedIn();
		if(is_null($orgid)){
			$orgid = ClassesController::_getOrgId($this->reader,$classid);
		}
		if (!$this->me->isEditTeacher($classid, true, $orgid)) {
			if($throwError){
				throw new HttpException(403, 'Not a edit teacher for this class');
			}else{
				return false;
			}
		}
		return true;
	}

	// HTTP RESPONSES
	public static function buildHTTPError($error, $code = 500, $params = array()) {
		$params['code'] = intval($code);
		$params['error'] = $error;
		return new JsonResponse(
			$params,
			$params['code']
		);
	}

	public static function removeFiles($paths) {
		foreach ($paths as $path) {
			if(is_dir($path)) {
				self::rmdirRecursive($path);
			} else if (file_exists($path)) {
				unlink($path);
			}
		}
	}

	public static function rmdirRecursive($folderPath) {
		if (is_dir($folderPath)) {
			$objects = scandir($folderPath);
			foreach ($objects as $object) {
				if ($object != "." && $object != "..") {
					if (filetype($folderPath."/".$object) == "dir"){
						self::rmdirRecursive($folderPath."/".$object);
					} else {
						unlink($folderPath."/".$object);
					}
				}
			}
			reset($objects);
			rmdir($folderPath);
		}
	}

	/* Extracts contents of file in $filePath into $folderPath
	 *
	 */
	public static function extract($filePath, $folderPath, $removeOriginal = true) {
		$zip = new ZipArchive;
		if ($zip->open($filePath) === TRUE) {
			// create directory to extract files
			if(!mkdir($folderPath, 0755)) {
				return false;
			}
			$zip->extractTo($folderPath);
			$zip->close();
			if($removeOriginal) {
				unlink($filePath);
			}
			return true;
		} else {
			return false;
		}
	}
	public static function generateSalt($length)
	{
		$salt = '';

		$tokens = array('a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '!', '@', '#', '$', '&', '*');

		$token_length = count($tokens) - 1;

		for ($i = 0; $i < $length; $i++) {
			$salt .= $tokens[mt_rand(0, $token_length)];
		}

		return $salt;
	}

	public static function generatePassword($length)
	{
		$password = '';

		$tokens = array('a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'j', 'k', 'm', 'n', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'A', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'M', 'N', 'P', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', '3', '4', '5', '6', '7', '9');

		$token_length = count($tokens) - 1;

		for ($i = 0; $i < $length; $i++) {
			$password .= $tokens[mt_rand(0, $token_length)];
		}

		return $password;
	}
	public static function urlencodepath($file){
		$jsonData = stripslashes(html_entity_decode($file));
		$jsonData = rtrim($jsonData, "\0");
		$files = json_decode($jsonData,true);
		if($files){
			$response = array();
			foreach($files as $f){
				$response[]=self::urlencodepath($f);
			}
			return $response;
		}
		else{
			$pathList = explode('/',$file);
			$filename = end($pathList);
			$pathList[key($pathList)] = rawurlencode($filename);
			reset($pathList);
			return implode('/',$pathList);
		}
	}
	public static function buildFileResponse($content,$filename){
		$headers = array(
			'Content-Description'=>'File Transfer',
			'Content-Type'=>'application/octet-stream',
#            'Content-Disposition'=> 'attachment, filename=S3S.cfg',
			'Content-Length'=> ''.strlen($content),
			'Cache-Control'=> 'must-revalidate, post-check=0, pre-check=0',
			'Expires'=> '0',
			'Pragma'=> 'public',
		);
		$response = new Response($content,200,$headers);
		$d = $response->headers->makeDisposition(
			ResponseHeaderBag::DISPOSITION_ATTACHMENT,
			$filename
		);
		$response->headers->set('Content-Disposition', $d);
		return $response;
	}
	public static function addToArrayIfNotExists($value,&$array){
		if(array_search($value,$array)===false){
			$array[]=$value;
		}
	}
	public static function removeFromArrayIfExists($value,&$array){
		if(($index = array_search($value,$array)) !==false){
			unset($array[$index]);
		}
	}
	public static function addToObjectIfNotExists($key,$value,&$array){
		if(array_key_exists($key,$array)===false){
			$array[$key]=$value;
		}
	}
	public static function sortBy(&$array,$sortBy){
		if(!$array){
			return;
		}
		if(is_callable($sortBy)){
			return uasort($array,$sortBy);
		}else{
			return uasort($array,function($a,$b) use($sortBy){
				$a=(array)$a;
				$b=(array)$b;
				if ([$sortBy] == $b[$sortBy]) {
					return 0;
				}
				return ($a[$sortBy] < $b[$sortBy]) ? -1 : 1;
			});
		}
	}
	public static function convertToMp4($destination_file,$mp4_file_name, $async=true){
		if($async){
			$mp4convert = "/usr/bin/ffmpeg -i " . $destination_file . " -s 160x120 -ar 11025 -r 15 -maxrate 5k  -vb 100k " . $mp4_file_name . " > /dev/null 2>/dev/null &";
		}else{
			$mp4convert = "/usr/bin/ffmpeg -i " . $destination_file . " -s 160x120 -ar 11025 -r 15 -maxrate 5k  -vb 100k " . $mp4_file_name;
		}
		return shell_exec($mp4convert);
	}
	public static function getElementFromArray($el,$array,$default){
		return array_key_exists($el,$array)?$array[$el]:$default;

	}
	public static function paginator($query,$paramsArray,$orderBy=null){
		return new Paginator($query,$paramsArray,$orderBy);
	}
	public static function splitClassGroupIds($id){
        $group_id = null;
        $courseId = $id;
        if(preg_match("/[0-9]+-[0-9]+/", $courseId)){
            $group_id = intval(explode('-',$courseId)[1]);
            $courseId = intval(explode('-',$courseId)[0]);
        }
        return [$courseId,$group_id];
    }
    public static function removeLastEndOfLine($text){
        return preg_replace('/\\n$/','', $text);
    }
    public static function buildTree(array &$elements, $parentId = 0,$parentKey='parentid') {
        $branch = array();

        foreach ($elements as $element) {
            if ($element[$parentKey] == $parentId) {
                $children = self::buildTree($elements, $element['id']);
                if ($children) {
                    $element['children'] = $children;
                }
                $branch[$element['id']] = $element;
                unset($elements[$element['id']]);
            }
        }
        return $branch;
    }


}
class Paginator{
	private $_limit;
	private $_page;
	private $_startIndex;
	private $_query;
	private $_total;
	private $_paramsArray;
	private $_orderBy;
	public function __construct( $query,$paramsArray,$orderBy = null ) {
		$this->_query = $query;
		$this->_paramsArray = $paramsArray;
		$this->_orderBy = $orderBy;
		$stmt = Utility::getInstance()->fetch($query,$paramsArray,false);
		$this->_total = $stmt->rowCount();
	}
	public function getData($limit = 10,$page=1,$startIndex = null){
		$this->_limit   = $limit;
		$this->_page    = $page;
		$this->_startIndex    = $startIndex;

		$result         = new \stdClass();
		$result->page   = $this->_page;
		$result->limit  = $this->_limit;
		$result->total  = $this->_total;
		$query = $this->_query;
		if($this->_limit){
			$result->totalPages = ceil($this->_total/$this->_limit);
			if($this->_page>$result->totalPages){
			    $this->_page = $result->page =  1;
            }
            $start = $this->_startIndex !== null?$this->_startIndex:( ( $this->_page - 1 ) * $this->_limit );
			$query = $this->_query. " LIMIT " . $start . ", $this->_limit";


		}
		$result->data   = Utility::getInstance()->fetch($query,$this->_paramsArray);;
		return $result;
	}

}

