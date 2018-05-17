<?php

namespace English3\Controller;
require_once($_SERVER['DOCUMENT_ROOT'].'/controllers/usertools/multipart.php');
use Doctrine\DBAL\Connection;
use English3\Controller\QuizController;
use English3\Controller\QuizzesAndQuestions\QuestionTags\QuestionTags;
use English3\Controller\Utility;


use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;

class QuestionController {

	private $reader;
	private $util;

	public function __construct(Connection $reader) {
		$this->reader = $reader;
		$this->util = new Utility($reader);
	}
	public function gradePageQuestion(Request $request,$id){
		Utility::clearPOSTParams($request);
		if($error = Utility::getInstance()->checkRequiredFields(
			['question','pageId','userId'],
			$request->request->all()
		)){
			return $error;
		}

		$question = $request->request->get('question');
		$response = $question['response'];

		$grader = new QuestionGrader($question['type'],$response,$id);
		list($grade,$response) = $grader->gradeAndNormalize();

		$this->reader->insert(
			'page_question_reponses',
			[
				'page_id'=>$request->request->get('pageId'),
				'user_id'=>$request->request->get('userId'),
				'question_id'=>$id,
				'grade'=>max(0,$grade),
				'waiting_for_grade'=>intval($grade==-1),
				'response'=>$response,
				'graded_by'=>$request->request->get('userId')
			]
		);
		return new JsonResponse($this->reader->lastInsertId());
	}
	public function update(Request $request){
		$util = new Utility();
		$util->calcLoggedIn();
		Utility::clearPOSTParams($request);
		if($request->request->get('quizQuestionId')){
			if($util->me->isEditTeacher()){
				$id = $request->request->get('quizQuestionId');
				$params = $request->request->all();
				if (!isset($params['points'])){
					$params['points'] = 1;
				}
				elseif($params['points'] <= 0){
					$params['points'] = 1;
				}

				$recalculate = isset($params['recalculate'])?$params['recalculate']:false;
				$quizQuestionId = $params['quizQuestionId'];
				unset($params['recalculate']);
				unset($params['quizQuestionId']);
				if(isset($params['points'])){
					$util->insert(
						QuestionController::$queryUpdateQuizResponseScores,
						[
							'quizQuestionId'=>$id,
							'newPoints'=>$params['points']
						]
					);
				}
				$response = self::_updateQuizQuestion($id,$params);

				if(isset($recalculate)){
					$classId = $util->fetch(self::$queryGetClassId,['quizQuestionId'=>$quizQuestionId]);
					$classCtrl = GradebookController::getClassCtrl();
					$users = $classCtrl->getUsers($classId);
					if($recalculate=='now'){
						foreach($users['students'] as $student){
							GradebookController::_recalculate($student['id'],null,$classId);
						}
					}else{
						foreach($users['students'] as $student){
							GradebookController::_setRecalculateGradebook($classId,$student['id']);
						}
					}
				}
				return new JsonResponse($response);
			}

			Utility::buildHTTPError('Must be a teacher admin',403);
		}

	}
	public function get(Request $request,$id){
		$util = Utility::getInstance();
		$util->calcLoggedIn();
		$question = self::_get($id);
		if($request->query->has('userId') && $request->query->has('pageId')){
			$userId =$request->query->get('userId');
			$pageId =$request->query->get('pageId');
			$question['response']=$util->fetchRow(self::$queryGetUserResponse,[
				'userId'=>$userId,
				'pageId'=>$pageId,
				'questionId'=>$id
			]);
		}
		return new JsonResponse($question);
	}
	public static function _get($id,$includeTags = false){
		$question = Utility::getInstance()->fetchRow(self::$queryGetQuestion,['id'=>$id]);
		$question['options'] = QuizController::getQuestionOptions(Utility::getInstance()->reader,$id);
		if($question['extra']){
			$question['extra'] = preg_replace('/(\r\n|\n|\r)/','',$question['extra']);
		}
		if($includeTags){
			self::fetchTagsForQuestion($question);
		}
		return $question;
	}
	public static function fetchTagsForQuestions(&$questions){
		foreach($questions as &$question){
			self::fetchTagsForQuestion($question);
		}
	}
	public static function fetchTagsForQuestion(&$question){
		$question['fixed_tags'] = QuestionTags::getQuestionFixedTags($question);
		$question['custom_tags'] = QuestionTags::getQuestionCustomTags($question);
		$question['tags'] = array_merge($question['fixed_tags'],$question['custom_tags']);
	}


	public static function _updateQuizQuestion($id,$params){
		$util = new Utility();
		$util->reader->update('quiz_questions',
			$params,
			['id'=>$id]
		);
		return ['ok'=>true];
	}
	public static function _isBlankCorrect($questionId,$response){
		$util = new Utility();
		$prompt = $util->fetchOne(self::$queryGetQuestion,['id'=>$questionId],'prompt');
		$text= preg_replace('/<[a-z].*?>|<\/[a-z].*?>/','',$prompt);
		$out = array();
		preg_match_all('/_\(.*?\)_/',$text,$out);
		$solution = '';
		if(count($out)){
			foreach($out[0] as $match){
				$anwser = array();
				preg_match('/_\(([^)]+)\)_/',$match,$anwser);
				if(count($anwser)>1){
					$solution.=$anwser[1]. ',';
				}
			}
			$solution= preg_replace('/\,$/', '',$solution);
		}

		return strtolower($response)==strtolower($solution);
	}
	public static function _getQuestionResponse($userId,$pageId,$attemptId,$questionId){
		$util = Utility::getInstance();
		$query =self::$queryGetUserResponse.' and attempt_id=:attemptId';

		return $util->fetchRow($query,['questionId'=>$questionId,'pageId'=>$pageId,'userId'=>$userId,'attemptId'=>$attemptId]);
	}
	public static function hasRespondedPageQuestion($pageId,$userId){
		$data= Utility::getInstance()->fetchOne(self::$queryGetPageQuestionResponse,['pageId'=>$pageId,'userId'=>$userId]);
		return boolval($data);
	}
	public function checkBlankQuestions(Request $request){
		$util = new Utility();
		$data = $util->fetch(self::$queryCheckingBlankResponses);
		$resp=array();
		$total=0;
		$queryToFixTemp = 'UPDATE quiz_responses SET is_correct = 1 WHERE ';
		$queryToFixQuizResponses = array();
        $queryToFixQuizScores = array();
		$quizzes = array();
        $studentsWithIncorrectScore = array();
		foreach($data as $row){
			$prompt = $row['prompt'];
			$text= preg_replace('/<[a-z].*?>|<\/[a-z].*?>/','',$prompt);
			$out = array();
			preg_match_all('/_\(.*?\)_/',$text,$out);
			$solution = '';
			if(count($out)){
				foreach($out[0] as $match){
					$anwser = array();
					preg_match('/_\(([^)]+)\)_/',$match,$anwser);
					if(count($anwser)>1){
						$solution.=$anwser[1]. ',';
					}
				}
				$solution= str_replace('&nbsp;',' ',(preg_replace('/\,$/', '',$solution)));
			}
			if(strtolower($solution)!=strtolower($row['solution'])){
				$wrongResponses = array();
				$responses=$util->fetch(self::$queryAllUserResponses,['questionId'=>$row['id']]);

				foreach($responses as $r){
					if(!$quizzes[$r['quiz_id']]){
						$quizzes[$r['quiz_id']]=array(
							'id'=>$r['quiz_id'],
							'pageName'=>$r['pageName'],
							'className'=>$r['className'],
							'students'=>array()
						);
					}

					if(!$quizzes[$r['quiz_id']]['students'][$r['user_id']]){
						$quizzes[$r['quiz_id']]['students'][$r['user_id']]=array(
							'id'=>$r['user_id'],
							'submitted'=>$r['submited'],
							'currentScore'=>$r['currentScore'],
							'correctScore'=>QuizController::_getQuizCurrentPoints($r['quiz_id'],$r['user_id'])
						);
					}
                    if($quizzes[$r['quiz_id']]['students'][$r['user_id']]['correctScore']!=$quizzes[$r['quiz_id']]['students'][$r['user_id']]['currentScore']){
                        $quizzes[$r['quiz_id']]['students'][$r['user_id']]['pageId']=$r['quiz_id'];
                        $studentsWithIncorrectScore[]=$quizzes[$r['quiz_id']]['students'][$r['user_id']];
                        $queryToFixQuizScores[]="UPDATE quiz_scores SET score='{$quizzes[$r['quiz_id']]['students'][$r['user_id']]['correctScore']}' WHERE quiz_id={$r['quiz_id']} and user_id={$r['user_id']}";
                    }
					$studentAnswer = trim($r['response']);
				   if(strcmp($studentAnswer,$solution)===0 && !boolval($r['is_correct'])){
					   $wrongResponses[]=$r;
					   $total++;
					   $points = $r['points']?$r['points']:$r['max_points'];
					   $queryToFixQuizResponses[]=$queryToFixTemp.'user_id='.$r['user_id'].' and question_id='.$r['question_id'];
				   }
				}
				$resp[]=array(
					'id'=>$row['id'],
					'solution'=>$solution,
					'dbSolution'=>$row['solution'],
					'responses'=>$wrongResponses
				);
			}
		}
		$queryToFixQuizResponses= implode(';',$queryToFixQuizResponses);
        $queryToFixQuizScores= implode(';',$queryToFixQuizScores);
		return new JsonResponse([
            'queryToFixQuizScores'=>$queryToFixQuizScores,
            'queryToFixQuizResponses'=>$queryToFixQuizResponses,
            'studentsWithIncorrectScore'=>$studentsWithIncorrectScore,
			'quizzes'=>$quizzes,
			'totalResponses'=>$total,
			'questionsCount'=>count($resp),
			'questions'=>$resp
		]);
	}
	public static function fetchBeforeLeavePageQuestions($question,$editor=false){
	global $DB;

	if(gettype($question) != 'array'){
		$question = [$question];
	}
	$questions = array();
	foreach($question as $id){
		if(!$id) continue;
		if(gettype($id)=='array'){
			if($editor){
				$questions[]=$id;
			}else{
				$row =  Utility::getInstance()->fetchRow(
					QuizController::$queryGetRandomQuestions . ' LIMIT ' . 1,
					array(
						'bankId' => $id['bankId']
					)
				);
				$row=json_decode(json_encode($row));
				if ($row->type == 'multipart'){
					$row->prompt = preg_replace('@<script.*?>.*?<\/script>|<script.*?>|<\/script>@','',$row->prompt);

					if ($row->extra == ''){
						$row->extra = $row->prompt;
						$row->prompt = 'Multipart Question';
					}
					$multipart = new \multipartPrepare;
					$multipart->is_teacher = 1;
					$multipart->questionLifter($row->extra,$row->id);
					$row->edit = $row->extra;
					$row->extra = $multipart->question;
				}

				$row->options=array();
				$query = "SELECT text FROM question_options WHERE question_id = {$row->id} ORDER BY sort_order ";
				$options = $DB->mysqli->query($query);
				if($options && $options->num_rows >= 1)
					while($option = $options->fetch_object()) {
						$row->options[]=$option->text;
					}
				$row->extra = preg_replace('/\r\n|\r|\n/', '', $row->extra);
				$questions[]=$row;

			}
		}else{
			$row = Utility::getInstance()->fetchRow(self::$queryGetQuestion,['id'=>$id]);
			$row=json_decode(json_encode($row));
			if ($row->type == 'multipart'){
				$row->prompt = preg_replace('@<script.*?>.*?<\/script>|<script.*?>|<\/script>@','',$row->prompt);

				if ($row->extra == ''){
					$row->extra = $row->prompt;
					$row->prompt = 'Multipart Question';
				}
				$multipart = new \multipartPrepare;
				$multipart->is_teacher = 1;
				$multipart->questionLifter($row->extra,$row->id);
				$row->edit = $row->extra;
				$row->extra = $multipart->question;
			}

			$row->options=array();
			$query = "SELECT text FROM question_options WHERE question_id = {$id} ORDER BY sort_order ";
			$options = $DB->mysqli->query($query);
			if($options && $options->num_rows >= 1)
				while($option = $options->fetch_object()) {
					$row->options[]=$option->text;
				}
			$row->extra = preg_replace('/\r\n|\r|\n/', '', $row->extra);
			$questions[]=$row;
		}

	}

	return count($questions)?$questions:null;
}
	public static $queryGetQuestion=<<<SQL
		SELECT * FROM questions WHERE id = :id
SQL;
	public static $queryGetPageQuestionResponse=<<<SQL
		SELECT * FROM page_question_reponses WHERE page_id = :pageId and user_id = :userId
SQL;
	private static $queryGetUserResponse=<<<SQL
		SELECT * FROM quiz_responses qr WHERE question_id =:questionId and quiz_id =:pageId and user_id=:userId
SQL;
	public static $queryUpdateQuizResponseScores=<<<SQL
		UPDATE quiz_questions qq
		 LEFT JOIN questions q on qq.question_id = q.id
		 JOIN quiz_responses qr on if(qr.quiz_question_id,qr.quiz_question_id = qq.id,qr.question_id = qq.question_id)
		 SET qr.is_correct = is_correct*(:newPoints/qq.points)
		 WHERE qq.id =:quizQuestionId and is_correct>0
SQL;
	public static $queryGetClassId=<<<SQL
		SELECT cl.id FROM pages p
		JOIN quiz_questions qq on p.quiz_id = qq.quiz_id
		JOIN units u on u.id = p.unitid
		JOIN classes cl on cl.courseid = u.courseid
		WHERE qq.id = :quizQuestionId
SQL;
	public static $queryAllUserResponses=<<<SQL
	select qr.*,qq.points,questions.max_points,
	cl.name as className,p.name as pageName,
	qs.score as currentScore
	from quiz_responses qr
	 join pages p on qr.quiz_id = p.id
	 join quiz_questions qq on qq.quiz_id = p.quiz_id and if(qr.quiz_question_id,qr.quiz_question_id = qq.id,qq.question_id=qr.question_id)
	 join questions on qr.question_id = questions.id
	 join units u on u.id = p.unitid
	 join classes cl on cl.courseid = u.courseid
	 join quiz_scores qs on qs.quiz_id = p.id and qr.user_id = qs.user_id
	 where qr.question_id = :questionId
SQL;
	public static $queryCheckingBlankResponses=<<<SQL
	select distinct questions.prompt,questions.solution,	questions.id
	from
	questions
	join quiz_responses on questions.id = quiz_responses.question_id
	where type = 'blank';
	select * from questions where id = 300944;
SQL;




}
class QuestionGrader{

	public $type;
	public $studentResponse;
	public $questionId;
	public $questionInfo;
	public function __construct($type,$studentResponse,$questionId) {
		$this->type=$type;
		$this->studentResponse = $studentResponse;
		$this->questionId = $questionId;
	}
	public function gradeAndNormalize(){
		if(!$this->questionInfo) $this->getQuestionInfo();
		$result = [];
		switch($this->type){
			case 'single':
				$result = $this->gradeMultipleChoice();
				break;
			case 'oneword':
				$result = $this->gradeOneWord();
				break;
			case 'multipart':
				$result = $this->gradeMultipart();
				break;
			case 'wordmatching':
				$result = $this->gradeWordMatching();
				break;
			case 'matching':
				$result = $this->gradeImageMatching();
				break;
			case 'essay':
				$result = $this->gradeEssay();
				break;
			case 'studentvideoresponse':
				$result = $this->gradeVideoResponse();
				break;
			case 'multiple':
				$result = $this->gradeMultipleResponse();
				break;
			case 'blank':
				$result = $this->gradeBlank();
				break;
			default:
				$result = $this->gradeMultipleChoice();

		}
		return $result;
	}
	private function getQuestionInfo(){
		$data = Utility::getInstance()->fetch($this->queryGetQuestionInfo,['id'=>$this->questionId]);
		$this->questionInfo = new \stdClass();
		foreach($data as $row){
			if(!isset($this->questionInfo->prompt)){
				$this->questionInfo->prompt=$row['prompt'];
				$this->questionInfo->solution=$row['solution'];
				$this->questionInfo->extra=$row['extra'];
				$this->questionInfo->options=array();
			}
			$this->questionInfo->options[]=$row['optionText'];
		}
	}
	private function gradeMultipleChoice(){
		return [intval($this->questionInfo->solution == $this->studentResponse),$this->studentResponse];
	}
	private function gradeWordMatching(){
		$a = preg_replace('/(<[^>]*)(?<![\\\|>])(")([^>]*>)/','$1\\"$3',$this->questionInfo->extra);
		while($this->questionInfo->extra!=$a){
			$this->questionInfo->extra=$a;
			$a = preg_replace('/(<[^>]*)(?<![\\\|>])(")([^>]*>)/','$1\\"$3',$this->questionInfo->extra);
		}
		$tmp            = json_decode(preg_replace('@\r\n|\r|\n@xsi','',$this->questionInfo->extra));
		$count          = 0;
		$questionnumber = 0;
		$worth = 1.0/count((array)$tmp);
		foreach ($tmp as $group) {
			$questionnumber += 1;
			if (isset($this->studentResponse))
				foreach ($this->studentResponse as $i) {
					$test = $i->name1 . $i->name2;
					if (trim($test) == $group->tmpanswers ||
						($group->target==$i->name2 && array_search(trim($i->name1),$group->matches)!==false)
					) {
						$count += 1;
						break;
					}
				}
		}

		if ($count > 0 ) {
			$is_correct = $worth * $count;

		} else {
			$is_correct = 0;
		}

		if (isset($this->studentResponse))
			$response = json_encode($this->studentResponse);
		if (!isset($response)){
			$response = '';
		}
		return [floatval($is_correct),$response];
	}
	private function gradeImageMatching()
	{
		$count = 0;
		$worth = 1.0 / count($this->studentResponse->matching->imagesCordinates);
		foreach ($this->studentResponse->matching->imagesCordinates as $key => $cordinates) {
			if (isset($cordinates->dropindex))
				if ($key == $cordinates->dropindex) {
					$count += 1;
				}
		}

		if ($count > 0) {
			$is_correct = $worth * $count;


		} else {
			$is_correct = 0;
		}


		$response = json_encode($this->studentResponse->matching->imagesCordinates);
		return [floatval($is_correct),$response];
	}
	private function gradeBlank(){
		return [intval(QuestionController::_isBlankCorrect($this->questionId,$this->studentResponse)),$this->studentResponse];
	}
	private function gradeMultipleResponse(){
		$compareone = explode(',',trim(strtolower($this->studentResponse)));
		$comparetwo = explode(',',trim(strtolower($this->questionInfo->solution)));
		$worth = 1.0/count($comparetwo);
		$countcorrect = 0;
		$count = 0;
		foreach ($compareone as $one) {
			foreach ($comparetwo as $two) {
				if (trim($one) == trim($two)){
					$countcorrect +=floatval($worth);
					$count+=1;
				}
			}
		}
		$is_correct = round($countcorrect,1);
		return [$is_correct,$this->studentResponse];
	}
	private function gradeMultipart(){

		if (preg_match('@\w@', $this->questionInfo->extra)) {
			$NumberExpectedResults = substr_count(preg_replace('@<\w.*?>|<\/\w+>@xsi', '', $this->questionInfo->extra), '__{');
		} else {
			$NumberExpectedResults = substr_count(preg_replace('@<\w.*?>|<\/\w+>@xsi', '', $this->questionInfo->prompt), '__{');
		}

		$real = new \multipartPrepare;
		$real->answers = new \stdClass();
		if (!preg_match('@\w@', $this->questionInfo->extra)) {
			$real->questionLifter($this->questionInfo->prompt, $this->questionId);
		} else {
			$real->questionLifter($this->questionInfo->extra, $this->questionId);
		}

		$counttmp = 0;

		//Preparing for : in answer numbers only at the moment
		//It is assume that : is number can be either side ie plus or minus
		foreach ($real->answers as $key => $answers) {
			foreach ($answers as $k => $value) {
				if (preg_match('@\d\:\d@', $answers[$k])) {
					list($left, $right) = explode(':', $answers[$k]);
					$real->answers[$key][$k] = $left;
//                            $real->answers[$key][] = floatval($left)+floatval($right);
//                            $real->answers[$key][] = floatval($left)-floatval($right);
					$real->useTolerance = true;
					$real->tolerance = floatval($right);
				}
			}

			//Adding in a zero at end incase answer example is 6.4 and student puts in 6.40
			if (preg_match('@\d\.\d@', $real->answers[$key][0])) {
				$real->answers[$key][] = $real->answers[$key][0] . '0';
			}
		}

		foreach ($real->answers as $key => $answers) {
			foreach ($answers as $k => $value) {
				$value = preg_replace('@\s+|[~=]|\&\w+\;|\W[,.]+@s', '', $value);
//                            if (isset($extra->multipartRadio)){
//                                 $value = preg_replace('@\W||\&\w+\;@s', '', $value);
//                            }
				if (isset($this->studentResponse[$key])) {
					$this->studentResponse[$key] = preg_replace('@\s+|\W+[,.]@s', '', $this->studentResponse[$key]);

					//if responses have commas and answers..
					if ((preg_match('/,/', $this->studentResponse[$key])) && ((preg_match('/,/', $value))) && !$real->containsHtml) {

						$explodeValue = explode(',', strtolower(trim($value)));
						$countValue = count($explodeValue);
						$countCorrect = 0;
						$explodeAnswers = explode(',', strtolower(trim($this->studentResponse[$key])));


						foreach ($explodeValue as $x => $valueTest) {
							foreach ($explodeAnswers as $y => $answersTest) {
								if ($valueTest == $answersTest) {
									$counttmp++;
									$countCorrect++;
									if ($countCorrect == $countValue) {
										break 3;
									}
								}
							}
						}
					} //if responses have commas only..
					elseif ((preg_match('/,/', $this->studentResponse[$key])) && (!(preg_match('/,/', $value))) && !$real->containsHtml) {
						$explode = explode(',', strtolower(trim($this->studentResponse[$key])));
						foreach ($explode as $i => $singlevalue) {
							if ($singlevalue == strtolower(trim($value))) {
								$counttmp++;
								break 2;//Breaking out of nested loop
							}
						}
					} else {
						if (strtolower(trim($this->studentResponse[$key])) == strtolower(trim($value)) ||
							($real->useTolerance && (floatval($this->studentResponse[$key]) <= floatval($value + $real->tolerance) &&
									floatval($this->studentResponse[$key]) >= floatval($value - $real->tolerance))
							)
						) {
							$counttmp++;
							break;
						}
					}
				}
			}
		}

		//We are breaking down our question according to
		//The number of Exected results. look at $NumberExpectedResults above.
		$worth = 1 / $NumberExpectedResults;
		//echo $counttmp.' == '.$countValue."\n";

		//echo '$countValue ='.$countValue."\n";
		//echo '$counttmp ='.$counttmp."\n";

		if ($counttmp > 0) {
			$is_correct = $counttmp * $worth;

		} else {
			$is_correct = 0;
		}
		$replace = array(
			"'"
		);
		$with = array(
			'&#39;'
		);
		foreach ($this->studentResponse as &$answer) {
			foreach ($replace as $i => $value) {
				$answer = preg_replace('@' . $replace[$i] . '@xsi', $with[$i], $answer);
			}
		}
		$response = json_encode($this->studentResponse);
		return [floatval($is_correct),$response];
	}
	private function gradeEssay(){
		$is_correct = $this->studentResponse!=""?-1:0;
		return [$is_correct,$this->studentResponse];
	}
	private function gradeVideoResponse(){
		return [-1,$this->studentResponse];
	}
	private function gradeOneWord(){
		$compareone = excludePrepareSameValues(explode(',',trim(strtolower($this->studentResponse))));
		$comparetwo = excludePrepareSameValues(explode(',',trim(strtolower($this->questionInfo->options[0]))));
		$isCorrect = false;
		foreach ($compareone as $one) {
			foreach ($comparetwo as $two) {
				if (trim($one) == trim($two)){
					$isCorrect=true;
				}
			}
		}
		return [intval($isCorrect),$this->studentResponse];
	}
	function prepareAnswer($answer)
	{
		$answer = strip_tags($answer);
		return trim(strtolower(preg_replace('/\s+|[^a-zA-Z0-9 .:\/]|\r|\n|0?=\.|$/xsi', '', $answer)));
	}
	function excludePrepareSameValues($array){
		$testtmp = new \stdClass();
		$arraytmp = array();
		foreach ($array as $key => $value) {
			$value = prepareAnswer($value);
			if (!isset($testtmp->$value)){
				$testtmp->$value = 1;
				$arraytmp[] = $value;
			}
		}
		return $arraytmp;
	}

	private $queryGetQuestionInfo=<<<SQL
	SELECT *,qo.text as optionText from questions
	LEFT JOIN question_options qo on qo.question_id = questions.id
	 WHERE questions.id = :id
SQL;



}