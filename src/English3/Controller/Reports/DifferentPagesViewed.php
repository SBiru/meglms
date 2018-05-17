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

class DifferentPagesViewed extends StudentPagesReport{
    protected $valueField = 'diffPages';
    protected $queryLoadData = <<<SQL
SELECT 
  u.id as studentId,
  u.fname,
  u.lname,
  p.name as pageName,
  p.id as pageId
  from pages p
JOIN activity_history ah ON ah.pageid = p.id
JOIN units on units.id = p.unitid
JOIN classes c on c.courseid = units.courseid
JOIN users u on u.id = ah.userid
JOIN user_classes uc on uc.userid = u.id and uc.classid = c.id
WHERE if(:classId,c.id=:classId,1) AND if(:groupId,uc.groupid=:groupId,1) AND if(:orgId,u.organizationid = :orgId,1) AND uc.is_student = 1
%s
group by u.id,p.id
SQL;
}

