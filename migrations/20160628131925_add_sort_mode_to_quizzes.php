<?php

use Phinx\Migration\AbstractMigration;

class AddSortModeToQuizzes extends AbstractMigration
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
        $table = $this->table('quizzes');
        if(!$table->hasColumn('sort_mode')) {
            $table->addColumn('sort_mode', 'string', array( 'limit'=>15,'null' => true,'default' => 'in_order'))->update();
        }
    }

    /**
     * Migrate Down.
     */
    public function down()
    {

    }
}