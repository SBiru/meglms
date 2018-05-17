<?php

use Phinx\Migration\AbstractMigration;

class AddSaveDeletedPostsToOrg extends AbstractMigration
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
ADD COLUMN `save_deleted_posts` TINYINT(1) NULL DEFAULT 1 AFTER `can_delete_posts`;

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
DROP COLUMN `save_deleted_posts`
SQL;
        $this->execute($sql);
    }


}