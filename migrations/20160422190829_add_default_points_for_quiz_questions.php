<?php

use Phinx\Migration\AbstractMigration;

class AddDefaultPointsForQuizQuestions extends AbstractMigration
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
        $table = $this->table('quiz_questions');
        if($table->hasColumn('points')){
            $table->changeColumn('points','float',array('default'=>'1'))->update();
        }
    }

    /**
     * Migrate Down.
     */
    public function down()
    {

    }
}