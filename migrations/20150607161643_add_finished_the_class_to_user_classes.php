<?php

use Phinx\Migration\AbstractMigration;

class AddFinishedTheClassToUserClasses extends AbstractMigration
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
ADD COLUMN `finished_the_class` TINYINT(1) NULL AFTER `groupid`
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
DROP COLUMN `finished_the_class`
SQL;
        $this->execute($sql);
    }
}