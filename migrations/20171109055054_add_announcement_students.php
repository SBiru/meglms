<?php

use Phinx\Migration\AbstractMigration;

class AddAnnouncementStudents extends AbstractMigration
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
    create table if not exists announcement_students
(
	announcementid int not null,
	studentid int not null,
	primary key (announcementid, studentid)
)
;
SQL;
    $this->execute($sql);
    }
}
