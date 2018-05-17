<?php

use Phinx\Migration\AbstractMigration;

class AddSessionTimeToOrg extends AbstractMigration
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
ALTER TABLE `organizations`
ADD COLUMN `session_time` INT NULL DEFAULT 20 COMMENT 'minutes' AFTER `use_splash`;

SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
ALTER TABLE `organizations`
DROP COLUMN `session_time`
SQL;
        $this->execute($sql);
    }
}