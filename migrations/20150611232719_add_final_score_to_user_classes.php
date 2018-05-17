<?php

use Phinx\Migration\AbstractMigration;

class AddFinalScoreToUserClasses extends AbstractMigration
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
        $table = $this->table('user_classes');
        $column = $table->hasColumn('final_score');
        if (!$column) {
            $table->addColumn('final_score', 'integer', array('null' => true))
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