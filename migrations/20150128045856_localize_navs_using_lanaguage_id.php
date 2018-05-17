<?php

use Phinx\Migration\AbstractMigration;

class LocalizeNavsUsingLanaguageId extends AbstractMigration
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
        ALTER TABLE `localize_navs`
CHANGE COLUMN `language` `language` CHAR(2) NOT NULL ;
SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
        ALTER TABLE `localize_navs`
CHANGE COLUMN `language` `language` ENUM('en','es','fr','de','th','ar','zh','pt','ko') NOT NULL ;
SQL;
        $this->execute($sql);
    }
}