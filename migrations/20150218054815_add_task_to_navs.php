<?php

use Phinx\Migration\AbstractMigration;

class AddTaskToNavs extends AbstractMigration
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
        INSERT INTO `navs` (`key`) VALUES ('task');
SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
            $sql = <<<SQL
        DELETE FROM `navs` WHERE `key` = 'task';
SQL;
        $this->execute($sql);
    }
}