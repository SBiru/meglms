<?php

use Phinx\Migration\AbstractMigration;

class AddSortPostsOrder extends AbstractMigration
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
        $table = $this->table('organizations');
        if(!$table->hasColumn('sort_posts_grader')){
            $table->addColumn('sort_posts_grader','string',array('limit' => 10,'default' => 'desc'))->update();
        }
    }

    /**
     * Migrate Down.
     */
    public function down()
    {

    }
}