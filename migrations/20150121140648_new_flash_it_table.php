<?php

use Phinx\Migration\AbstractMigration;

class NewFlashItTable extends AbstractMigration
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
		$flashit = $this->table('flash_it_right_id');
        $flashit->addColumn('correct', 'integer', array('limit' => 11))
              ->addColumn('incorrect', 'integer', array('limit' => 11))
              ->addColumn('remaining', 'integer', array('limit' => 11))
              ->addColumn('user_id', 'integer', array('limit' => 11))
              ->addColumn('vocabulary_id', 'integer', array('limit' => 11))
              ->addIndex(array('user_id', 'vocabulary_id'), array('unique' => true))
              ->save();
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
		$this->dropTable('flash_it_right_id');
    }
}