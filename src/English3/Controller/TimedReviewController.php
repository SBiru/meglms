<?php


namespace English3\Controller;

use Doctrine\DBAL\Connection;
use English3\ResponseView\Assignment;
use Phinx\Migration\Util;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\Serializer\Normalizer\GetSetMethodNormalizer;

class TimedReviewController
{
    /**
     * @var Connection
     */
    private $read;

    public function __construct(Connection $read)
    {
        $this->read = $read;
        if (isset($_SESSION['USER']) && isset($_SESSION['USER']['ID'])) {
            $this->userId = $_SESSION['USER']['ID'];
            $this->loggedIn = true;
        } else {
            $this->loggedIn = false;
        }
    }

    /**
     * Get the timed_review JSON information for a given `page_id`.
     */
    public function getTimedReviewForPage(Request $req, $page_id) {
        if (!$this->loggedIn) {
            throw new BadRequestHttpException('Not logged in');
        }
        if ($page_id <= 0) {
            throw new BadRequestHttpException('Invalid page id');
        }

        $page = $this->read->fetchAssoc(<<<SQL
            SELECT timed_id, timed_limit, timed_pause from pages
            WHERE pages.id=:page_id AND pages.layout='TIMED_REVIEW'
            LIMIT 1
SQL
            , [':page_id' => $page_id]);

        if (!$page) {
            throw new BadRequestHttpException('Page not found');
        }

        $review = $this->read->fetchAssoc(<<<SQL
            SELECT * FROM timed_review
            WHERE id=:id LIMIT 1
SQL
            , [':id' => $page['timed_id']]);


        if (!$review) {
            print_r($page);
            throw new BadRequestHttpException('Timed review not found');
        }

        $page['pagename'] = $page['title'];
        $page['reviewData'] = json_decode($review['dialog_json']);
        $page['title'] = $review['title'];
        $page['description'] = $review['description'];
        $page['timed_pause'] = intval($page['timed_pause']);
        $page['timed_limit'] = intval($page['timed_limit']);

        return new JsonResponse($page);
    }

    public function getTimedReview(Request $request, $id) {
        $data = $this->read->fetchAssoc('select * from timed_review where id=:id', ['id'=>$id]);
        $data['dialog_json'] = json_decode($data['dialog_json']);
        return new JsonResponse($data);
    }

    /**
     * Submit the video recordings for an assignment page (specified by 
     * `page_id`) and save it as a new `post`
     */
    public function postOnTimedReview(Request $request, $page_id) {
        if (!$this->loggedIn) {
            throw new BadRequestHttpException('Not logged in');
        }
        $destname = self::generateUnique(10);
        global $PATHS;

        $BASE = $PATHS->app_path . $PATHS->base_site_public_path;
        $video = $BASE . "uservids/" . $destname . '.mp4';
        $thumb = $BASE . "uservids/" . $destname . '.jpg';

        $this->processSubmission($request, $video);
        $this->makeThumbnail($video, $thumb);
        $this->savePost($page_id, $destname);

        return new JsonResponse('success');
    }

    /**
     * Update the JSON timed_review specification for a given timed review
     */
    public function updateTimedReview(Request $request, $review_id) {
        if (!$this->loggedIn) {
            throw new BadRequestHttpException('Not logged in');
        }
        $body = json_decode($request->getContent());
        $this->read->update('timed_review', [
            'title' => $body->title,
            'description' => $body->description,
            'dialog_json' => json_encode($body->dialog_json),
        ], ['id' => $review_id]);
        return new JsonResponse(['status' => 'success']);
    }
    /**
     * Get groups of prompts
     */
    public function getGroups(Request $req) {
        $util = Utility::getInstance();
        $util->calcLoggedIn();
        if(!$util->me->amISuperUser()){
            $orgId = $req->query->has('orgId')?$req->query->get('orgId'):$util->me->user->getOrgId();
            $query = self::$queryGetGroups.' and orgid='.$orgId . ' group by g.id';
        }else{
            $query = self::$queryGetGroups.' group by g.id';
        }
        return new JsonResponse($util->fetch($query.' order by g.title'));
    }
    /**
     * Get group of prompts
     */
    public function getGroup(Request $req,$id) {
        $util = Utility::getInstance();
        $util->calcLoggedIn();

        $data = $util->fetch($this->queryGetGroup,['id'=>$id]);
        $group = array();
        foreach($data as $row){
            if(!isset($group['id'])){
                $group=array(
                    'id'=>$row['id'],
                    'title'=>$row['title'],
                    'classId'=>$row['classid'],
                    'orgId'=>$row['orgid'],
                    'prompts'=>array()
                );
            }
            if($row['promptId']){
                $prompt = array(
                    'id'=>$row['promptId'],
                    'name'=>$row['promptName']?:'',
                    'answer'=>$row['answer'],
                    'prompt'=>$row['prompt'],
                    'shortPrompt'=>$row['shortPrompt'],
                    'modifiedOn'=>$row['modified_on'],
                    'type'=>$row['type'],
                    'time_limit'=>$row['time_limit'],
                    'time_pause'=>$row['time_pause'],
                    'creator'=>$row['creator'],
                    'groupid'=>$row['id'],
                    'time_prepare'=>$row['time_prepare']
                );
                $options =json_decode($row['options'],true);
                if($options){
                    $prompt=array_merge($prompt,$options);
                }


                $group['prompts'][$row['promptId']]=$prompt;
            }

        }
        return new JsonResponse($group);
    }
    /**
     * Move prompt from one group to another
     */
    public function movePrompt(Request $req,$id) {
        $util = Utility::getInstance();
        Utility::clearPOSTParams($req);
        $util->checkRequiredFields([
            'srcGroup',
            'destGroup'
        ],$req->request->all());
        $this->read->update('timed_review_prompts',
            ['groupid'=>$req->request->get('destGroup')],
            ['id'=>$id]
        );
        return new JsonResponse('ok');
    }
    /**
     * Remove group
     */
    public function removeGroup(Request $req, $id) {
        $this->read->delete('timed_review_groups',
            ['id'=>$id]);
        $this->read->delete('timed_review_prompts',
            ['groupid'=>$id]);
        return new JsonResponse('ok');
    }
    /**
     * Remove prompt
     */
    public function removePrompt(Request $req, $id) {
        $this->read->delete('timed_review_prompts',
            ['id'=>$id]);
        return new JsonResponse('ok');
    }
    /**
     * Save prompt
     */
    public function savePrompt(Request $req, $id) {
        $util = Utility::getInstance();
        Utility::clearPOSTParams($req);
        $util->checkRequiredFields([
            'prompt',
            'type',
            'groupid'
        ],$req->request->all());

        if($id=='new'){
            $this->read->insert(
                'timed_review_prompts',
                [
                    'prompt'=>$req->request->get('prompt'),
                    'answer'=>$req->request->get('answer'),
                    'type'=>$req->request->get('type'),
                    'time_limit'=>is_numeric($req->request->get('time_limit'))?$req->request->get('time_limit'):null,
                    'time_pause'=>is_numeric($req->request->get('time_pause'))?$req->request->get('time_pause'):null,
                    'time_prepare'=>is_numeric($req->request->get('time_prepare'))?$req->request->get('time_prepare'):null,
                    'options'=>self::prepareOptions($req->request->all()),
                    'groupid'=>$req->request->get('groupid'),
                    'name'=>$req->request->get('name'),
                    'modified_by'=>$_SESSION['USER']['ID']
                ]
            );
            $id = $this->read->lastInsertId();
        }else{
            $this->read->update(
                'timed_review_prompts',
                [
                    'prompt'=>$req->request->get('prompt'),
                    'answer'=>$req->request->get('answer'),
                    'type'=>$req->request->get('type'),
                    'time_limit'=>is_numeric($req->request->get('time_limit'))?$req->request->get('time_limit'):null,
                    'time_pause'=>is_numeric($req->request->get('time_pause'))?$req->request->get('time_pause'):null,
                    'time_prepare'=>is_numeric($req->request->get('time_prepare'))?$req->request->get('time_prepare'):null,
                    'options'=>self::prepareOptions($req->request->all()),
                    'groupid'=>$req->request->get('groupid'),
                    'name'=>$req->request->get('name'),
                    'modified_by'=>$_SESSION['USER']['ID'],
                    'modified_on'=>(new \DateTime)->format('Y-m-d h:i:s')
                ],
                ['id'=>$id]
            );
        }
        return new JsonResponse(['id'=>$id]);
    }
    /**
     * Save group of prompts
     */
    public function saveGroup(Request $req, $id) {
        $util = Utility::getInstance();
        Utility::clearPOSTParams($req);
        $util->checkRequiredFields([
            'classId',
            'orgId',
            'title'
        ],$req->request->all());

        $util->checkTeacher($req->request->get('classId'));

        if($id=='new'){
            $id = TimedReviewController::_createGroup(
                $req->request->get('classId'),
                $req->request->get('orgId'),
                $req->request->get('title'),
                $_SESSION['USER']['ID']
            );
        }else{
            $this->read->update(
                'timed_review_groups',
                [
                    'title'=>$req->request->get('title'),
                    'modified_by'=>$_SESSION['USER']['ID'],
                    'modified_on'=>(new \DateTime)->format('Y-m-d h:i:s')
                ],
                ['id'=>$id]
            );
        }
        return new JsonResponse(['id'=>$id]);

    }
    public static function _createGroup($classId,$orgId,$title,$userId){
        Utility::getInstance()->reader->insert(
            'timed_review_groups',
            [
                'classid'=>$classId,
                'orgid'=>$orgId,
                'title'=>$title,
                'modified_by'=>$userId
            ]
        );
        $id = Utility::getInstance()->reader->lastInsertId();
        return $id;
    }
    /**
     * Delete a timed review
     */
    public function deleteTimedReview(Request $request, $id) {
        if (!$this->loggedIn) {
            throw new BadRequestHttpException('Not logged in');
        }
        // TODO access control
        $removed = $this->read->delete('timed_review', [ 'id' => $id ]);
        $status = 'success';
        if (!$removed) {
            $status = 'failure';
        }
        return new JsonResponse(['status' => $status]);
    }
    /**
     * Create a new timed review
     */
    public function createTimedReview(Request $request) {
        if (!$this->loggedIn) {
            throw new BadRequestHttpException('Not logged in');
        }
        $body = json_decode($request->getContent());
        $this->read->insert('timed_review', [
            'title' => $body->title,
            'description' => $body->description,
            'dialog_json' => json_encode([]),
        ]);
        $id = $this->read->lastInsertId();
        return new JsonResponse(['id' => $id, 'title' => $body->title, 'description' => '']);
    }

    /**
     * Get a list of the timed reviews that are available
     */
    public function getTimedReviews(Request $request) {
        if (!$this->loggedIn) {
            throw new BadRequestHttpException('Not logged in');
        }
        $results = $this->read->fetchAll('SELECT id, title, description FROM timed_review');
        return new JsonResponse($results);
    }

    /**
     * @return string Json string with the normalized options
     */
    public static function prepareOptions($options=null){

        if($options['type']=='audio'){
            Utility::getInstance()->checkRequiredFields(['audioFile'],$options);
            return json_encode(array('audioFile'=>$options['audioFile'],'isInformation'=>boolval($options['isInformation'])));
        }else if($options['type']=='video'){
            Utility::getInstance()->checkRequiredFields(['videoFile','videoThumbnailFile'],$options);
            return json_encode(array(
                'videoFile'=>$options['videoFile'],
                'videoThumbnailFile'=>$options['videoThumbnailFile'],
                'isInformation'=>boolval($options['isInformation'])

            ));
        }
        return json_encode(array('isInformation'=>boolval($options['isInformation'])));
    }
    function fetchTimedPrompts($rawData){
        $usedGroupsAndPrompts = array();
        //fetching all specific prompts;

        $prompts = array_map(function($prompt) use($usedGroupsAndPrompts){
            if($prompt['type']!=='promptFromGroup'){
                return $prompt;
            }
            $row = Utility::getInstance()->fetchRow("select *,if(char_length(p.prompt)>30,concat(LEFT(p.prompt,30),'...'),p.prompt) as shortPrompt from timed_review_prompts p where p.id = '{$prompt['selected']['prompt']}'");
            $prompt = array(
                'id'=>$row['id'],
                'answer'=>$row['answer'],
                'prompt'=>$row['prompt'],
                'shortPrompt'=>$row['shortPrompt'],
                'type'=>$row['type'],
                'name'=>$row['name'],
                'time_limit'=>$row['time_limit'],
                'time_pause'=>$row['time_pause'],
                'groupid'=>$row['groupid'],
                'time_prepare'=>$row['time_prepare']
            );
            $options =json_decode($row['options'],true);
            if($options){
                $prompt=array_merge($prompt,$options);
            }
            if(!isset($usedGroupsAndPrompts[$row['groupid']])){
                $usedGroupsAndPrompts[$row['groupid']]=array();
            }
            $usedGroupsAndPrompts[$row['groupid']][]=$row['id'];
            return $prompt;
        },$rawData);

        $prompts = array_map(function($prompt) use(&$usedGroupsAndPrompts){
            if($prompt['type']!=='randomFromGroup'){
                return $prompt;
            }
            $excludeIds = $usedGroupsAndPrompts[$prompt['selected']['group']];
            $excludeIds = $excludeIds?$excludeIds:array('');
            $row = Utility::getInstance()->reader->fetchAssoc(TimedReviewController::$queryGetRandomPromptFromGroup,[
                'excludeIds'=>$excludeIds,
                'groupId'=>$prompt['selected']['group']
            ],
                ['excludeIds'=>\Doctrine\DBAL\Connection::PARAM_STR_ARRAY]
            );
            $prompt = array(
                'id'=>$row['id'],
                'answer'=>$row['answer'],
                'prompt'=>$row['prompt'],
                'shortPrompt'=>$row['shortPrompt'],
                'type'=>$row['type'],
                'time_limit'=>$row['time_limit'],
                'time_pause'=>$row['time_pause'],
                'groupid'=>$row['groupid'],
                 'time_prepare'=>$row['time_prepare']
            );
            $options =json_decode($row['options'],true);
            if($options){
                $prompt=array_merge($prompt,$options);
            }
            if(!isset($usedGroupsAndPrompts[$row['groupid']])){
                $usedGroupsAndPrompts[$row['groupid']]=array();
            }
            $usedGroupsAndPrompts[$row['groupid']][]=$row['id'];
            return $prompt;
        },$prompts);
        //fetching random prompts

        return $prompts;
    }
    /** interaly used to get the submitted video files and join them into a
     * single file
     * TODO support firefox.
     */
    function processSubmission(Request $request, $outfile) {
        $count = intval($request->request->get('chunks'));
        if (!$count) {
            throw new BadRequestHttpException("Failed to get a count");
        }
        $tmpdir = tempnam(sys_get_temp_dir(), '');
        if (file_exists($tmpdir)) { unlink($tmpdir); }
        mkdir($tmpdir);

        $ffmpegcommand = "ffmpeg ";
        $filterpart = "";
        for ($i=0; $i<$count; $i++) {
            $key = "chunk-${i}";
            $afile = $request->files->get($key . '-audio')->getRealPath();
            $vfile = $request->files->get($key . '-video')->getRealPath();
            // $afile = $_FILES[$key . '-audio']['tmp_name'];
            // $vfile = $_FILES[$key . '-video']['tmp_name'];
            $cmd = "ffmpeg -i ${afile} -i ${vfile} ${tmpdir}/chunk-${i}.mp4";

            exec($cmd, $out, $ret);
            if ($ret) {
                print_r($out);
                print_r($ret);
                print "Failed to encode ${key} with ${cmd}! ${out} ${ret}\n";
                throw new BadRequestHttpException("Failed to encode");
            }
            $ffmpegcommand .= "-i ${tmpdir}/chunk-${i}.mp4 ";
            $filterpart .= "[${i}:0] [${i}:1] ";
        }
        $ffmpegcommand .= "\
            -filter_complex \"${filterpart} concat=n=${count}:v=1:a=1 [v] [a]\" \
            -map \"[v]\" -map \"[a]\" \
            ${outfile}";


        // TODO incorporate these options?
        // $mp4convert="/usr/bin/ffmpeg -i " . $destination_file . " -vcodec libx264 -crf 23 -preset medium -vsync 1 -r 25 -acodec aac -strict -2 -b:a 64k  -ar 44100 -ac 1 " . $mp4_file_name . " > /dev/null 2>/dev/null &";

        exec($ffmpegcommand, $out, $ret);
        // print "Outint to ${outfile} from ${tmpdir}";
        if ($ret) {
            print_r($out);
            print_r($ret);
            print "Failed! ${out} ${ret}\n";
            throw new BadRequestHttpException("Failed to combine");
        }
    }

    public static function  generateUnique($unique_end_length) {
        $unique_end_length = intval($unique_end_length);

        $rand = array('a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'k', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z');

        $date = date("Y-m-d-s-");
        $str = '';

        $length = count($rand) - 1;

        for($i = 0; $i < $unique_end_length; $i++) {
            $str .= $rand[mt_rand(0, $length)];

        }

        return $date . $str;
    }

    /**
     * Turn a movie into a thumbnail
     */
    function makeThumbnail($movie, $outfile) {
        shell_exec("/usr/bin/ffmpeg -i ${movie} -deinterlace -an -ss 1 -t 00:00:10 -r 1 -y -vcodec mjpeg -f mjpeg $outfile 2>&1");
    }

    /**
     * Save the video as a post in the database
     */
    function savePost($page_id, $name) {
        $info = $this->getClassInfo($page_id);
        $perms = $this->getPermissions($page_id);

        $this->read->insert('posts', [
            'classid' => $info->classid,
            'userid' => $this->userId,
            'pageid' => $page_id,
            'postrootparentid' => 0,
            'post_reply_id' => 0,
            'video_url' => '/public/uservids/' . $name . '.mp4',
            'video_thumbnail_url' => '/public/uservidthumbnails/' . $name . '.jpg',
            'message' => '',
            'is_private' => $perms->is_private,
            'is_teacher' => $info->is_teacher,
        ]);

        $last_id = $this->read->lastInsertId();
        $this->read->update(
            'posts',
            ['postrootparentid' => $last_id, 'post_reply_id' => $last_id],
            ['id' => $last_id]
        );
    }

    function getClassInfo($page_id) {
        return (object) $this->read->fetchAssoc(<<<SQL
            SELECT user_classes.classid, user_classes.is_teacher
            FROM `user_classes`
            JOIN classes ON (user_classes.classid=classes.id)
            JOIN units ON (classes.courseid=units.courseid)
            JOIN pages ON (pages.unitid=units.id)
            WHERE user_classes.userid=:user_id AND
                  pages.id=:page_id LIMIT 1
SQL
            , ['user_id' => $this->userId, 'page_id' => $page_id]);
    }

    function getPermissions($page_id) {
        return (object) $this->read->fetchAssoc(<<<SQL
            SELECT allow_video_post, allow_text_post, is_private, is_gradeable
            FROM pages
            WHERE id=:page_id LIMIT 1
SQL
            , ['page_id' => $page_id]);
    }
    public static $queryGetGroups = <<<SQL
    SELECT g.*,count(distinct p.id) as numPrompts
    FROM timed_review_groups g
    LEFT JOIN timed_review_prompts p ON p.groupid = g.id
    WHERE 1
SQL;
    private $queryGetGroup = <<<SQL
    SELECT g.*,
      p.id as promptId,
      p.name as promptName,
      p.prompt,
      if(char_length(p.prompt)>30,concat(LEFT(p.prompt,30),'...'),p.prompt) as shortPrompt,
      p.answer,
      p.type,
      p.time_limit,
      p.time_pause,
      p.time_prepare,
      p.modified_on,
      concat(u.fname, ' ', u.lname) as creator,
      p.options
    FROM timed_review_groups g
    LEFT JOIN timed_review_prompts p ON p.groupid = g.id
    LEFT JOIN users u ON p.modified_by = u.id
    WHERE g.id=:id
    ORDER BY p.name;
SQL;
    public static $queryGetRandomPromptFromGroup = <<<SQL
    select *,
      if(char_length(p.prompt)>30,concat(LEFT(p.prompt,30),'...'),p.prompt) as shortPrompt
      from timed_review_prompts p
      where groupid = :groupId and id not in (:excludeIds)
      order by rand() limit 1
SQL;



}
