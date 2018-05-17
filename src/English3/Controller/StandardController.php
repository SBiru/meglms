<?php
namespace English3\Controller;

use Doctrine\DBAL\Connection;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;


class StandardController
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
    public function createStandard(Request $request,$org){
        $this->checkUser();
        $body = json_decode($request->getContent());
        $parentid=isset($body->parentid)?intval($body->parentid):0;
        $desc = isset($body->description)?$body->description:"";
        $this->read->insert('standards', [
            'name' => $body->name,
            'description' => $desc,
            'parentid' => $parentid,
            'org_id'=>$org
        ]);
        $id = $this->read->lastInsertId();
        return new JsonResponse(['id' => $id, 'name' => $body->name, 'description' => $desc,'parentid'=>$parentid,'org'=>$org]);

    }
    public function updateStandard(Request $request,$id){
        $this->checkUser();
        $body = json_decode($request->getContent());
        $parentid=isset($body->parentid)?intval($body->parentid):0;
        $updated = $this->read->update('standards', [
            'name' => $body->name,
            'description' => $body->description,
            'parentid' => $parentid,
        ], ['id' => $id]);

        return new JsonResponse(['status' => 'success']);
    }

    public function deleteStandard(Request $request,$id){
        $this->checkUser();
        // TODO access control
        $removed = $this->read->delete('standards', [ 'id' => $id ]);
        $status = 'success';
        if (!$removed) {
            $status = 'failure';
        }
        return new JsonResponse(['status' => $status]);
    }

    public function getStandard(Request $request,$org,$id){
        $this->checkUser();
        $data = $this->read->fetchAssoc('select * from standards where id=:id and org_id = :org', ['id'=>$id,'org'=>$org]);
        return new JsonResponse($data);
    }
    public function getStandards(Request $request,$org){
        $this->checkUser();
        if($org==0){
            $courseid = $_REQUEST['courseId'];
            $org=$this->read->fetchAssoc(
                "SELECT organizationid FROM courses
                  LEFT JOIN departments on departments.id = courses.departmentid
                  WHERE courses.id = $courseid"
            )['organizationid'];
        }
        $standards =$this->read->fetchAll('select * from standards where org_id=:id order by parentid',['id'=>$org]);

        $tree_node = function($id, $parent,$name,$desc) {
            return array('id' => $id, 'parentid' => $parent, 'name'=>$name,'description'=>$desc, 'children' => array());
        };

        $tree = $tree_node(0, null,null,null); //root node
        $map = array(0 => &$tree);
        foreach($standards as $cur) {
            $id = (int) $cur['id'];
            $parentId = (int) $cur['parentid'];
            $name =  $cur['name'];
            $desc =  $cur['description'];
            $map[$id] =& $map[$parentId]['children'][];
            $map[$id] = $tree_node($id, $parentId,$name,$desc);
        }
        return new JsonResponse(['standards'=>$tree['children']]);
    }
    public function linkStandard(Request $request){
        $this->unlinkStandard($request,false);
        $this->checkUser();
        $body = json_decode($request->getContent());
        $type = $body->type;
        $referred_id = $body->referred_id;
        $ids = $body->id;
        foreach($ids as $id){
            if(intval($id)>0)
                $this->read->insert('standard_links',['standard_id'=>$id,'referred_id'=>$referred_id,'type'=>$type]);
        }
        return new JsonResponse(['status'=>'success']);
    }
    public function unlinkStandard(Request $request,$echo = true){
        $this->checkUser();
        $body = json_decode($request->getContent());
        $type = $body->type;
        $referred_id = $body->referred_id;
        $removed = $this->read->delete('standard_links', ['referred_id'=>$referred_id,'type'=>$type]);
        $status = 'success';
        if (!$removed) {
            $status = 'failure';
        }
        if($echo)  return new JsonResponse(['status' => $status]);
    }
    public function linkedStandard(Request $request){
        $this->checkUser();

        $qb = $this->read->createQueryBuilder();

        $qb->select('p.*,s.name as standard_name,s.description as standard_description,s.id as standard_id');
        $qb->from('standard_links','st');
        $qb->leftJoin('st','pages',"p",'st.type="page" and p.id = st.referred_id');
        $qb->leftJoin('st','standards',"s",'s.id = st.standard_id');

        $and_cond = $qb->expr()->andx();
        $and_cond->add(1);
        if(isset($_REQUEST['type']))  $and_cond->add($qb->expr()->eq('type',$qb->expr()->literal($_REQUEST['type'])));
        if(isset($_REQUEST['referred_id']))  $and_cond->add($qb->expr()->eq('referred_id',$_REQUEST['referred_id']));
        if(isset($_REQUEST['id']))  $and_cond->add($qb->expr()->eq('id',$_REQUEST['id']));
        if(isset($_REQUEST['standard_id']))  $and_cond->add($qb->expr()->eq('standard_id',$_REQUEST['standard_id']));

        $qb->andWhere($and_cond);
        $q = $qb->getSql();
        $stmt = $this->read->executeQuery($q);
        $standards = $stmt->fetchAll();

        return new JsonResponse(['standards'=>$standards]);
    }
}

?>