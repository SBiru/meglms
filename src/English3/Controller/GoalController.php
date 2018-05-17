<?php

namespace English3\Controller;

use Doctrine\DBAL\Connection;


use English3\Controller\Utility;
use Phinx\Migration\Util;
use Silex\Application;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;

class GoalController
{
    private static $util;
    private static $reader;

    public function __construct(Connection $reader) {
        self::$reader = $reader;
        self::$util = Utility::getInstance();
    }
    public function saveComment(Request $request,$userId,$goalId){
        self::$util->calcLoggedIn();
        Utility::clearPOSTParams($request);
        self::$reader->update('goals',array(
            'comment'=>$request->request->get("comment"),
        ),array(
            'id'=>$goalId
        ));
        return new JsonResponse('ok');
    }
    public function markAsCompleted(Request $request,$userId,$goalId){
        self::$util->calcLoggedIn();
        Utility::clearPOSTParams($request);
        self::$reader->update('goals',array(
            'completed'=>$request->request->get("completed"),
            'completed_on'=>(new \DateTime())->format('Y-m-d h:i:s'),
        ),array(
            'id'=>$goalId
        ));
        return new JsonResponse('ok');
    }
    public function deleteGoal(Request $request,$userId,$goalId){
        self::$util->calcLoggedIn();
        self::$reader->delete('goals',['id'=>$goalId]);
        return new JsonResponse('ok');
    }
    public function save(Request $request,$userId){
        self::$util->calcLoggedIn();
        Utility::clearPOSTParams($request);
        $goalId = $request->request->get('id');
        if($goalId){
            self::$reader->update('goals',array(
                'description'=>$request->request->get("description"),
                'expected_date'=>$request->request->get("expected_date"),
                'teacher_id'=>$_SESSION['USER']['ID'],
                'created'=>(new \DateTime())->format('Y-m-d h:i:s'),
            ),array(
                'id'=>$goalId
            ));
        }else{
            $goalId = self::$util->insert($this->queryInsertGoal,array(
                'description'=>$request->request->get("description"),
                'expected_date'=>$request->request->get("expected_date"),
                'userId'=>$userId,
                'teacherId'=>$_SESSION['USER']['ID'],
                'created'=>(new \DateTime())->format('Y-m-d h:i:s'),
            ));
        }

        return new JsonResponse(self::getGoal($goalId));
    }
    public function getStudentGoals(Request $request,$userId){
        self::$util->calcLoggedIn();
        $userId=$userId=='me'?$_SESSION['USER']['ID']:$userId;
        $data = self::$util->fetch($this->queryGetStudentGoals,['userId'=>$userId]);
        $goals = array_map(function($row){
            return array(
                'teacher'=>$row['fname'].' '.$row['lname'],
                'description'=>$row['description'],
                'expected_date'=>$row['expected_date']?(new \DateTime($row['expected_date']))->format('Y-m-d'):null,
                'completed'=>boolval($row['completed']),
                'created'=>$row['created'],
                'created_by'=>$row['teacher_id'],
                'comment'=>$row['comment'],
                'id'=>$row['id']
            );
        },$data);
        return new JsonResponse($goals);
    }
    public static function getGoal($id){
        $row = self::$util->fetchRow(self::$queryGetGoal,['id'=>$id]);
        return array(
            'teacher'=>$row['fname'].' '.$row['lname'],
            'description'=>$row['description'],
            'expected_date'=>$row['expected_date']?(new \DateTime($row['expected_date']))->format('Y-m-d'):null,
            'completed'=>boolval($row['completed']),
            'created'=>$row['created'],
            'created_by'=>$row['teacher_id'],
            'comment'=>$row['comment'],
            'id'=>$row['id']
        );
    }

    private $queryInsertGoal = <<<SQL
    INSERT INTO goals (user_id,teacher_id,description,created,expected_date)
    VALUES (:userId,:teacherId,:description,:created,:expected_date)
    ON DUPLICATE KEY UPDATE created=values(created),expected_date=values(expected_date)
SQL;
    private $queryGetStudentGoals = <<<SQL
    SELECT goals.*,users.fname,users.lname FROM goals
    JOIN users on users.id = goals.teacher_id
     WHERE user_id = :userId
SQL;
    private static $queryGetGoal = <<<SQL
    SELECT goals.*,users.fname,users.lname FROM goals
    JOIN users on users.id = goals.teacher_id
     WHERE goals.id = :id
SQL;


}
?>