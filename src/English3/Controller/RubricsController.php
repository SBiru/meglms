<?php
namespace English3\Controller;

use Doctrine\DBAL\Connection;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;


class RubricsController
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
    public function checkUser(){
        if (!$this->loggedIn) {
            throw new BadRequestHttpException('Not logged in');
        }
    }

    public function createRubric(Request $request,$org){
        $this->checkUser();
        $body = json_decode($request->getContent());
        if(!(isset($body->name) && $body->name!=""))
            return new JsonResponse(['status'=>'Invalid rubric name']);
        if(!intval($body->classid))
            return new JsonResponse(['status'=>'Invalid class id']);

        if(!$org){
            $org = ClassesController::_getOrgId($this->read,$body->classid);
        }

        $id = isset($body->id)?intval($body->id):0;
        $page_id = isset($body->page_id)?intval($body->page_id):0;

        if($id){
            $linkedPages = $this->getLinkedPages($id);
            if(count($linkedPages)>0 &&
                !(count($linkedPages)==1 && $linkedPages[0]['id']==$page_id)
            ){
                $info = $this->read->fetchAssoc("SELECT name FROM rubrics WHERE id = {$id}");
                $old_name = $info['name'];
                if($old_name==$body->name)
                    $body->name = $body->name.=' copy';
            }
            else {
                return $this->updateRubric($request,$id);
            }
        }
        $deptId = ClassesController::_getDeptId($body->classid);
        $this->read->insert('rubrics', [
            'name' => $body->name,
            'org_id'=>$org,
            'class_id'=>$body->classid,
            'rows'=>$body->rows,
            'cols'=>$body->cols,
            'department_id'=>$deptId,
            'user_id'=>$this->userId
        ]);

        $id = $this->read->lastInsertId();

        if(isset($body->grid))
        {
            $success = $this->updateRubricItems($id,$body->grid);
            if(gettype($success)==='string' && $success!=""){
                $this->read->delete('rubrics',['id'=>$id]);
                return new JsonResponse(['status'=>$success]);
            }
            else{
                if(gettype($success)==='double'){
                    $maxPoints = $success;
                    $util = new Utility();
                    $pages = $util->fetch(self::$queryGetPagesUsingRubric,['rubricId'=>$id]);
                    foreach($pages as $page){
                        $util->reader->update(
                            'class_assignments',
                            ['points'=>$maxPoints],
                            ['page_id'=>$page['id']]
                        );
                    }
                }
            }
        }

        return new JsonResponse(['status'=>'success','id'=>$id,'name'=>$body->name]);
    }
    private function updateRubricItems($id,$grid){
        $this->read->delete('rubric_items',['rubric_id'=>$id]);

        $values = array();

        for($i = 0; $i<count($grid->items);$i++){
            $row = &$grid->items[$i];
            for($j=0;$j<count($row);$j++){
                $cell = &$row[$j];
                $cell->score = intval($cell->score);
                if($cell->text!=""||$cell->score!=0){
                    if($cell->text=="") return "Invalid content for row: {$i}, col: {$j}";

                    if(!isset($grid->rubric_descriptions[$i]->total)) $grid->rubric_descriptions[$i]->total=0;
                    $grid->rubric_descriptions[$i]->total+=$cell->score;
                    $cell->text = addslashes($cell->text);
                    $values[]="('{$id}', '{$i}','{$j}','{$cell->text}','{$cell->score}')";
                }

            }

        }
        $maxPoints = 0;
        for($i = 0; $i<count($grid->rubric_descriptions);$i++){
            $item = &$grid->rubric_descriptions[$i];
            if($item->text!=""||$item->score!=0||$item->score) {

                if ($item->text == "" || $item->score == 0) return "Invalid content for rubric title in row: {$i}";
                //if(!isset($item->total) || $item->total!=100) return "Sum of items is not 100 for row {$i}";
                $item->text = addslashes($item->text);
                $maxPoints+=floatval($item->score);
                $values[] = "('{$id}','{$i}','-1','{$item->text}','{$item->score}')";

            }
        }
        if($grid->header){
            $headervalues=[];
            $hasItem=false;
            for($j = 0; $j<count($grid->header);$j++){
                $hasItem = $item->text!=""||$hasItem;
                $item = &$grid->header[$j];
                $item->text = addslashes($item->text);
                $headervalues[] = "('{$id}','-1','{$j}','{$item->text}','0')";
            }
            if($hasItem){
                $values = array_merge($values,$headervalues);
            }
        }
        
        if(count($values)==0) return "The grid is empty";
        $values = implode(",",$values);

        $query = "INSERT INTO rubric_items (rubric_id, row, col, text, score) values {$values}";

        $this->read->executeUpdate($query);
        return $maxPoints;
    }


    public function updateRubric(Request $request,$id){
            $this->checkUser();
        $body = json_decode($request->getContent());
        if(!(isset($body->name) && $body->name!=""))
            return new JsonResponse(['status'=>'Invalid rubric name']);

        $this->read->update('rubrics', [
            'name' => $body->name,
            'rows'=>$body->rows,
            'cols'=>$body->cols,
        ],['id'=>$id]);

        if(isset($body->grid))
        {
            $success = $this->updateRubricItems($id,$body->grid);
            if(gettype($success)==='string' && $success!=""){
                return new JsonResponse(['status'=>$success]);
            }
            else{
                if(gettype($success)==='double'){
                    $maxPoints = $success;
                    $util = new Utility();
                    $util->insert(
                        self::$queryUpdatePagesUsingRubric,
                        [
                            'points'=>$maxPoints,
                            'rubricId'=>$id
                        ]
                    );
                    if(isset($body->recalculate)){
                        $classes = $util->fetch(self::$queryGetClassesUsingRubric,['rubricId'=>$id]);
                        $classCtrl = GradebookController::getClassCtrl();
                        foreach($classes as $class){
                            $classId = $class['id'];
                            $users = $classCtrl->getUsers($classId);
                            if($body->recalculate=='now'){
                                foreach($users['students'] as $student){
                                    GradebookController::_recalculate($student['id'],null,$classId);
                                }
                            }else{
                                foreach($users['students'] as $student){
                                    GradebookController::_setRecalculateGradebook($classId,$student['id']);
                                }
                            }
                        }
                    }
                }
            }
        }
        return new JsonResponse(['status'=>'success']);
    }

    private function getLinkedPages($id){
        return $this->read->fetchAll("SELECT id FROM pages WHERE rubricid={$id}");
    }

    public function deleteRubric(Request $request,$id){
        $this->checkUser();

        $this->read->delete('rubrics', [ 'id' => $id ]);
        $this->read->delete('rubric_items', [ 'rubric_id' => $id ]);

        $status = 'success';
        return new JsonResponse(['status' => $status]);
    }
    public function getRubric(Request $request,$id,$echo=true){
//        $this->checkUser();
        $util=new Utility();
        $info = $this->read->fetchAssoc("select * from rubrics where id = $id");
        $info['needGradebookRecalculation'] = boolval($util->fetchOne(self::$queryGetPagesUsingRubric,['rubricId'=>$id]));
        $items = $this->read->fetchAll("select * from rubric_items where rubric_id=$id");
        if($echo) {
            return new JsonResponse(['info'=>$info,'grid'=>$this->prepareItems($items)]);
        };
        return ['info'=>$info,'grid'=>$this->prepareItems($items)];
    }
    private function prepareItems($items){
        $grid = array();
        $rubric_descriptions = array();
        $header=array();
        foreach($items as $item){
            if($item['col']=='-1'){
                $rubric_descriptions[$item['row']] = array(
                    'text'=>$item['text'],
                    'score'=>$item['score'],
                );
            }
            else if($item['row']=='-1'){
                $header[$item['col']] = array(
                    'text'=>$item['text'],
                );
            }
            else{
                if(!isset($grid[$item['row']])) $grid[$item['row']] = array();

                $grid[$item['row']][$item['col']] = array(
                    'text'=>$item['text'],
                    'score'=>$item['score'],
                );
            }
        }
        return [
            'items'=>$grid,
            'rubric_descriptions'=>$rubric_descriptions,
            'header'=>$header
        ];
    }
    public function getRubrics(Request $request){
        return new JsonResponse(self::_getRubrics($request->query->all()));
    }
    public function getOrgRubrics(Request $request,$orgId){
        $this->checkUser();
        $query = $this->queryGetOrgRubrics;
        $params = ['orgId'=>$orgId];
        if($request->get('classid')){
            $rubrics = self::_getRubricsForClass($request->get('classid'));
        }
        else{
            $rubrics = $this->read->fetchAll($query,$params);
        }
        return new JsonResponse(['rubrics'=>$rubrics]);
    }

    public static function _getRubrics($params){
        $util = new Utility();
        $deptId = @$params['deptId'];
        $orgId = @$params['orgId'];
        $classId = @$params['classId'];
        $userId = @$params['userId'];

        $queryParams = array();

        $whereOrgId = ' and org_id = :orgId ';
        $whereDeptId = ' and department_id = :deptId ';
        $whereClassId = ' and class_id = :classId ';
        $whereUserId = ' and user_id = :userId ';

        $query = self::$queryGetRubrics;

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

        return $util->fetch($query,$queryParams);
    }
    public function getGradeRubric(Request $request,$echo=true){
        $this->checkUser();
        $body = $_REQUEST;
        $body['type'] = $body['type']?:'post';
        $result = $this->getGradeRubricJSON($body);
        if($echo) return new JsonResponse(['status'=>'success','grades'=>array_values($result)]);
        else return $result;

    }
    public function getGradeRubricJSON($body){



        $allowed_filters = array(
            'postid',
            'rubricid',
            'userid',
            'teacherid',
            'pageid',
            'type'
        );

        $where = '1';
        if($body){
            if(!isset($body['type'])){
                $body['type'] = 'post';
            }
            if(isset($body['userid']) && $body['userid']=='me' || !intval($body['userid']) ) $body['userid']=$_SESSION['USER']['ID'];
            foreach($body as $filter => $value){
                $is_allowed = array_search($filter,$allowed_filters);
                if(gettype($is_allowed)!== "boolean"){
                    if($filter=='userid') $filter='gr.userid';
                    $where .= " and {$filter}='{$value}'";
                }
            }
        }else{
            $where .= "type = 'post'";
        }
        $orderBy = 'row';
        if(isset($body['orderBy'])){
            $orderBy = $body['orderBy'].','.$orderBy;
        }
        $query = "SELECT gr.* from grade_rubrics gr
                  left join posts p on p.id = gr.postid
                  WHERE {$where} order by {$orderBy}";
        $result = $this->read->fetchAll($query);

        if(isset($body['groupBy']) && count($result)>0){
            $result = $this->groupRubrics($result,$body['groupBy']);
        }
        return $result;
    }
    private function getPostInfo($id){
        return $this->read->fetchAssoc("SELECT * FROM posts where id = {$id}");
    }
    private function groupRubrics($rubrics,$by){
        $postInfos=array();
        $grouped=array();
        foreach($rubrics as $row){
            if(!isset($grouped[$row[$by]])){
                if(!isset($postInfos[$row['postid']]))
                    $postInfos[$row['postid']]=$this->getPostInfo($row['postid']);
                $grouped[$row[$by]]= array('post'=>$postInfos[$row['postid']],
                    'rows'=>array());
            }
            $grouped[$row[$by]]['rows'][]=$row;
        }
        return $grouped;
    }
    public function saveGradeRubric(Request $request){
        $this->checkUser();
        $body = json_decode($request->getContent());
        $this->_saveGradeRubric($body);
        return new JsonResponse(['status'=>'success']);
    }
    public function _saveGradeRubric($body){
        $required = array(
            'postid',
            'rubricid',
            'userid',
            'grid'
        );
        foreach($required as $key){
            if(!isset($body->$key)) return new JsonResponse(['status'=>"Invalid {$key}"]);
        }
        if(!isset($body->type)){
            $body->type='post';
        }
        if(!isset($body->teacherid)){
            $body->teacherid = $_SESSION['USER']['ID'];
        }
        $values = array();
        foreach($body->grid as $row){
            $values[] = "('{$body->postid}','{$body->rubricid}','{$body->userid}','{$body->teacherid}','{$row->row}','{$row->col}','{$body->type}')";
        }
        $values = implode(",",$values);
        $this->read->delete('grade_rubrics',['postid'=>$body->postid,'type'=>$body->type]);
        $query = "INSERT INTO grade_rubrics (postid,rubricid,userid,teacherid,row,col,type) VALUES {$values}";
        $this->read->executeUpdate($query);
    }
    public static function _getRubricsForClass($classId){
        $util = new Utility();
        return $util->fetch(self::$queryGetClassRubrics,['classId'=>$classId]);
    }
    private $queryGetOrgRubrics=<<<SQL
    SELECT * FROM rubrics WHERE org_id = :orgId
SQL;

    //Getting both rubribs being used and rubrics created for an specific class
    //Union statement is faster than left join pages
    private static $queryGetClassRubrics=<<<SQL
    SELECT DISTINCT * FROM
    (SELECT * FROM rubrics WHERE class_id=:classId
    UNION
    SELECT DISTINCT rubrics.* FROM rubrics
     INNER JOIN pages on rubrics.id = pages.rubricid
     INNER JOIN units on units.id = pages.unitid
     INNER JOIN classes on units.courseid = classes.courseid
     WHERE classes.id = :classId) allRubrics
SQL;
    private static $queryGetRubrics=<<<SQL
    SELECT * FROM rubrics
    WHERE 1
SQL;
    private static $queryGetPagesUsingRubric=<<<SQL
    SELECT p.id FROM pages p WHERE rubricid = :rubricId
SQL;
    private static $queryUpdatePagesUsingRubric=<<<SQL
    UPDATE class_assignments ca JOIN
     pages p ON ca.page_id = p.id
     SET ca.points = :points
     WHERE rubricid = :rubricId
SQL;
    private static $queryGetClassesUsingRubric=<<<SQL
    SELECT DISTINCT c.id FROM pages p
     JOIN units u ON u.id = p.unitid
     JOIN classes c ON c.courseid = u.courseid
     WHERE p.rubricid = :rubricId
SQL;


}

?>