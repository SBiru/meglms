<?php

use Phinx\Migration\AbstractMigration;

class CreateTableImports extends AbstractMigration
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
        if (!$this->hasTable('imports')) {
            $table = $this->table('imports');
            $table->addColumn('type', 'string', array('limit' => 20, 'null' => false))
                ->addColumn('userId', 'integer', array('null' => false))
                ->addColumn('date', 'timestamp', array('default' => 'CURRENT_TIMESTAMP', 'null' => false))
                ->addColumn('mapFileName', 'string', array('limit' => 255, 'null' => false))
                ->addColumn('folderName', 'string', array('limit' => 255, 'null' => false))
                ->addColumn('courseName', 'string', array('limit' => 255, 'null' => false))
                ->save();
        }
    }
    /**
     * Migrate Down.
     */
    public function down()
    {

    }
}