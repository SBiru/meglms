<?php

use Phinx\Migration\AbstractMigration;

class ChangeFinalScoreType extends AbstractMigration
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
CHANGE COLUMN `final_score` `final_score` VARCHAR(10) NULL DEFAULT NULL ;

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
CHANGE COLUMN `final_score` `final_score` INT(11) NULL DEFAULT NULL ;
SQL;
        $this->execute($sql);
    }


}