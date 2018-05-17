<?php

use Phinx\Migration\AbstractMigration;

class CreateTableGradeRubrics extends AbstractMigration
{
    /**
     * Change Method.
     *
     * More information on this method is available here:
     * http://docs.phinx.org/en/latest/migrations.html#the-change-method
     *
     * Uncomment this method if you would like to use it.
     *
    public function change()
    {
    }
    */
    
    /**
     * Migrate Up.
     */
    public function up()
    {
        $sql = <<<SQL
CREATE TABLE `grade_rubrics` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `postid` INT NULL,
  `rubricid` INT NULL,
  `userid` INT NULL,
  `teacherid` INT NULL,
  `row` INT NULL,
  `col` INT NULL,
  PRIMARY KEY (`id`));

SQL;
        $this->execute($sql);


    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
DROP TABLE `grade_rubrics`
SQL;
        $this->execute($sql);
    }
}