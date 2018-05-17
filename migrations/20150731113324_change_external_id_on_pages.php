<?php

use Phinx\Migration\AbstractMigration;

class ChangeExternalIdOnPages extends AbstractMigration
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
CHANGE COLUMN `external_id` `external_id` VARCHAR(500) NULL DEFAULT NULL ;

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
CHANGE COLUMN `external_id` `external_id` INT(11) NULL DEFAULT NULL ;
SQL;
        $this->execute($sql);
    }


}