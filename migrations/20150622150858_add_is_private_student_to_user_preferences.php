<?php

use Phinx\Migration\AbstractMigration;

class AddIsPrivateStudentToUserPreferences extends AbstractMigration
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
ALTER TABLE `user_preferences`
CHANGE COLUMN `preference` `preference` ENUM('language','time_zone','is_private_student') NOT NULL ;

SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
ALTER TABLE `user_preferences`
CHANGE COLUMN `preference` `preference` ENUM('language','time_zone') NOT NULL ;
SQL;
        $this->execute($sql);
    }

}