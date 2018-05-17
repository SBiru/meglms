<?php
/**
 * Created by IntelliJ IDEA.
 * User: denny
 * Date: 4/18/17
 * Time: 10:54 AM
 */

namespace English3\Controller\Reports;


use English3\Controller\Reports\BaseReports\StudentPagesReport;
use English3\Controller\Utility;

class PostsPerStudent extends StudentPagesReport{
    protected function addValueField(&$student, $row)
    {
        $student[$this->valueField]+=$row['postCount'];
    }
    protected function addItemsPerPage(&$page, $row)
    {
        $page['itemsPerPage']+=$row['postCount'];
    }

    protected $valueField = 'postCount';
    protected $queryLoadData = <<<SQL
SELECT 
  u.id as studentId,
  u.fname,
  u.lname,
  pages.name as pageName,
  pages.id as pageId,
  count(p.id) as postCount
  from posts p
JOIN pages on p.pageid = pages.id
JOIN units on units.id = pages.unitid
JOIN classes c on c.courseid = units.courseid
JOIN users u on u.id = p.userid
JOIN user_classes uc on uc.userid = u.id and uc.classid = c.id
WHERE if(:classId,c.id=:classId,1) AND if(:groupId,uc.groupid=:groupId,1) AND if(:orgId,u.organizationid = :orgId,1) AND uc.is_student = 1
%s
group by u.id,pages.id
SQL;
}

