<?php

use Phinx\Migration\AbstractMigration;

class ChangeUserClassesIndex extends AbstractMigration
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
DROP INDEX `userid` ,
ADD UNIQUE INDEX `userid` (`userid` ASC, `classid` ASC, `groupid` ASC);

SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {

    }
}