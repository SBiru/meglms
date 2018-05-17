<?php

use Phinx\Migration\AbstractMigration;

class AddShowMasteryToPages extends AbstractMigration
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
 alter table `pages`
 add column `show_mastery` TINYINT(1)  DEFAULT '0' NULL  after `show_score_per_standard`,
 add column `mastery_percentage` INT(11)  NULL  after `show_mastery`
SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
SQL;
        $this->execute($sql);


    }
}