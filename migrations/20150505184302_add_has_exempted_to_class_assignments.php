<?php

use Phinx\Migration\AbstractMigration;
use Phinx\Db\Adapter\MysqlAdapter;

class AddHasExemptedToClassAssignments extends AbstractMigration
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
        $table = $this->table('class_assignments');
        $table->addColumn('has_exempted', 'integer', array('limit' => 1, 'default' => 0))
              ->update();
    }

    /**
     * Migrate Down.
     */
    public function down()
    {

    }
}