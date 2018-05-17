	<?php

global $PATHS, $DB;

    use English3\Controller\PageController;
    use English3\Controller\Utility;
	use English3\Controller\VocabController;

require_once("_utils.php");
require_once("sql.php");
if(isset($_SESSION['USER']) && isset($_SESSION['USER']['LOGGED_IN']) && isset($_SESSION['USER']['ID']) && $_SESSION['USER']['ID'] > 0 && $_SESSION['USER']['LOGGED_IN']==true) {
	$uri = strtok($_SERVER['REQUEST_URI'], '?');

	$uri = str_replace('/vocab/', '', $uri);

	$uri = strtok($uri, '/');
	if($uri=='details'){
		$input = get_input();
		$vocabSQL = new VocabSQL();
		$info = $vocabSQL->fetch_one("SELECT * FROM modules where id={$input->vocabId}");
		$details = $vocabSQL->details($input->vocabId);
		$vocabs = array();
		foreach($details as $row){
			$id = $row->id;
			if(!isset($vocabs[$id])){
				$vocabs[$id] = array(
					'info'=> $row,
					'audio'=>array()
				);
			}
			$vocabs[$id]['audio'][]=$row->audio_url;
			$vocabs[$id]['image']=$row->image;
		}
		header('Content-Type: application/json');
		echo json_encode(['info'=>$info,'vocabs'=>array_values($vocabs)]);
		exit();
	}
	else if($uri=='save') {
		$input = get_input();
		$vocabSQL = new VocabSQL();

		validate_str($input->title, "Invalid name");
		validate_str($input->base_language, "Invalid Base Language");

		$id = $vocabSQL->saveModule($input->id,$input->title,
			isset($input->description) ? $input->description : '',
			$input->target_language,
			$input->base_language,
			$input->courseId);
		if (!$id)
			throwMessage("Could not save module");
		$position = 0;
		Utility::getInstance()->insert("DELETE FROM vocabularies WHERE module_id = :id",['id'=>$id]);
		foreach ($input->vocabs as $vocab) {
			unset($vocab->info->id);
			$vocab_id = $vocabSQL->saveVocab(isset($vocab->info->id)?$vocab->info->id:0,$id, $vocab->info->phrase, $vocab->info->translation,$position,$vocab->image);
			if (!$vocab_id)
				continue;
			$vocabSQL->saveAudio($vocab_id, $vocab->audio);
			$position++;
		}
		returnData(['message'=>'successful','id'=>$id]);
		exit();
	}
	else if($uri=='byunit'){
		if(!isset($_REQUEST['id'])){
			throwError('Unit id is required');
		}
		$unitId = intval($_REQUEST['id']);
		$vocabSQL = new VocabSQL();
		$all = $vocabSQL->get_by_unit($unitId);
		header('Content-Type: application/json');
		echo json_encode($all);
		exit();
	}
	else if($uri=='all'){

		$input = get_input();
		$lang=isset($_REQUEST['language'])?$_REQUEST['language']:'';

		$all = VocabController::_getAll($_REQUEST);
		$languages=array();
		foreach($all as $row){
			$lang = $row['language_id'];
			if(!isset($languages[$lang]))
				$languages[$lang]=array('language_id'=>$lang,
									'language'=>$row['language_name'],
									'vocabs'=>array());
			$languages[$lang]['vocabs'][] = $row;
		}
		header('Content-Type: application/json');
		echo json_encode(array_values($languages));
		exit();
	}

	$vocab_id = intval($uri);


	if($vocab_id > 0) {
		
		
		ob_start();
		if(!@include_once($PATHS->app_path . $PATHS->data_path . '/' . $vocab_id . '.json')) {
			
			$data = new \stdClass();
			$data->content = array();
			$userId = $_SESSION['USER']['ID'];
			$query = "SELECT pages.password,
							pages.vocab_config,
							pages.time_limit,
							pages.allowed_takes,
							qs.attempts_completed,
							vocabularies.id, vocabularies.translation, vocabularies.phrase,vocabularies.image, vocabulary_audios.audio_url
						FROM pages
						JOIN vocabularies ON (pages.moduleid=vocabularies.module_id)
						JOIN vocabulary_audios ON (vocabularies.id=vocabulary_audios.vocabulary_id)
						LEFT JOIN quiz_scores 	qs 	ON  qs.quiz_id = pages.id and qs.user_id = {$userId}
						WHERE pages.id={$vocab_id} AND (pages.layout='VOCAB' OR pages.layout='VOCAB_QUIZ')
						ORDER BY vocabularies.position ASC";

			$result = $DB->mysqli->query($query);
			$need_password = null;
			if($result && $result->num_rows > 0) {
				while($row = $result->fetch_object()) {
					if(is_null($row->vocab_config) || $row->vocab_config=='null' || $row->vocab_config==''){
						$row->vocab_config = '{"questionFormat":"word","questionType":"text","optionFormat":"definition","optionType":"text"}';
					}
					$data->quizConfig = json_decode($row->vocab_config);
					$data->allowed_takes = is_null($row->attempts_completed)?intval($row->allowed_takes):intval($row->allowed_takes)-intval($row->attempts_completed)-1;
					$data->isUnlimitedAttempts = !boolval($row->allowed_takes);
					$data->time_limit = intval($row->time_limit);
					$data->meta = PageController::_getPageMeta($vocab_id);
					if(is_null($need_password)){
						$need_password = $row->password?true:false;
						$data->need_password = $need_password;
					}
					if(!isset($data->content[$row->id])) {
						$temp = new \stdClass();

						$temp->id = $row->id;
						$temp->translation = $row->translation;
						$temp->phrase = $row->phrase;
						$temp->image = $row->image;


						$temp->urls = array();
		
						$temp->urls[] = $row->audio_url;

						$data->content[$row->id] = $temp;
					} else {
						$data->content[$row->id]->urls[] = $row->audio_url;
					}
				}
			}

                     $data->content = array_values($data->content);

			print json_encode($data);
		}
	}
	header('Content-Type: application/json');
	ob_end_flush();
	exit();
} 

?>