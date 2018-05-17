<?php

use Phinx\Migration\AbstractMigration;

class AddIdAutoIncrement extends AbstractMigration
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
ALTER TABLE `page_meta`
CHANGE COLUMN `id` `id` INT(11) NOT NULL AUTO_INCREMENT ;
SQL;
        $this->execute($sql);


    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
ALTER TABLE `page_meta`
CHANGE COLUMN `id` `id` INT(11) NOT NULL ;
SQL;
        $this->execute($sql);
    }
}