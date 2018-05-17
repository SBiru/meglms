<?php

use Phinx\Migration\AbstractMigration;

class CrateRubricsTable extends AbstractMigration
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
CREATE TABLE `rubrics` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NULL,
  `org_id` INT NULL,
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
DROP TABLE `rubrics`
SQL;
        $this->execute($sql);
    }
}