<?php

use Phinx\Migration\AbstractMigration;

class AddPowerschoolEnrollmentsTable extends AbstractMigration
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
     *
     */
    public function change()
    {
        $sql = <<<SQL
CREATE TABLE IF NOT EXISTS cc_enrollments
(
  end_date DATE,
  student_idnumber INT,
  student_gender VARCHAR(25),
  student_web_id VARCHAR(100),
  course_name VARCHAR(500),
  student_guardianemail VARCHAR(255),
  last_name VARCHAR(100),
  student_site VARCHAR(10),
  sectionid INT,
  student_schoolid INT,
  studentid INT,
  termid INT,
  ccid INT NOT NULL UNIQUE,
  student_web_password VARCHAR(255),
  student_tuitionpayer TINYINT,
  first_name VARCHAR(100),
  start_date DATE,
  student_advisor VARCHAR(100)
  
);
SQL;
        $this->execute($sql);
    }
}
