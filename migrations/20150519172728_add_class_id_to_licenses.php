<?php

use Phinx\Migration\AbstractMigration;

class AddClassIdToLicenses extends AbstractMigration
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
ALTER TABLE `licenses`
ADD COLUMN `class_id` INT NULL AFTER `user_id`;
SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
ALTER TABLE `licenses`
DROP COLUMN `class_id`
SQL;
        $this->execute($sql);
    }
}