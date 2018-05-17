<?php

use Phinx\Migration\AbstractMigration;

class CreateTableClassExempted extends AbstractMigration
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
        $table = $this->table('class_exempted', array('id' => false, 'primary_key' => array('userId','caId')));
        $table->addColumn('userId', 'integer')
            ->addColumn('caId', 'integer')
            ->addColumn('byUserId', 'integer', array('null' => false))
            ->addColumn('date', 'timestamp', array('default' => 'CURRENT_TIMESTAMP'))
            ->addColumn('comments', 'text', array('null' => true))
            ->save();
    }

    /**
     * Migrate Down.
     */
    public function down()
    {

    }
}