<?php

namespace English3\Controller;

use Doctrine\DBAL\Connection;
use English3\Controller\Organization\OrganizationController;
use English3\ResponseView\Notification;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\Serializer\Normalizer\GetSetMethodNormalizer;

class NotificationsController
{
    /**
     * @var Connection
     */
    private $read;

    public function __construct(Connection $read)
    {
        $this->read = $read;
    }
    public static function _getTeacherFeedbacks(Connection $reader,$teacherId){
        $util = new Utility($reader);
        return $util->fetch(self::$queryGetTeacherFeedback,['teacherId'=>$teacherId]);
    }
    public static function _markTeacherFeedbackAsViewed($postId){
        $util = new Utility();
        $util->reader->update('posts',[
            'viewed'=>1
        ],[
            'id'=>$postId
        ]);
    }
    public static function _markStudentFeedbackAsViewed($postId){
        $util = new Utility();
        $util->reader->update('posts',[
            'viewed'=>1
        ],[
            'id'=>$postId
        ]);
    }
    public static function _markQuizFeedbackAsViewed($quizId){
        $util = new Utility();
        $util->reader->update('quiz_feedback',[
            'viewed'=>1
        ],[
            'quiz_id'=>$quizId,
            'user_id'=>$_SESSION['USER']['ID']
        ]);
    }
    public static function _markForumFeedbackAsViewed($forumId){
        $util = new Utility();
        $util->reader->update('forum_grade',[
            'read_on'=>date('Y-m-d H:i:s')
        ],[
            'forumid'=>$forumId,
            'studentid'=>$_SESSION['USER']['ID']
        ]);
    }
    public static function _getQuizNotifications($studentId){
        $util = new Utility();
        return $util->fetch(
            self::$queryGetQuizNotifications,
            ['studentId'=>$studentId]
        );
    }
    public static function _getForumNotifications($studentId){
        $util = new Utility();
        return $util->fetch(
            self::$queryGetForumNotifications,
            ['studentId'=>$studentId]
        );
    }
    public function getStudentFeedback(Request $request,$postId){
        $notificationPost = PostsController::_get($this->read,$postId);
        $yourSubmission = Utility::getInstance()->fetchRow($this->queryGetYourSubmission,['postId'=>$notificationPost['postrootparentid']]);
        $replies = Utility::getInstance()->fetch($this->queryGetStudentReplies,['postId'=>$notificationPost['postrootparentid']]);
        return new JsonResponse(['yourSubmission'=>$yourSubmission,'replies'=>$replies]);

    }
    public static function shouldSendEmailNotificationToUser($userId,$role='student'){
        $orgId = OrganizationController::_getOrgFromUserId($userId);
        return OrganizationController::shouldSendNotifications($orgId) &&
            !boolval(UserMetaController::getField($userId,"disable_".$role."_notifications_email"));
    }
    public static function shouldSendPostEmailNotificationToUser($userId){
        $orgId = OrganizationController::_getOrgFromUserId($userId);
        return OrganizationController::shouldSendNotifications($orgId) &&
            !boolval(UserMetaController::getField($userId,"disable_student_post_notifications_email"));
    }
    public function getNotificationAction(Request $request)
    {
        if ($request->query->has('userid') === false) {
            throw new BadRequestHttpException('Missing userid');
        }
        $userid = $request->query->get('userid');
        if ($request->query->get('userid') == 'me') {
            $userid = $_SESSION['USER']['ID'];
        }

        $sql = <<<SQL
SELECT COUNT(DISTINCT id) as chat_count
FROM chats
WHERE to_user_id = :userid
SQL;

        $stmt = $this->read->prepare($sql);
        $stmt->execute(array(':userid' => $userid));
        $count = $stmt->fetchAll()[0]['chat_count'];
        $notification = new Notification();
        if (!isset($_SESSION['read_chat_message_count'])) {
            $_SESSION['read_chat_message_count'] = $count;
            $notification->setNewChatMessagesCount(0);
        } else {
            if ($_SESSION['read_chat_message_count'] < $count) {
                $new_message_count = $count - $_SESSION['read_chat_message_count'];
                $notification->setNewChatMessagesCount($new_message_count);
                $_SESSION['read_chat_message_count'] = $count;
            } else {
                $notification->setNewChatMessagesCount(0);
            }
        }

        $normalizer = new GetSetMethodNormalizer();
        return new JsonResponse($normalizer->normalize($notification));

    }

    private static $queryGetTeacherFeedback = <<<SQL
      SELECT p.*,
            p.created as 'feedbackOn',
            pages.name as page_name,
            teacher_post.message as teacherMessage,
            teacher_post.video_url as teacherVideoUrl,
            teacher_post.video_thumbnail_url as teacherVideoThumbnailUrl,
            teacher_post.fileuploadid as teacherFileUploadId,
            users.fname as 'teacher_fname',
            users.lname as 'teacher_lname'
      FROM posts p
      JOIN posts teacher_post on p.post_reply_id = teacher_post.id
      JOIN pages on p.pageid = pages.id
      JOIN users on p.userid = users.id
      WHERE teacher_post.userid = :teacherId and teacher_post.is_teacher = 1 and p.teacher_feedback = 1
SQL;
    //get all quizzes with feedback
    private static $queryGetQuizNotifications = <<<SQL
      SELECT p.name as page_name,
             p.id as page_id,
             p.layout,
             qf.quiz_id,
             qs.score,
             qf.date as created,
             qf.viewed,
             c.show_grades
      FROM pages p
      JOIN quiz_scores qs on p.id = qs.quiz_id
      JOIN units u on p.unitid = u.id
      JOIN classes c on c.courseid = u.courseid
      JOIN (SELECT * FROM
            quiz_feedback ORDER BY date DESC)
            qf on qs.user_id = qf.user_id and p.quiz_id = qf.quiz_id
      WHERE qs.user_id = :studentId
      group by page_id
SQL;
//get all forum with feedback
    private static $queryGetForumNotifications = <<<SQL
      SELECT p.name as page_name,
             p.id as page_id,
             p.layout,
             g.forumid,
             g.grade,
             g.modified as created,
             if(g.read_on is null,0,1) as viewed,
             c.show_grades
      FROM pages p
      JOIN forums f on p.id = f.pageid
      JOIN forum_grade g on g.forumid = f.id
      JOIN units u on p.unitid = u.id
      JOIN classes c on c.courseid = u.courseid
      WHERE g.studentid = :studentId
      group by page_id
SQL;
    private $queryGetYourSubmission = <<<SQL
    SELECT
        pg.name as page_name,
        pg.layout,
        p.pageid,
        p.message,
        p.video_url,
        p.video_thumbnail_url,
        p.upload_url,
        p.upload_file_name
    FROM posts p
    join pages pg on p.pageid = pg.id
    where p.id = :postId
SQL;

    private $queryGetStudentReplies = <<<SQL
    select
        u.fname as user_fname,
        u.lname as user_lname,
        p.created as feedbackOn,
        p.message,
        p.video_url,
        p.video_thumbnail_url,
        p.upload_url,
        p.upload_file_name
        from posts p
        join posts  root on p.postrootparentid = root.id
        join users u on u.id = p.userid
        join user_classes uc on uc.userid = u.id and uc.classid = p.classid
        and root.id = :postId
        and p.id <> root.id
        order by p.created desc;

SQL;


}