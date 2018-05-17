<?php

namespace English3\Controller;

use Doctrine\DBAL\Connection;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class TeacherResponsesController{

    public function __construct(Connection $reader) {
        $this->reader = $reader;
        if (isset($_SESSION['USER']) && isset($_SESSION['USER']['ID'])) {
            $this->userId = $_SESSION['USER']['ID'];
            $this->loggedIn = true;
        } else {
            $this->loggedIn = false;
        }
    }

    private function checkUser() {
        if (!$this->loggedIn) {
            throw new BadRequestHttpException('Not logged in');
        }
    }

    private function prepareAndFetch($query, $paramsArray) {
        $preparedStatement = $this->reader->prepare($query);
        $preparedStatement->execute($paramsArray);
        return $preparedStatement->fetchAll();
    }

    public function getTeachers(Request $request,$org_id){
        $this->checkUser();




        $params = $request->query->all();;
        if($org_id>0){
            $params['d.organizationid']=$org_id;
        }
//
//        $min_date=$request->query->get('min_date');
//        $max_date=$request->query->get('max_date');
//
//        array(':orgId' => $org_id);
//
//
//        $max_date=$max_date?"AND posts.created <= '{$max_date}'":"";
//        $min_date=$min_date?"AND posts.created >= '{$min_date}'":'';

        $query = $this->queryGetTeachers($params);
//        $query = str_replace("#minDate", $min_date, $query);
//        $query = str_replace("#maxDate", $max_date, $query);

        $data = $this->prepareAndFetch($query,[]);
        $teachers = $this->prepareTeachers($data);
        $this->finishTeachers($teachers);

        return new JsonResponse($teachers);

    }
    private function finishTeachers(&$teachers){
        foreach($teachers as &$teacher){
            $classes_text = array();
            $total = 0;
            foreach($teacher['classes'] as &$class){
                $totalPosts = 0;
                foreach($class['posts'] as $type){
                    $totalPosts+= count($type);
                }
                $classes_text[]=$class['name'].': '.$totalPosts;
                $total+=$totalPosts;
            }
            $classes_text = implode(', ',$classes_text);
            $teacher['classes']=array_values($teacher['classes']);
            $teacher['classes_text']=$classes_text;
            $teacher['total_posts']=$total;
        }
        $teachers = array_values($teachers);
    }
    private function prepareTeachers($data){
        $teachers = array();
        foreach($data as $row){
            $id = $row['id'];
            if(!isset($teachers[$id])){
                $teachers[$id] = array(
                    'id'=>$id,
                    'fname'=>$row['fname'],
                    'lname'=>$row['lname'],
                    'email'=>$row['email'],
                    'classes'=>array()
                );
            }
            $classes = &$teachers[$id]['classes'];
            if(!isset($classes[$row['classid']])){
                $classes[$row['classid']] = array(
                    'id'=>$row['classid'],
                    'name'=>$row['name'],
                    'posts'=>array(
                        'text'=>array(),
                        'video'=>array(),
                        'file'=>array()
                        )
                );
            }
            $posts = &$classes[$row['classid']]['posts'];

            $post = array(
                'id'=>$row['postid'],
                'pageid'=>$row['pageid'],
                'postrootparentid'=>$row['postrootparentid'],
                'post_reply_id'=>$row['post_reply_id'],
                'pagetype'=>$row['layout'],
                'created'=>$row['post_created']
            );
            if($row['video_url']){
                $post['upload']=array(
                    'type'=>'video',
                    'url'=>$row['video_url']
                );
                $posts['video'][]=$post;
            }
            if($row['fileuploadid']){
                $post['upload']=array(
                    'type'=>'file',
                    'fileuploadid'=>$row['fileuploadid']
                );
                $posts['file'][]=$post;
            }
            if(!$row['fileuploadid'] && !$row['video_url']){
                $posts['text'][]=$post;
            }
        }
        return $teachers;
    }

    /* QUERY: get teachers for an org */
    private function queryGetTeachers($filters){
        $qb = $this->reader->createQueryBuilder();
        $qb->select('u.*,uc.classid,c.name,p.id as postid,p.pageid,p.postrootparentid,p.fileuploadid,
            p.post_reply_id,p.created as post_created,pg.layout');
        $qb->from('posts','p');
        $qb->join('p','grade_posts','gp','p.id=gp.teacher_post_id');
        $qb->join('p','users','u','p.userid=u.id');
        $qb->join('p','pages','pg','p.pageid=pg.id');
        $qb->join('p','units','un','pg.unitid=un.id');
        $qb->join('p','classes','c','un.courseid=c.courseid');
        $qb->join('p','courses','co','co.id=c.courseid');
        $qb->join('p','departments','d','d.id=co.departmentid');
        $qb->join('p','(select * from user_classes where is_teacher=1 group by userid,classid)','uc','uc.userid =p.userid and uc.classid=c.id');
        $qb->orderBy("u.fname");

        $and_cond = $qb->expr()->andx();
        $and_cond->add(1);

        foreach($filters as $key=>$value){
            if($key=='max_date'){
                $and_cond->add($qb->expr()->lte('p.created',$qb->expr()->literal($value)));
            }
            else if($key=='min_date'){
                $and_cond->add($qb->expr()->gte('p.created',$qb->expr()->literal($value)));
            }
            else{
                $and_cond->add($qb->expr()->eq($key,$qb->expr()->literal($value)));
            }
        }
        $qb->andWhere($and_cond);

        $query = $qb->getSQL();

        $query = "SELECT  p.*,video.video_url,upload_url from ("
            .$query
            .") p LEFT JOIN (SELECT * FROM posts  WHERE video_url<>'' or upload_url <>'') video on p.postrootparentid = video.postrootparentid and p.id<>video.id and video.userid=p.id";
        return $query;
//        SELECT  p.*,video.video_url,upload_url from (SELECT users.*,uc.classid,classes.name,posts.id as postid,posts.pageid,posts.postrootparentid,
//        posts.post_reply_id,posts.created as post_created,pages.layout
//        FROM posts
//        JOIN grade_posts on posts.id = grade_posts.teacher_post_id
//        JOIN users on posts.userid = users.id
//        JOIN pages on pages.id = posts.pageid
//        JOIN units on pages.unitid = units.id
//        JOIN classes on units.courseid = classes.courseid
//        JOIN courses on classes.courseid=courses.id
//        JOIN departments on courses.departmentid = departments.id
//        JOIN (select * from user_classes where is_teacher=1 group by userid,classid) uc on uc.userid =posts.userid and uc.classid=classes.id
//        WHERE departments.organizationid = :orgId #minDate #maxDate
//        ORDER BY users.fname) p
//		LEFT JOIN (SELECT * FROM posts  WHERE video_url<>"" or upload_url <>"") video on p.postrootparentid = video.postrootparentid and p.id<>video.id and video.userid=p.id;
    }
//= <<<SQL
//
//SQL;
}
?>