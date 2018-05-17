<?php

use Phinx\Migration\AbstractMigration;

class MoveRandomFieldFromQuizzesToQuizQuestions extends AbstractMigration
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
        if ($this->hasTable('quizzes') && $this->hasTable('quiz_questions')) {
            // We will not remove this column yet, so we can recreate these changes in the new column
            // in the quiz_questions table
            //
            // $quizzes = $this->table('quizzes');
            // $quizzes->removeColumn('random')
            //     ->update();
            $quiz_questions = $this->table('quiz_questions');
            $quiz_questions->addColumn('random', 'integer', array('null' => true))
                ->update();
        }
    }

    /**
     * Migrate Down.
     */
    public function down()
    {

    }
}