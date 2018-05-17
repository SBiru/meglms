<?php

use Phinx\Migration\AbstractMigration;

class AddExternalIdToPostsAndQuizScores extends AbstractMigration
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
        $table = $this->table('posts');
        $column = $table->hasColumn('external_id');
        if (!$column) {
            $table->addColumn('external_id', 'string', array('null' => true))
                  ->update();
        }
        $table = $this->table('quiz_scores');
        $column = $table->hasColumn('external_id');
        if (!$column) {
            $table->addColumn('external_id', 'string', array('null' => true))
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