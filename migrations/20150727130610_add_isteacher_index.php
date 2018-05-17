<?php

use Phinx\Migration\AbstractMigration;

class AddIsteacherIndex extends AbstractMigration
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
alter table `user_classes` add index `is_teacher` ( `is_teacher` )

SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
alter table `user_classes` drop key `is_teacher`

SQL;
        $this->execute($sql);
    }


}