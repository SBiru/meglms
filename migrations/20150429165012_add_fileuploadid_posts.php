<?php

use Phinx\Migration\AbstractMigration;

class AddFileuploadidPosts extends AbstractMigration
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
 ALTER TABLE `meglms`.`posts` ADD COLUMN `fileuploadid` varchar (30)   NULL  AFTER `post_reply_id`
SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
 ALTER TABLE `meglms`.`posts` DROP COLUMN `fileuploadid`
SQL;
        $this->execute($sql);
    }
}