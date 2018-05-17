<?php

use Phinx\Migration\AbstractMigration;

class AddCategoryDashboardToOrg extends AbstractMigration
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
alter table `organizations` add column `category_dashboard` tinyint (1)  DEFAULT '0' NULL;
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