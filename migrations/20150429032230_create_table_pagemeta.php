<?php

use Phinx\Migration\AbstractMigration;

class CreateTablePagemeta extends AbstractMigration
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
CREATE TABLE `page_meta` (
  `id` INT NOT NULL,
  `pageid` INT NULL,
  `meta_key` VARCHAR(45) NULL,
  `meta_value` TEXT NULL,
  PRIMARY KEY (`id`),
  INDEX `PAGE` (`pageid` ASC));
SQL;
        $this->execute($sql);


    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
DROP TABLE `page_meta`
SQL;
        $this->execute($sql);
    }
}