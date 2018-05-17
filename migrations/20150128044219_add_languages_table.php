<?php

use Phinx\Migration\AbstractMigration;

class AddLanguagesTable extends AbstractMigration
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
        CREATE TABLE `languages` (
    `language_id` CHAR(2) NOT NULL,
  `language_name` VARCHAR(45) NULL,
  `rtl_support` TINYINT(1) NULL,
  PRIMARY KEY (`language_id`))
COMMENT = 'Create table to store information about all the languages supported by the system.';
SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
DROP TABLE `languages`;
SQL;
        $this->execute($sql);
    }
}