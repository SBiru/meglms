<?php

use Phinx\Migration\AbstractMigration;

class AddPostIdToReceivedMessages extends AbstractMigration
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
ALTER TABLE `received_messages`
ADD COLUMN `post_id` INT(11) NOT NULL DEFAULT '0';
SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
ALTER TABLE `received_messages`
DROP COLUMN `post_id`;
SQL;
        $this->execute($sql);
    }
}