<?php

use Phinx\Migration\AbstractMigration;

class AddSectionidAttendanceOnlyMapTable extends AbstractMigration
{
    /**
     * Change Method.
     *
     * Write your reversible migrations using this method.
     *
     * More information on writing migrations is available here:
     * http://docs.phinx.org/en/latest/migrations.html#the-abstractmigration-class
     *
     * The following commands can be used in this method and Phinx will
     * automatically reverse them when rolling back:
     *
     *    createTable
     *    renameTable
     *    addColumn
     *    renameColumn
     *    addIndex
     *    addForeignKey
     *
     * Remember to call "create()" or "update()" and NOT "save()" when working
     * with the Table class.
     */
    public function change()
    {
        $sql = <<<SQL
CREATE TABLE IF NOT EXISTS is_attendance_only
(
  sectionid INT NOT NULL UNIQUE,
  attendance_only BOOL
);
SQL;
        $this->execute($sql);
        $this->populateIsAttendanceOnly();
    }
    private function populateIsAttendanceOnly(){
        $notAttendanceOnlyClasses = <<<SQL
insert ignore into is_attendance_only select lms_map.sectionid,'0' from lms_map join classes c on lms_map.lmsid = c.LMS_id
SQL;
        $attendanceOnlyClasses = <<<SQL
insert ignore into is_attendance_only select ps_teachers.sectionid,'1' from ps_teachers join attendance_only_classes on ps_teachers.sectionid = attendance_only_classes.external_id;
SQL;
        $this->execute($notAttendanceOnlyClasses);
        $this->execute($attendanceOnlyClasses);
    }
}
