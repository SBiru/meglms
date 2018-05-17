<?php

use Phinx\Migration\AbstractMigration;

class NewImportTable extends AbstractMigration
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
        $users = $this->table('import_jobs',array('id' => true, 'primary_key' => array('id')));
        $users->addColumn('orgID', 'integer', array('limit' => 11))
              ->addColumn('userid', 'integer', array('limit' => 11))
              ->addColumn('startedDate', 'timestamp', array('default' => 'CURRENT_TIMESTAMP'))
              ->addColumn('endedDate', 'timestamp', array('null' => true))
              ->addColumn('completed', 'boolean', array('default' => 0))
              ->addColumn('type', 'string',array('length'=>50))
              ->addColumn('uniqueTableName', 'string', array('null' => false,'length'=>50))
              ->addIndex(array('startedDate'), array('unique' => false))
              ->save();
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $this->dropTable('import_jobs');
    }
}