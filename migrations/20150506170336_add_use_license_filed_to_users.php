<?php

use Phinx\Migration\AbstractMigration;

class AddUseLicenseFiledToUsers extends AbstractMigration
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
ALTER TABLE `users`
ADD COLUMN `use_license` TINYINT(1) NULL DEFAULT '0' AFTER `external_id`;

SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
ALTER TABLE `users`
DROP COLUMN `use_license`
SQL;
        $this->execute($sql);
    }
}