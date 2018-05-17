<?php

use Phinx\Migration\AbstractMigration;

class AddIsSuspendedToUserClasses extends AbstractMigration
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
ALTER TABLE `user_classes`
ADD COLUMN `is_suspended` TINYINT(1) NOT NULL DEFAULT 0 AFTER `is_observer`;
SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
ALTER TABLE `user_classes`
DROP COLUMN `is_suspended`
SQL;
        $this->execute($sql);
    }
}