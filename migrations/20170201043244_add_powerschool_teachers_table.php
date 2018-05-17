<?php

use Phinx\Migration\AbstractMigration;

class AddPowerschoolTeachersTable extends AbstractMigration
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
    /*
     * [teacherid] => 115 [_name] => cc [last_name] => Burton [sectionid] => 23806 [first_name] => Alicia [email] => aburton@edkey.org
     */
    public function change()
    {
        $sql = <<<SQL
CREATE TABLE IF NOT EXISTS ps_teachers
(
  teacherid INT,
  last_name VARCHAR(100),
  sectionid INT NOT NULL UNIQUE,
  first_name VARCHAR(100),
  email VARCHAR(255),
  course_name VARCHAR(255)
);
SQL;
        $this->execute($sql);
    }
}
