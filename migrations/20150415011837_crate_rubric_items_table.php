<?php

use Phinx\Migration\AbstractMigration;

class CrateRubricItemsTable extends AbstractMigration
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
CREATE TABLE `rubric_items` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `rubric_id` INT NOT NULL,
  `row` INT NOT NULL,
  `col` INT NOT NULL,
  `text` VARCHAR(500) NOT NULL,
  `score` INT NOT NULL,
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
DROP TABLE `rubric_items`
SQL;
        $this->execute($sql);
    }
}