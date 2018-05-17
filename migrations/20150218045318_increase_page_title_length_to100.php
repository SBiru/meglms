<?php

use Phinx\Migration\AbstractMigration;

class IncreasePageTitleLengthTo100 extends AbstractMigration
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
ALTER TABLE `pages`
CHANGE COLUMN `name` `name` VARCHAR(100) NOT NULL ,
CHANGE COLUMN `subtitle` `subtitle` VARCHAR(100) NOT NULL ;
SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
ALTER TABLE `pages`
CHANGE COLUMN `name` `name` VARCHAR(70) NOT NULL ,
CHANGE COLUMN `subtitle` `subtitle` VARCHAR(70) NOT NULL ;
SQL;
        $this->execute($sql);
    }
}