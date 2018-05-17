<?php

namespace English3\Controller;

use Doctrine\DBAL\Connection;
use English3\Controller\UserController;
use English3\Controller\Utility;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;

class VocabController {

	private $me;
	private $reader;
	private $util;

	public function __construct(Connection $reader) {
		$this->reader = $reader;
		$this->me = UserController::me($reader);
		$this->util = new Utility($reader);
	}

	/* Template */
	public function get() {

	}
	public static function _create($params){
		$util = new Utility();
		$required = ['name','description','base_language','target_language','course_id'];

		$util->checkRequiredFields($required,$params);

		$courseId = $params['course_id'];
		$classId = ClassesController::_getFromCourseId($courseId);
		$params['org_id'] = ClassesController::_getOrgId($util->reader,$classId);
		$params['department_id'] = ClassesController::_getDeptId($classId);
		$params['user_id']=$_SESSION['USER']['ID'];

		$util->reader->insert('modules',$params);

		return $util->reader->lastInsertId();

	}
	public static function _get(Connection $reader, $moduleId, $isQuiz = false, $distractors = 3) {
		if(!$moduleId) {
			return null;
		}
		$util = new Utility($reader);
		$vocabs = $util->fetch(self::$queryGetFromModuleId, array('moduleId' => $moduleId));
		$result = null;
		if($vocabs) {
			$vocabArray = array();
			// id module_id translation phrase position autio_url
			foreach ($vocabs as $vocab) {
				if(!array_key_exists($vocab['id'], $vocabArray)) {
					$vocabArray[$vocab['id']] = array(
						'phrase' => $vocab['phrase'],
						'translation' => $vocab['translation'],
						'audios' => array($vocab['audio_url'])
					);
				} else {
					$vocabArray[$vocab['id']]['audios'][] = $vocab['audio_url'];
				}
			}
			if(!$isQuiz) {
				// re-structure to remove id as index
				foreach ($vocabArray as $vocab) {
					$result[] = $vocab;
				}
			} else {
				// re-structure to insert id in object
				$phrases = array();
				foreach ($vocabArray as $key => $phrase) {
					$phrase['id'] = intval($key);
					$phrases[] = $phrase;
				}
				// generate questions from words (id is maintained)
				for ($i = 0; $i < count($phrases); $i++) {
					$phrase = array_shift($phrases);
					$tmp = $phrases; // copy to avoid repeating words
					// result to include in return array.
					// adding this word (will be shuffled later)
					$choices = array($phrase['translation']);
					// get random words as distractors
					for($j = 0; $j < $distractors; $j++) {
						shuffle($tmp);
						$distractor = array_shift($tmp);
						$choices[] = $distractor['translation'];
					}
					shuffle($choices);
					$result[] = array(
						'id' => $phrase['id'],
						'phrase' => $phrase['phrase'],
						'choices' => $choices
					);
					$phrases[] = $phrase;
				}
				shuffle($result);
			}
		}
		return $result;
	}
	public static function _getAll($params=[]){
		$util = new Utility();
		$deptId = @$params['deptId'];
		$orgId = @$params['orgId'];
		$classId = @$params['classId'];
		$userId = @$params['userId'];
		$lang = @$params['language'];

		$queryParams = array();

		$whereOrgId = ' and m.org_id = :orgId ';
		$whereDeptId = ' and m.department_id = :deptId ';
		$whereClassId = ' and classes.id = :classId ';
		$whereUserId = ' and m.user_id = :userId ';
		$whereLang = ' and m.base_language = :language ';

		$query = self::$queryGetVocabs;

		if($orgId){
			$query .= $whereOrgId;
			$queryParams['orgId']=$orgId;
		}
		if($deptId){
			$query .= $whereDeptId;
			$queryParams['deptId']=$deptId;
		}
		if($classId){
			$query .= $whereClassId;
			$queryParams['classId']=$classId;
		}
		if($userId){
			$query .= $whereUserId;
			$queryParams['userId']=$userId;
		}
		if($lang){
			$query .= $whereLang;
			$queryParams['language']=$lang;
		}

		return $util->fetch($query.' group by m.id',$queryParams);
	}


	protected static $queryGetFromModuleId = <<<SQL
		SELECT
			words.id,
			words.phrase,
			words.translation,
			audios.audio_url
		FROM vocabularies words
		JOIN (SELECT * FROM vocabulary_audios) audios ON audios.vocabulary_id = words.id
		WHERE words.module_id = :moduleId
		ORDER BY words.position ASC
SQL;
	public static $queryGetVocabs=<<<SQL
	select m.id as module_id,m.name,m.description,language_name,language_id,count(distinct v.id) as 'count'  from modules m
	join languages l on l.language_id = m.base_language
	left join classes on m.course_id = classes.courseid
	left join vocabularies v on m.id = v.module_id
	left join vocabulary_audios va on v.id = va.vocabulary_id
	WHERE 1
SQL;
	public static $queryUpdateVocab=<<<SQL
	UPDATE vocabularies
	SET module_id=:moduleId,
		phrase=:phrase,
		translation=:translation,
		position=:position,
		image=:image
     WHERE id = :id
SQL;




}