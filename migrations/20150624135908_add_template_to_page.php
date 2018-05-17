<?php

use Phinx\Migration\AbstractMigration;

class AddTemplateToPage extends AbstractMigration
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
alter table `meglms`.`pages` add column `template` tinytext   NULL  after `automatically_grade`
SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
alter table `meglms`.`pages` drop column `template`
SQL;
        $this->execute($sql);
    }

}