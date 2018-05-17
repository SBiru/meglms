<?php

use Phinx\Migration\AbstractMigration;

class AddScorePerStandardToPage extends AbstractMigration
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
        $table = $this->table('pages');
        $column = $table->hasColumn('show_score_per_standard');
        if (!$column) {
            $table->addColumn('show_score_per_standard', 'integer', array('null' => true, 'default' => 0))
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