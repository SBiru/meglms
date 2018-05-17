<?php

use Phinx\Migration\AbstractMigration;

class AddPsFieldsToAttendance extends AbstractMigration
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
        $table = $this->table('approved_attendance_log');
        if(!$table->hasColumn('external_userid')){
            $table->addColumn('external_userid','integer',array('null'=>true))
                ->addColumn('sectionid','integer',array('null'=>true))
                ->addColumn('schoolid','integer',array('null'=>true))
                ->update();
            $this->setIntialSectionIds();

        }
        if(!$table->hasColumn('export_filename')){
            $table->addColumn('export_filename','string',array('null'=>true,'limit'=>35))
                ->update();
            $this->setInitialExportFileNames();
        }
        if(!$table->hasColumn('orgid')){
            $table->addColumn('orgid','integer',array('null'=>true))
                ->update();
            $this->setInitialOrgId();
        }
    }
    private function setIntialSectionIds(){
        $attendance_only_sql = <<<SQL
    UPDATE approved_attendance_log a JOIN
    attendance_only_classes c on a.classid = c.id
    set a.sectionid = c.external_id
    where a.attendance_only=1
SQL;
        $normal_classes_sql = <<<SQL
    UPDATE approved_attendance_log a JOIN
    classes c on a.classid = c.id
    join lms_map s on c.lms_id = s.lmsid
    set a.sectionid = s.sectionid
    where a.attendance_only<>1
SQL;
        $external_userid_sql = <<<SQL
    UPDATE approved_attendance_log a JOIN
  users u on a.userid = u.id
    set  a.external_userid = u.external_id 
    where a.external_userid is null;

SQL;
    $this->execute($attendance_only_sql);
    $this->execute($normal_classes_sql);
    $this->execute($external_userid_sql);
    }
    private function setInitialExportFileNames(){
        $sql = <<<SQL
        UPDATE approved_attendance_log a
         set a.export_filename = concat('elmsattenanceexport-',DATE_FORMAT(synced_on,'%Y%m%d%H%i%s'))
        WHERE a.synced_on is not null
SQL;
        $this->execute($sql);

    }
    private function setInitialOrgId(){
        $sql = <<<SQL
        UPDATE approved_attendance_log a
         set a.orgid = 10
SQL;
        $this->execute($sql);

    }
}
