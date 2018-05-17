<?php

use Phinx\Migration\AbstractMigration;

class AddHideAllMessages extends AbstractMigration
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
 ALTER TABLE `organizations`
ADD COLUMN `hide_all_messages` TINYINT(1)  NULL DEFAULT '0' AFTER `sort_users_by`;

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
DROP COLUMN hide_all_messages;
SQL;
        $this->execute($sql);


    }
}