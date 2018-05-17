<?php

namespace English3\Controller;

use XMLReader;
use SimpleXML;
use ZipArchive;
use Doctrine\DBAL\Connection;
use English3\Controller\UserController;
use English3\Controller\Utility;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpFoundation\File\UploadedFile;

class TestbankController {

	private $me;
	private $reader;
	private $util;

	public function __construct(Connection $reader) {
		$this->reader = $reader;
		$this->me = UserController::me($reader);
		$this->util = new Utility($reader);
	}

	/** GET
	 * Get by id, or get all in: org, course, etc
	 *
	 */
	public function get(Request $request, $courseId, $bankId) {
		/* NEEDS IMPLEMENTATION */
	}

	/** POST
	 * Create testbank from scratch
	 *
	 */
	public function create(Request $request, $courseId) {
		// if a file is appended, call 'upload' method instead
		$file = $request->files->get('file');
		if($file) {
			return $this->upload($file, $courseId);
		}
		// check permissions here
		if(!$this->me){
			throw new HttpException(403, 'You must be logged in');
		}
		if(!$this->me->isTeacher()) {
			throw new HttpException(403, 'You must be a teacher to edit testbanks');
		}
		// read POST params (title, objectiveId:[opt]).
		Utility::clearPOSTParams($request);
		if(!$request->request->get('title')) {
			throw new HttpException(400, 'Required params: title');
		}
		return new JsonResponse(self::_create(
			$this->reader,
			$request->request->get('title'),
			$courseId,
			$this->me->user->getUserId(),
			$request->request->get('objectiveId'),
			null,
			$request->request->get('questions')
		));
	}

	/** POST
	 * Import entire testbanks (or multiple in compressed file)
	 *
	 */
	public function upload(UploadedFile $file, $courseId) {
		global $PATHS;
		// check if user is not superadmin or is not teacher
		$this->util->calcLoggedIn();
		if(!$this->me->isTeacher()) {
			return Utility::buildHTTPError('You must be a teacher to edit testbanks', 403);
		}
		// main folder for temporarily storing extracted files
		if (!file_exists($PATHS->app_path . '/imported')){
		mkdir($PATHS->app_path . '/imported', 0755);
		}

		$banksFolderPath = $PATHS->app_path . '/imported/testbanks';
		if (!file_exists($banksFolderPath)){
		mkdir($banksFolderPath, 0755);
		}
		// keep filetype
		$fileType = $file->guessExtension();
		// move file to local folder
		try {
			// move compressed (backup file) to server folder
			$file->move($banksFolderPath, $file->getClientOriginalName());
			$filePath = $banksFolderPath . '/' . $file->getClientOriginalName();
		} catch(FileException $e) {
			return Utility::buildHTTPError('Could not write file to target folder. Error message: ' . $e->getMessage());
		}
		// decide next step based on filetype
		switch($fileType) {
			case 'xml':
			case 'txt':
				return self::buildFromTextFile($this->reader, $file, $filePath, $courseId);
				break;
			case 'zip':
				return self::buildFromCompressedFile($this->reader, $file, $filePath, $banksFolderPath, $courseId);
				break;
			default:
				unlink($filePath);
				return Utility::buildHTTPError('File type not supported: ' . (($fileType)? $fileType : 'unknown'), 400);
		}
	}

	public static function buildFromTextFile(Connection $reader, $file, $filePath, $courseId){
		$testbank = self::buildFromFile($reader, $filePath, $courseId);


		if (!$testbank)
		{
			$testbank = self::buildFromFileCatetory($reader, $filePath, $courseId);
		}

		unlink($filePath);

		return new JsonResponse(
			array(
				'fileName' => $file->getClientOriginalName(),
				'testbank' => $testbank,
				'multiple' => false
			)
		);
	}

	public static function buildFromCompressedFile(Connection $reader, UploadedFile $file, $filePath, $banksFolderPath, $courseId){
		// actual folder to place extracted files
		$folderPath = $banksFolderPath . '/banks_' . time();
		$zip = new ZipArchive;
		if ($zip->open($filePath) === TRUE) {
			mkdir($folderPath, 0755);
			$zip->extractTo($folderPath);
			$zip->close();
		} else {
			return Utility::buildHTTPError('Could not extract content of file. Make sure the file is not corrupt.', 400);
		}
		// remove original file (has already been extracted)
		unlink($filePath);
		// for every file, add testbanks and build response ($testbanks)
		$textFiles = array_diff(scandir($folderPath), array('..', '.'));
		$response = array(
			'testbanks' => array(),
			'files' => array()
		);
		foreach ($textFiles as $textFile) {
			$testbank = self::buildFromFile($reader, $folderPath . '/' . $textFile, $courseId);
			if($testbank) {
				$response['files'][] = $textFile;
				$response['testbanks'][] = $testbank;
			}
		}
		Utility::rmdirRecursive($folderPath);
		return new JsonResponse(
			array(
				'fileName' => $file->getClientOriginalName(),
				'files' => $response['files'],
				'testbanks' => $response['testbanks'],
				'multiple' => true
			)
		);
	}

    public static function buildFromFileCatetory(Connection $reader, $filePath, $courseId)
    {
        $reader = new XMLReader();
        $reader->open($filePath);
        $question_Groups = array();
        while ($reader->read()) {

            switch ($reader->nodeType) {

                case (XMLREADER::ELEMENT):

                    $node_name = $reader->name;
                    switch ($node_name) {
                        case ('question_category'):
                            if (isset($group)) {
                            	if (isset($question)){
        	 						$group->questions[] = $question;
        						}
                                $question_Groups[] = $group;
                            }
                            $part             = simplexml_load_string($reader->readOuterXML());
                            $group            = new \stdClass();
                            $group->id        = $reader->getAttribute('id');
                            $group->name      = (string) $part->name;
                            $group->questions = array();
                            break;
                        case ('question'):
                            $part = simplexml_load_string($reader->readOuterXML());
                            if ($part->qtype == 'multianswer') {
                                if (isset($question)) {
                                    $group->questions[] = $question;
                                }
                                $question               = new \stdClass();
                                $question->name         = (string) $part->name;
                                $question->questiontext = (string) $part->questiontext;
                                $question->sequence     = explode(",", $part->plugin_qtype_multianswer_question->multianswer->sequence);
                                $question->parentid     = $reader->getAttribute('id');
                                $question->answers      = array();
                                break;
                            }
                            if (isset($question->sequence)) {
                                if (in_array($reader->getAttribute('id'), $question->sequence)) {
                                    $id                     = $reader->getAttribute('id');
                                    $question->answers[$id] = (string) $part->questiontext;
                                }
                            }
                            break;
                    }
                    $reader->read();
                    break;
                case (XMLREADER::END_ELEMENT):
                    break;
            }
        }
        if (isset($group)) {
        	if (isset($question)){
        	 $group->questions[] = $question;
        	}
            $question_Groups[] = $group;
        }

        if (count($question_Groups) > 0){
        	return $question_Groups;
        }
        return null;
    }

	public static function buildFromFile(Connection $reader, $filePath, $courseId) {
		try {
			$XMLReader = new XMLReader();
			$XMLReader->open($filePath);
			// getting course name
			while ($XMLReader->read() && $XMLReader->name !== 'quiz');
			$quizXML = simplexml_load_string($XMLReader->readOuterXML());
			if(!$quizXML) {
				return null;
			}
			$questions = array();
			// courseInfo
			$util = new Utility($reader);
			$courseInfo = $util->fetchRow(
				self::$queryGetCourseInfo,
				array('courseId' => $courseId)
			);
			foreach ($quizXML->children() as $question) {
				$type = (string)$question->attributes()['type'];
				switch($type) {
					case 'category':
						// this node contains the name of the testbank.
						// As of today (junn 25 2015), name could either be a simple string, a path-like string, or empty
						$title = explode('/', $question->category->text);
						$title = $courseInfo['name'] . '-' . trim(array_pop($title));
						break;
					default:
						// to avoid problems later when json_escape'd
						$prompt = substr($question->questiontext->text, 0, strlen($question->questiontext->text));
						// common fields
						//   answers
						$answers = array();
						$correct = false;
						foreach ($question->children() as $node) {
							if($node->getName() == 'answer') {
								$isCorrect = boolval((int)$node->attributes()['fraction']);
								$text = substr($node->text, 0, strlen($node->text));
								$answers[] = array(
									'text' => $text,
									'isCorrect' => $isCorrect
								);
								if($type == 'truefalse' && $text == 'true' && $isCorrect) {
									$correct = true;
								}
							}
						}
						//   question fields
						$tmpQuestion = array(
							'prompt' => $prompt,
							'type' => $type
						);

						// types seen so far (junn 25 2015):
						// - multichoice
						// - matching
						// - truefalse
						switch($type){
							case 'multichoice':
								$tmpQuestion['type'] = 'multiple';
								$tmpQuestion['answers'] = $answers;
								break;
							case 'truefalse':
								$tmpQuestion['correct'] = $correct;
								break;
							case 'matching':
								$tmpQuestion['type'] = 'wordmatching';
								$tmpQuestion['matches'] = array();
								// form 'matches' object (_create function will handle it later)
								foreach ($question->children() as $node) {
									if($node->getName() == 'subquestion') {
										$tmpQuestion['matches'][] = array(
											'question' => (string)$node->text,
											'correct' => (string)$node->answer->text,
											'wrong' => ''
										);
									}
								}
								break;
							default:
								break;
						}
						$questions[] = $tmpQuestion;
						break;
				}
			}
			$title = ($title)? $title : 'Imported Testbank';
			$me = UserController::me($reader);
			return self::_create(
				$reader,
				$title,
				$courseId,
				$me->user->getUserId(),
				null,
				null,
				$questions
			);
		} catch(Exception $e) {
			return null;
		}
	}

	/**
	 * Kept static to be usable internally
	 *
	 */
	public static function _create(Connection $reader, $title, $courseId, $createdBy, $objectiveId = null, $externalId = null, $questions = array()) {
		$util = new Utility($reader);
		$me = UserController::me($reader);
		$courseInfo = $util->fetchRow(
			self::$queryGetCourseInfo,
			array('courseId' => $courseId)
		);
		// $testbank array
		$testbank = array(
			'title' => $title,
			'courseId' => intval($courseId),
			'createdBy' => intval($createdBy),
			'objectiveId' => intval($objectiveId),
			'deptId' => intval($courseInfo['deptId']),
			'orgId' => intval($courseInfo['orgId']),
			'externalId' => ($externalId)? intval($externalId) : null,
			'userId' => $me->user->getUserId()
		);
		// insert testbank
		$testbank['id'] = $util->insert(
			self::$queryInsertTestbank,
			$testbank
		);
		// error
		if(!$testbank['id']) {
			throw new HttpException(500, 'An error occured while inserting testbank');
		}
		if(count($questions)) {
			$testbank['questions'] = self::_addQuestions($reader, $testbank['id'], $questions);
		}
		return $testbank;
	}

	/** POST
	 * add questions to testbank with passed $id
	 *
	 */
	public function addQuestions(Request $request, $courseId, $bankId) {
		// check permissions here
		if(!$this->me){
			throw new HttpException(403, 'You must be logged in');
		}
		if(!$this->me->isTeacher()) {
			throw new HttpException(403, 'You must be a teacher to edit testbanks');
		}
		$bankId = intval($bankId);
		// $bankId invalid
		if(!$bankId) {
			throw new HttpException(400, 'id must be integer greater than 0');
		}
		Utility::clearPOSTParams($request);
		$questions = $request->request->get('questions');
		$questionIds = array();
		if($questions) {
			$questionIds = self::_addQuestions($this->reader, $bankId, $questions);
		} else {
			return 'Missing [questions] object';
		}
		return new JsonResponse($questionIds);
	}

	/**
	 * Adds questions to db and links them to passed testbank id
	 *
	 * Returns list of newly inserted questions as array
	 */
	public static function _addQuestions(Connection $reader, $bankId, $questions) {
		$util = new Utility($reader);
		$me = UserController::me($reader);
		$added = array();
		// values nullable or defaulted in db, but required in array for query
		$defaults = array(
			'prompt' => 'Question has no prompt',
			'options' => '',
			'type' => 'open',
			'solution' => '',
			'feedback' => '',
			'modified' => date('Y-m-d H:i:s'),
			'modifiedBy' => $me->user->getUserId(),
			'maxPoints' => 1,
			'extra' => '',
			'pagebreak' => 0
		);
		foreach ($questions as $question) {
			$questionToInsert = array();
			$questionId = null;
			$ready = false;
			foreach ($defaults as $key => $value) {
				if(!array_key_exists($key, $question)) {
					$questionToInsert[$key] = $value;
					$question[$key] = $value;
				} else {
					$questionToInsert[$key] = $question[$key];
				}
			}
			// try inserting (should only fail if values are corrupt or db problems)
			try {
				$questionId = $util->insert(
					self::$queryInsertQuestion,
					$questionToInsert
				);
				switch ($question['type']) {
					case 'single':
					case 'multiple':
						$ready = self::finishQuestionMultiple($reader, $question, $questionId);
						break;
					case 'truefalse':
						$ready = self::finishQuestionTruefalse($reader, $question, $questionId);
						break;
					case 'essay':
					case 'multipart':
						$ready = true;
						break;
					case 'oneword':
						$ready = self::finishQuestionOneword($reader, $question, $questionId);
						break;
					case 'wordmatching':
						$ready = self::finishQuestionWordmatching($reader, $question, $questionId);
						break;
					// ADDITIONAL TYPES MUST BE IMPLEMENTED. AS OF TODAY (21/05/2015) STOPS HERE
					// BECAUSE IT IS ONLY BEING CREATED FOR IMPORTING CONTENT FROM MOODLE
					// DB, HOWEVER, HAS: open,single,multiple,oneword,truefalse,matching,blank,essay,wordmatching,studentvideoresponse
					default:
						continue 2;
				}
				// check if something failed while inserting options. skip question if not ready
				if($ready) {
					// no need to keep track of bank_question id
					$util->insert(
						self::$queryAddQuestionToTestbank,
						array(
							'bankId' => $bankId,
							'questionId' => intval($questionId),
							'position' => (array_key_exists('position', $question))? $question['position'] : 0
						)
					);
					$question['id'] = $questionId;
					$added[] = $question;
				} else {
					self::_deleteQuestion($reader, $questionId);
					continue;
				}
			} catch (Exception $e) {
				throw new HttpException(400, $e->getMessage());
			}
		}
		return $added;
	}

	private static function finishQuestionMultiple($reader, &$question, $questionId) {
		if(!array_key_exists('answers', $question)) {
			return false;
		}
		$util = new Utility($reader);
		$added = false;
		$solutions = array();
		for($i = 0; $i < count($question['answers']); $i++) {
			// 'solution' for 'single' questions is the sort_order number in db ($i in this case):
			if(array_key_exists('isCorrect', $question['answers'][$i])) {
				if($question['answers'][$i]['isCorrect']) {
					$solutions[] = $i;
				}
			}
			// inserting option
			$question['answers'][$i]['id'] = $util->insert(
				self::$queryInsertQuestionOption,
				array(
					'questionId' => $questionId,
					'text' => $question['answers'][$i]['text'],
					'sortOrder' => $i
				)
			);
			$added = true;
		}
		if($added) {
			$question['solution'] = implode(',', $solutions);
			$util->execute(
				self::$queryUpdateQuestionSolution,
				array('solution' => $question['solution'], 'questionId' => $questionId)
			);
		}
		return $added;
	}

	// Actually, this only exists because of the way the db was created. truefalse questions also
	// exist in question_options. Text is always 'true' or 'false', and sort_order decides solution,
	// although they are always 0, 1 (for true and false respectively).
	// Ideally, solution should tell whether it's true/false directly in the 'questions' table.
	// If that is corrected in the future, this can be safely removed and we can stick to the 'solution'
	// field in the original $question (wherever this function is called)
	private static function finishQuestionTruefalse($reader, &$question, $questionId) {
		if(!array_key_exists('correct', $question)) {
			return false;
		}
		$util = new Utility($reader);
		$solution = ($question['correct'])? '0' : '1';
		// inserting TRUE
		$util->insert(
			self::$queryInsertQuestionOption,
			array(
				'questionId' => $questionId,
				'text' => 'True',
				'sortOrder' => 0
			)
		);
		// inserting FALSE
		$util->insert(
			self::$queryInsertQuestionOption,
			array(
				'questionId' => $questionId,
				'text' => 'False',
				'sortOrder' => 1
			)
		);
		// update solution (if needed)
		if($solution !== $question['solution']) {
			$question['solution'] = $solution;
			$util->execute(
				self::$queryUpdateQuestionSolution,
				array('solution' => $solution, 'questionId' => $questionId)
			);
		}
		return true;
	}

	/**
	 * Same as with 'truefalse' questions, the way 'oneword' questions are handled in db is not ideal.
	 * 'solution' property in $question could retain the expected word.
	 * HOWEVER, this function supports multiple word entries ($question['answers']).
	 */
	private static function finishQuestionOneword($reader, &$question, $questionId) {
		if(!array_key_exists('answers', $question)) {
			return false;
		}
		$util = new Utility($reader);
		$added = false;
		$solutions = array();
		for($i = 0; $i < count($question['answers']); $i++) {
			$solutions[] = $i;
			// inserting option
			$question['answers'][$i] = array(
				'id' => $util->insert(
					self::$queryInsertQuestionOption,
					array(
						'questionId' => $questionId,
						'text' => $question['answers'][$i],
						'sortOrder' => $i
					)
				),
				'text' => $question['answers'][$i]
			);
			$added = true;
		}
		if($added) {
			$question['solution'] = implode(',', $solutions);
			$util->execute(
				self::$queryUpdateQuestionSolution,
				array('solution' => $question['solution'], 'questionId' => $questionId)
			);
		}
		return $added;
	}

	/**
	 * The way this type of question is handled should be improved. For now (because of time),
	 * this function translates the received matches (words, phrases) into a json string to be
	 * saved into the 'extra' field in the db entry for this question
	 *
	 * $question MUST include 'matches' array
	 */
	private static function finishQuestionWordmatching($reader, &$question, $questionId) {
		if(!array_key_exists('matches', $question) || !count($question['matches'])) {
			return false;
		}
		$util = new Utility($reader);
		// only applies because of how this type of question has been built
		$matches = array();
		foreach ($question['matches'] as $match) {
			$hashes = array();
			for($i = 0; $i < 4; $i++) {
				// 0: id
				// 1: question
				// 2: correct
				// 3: wrong
				$hashes[] = substr(md5(uniqid(rand(), true)), 0, 14);
			}
			$matches[$hashes[0]] = array(
				$hashes[2] => $match['correct'],
				$hashes[1] => $match['question'],
				$hashes[3] => $match['wrong'],
				'tmpanswers' => $hashes[2] . $hashes[1]
			);
		}
		$util->execute(
			self::$queryUpdateQuestionExtra,
			array('extra' => stripslashes(json_encode($matches)), 'questionId' => $questionId)
		);
		return true;
	}

	public static function _deleteQuestion(Connection $reader, $questionId) {
		$util = new Utility($reader);
		return $util->execute(
			self::$queryDeleteQuestion,
			array('questionId' => $questionId)
		);
	}


	private static $queryGetCourseInfo = <<<SQL
		SELECT c.*, d.id AS deptId, d.organizationid AS orgId
		FROM courses c
		INNER JOIN departments d ON d.id = c.departmentid
		WHERE c.id = :courseId
SQL;

	private static $queryInsertTestbank = <<<SQL
		INSERT INTO banks (title, course_id, created_by, default_objective_id, department_id, org_id, external_id, user_id)
		VALUES (:title, :courseId, :createdBy, :objectiveId, :deptId, :orgId, :externalId, :userId)
SQL;

	private static $queryInsertQuestion = <<<SQL
		INSERT INTO questions (
			prompt,
			type,
			options,
			solution,
			feedback,
			modified,
			modified_by,
			max_points,
			extra,
			pagebreak
		)
		VALUES (
			:prompt,
			:type,
			:options,
			:solution,
			:feedback,
			:modified,
			:modifiedBy,
			:maxPoints,
			:extra,
			:pagebreak
		)
SQL;

	private static $queryDeleteQuestion = <<<SQL
		DELETE FROM questions
		WHERE id = :questionId;
		DELETE FROM question_options
		WHERE question_id = :questionId;
SQL;

	private static $queryUpdateQuestionSolution = <<<SQL
		UPDATE questions
		SET solution = :solution
		WHERE id = :questionId
SQL;

	private static $queryUpdateQuestionExtra = <<<SQL
		UPDATE questions
		SET extra = :extra
		WHERE id = :questionId
SQL;

	private static $queryAddQuestionToTestbank = <<<SQL
		INSERT INTO bank_questions (bank_id, question_id, position)
		VALUES (:bankId, :questionId, :position)
SQL;

	private static $queryInsertQuestionOption = <<<SQL
		INSERT INTO question_options (question_id, text, sort_order)
		VALUES (:questionId, :text, :sortOrder)
SQL;

}