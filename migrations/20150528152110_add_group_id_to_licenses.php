<?php

use Phinx\Migration\AbstractMigration;

class AddGroupIdToLicenses extends AbstractMigration
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
     * Migrate Down.
     */
    public function up()
    {
        $sql = <<<SQL
ALTER TABLE `licenses`
ADD COLUMN `group_id` INT NULL AFTER `type`;


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
DROP COLUMN `group_id`
SQL;
        $this->execute($sql);
    }
}