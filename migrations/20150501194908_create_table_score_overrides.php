<?php

use Phinx\Migration\AbstractMigration;

class CreateTableScoreOverrides extends AbstractMigration
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
        $table = $this->table('scores_overrides', array('id' => false, 'primary_key' => array('classId','pageId','userId')));
        $table->addColumn('classId', 'integer')
            ->addColumn('pageId', 'integer')
            ->addColumn('userId', 'integer')
            ->addColumn('score', 'decimal', array('precision' => 11, 'scale' => 2))
            ->addColumn('byUserId', 'integer')
            ->addColumn('date', 'datetime')
            ->save();
    }

    /** 
     * Migrate Down.
     */
    public function down()
    {

    }
}