<?php

namespace English3\Controller;

use XMLReader;
use SimpleXML;
use Doctrine\DBAL\Connection;
use English3\Controller\UserController;
use English3\Controller\ClassesController;
use English3\Controller\TestbankController;
use English3\Controller\QuizController;
use English3\Controller\Utility;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\File\File;

class ImportCourseController{

	private $reader;
	private $me;
	private $util;
	private $config;
	private $filesPublicURL;
	private $mainFolderPath;
	private $courseId;
	private $classId;
	private $addedPages;

	public function __construct(Connection $reader) {
		global $PATHS;
		$this->util = new Utility($reader);
		$this->filesPublicURL = '';
		$this->mainFolderPath = '';
		$this->courseId = null;
		$this->classId = null;
		$this->reader = $reader;
		$this->addedPages = array();
		// config file does not keep a base url. If we change that there, this should also
		// change accordingly (i.e. alter 'public_files_url' and 'redirect_url')
		$this->config = array(
			'main_path' => $PATHS->app_path . '/imported',
			'public_files_path' => $PATHS->app_path . '/public/useruploads/',
			'public_files_url' => 'http://' . $_SERVER['SERVER_NAME'] . '/public/useruploads/',
			// Replaces href in imported links. Replace value in redirectTo to target content page.
			// Query params: importId, courseId:
			'redirect_url' => 'http://' . $_SERVER['SERVER_NAME'] . '/singlepage/#/',
			'valid_types' => array(
				'moodle'
			)
		);
	}

	/* Returns list of files previously uploaded by current user */
	public function get(Request $request) {
		$this->me = UserController::me($this->reader);
		if(!$this->me) {
			die('Not logged in');
		} else if(!$this->me->isTeacher()) {
			die('You must be a teacher');
		}
		$mapFile = $request->query->get('mapFile');
		if($mapFile) {
			$fullFilePath = $this->config['main_path'] . DIRECTORY_SEPARATOR . $mapFile;
			$result = json_decode(file_get_contents($fullFilePath), true);
			return new JsonResponse($result);
		} else {
			$data = $this->util->fetch(
				$this->queryGetPreviousUploads,
				array('userId' => $this->me->user->getUserId())
			);
			$uploads = array();
			foreach ($data as $row) {
				$uploads[] = array(
					'type' => $row['type'],
					'name' => $row['courseName'],
					'date' => strtotime($row['date']) * 1000, // ms
					'folder' => $row['folderName'],
					'mapFile' => $row['mapFileName'],
				);
			}
			return new JsonResponse($uploads);
		}
	}

	public function discard(Request $request, $mapFile) {
		$this->me = UserController::me($this->reader);
		if(!$this->me) {
			die('Not logged in');
		} else if(!$this->me->isTeacher()) {
			die('You must be a teacher');
		}
		// from DB
		$this->util->execute(
			$this->queryDiscardUpload,
			array('mapFile' => $mapFile)
		);
		// from server
		$filesToRemove = array(
			$this->config['main_path'] . DIRECTORY_SEPARATOR . $mapFile,
			$this->config['main_path'] . DIRECTORY_SEPARATOR . $mapFile . '.json'
		);
		$this->removeFiles($filesToRemove);
		return new JsonResponse(true);
	}


	public function import(Request $request) {
		$this->me = UserController::me($this->reader);
		if(!$this->me) {
			die('Not logged in');
		} else if(!$this->me->isTeacher()) {
			die('You must be a teacher');
		}
		$orgId = $this->me->user->getOrgId();
		$orgFolderHash = substr(md5('org_' . $orgId),-10,-5) . $orgId;
		$this->config['public_files_path'] .= $orgFolderHash . '/';
		$this->config['public_files_url'] .= $orgFolderHash . '/';
		// manage permissions here
		//
		//

		// get param as array if in json format (workaround for PHP/Symfony)
		if (0 === strpos($request->headers->get('Content-Type'), 'application/json')) {
			$postData = json_decode($request->getContent(), true);
			$request->request->replace(is_array($postData) ? $postData : array());
		}
		// main files to arrays:
		$data = $request->request->get('data');
		// courseId:
		$this->courseId = $data['courseId'];
		// classId:
		$classId = $this->util->fetch($this->queryGetClassId, array('courseId'=>$this->courseId));
		$this->classId = $classId[0]['id'];
		// check if course not empty
		$countUnits = ClassesController::countUnits($this->reader, $this->courseId);
		if($countUnits === false || $countUnits > 0) {
			return Utility::buildHTTPError('Course already has content', 400);
		}
			// db data
		$storedData = $this->verifyData($data);
		$type = $data['type'] = $storedData['type'];
		if(!in_array($type, $this->config['valid_types'])) {
			return Utility::buildHTTPError('Invalid type: ' . $type, 400);
		}
		$this->mainFolderPath = $this->config['main_path'] . DIRECTORY_SEPARATOR . $data['folderName'];

		// actual content transfer
		$this->transfer($data);

		// transfer files to public folder (better if it happens after everything else was successful, a.k.a. right
		// before returning a response. Otherwise, temp files would remain in new 'files' folders)
			// files:
		$this->moveFilesToPublic(
			$data['folderName'],
			$type
		);

		// remove original files
		$filesToRemove = array(
			$this->mainFolderPath,
			$this->config['main_path'] . DIRECTORY_SEPARATOR . $data['folderName'] . '.json'
		);
		$this->removeFiles($filesToRemove);

		// remove DB records (course has been imported and can be discarded now)
		$this->util->execute($this->queryRemoveImportRecord, array('folderName'=>$data['folderName']));

		return new JsonResponse($this->courseId);
	}

	/* Verifies folderName exists (backup has been uploaded from site) and retrieves stored entry
	 * for current backup file.
	 *
	 * Returns stored data (single array)
	 */
	private function verifyData($data) {
		if(empty($data['folderName'])) {
			return Utility::buildHTTPError('Missing folder name. Cannot continue', 400);
		}
		$stored = $this->util->fetch(
			$this->queryGetStoredData,
			array(':folderName' => $data['folderName'])
		);
		if($stored) {
			return $stored[0];
		} else {
			return Utility::buildHTTPError('Backup entry does not exist in database', 400);
		}
	}

	/* Selects correct parse/transfer function according to data type
	 *
	 * $data: contains same structure as local json record, but 'include' element should have
	 * been added to each object that was marked for inclusion ([true] and [missing key] should
	 * include object, while [false] will exclude it)
	 *
	 */
	private function transfer($data) {
		switch ($data['type']) {
			case 'moodle':
				return $this->transferMoodle($data, $this->mainFolderPath);
				break;
			default:
				return Utility::buildHTTPError('Invalid type: ' . $data['type'], 400);
		}
	}

	/* MOODLE transfer
	 *
	 */
	private function transferMoodle($data) {
		$this->filesPublicURL = $this->config['public_files_url'] . $data['folderName'];
		$unit_counter = 1;
		try {
			// First, import testbanks (ALL, for now)
			$randomQuestionsPath = $this->mainFolderPath . DIRECTORY_SEPARATOR . 'randomQuestions.json';
			$questionsPath = $this->mainFolderPath . DIRECTORY_SEPARATOR . 'questions.json';
			$categoriesPath = $this->mainFolderPath . DIRECTORY_SEPARATOR . 'questionsByCategory.json';
			$randomQuestions = json_decode(file_get_contents($randomQuestionsPath), true);
			$moodleQuestions = json_decode(file_get_contents($questionsPath), true);
			$moodleCategories = json_decode(file_get_contents($categoriesPath), true);
			// these testbanks will be indexed by the original categoryId. It will be used a few lines later
			$testbanks = $this->importMoodleTestbanks($moodleQuestions, $moodleCategories);
			// orgId, departmentid
			$dbClass = $this->util->fetchRow(
				$this->queryGetClass,
				array('classId' => $this->classId)
			);
			$orgId = $dbClass['organizationid'];
			$courseId = $dbClass['courseid'];
			$departmentid = $dbClass['departmentid'];
			// Now insert units and pages
			foreach ($data['units'] as $unit) {
				if(!$this->isIncluded($unit)) {
					continue;
				}
				$page_counter = 1;
				// Create unit (in DB) and auto-add intro page
				$unitId = $this->moddleNewUnit($unit_counter, $unit, $page_counter);
				// loop trough pagegroups
				foreach ($unit['pageGroups'] as $pageGroup) {
					if(!$this->isIncluded($pageGroup)) {
						continue;
					}
					switch ($pageGroup['type']) {
						case 'lesson':
						case 'book':
							$pageGroupId = $this->moddleNewPageGroup($unitId, $page_counter, $pageGroup);
							// add pages (chapters)
							break;
						case 'assign':
						case 'journal':
							$this->moodleNewAssignment($unitId, $page_counter, $pageGroup);
							break;
						case 'page':
							$this->moodleNewPage($unitId, $page_counter, $pageGroup);
							break;
						case 'url':
							$this->moodleNewURL($unitId, $page_counter, $pageGroup);
							break;
						case 'quiz':
							$this->moodleNewQuiz($unitId, $page_counter, $pageGroup, $testbanks, $moodleQuestions, $randomQuestions, $orgId, $departmentid,$courseId);
							break;
						case 'folder':
						case 'resource':
							$this->moodleNewFolder($unitId, $page_counter, $pageGroup);
							break;
						default:
							continue 2;
					}
					$page_counter++;
				}
				$unit_counter++;
			}
			$this->parseMoodlePages();
			// everything done, store external_id in class
			$this->util->execute(
				$this->queryUpdateClassImportOriginalId,
				array(
					'classId' => $this->classId,
					'importOriginalId' => $data['originalId']
				)
			);
		} catch (Exception $e) {
			return Utility::buildHTTPError('An error ocurred while importing module. Message: ' . $e->getMessage(), 500);
		}
	}

	/***************************
	 * GLOBAL FUNCTIONS
	 ***************************/

	private function getNextUnitNumber() {
		$next = $this->util->fetchOne($this->queryGetNextUnitNumber, array('courseId' => $this->courseId));
		return ($next)? $next : 1;
	}

	private function isIncluded($obj) {
		if(array_key_exists('include', $obj)) {
			if(!$obj['include']) {
				// not included, skip
				return false;
			}
		}
		return true;
	}

	private function removeFiles($paths) {
		foreach ($paths as $path) {
			if(is_dir($path)) {
				$this->rmdirRecursive($path);
			} else if (file_exists($path)) {
				unlink($path);
			}
		}
	}

	private function rmdirRecursive($folderPath) {
		if (is_dir($folderPath)) {
			$objects = scandir($folderPath);
			foreach ($objects as $object) {
				if ($object != "." && $object != "..") {
					if (filetype($folderPath."/".$object) == "dir"){
						$this->rmdirRecursive($folderPath."/".$object);
					} else {
						unlink($folderPath."/".$object);
					}
				}
			}
			reset($objects);
			rmdir($folderPath);
		}
	}

	/* Moves files in $files array to public folder under folderName
	 * These files will be directly-linked sources for imported pages
	 *
	 * path will result in http://[domain] / [$this->config['public_files_path']] / $folderName /
	 *
	 * - If folderName already exists, entire process is skipped
	 * - Any existing folder is also skipped
	 * - Folder (public) is created inside existing backup folder to be moved at the end of process
	 *   in case error occurs, so files can be removed with entire original folder
	 *
	 */
	private function moveFilesToPublic($folderName, $type) {
		// org folder
		if(!file_exists($this->config['public_files_path'])) {
			mkdir($this->config['public_files_path'], 0777, true);
		}
		$files = file_get_contents($this->mainFolderPath . DIRECTORY_SEPARATOR . 'files.json');
		$files = json_decode($files, true);
		// original files folder
		$filesFolderPath = $this->mainFolderPath . '/files';
		// temporary folder for files
		$targetBackupPath = $this->mainFolderPath . DIRECTORY_SEPARATOR . $folderName;
		// final public folder
		$targetPublicPath = $this->config['public_files_path'] . DIRECTORY_SEPARATOR . $folderName;

		// keep track of files actually imported (not skipped)
		$importedFiles = array();

		// skip process if public folder already exists
		if (file_exists($targetBackupPath) || file_exists($targetPublicPath)) {
			return true;
		// folder to be moved is inside backup folder until end of process
		} else {
			mkdir($targetBackupPath, 0777, true);
		}
		try {
			foreach ($files as $file) {
				$originalFile = $filesFolderPath . DIRECTORY_SEPARATOR . $file['folder'] . DIRECTORY_SEPARATOR . $file['fileName'];
				$targetFolderPath = $targetBackupPath . $file['originalFilePath'];
				$targetFile = $targetFolderPath . DIRECTORY_SEPARATOR . $file['originalFileName'];
				// skip file if it already exists
				if(file_exists($targetFile) || !file_exists($originalFile)) {
					continue;
				} else {
					$importedFiles[] = $file;
				}
				if(!file_exists($targetFolderPath)) {
					mkdir($targetFolderPath, 0777, true);
				}
				// move file
				if(!copy($originalFile, $targetFile)) {
					return Utility::buildHTTPError('An error ocurred while moving file: ' . $file['fileName'], 500);
				}
			}
			// importedFiles.json: contains a list of all files actually imported
			$importedFilesLog = fopen($targetBackupPath . DIRECTORY_SEPARATOR . 'index.json', 'w');
			fwrite($importedFilesLog, json_encode($importedFiles));
			fclose($importedFilesLog);
			// move folder to public location
			if(!rename($targetBackupPath, $targetPublicPath)) {
				return Utility::buildHTTPError('An error occurred while moving folder to public location', 500);
			}
		} catch(Exception $e) {
			return Utility::buildHTTPError('An error occurred while processing files. Message: ' . $e->getMessage(), 500);
		}
	}

	/* Adds a unit to the unit. This function should remain able to be called
	 * from ALL types of imported content
	 *
	 * Returns id of newly inserted unit
	 *
	 */
	private function addUnit($number = 0, $title = null) {
		$params = array(
			'courseId' => $this->courseId,
			'number' => $number,
			'description' => (!$title)? ('Unit ' . $number) : $title
		);
		return $this->util->insert(
			$this->queryCreateUnit,
			$params
		);
	}

	/* Adds a pagegroup to the course. This function should remain able to be called
	 * from ALL types of imported content
	 *
	 */
	private function addPageGroup($unitId, $number, $title = null) {
		$params = array(
			'unitId' => $unitId,
			'title' => ($title)? $title : 'Empty title',
			'position' => intval($number)
		);
		return $this->util->insert(
			$this->queryCreatePageGroup,
			$params
		);
	}

	/* Adds a page to the system. This function is global, should remain able to be called
	 * from ALL types of imported content
	 *
	 * Structure MUST have at least:
	 *   page: {
	 *     unitId,
	 *     pageGroupId,
	 *     title,
	 *     content,
	 *     layout
	 *   }
	 * Optional:
	 *  - position
	 *  - gradeable
	 *  - allowVideoPost
	 *  - allowTextPost
	 *  - allowUploadPost
	 *
	 * Return id of newly inserted page
	 */
	private function addPage($page) {
		$requiredFields = array('unitId', 'pageGroupId', 'title', 'content', 'layout');
		foreach ($requiredFields as $requiredField) {
			if(!array_key_exists($requiredField, $page)) {
				return false;
			}
		}
		$insertArray = array(
			'externalId' => array_key_exists('externalId', $page)? $page['externalId'] : null,
			'unitId' => $page['unitId'],
			'pageGroupId' => $page['pageGroupId'],
			'title' => $page['title'],
			'content' => $page['content'],
			'layout' => $page['layout'],
			'position' => array_key_exists('position', $page)? $page['position'] : 0,
			'gradeable' => array_key_exists('gradeable', $page)? $page['gradeable'] : 0,
			'allowVideoPost' => array_key_exists('allowVideoPost', $page)? $page['allowVideoPost'] : 0,
			'allowTextPost' => array_key_exists('allowTextPost', $page)? $page['allowTextPost'] : 0,
			'allowUploadPost' => array_key_exists('allowUploadPost', $page)? $page['allowUploadPost'] : 0,
			'quizId' => array_key_exists('quizId', $page)? $page['quizId'] : 0,
			'allowedTakes' => array_key_exists('allowedTakes', $page)? $page['allowedTakes'] : 1,
			'timeLimit' => array_key_exists('timeLimit', $page)? $page['timeLimit'] : 0,
			'password' => array_key_exists('password', $page)? $page['password'] : '',
			'listenCourse' => array_key_exists('listenCourse', $page)? $page['listenCourse'] : '',
			'listenLesson' => array_key_exists('listenLesson', $page)? $page['listenLesson'] : ''
		);
		$selectArray = array(
			'unitId' => $insertArray['unitId'],
			'pageGroupId' => $insertArray['pageGroupId'],
			'title' => $insertArray['title'],
			'position' => $insertArray['position']
		);
		// keep newly added page's pageId
		$pageId = $this->util->insert(
			$this->queryCreatePage,
			$insertArray
		);
		// if page is assignment, create in db
		if(array_key_exists('assignment', $page)) {
			$this->util->execute(
				$this->queryCreateAssignment,
				array(
					'classId' => $this->classId,
					'pageId' => $pageId,
					'points' => (array_key_exists('points', $page['assignment']))? $page['assignment']['points'] : 0,
					'due' => (array_key_exists('due', $page['assignment']))? $page['assignment']['due'] : null,
					'noDueDate' => (array_key_exists('noDueDate', $page['assignment']))? $page['assignment']['noDueDate'] : 0
				)
			);
		}
		return $pageId;
	}

	/***************************
	 * MOODLE-SPECIFIC FUNCTIONS
	 ***************************/
	private function importMoodleTestbanks($moodleQuestions, $moodleCategories) {
		$testbanks = array();
		$class = $this->util->fetchRow(
			$this->queryGetClass,
			array('classId' => $this->classId)
		);
		// all ready. add tesbanks now (questions inside of categories). category = testbank
		foreach ($moodleCategories as $key => $category) {
			$dbTestbank = $this->util->fetchRow(
				$this->queryGetTestbankFromExternalId,
				array(
					'externalId' => $key,
					'orgId' => ($class['organizationid']),
					'courseId'=>($class['courseid'])
				)
			);
			if($dbTestbank || !count($category['questions'])) {
				continue;
			}
			$questions = array();
			foreach ($category['questions'] as $questionMoodleId) {
				// some prompts and 'extra' (in wordmatching activities) have embedded html which includes images, etc.
				// We'll need to escape them one by one as needed (sadly, very slow)
				if(!array_key_exists($questionMoodleId, $moodleQuestions)) {
					continue;
				}
				$question = $moodleQuestions[$questionMoodleId];
				$question['prompt'] = $this->parseContentMoodle($question['prompt']);
				if($question['type'] == 'wordmatching') {
					foreach($question['matches'] as &$match) {
						$match['question'] = htmlspecialchars($match['question'], ENT_QUOTES);
						$match['question'] = $this->parseContentMoodle($match['question'], false);
						$match['correct'] = htmlspecialchars($match['correct'], ENT_QUOTES);
						$match['correct'] = $this->parseContentMoodle($match['correct'], false);
					}
				}
				$questions[] = $question;
			}
			// if bank/category has a parent, concat parent's name (first 30 chars in it)
			if(intval($category['parentId']) && array_key_exists($category['parentId'], $moodleCategories)) {
				$category['name'] = substr($moodleCategories[$category['parentId']]['name'], 0, 30) . ' - ' . $category['name'];
			}
			$testbanks[$key] = TestbankController::_create(
				$this->reader,
				$category['name'],
				$this->courseId,
				$this->me->user->getUserId(),
				null, // objectiveId
				$key, // externalId
				$questions
			);
		}
		return $testbanks;
	}

	private function parseMoodlePages() {
		foreach ($this->addedPages as $page) {
			if(array_key_exists('content', $page)) {
				$content = $this->parseContentMoodle($page['content']);
				$this->util->execute(
					$this->queryUpdatePageContent,
					array(
						'pageId' => $page['id'],
						'content' => $content
					)
				);
			}
		}
	}

	/* Loops through added pages. For each page, content will be parsed and replaced with final html.
	 * If line or string to parse contains link to page not imported or unavailable, string is replaced
	 * with empty string.
	 */
	public function parseContentMoodle($content, $decode = true) {
		// 1. URL DECODE
		if($decode) {
			$content = html_entity_decode($content);
		}
		// 2. REPLACE CONSTANTS
		$search = array(
			'@@PLUGINFILE@@',
			'$@FILEPHP@$',
			'$@SLASH@$',
			'$@NULL@$',
			'<a ',
			'&#39;'
		);
		$replace = array(
			$this->filesPublicURL,
			$this->filesPublicURL,
			'/',
			'',
			'<a target="_blank" ',
			'&#34;'
		);
		// 3. LOCATE DYNAMIC ENTRIES. Format: $@[moduleName]VIEWBYID*[id]@$
		$excludeString = 'VIEWBYID*';
		preg_match('/\$@[A-Z]+' . $excludeString . '\*[0-9]+@\$/', $content, $matches);
		if ($matches) {
			$toReplace = array();
			// 3.1. patterns were found, proceed to replace strings
			foreach($matches as $match) {
				// matched pattern will be added to search and replace arrays for str_replace
				$original = $match;
				// Original pattern: $@[moduleName][$excludeString]*[id]@$
				// moduleName's: lesson, assign, resource, quiz, book, folder
				$excludeStringPos = mb_strpos($match, $excludeString);
				// Remove delimiters ($ and @) and separate parts
				$match = explode($excludeString, str_replace(array('$@','@$'), array(), $match));
				// $pattern[1] contains id
				if(array_key_exists($match[1], $this->addedPages)) {
					$search[] = $original;
					$replace[] = $this->config['redirect_url'] . $this->addedPages[$match[1]]['id'];
				}
			}
		}
		// 4. REPLACE PATTERNS
		return str_replace($search, $replace, $content);
	}

	/* Moodle: NewUnit */
	private function moddleNewUnit($number, $unit, &$pageNumber) {
		// Create unit (in DB)
		$unitId = $this->addUnit($number, $unit['name']);
		// XML
		$unitXMLPath = $this->mainFolderPath
			. DIRECTORY_SEPARATOR
			. 'sections'
			. DIRECTORY_SEPARATOR
			. 'section_' . $unit['id']
			. DIRECTORY_SEPARATOR
			. 'section.xml';
		$XMLReader = new XMLReader();
		$XMLReader->open($unitXMLPath);
		while ($XMLReader->read() && $XMLReader->name !== 'summary');
		$content = $XMLReader->readString();
		if(!empty($content)) {
			// Introduction page (content in /sections/section_####/section.xml)
			$introPage = array(
				'unitId' => $unitId,
				'pageGroupId' => 0,
				'title' => ($unit['name'] === null)? ('Unit ' . $number . ': Introduction') : $unit['name'],
				'layout' => 'CONTENT',
				'position' => $pageNumber,
				'content' => $this->parseContentMoodle($content)
			);
			$pageNumber++;
			$this->addPage($introPage, $number);
		}
		return $unitId;
	}

	/* Moodle: NewPageGroup */
	private function moddleNewPageGroup($unitId, &$number, $pageGroup) {
		switch ($pageGroup['type']) {
			case 'lesson':
				$xmlElement = 'pages';
				$xmlInnerElement = 'page';
				$xmlContentElement = 'contents';
				break;
			case 'book':
				$xmlElement = 'chapters';
				$xmlInnerElement = 'chapter';
				$xmlContentElement = 'content';
				break;
			default:
				return null;
		}

		// XML file
		$mainXMLFilePath = $this->mainFolderPath
			. DIRECTORY_SEPARATOR
			. 'activities'
			. DIRECTORY_SEPARATOR
			. $pageGroup['type'] . '_' . $pageGroup['id']
			. DIRECTORY_SEPARATOR
			. $pageGroup['type'] . '.xml';
		$XMLReader = new XMLReader();
		$XMLReader->open($mainXMLFilePath);
		while ($XMLReader->read() && $XMLReader->name !== $xmlElement); // pages, chapters
		$pagesXML = simplexml_load_string($XMLReader->readOuterXML());

		// index pages/chapters/etc which will be included, by id (in XML)
		// to facilitate locating pages to include, and avoid nested loops
		$includePagesIndex = array();
		foreach($pageGroup[$xmlElement] as $page) {
			if($this->isIncluded($page)) {
				$includePagesIndex[intval($page['id'])] = $page;
			}
		}

		// Create pagegroup in DB
		if(count($includePagesIndex) > 0) {
			$pageGroupId = $this->addPageGroup($unitId, $number, $pageGroup['title']);
			$number++;
		} else {
			// no pages included, no need to insert pagegroup
			return null;
		}

		// insert 'included' pages
		foreach($pagesXML->children() as $pageXML) {
			$attr = $pageXML->attributes();
			$idXML = intval($attr['id']);
			if(array_key_exists($idXML, $includePagesIndex)) {
				$pageArray = $includePagesIndex[$idXML];
				$grade = (integer)$pageXML->grade;
				// page to insert
				$insertPage = array(
					'externalId' => $idXML,
					'unitId' => $unitId,
					'pageGroupId' => $pageGroupId,
					'title' => ($pageArray['title'])? $pageArray['title'] : 'No title',
					'layout' => 'CONTENT',
					'position' => $number,
					'content' => (string)$pageXML->$xmlContentElement,
					'gradeable' => ($grade)? 1 : 0
				);
				if($grade) {
					$insertPage['assignment'] = array(
						'points' => intval($grade),
						'noDueDate' => 1,
					);
				}
				$this->addedPages[(string)$attr['id']] = array(
					'id' => $this->addPage($insertPage),
					'content' => (string)$pageXML->$xmlContentElement
				);
				// update value in pointer
				$number++;
			}
		}
		return $pageGroupId;
	}

	/* Moodle: NewPage */
	private function moodleNewPage($unitId, &$number, $pageGroup) {
		// XML file
		$mainXMLFilePath = $this->mainFolderPath
			. DIRECTORY_SEPARATOR
			. 'activities'
			. DIRECTORY_SEPARATOR
			. 'page_' . $pageGroup['id']
			. DIRECTORY_SEPARATOR
			. 'page.xml';
		$XMLReader = new XMLReader();
		$XMLReader->open($mainXMLFilePath);
		while ($XMLReader->read() && $XMLReader->name !== 'grade');
		$grade = intval($XMLReader->readString());
		$XMLReader = new XMLReader();
		$XMLReader->open($mainXMLFilePath);
		while ($XMLReader->read() && $XMLReader->name !== 'name');
		$title = $XMLReader->readString();
		while ($XMLReader->read() && $XMLReader->name !== 'content');
		$content = $XMLReader->readString();
		// insert page
		$insertPage = array(
			'externalId' => $pageGroup['id'],
			'unitId' => $unitId,
			'pageGroupId' => 0,
			'title' => $title,
			'layout' => 'CONTENT',
			'position' => $number,
			'content' => $content
		);
		if($grade) {
			$insertPage['gradeable'] = 1;
			$insertPage['assignment'] = array(
				'points' => $grade,
				'noDueDate' => 1
			);
		}
		$this->addedPages[$pageGroup['id']] = array(
			'id' => $this->addPage($insertPage),
			'content' => $content
		);
		// update value in pointer
		$number++;
	}

	/* Moodle: NewAssignment */
	private function moodleNewURL($unitId, &$number, $pageGroup) {
		// XML file
		$mainXMLFilePath = $this->mainFolderPath
			. DIRECTORY_SEPARATOR
			. 'activities'
			. DIRECTORY_SEPARATOR
			. 'url_' . $pageGroup['id']
			. DIRECTORY_SEPARATOR
			. 'url.xml';
		$XMLReader = new XMLReader();
		$XMLReader->open($mainXMLFilePath);
		while ($XMLReader->read() && $XMLReader->name !== 'name');
		$title = $XMLReader->readString();
		while ($XMLReader->read() && $XMLReader->name !== 'intro');
		$intro = $XMLReader->readString();
		while ($XMLReader->read() && $XMLReader->name !== 'externalurl');
		$content = $XMLReader->readString(); // url
		$page = array(
			'externalId' => $pageGroup['id'],
			'unitId' => $unitId,
			'pageGroupId' => 0,
			'title' => $title,
			'layout' => 'EXTERNAL_LINK',
			'position' => $number,
			'content' => $content
		);
		// this section is specific to a group of pages for online-music-academy
		// and can be safely removed when unused
		if($content == 'http://online-music-academy.com/meg/generic.php') {
			$page['content'] = $content = (!empty($intro))? $intro : 'Imported Content';
			$page['layout'] = 'CONTENT';
			$page['allowVideoPost'] = 1;
		}
		// insert page
		$this->addedPages[$pageGroup['id']] = array(
			'id' => $this->addPage($page),
			'content' => $content
		);
		// update value in pointer
		$number++;
	}

	/* Moodle: NewAssignment */
	private function moodleNewAssignment($unitId, &$number, $pageGroup) {
		// XML file
		$mainXMLFilePath = $this->mainFolderPath
			. DIRECTORY_SEPARATOR
			. 'activities'
			. DIRECTORY_SEPARATOR
			. $pageGroup['type'] . '_' . $pageGroup['id']
			. DIRECTORY_SEPARATOR
			. $pageGroup['type'] . '.xml';
		$XMLReader = new XMLReader();
		$XMLReader->open($mainXMLFilePath);
		while ($XMLReader->read() && $XMLReader->name !== 'name');
		$title = $XMLReader->readString();
		while ($XMLReader->read() && $XMLReader->name !== 'intro');
		$content = $XMLReader->readString();
		while ($XMLReader->read() && $XMLReader->name !== 'grade');
		$maxScore = intval($XMLReader->readString());

		// insert assignment
		$this->addedPages[$pageGroup['id']] = array(
			'id' => $this->addPage(array(
				'externalId' => $pageGroup['id'],
				'unitId' => $unitId,
				'pageGroupId' => 0,
				'title' => $title,
				'layout' => 'CONTENT',
				'position' => $number,
				'content' => $content,
				'gradeable' => 1,
				'allowUploadPost' => ($pageGroup['type'] == 'assign')? 1 : 0,
				'allowVideoPost' => ($pageGroup['type'] == 'journal')? 1 : 0,
				'allowTextPost' => ($pageGroup['type'] == 'journal')? 1 : 0,
				'assignment' => array(
					'points' => $maxScore,
					'noDueDate' => 1,
				)
			)),
			'content' => $content
		);
		// update value in pointer
		$number++;
	}

	/* Moodle: NewQuiz ('random' type is separate) */
	private function moodleNewQuiz($unitId, $page_counter, $pageGroup, $testbanks, $moodleQuestions, $randomQuestionsMap, $orgId, $departmentid,$courseId) {
		$page = array(
			'externalId' => $pageGroup['id'],
			'unitId' => $unitId,
			'pageGroupId' => 0,
			'title' => $pageGroup['title'],
			'content' => '',
			'layout' => 'QUIZ',
			'position' => $page_counter
		);
 		$questionIds = array();
		$randomQuestionsByBank = array();
		$options = array();
		// no need to reopen XML file. Loop through questions directly
		foreach ($pageGroup['questions'] as $questionMoodleId) {
			// is it a random question?
			if(array_key_exists($questionMoodleId, $randomQuestionsMap)) {
				$categoryId = $randomQuestionsMap[$questionMoodleId]['categoryId'];
				$bankId = $this->util->fetchRow(
					$this->queryGetTestbankFromExternalId,
					array(
						'externalId' => $categoryId,
						'orgId' => $orgId,
						'courseId'=>$courseId
					)
				)['id'];
				if(intval($bankId)) {
					if(array_key_exists($bankId, $randomQuestionsByBank)) {
						$randomQuestionsByBank[$bankId]++;
					} else {
						$randomQuestionsByBank[$bankId] = 1;
					}
				}
			} else if(array_key_exists($questionMoodleId, $moodleQuestions)) {
				$moodleQuestion = $moodleQuestions[$questionMoodleId];
				$categoryId = $moodleQuestion['categoryId'];
				if($moodleQuestion['type'] == 'description') {
					$options['description'] = $moodleQuestion['prompt'];
					continue;
				}
				foreach($testbanks[$categoryId]['questions'] as $testbankQuestion) {
					if(intval($testbankQuestion['moodleId']) == intval($questionMoodleId)) {
						// get db id (from our db)
						$questionIds[] = $testbankQuestion['id'];
						break;
					}
				}
			}
		}
		// insert page
		$quiz = QuizController::_create(
			$this->reader,
			$page['title'],
			$this->courseId,
			$this->me->user->getUserId(),
			$orgId,
			$departmentid,
			$questionIds,
			$randomQuestionsByBank,
			$options);
		$page['quizId'] = $quiz['id'];
		$this->addedPages[$pageGroup['id']] = array(
			'id' => $this->addPage($page)
		);
	}

	/* Moodle: NewResource */
	private function moodleNewFolder($unitId, &$number, $pageGroup) {
		// no need to reopen xml files. json index already contained required contextId
		$filesPath = $this->mainFolderPath . DIRECTORY_SEPARATOR . 'filesByContext.json';
		$files = json_decode(file_get_contents($filesPath), true);
		// check if context and files exist
		if(!array_key_exists($pageGroup['contextId'], $files) || !count($files[$pageGroup['contextId']])) {
			return;
		}
		$files = $files[$pageGroup['contextId']];
		// generate content
		$content = '<div>';
		foreach ($files as $file) {
			$url = $this->filesPublicURL . DIRECTORY_SEPARATOR . $file['originalFilePath'] . $file['originalFileName'];
			$content .= '<div class="url"><a target="_blank" href="' . $url . '">' . $file['originalFileName'] . '</a></div>';
		}
		$content .= '</div>';
		// insert page
		$this->addPage(array(
			'externalId' => $pageGroup['id'],
			'unitId' => $unitId,
			'pageGroupId' => 0,
			'title' => $pageGroup['title'],
			'layout' => 'CONTENT',
			'position' => $number,
			'content' => $content
		));
		// update value in pointer
		$number++;
	}

	/***************************
	 * QUERIES
	 ***************************/

	/* QUERY: gets next number for unit (unit 'name' in db) */
	private $queryGetNextUnitNumber = <<<SQL
		SELECT MAX(name) + 1 as next
		FROM units
		WHERE courseid = :courseId;
SQL;

	/* QUERY: get files uploaded previously */
	private $queryGetPreviousUploads = <<<SQL
		SELECT *
		FROM imports
		WHERE userId = :userId
SQL;

	private $queryGetTestbankFromExternalId = <<<SQL
		SELECT *
		FROM banks
		WHERE external_id = :externalId AND org_id = :orgId and course_id = :courseId
SQL;

	private $queryGetQuestionsFromExternalBankId = <<<SQL
		SELECT *
		FROM bank_questions
		WHERE bank_id IN (SELECT id FROM banks WHERE external_id = :externalId AND org_id = :orgId);
SQL;

	/* QUERY: delete files uploaded previously */
	private $queryDiscardUpload = <<<SQL
		DELETE
		FROM imports
		WHERE folderName = :mapFile
SQL;

	/* QUERY: get data stored at upload of backup file */
	private $queryGetClassId = <<<SQL
		SELECT id
		FROM classes
		WHERE courseid = :courseId
SQL;

	/* QUERY: get data stored at upload of backup file */
	private $queryGetClass = <<<SQL
		SELECT cl.*, d.organizationid, c.departmentid
		FROM classes cl
		INNER JOIN courses c ON c.id = cl.courseid
		INNER JOIN departments d ON d.id = c.departmentid
		WHERE cl.id = :classId
SQL;

	/* QUERY: get data stored at upload of backup file */
	private $queryGetStoredData = <<<SQL
		SELECT *
		FROM imports
		WHERE folderName = :folderName
SQL;

	/* QUERY: insert unit for course */
	private $queryCreateUnit = <<<SQL
		INSERT INTO units (courseid, name, description)
		VALUES (:courseId, :number, :description)
SQL;

	/* QUERY: insert pagegroup in unit */
	private $queryCreatePageGroup = <<<SQL
		INSERT INTO pages (unitid, pagegroupid, name, subtitle, content, layout, position, is_private)
		VALUES (:unitId, 0, :title, :title, "", "HEADER", :position, 0)
SQL;

	/* QUERY: insert page into pagegroup */
	private $queryCreatePage = <<<SQL
		INSERT INTO pages (
			external_id,
			unitid,
			pagegroupid,
			name,
			subtitle,
			content,
			layout,
			position,
			is_private,
			is_gradeable,
			allow_video_post,
			allow_text_post,
			allow_upload_post,
			allowed_takes,
			time_limit,
			password,
			listen_course,
			listen_lesson,
			quiz_id)
		VALUES (
			:externalId,
			:unitId,
			:pageGroupId,
			:title,
			'',
			:content,
			:layout,
			:position,
			1,
			:gradeable,
			:allowVideoPost,
			:allowTextPost,
			:allowUploadPost,
			:allowedTakes,
			:timeLimit,
			:password,
			:listenCourse,
			:listenLesson,
			:quizId)
SQL;

	/* QUERY: insert assignment */
	private $queryCreateAssignment = <<<SQL
		INSERT INTO class_assignments (
			class_id,
			page_id,
			points,
			due,
			due_offset_days,
			no_due_date)
		VALUES (
			:classId,
			:pageId,
			:points,
			:due,
			0,
			:noDueDate)
SQL;

	/* QUERY: remove record of import in db */
	private $queryRemoveImportRecord = <<<SQL
		DELETE
		FROM imports
		WHERE folderName = :folderName
SQL;

	private $queryUpdatePageContent = <<<SQL
		UPDATE pages
		SET content = :content
		WHERE id = :pageId
SQL;

	private $queryUpdateClassImportOriginalId = <<<SQL
		UPDATE classes
		SET import_original_id = :importOriginalId
		WHERE id = :classId
SQL;
}