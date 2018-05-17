<?php

use Phinx\Migration\AbstractMigration;

class AddNameToTimedReviewPrompts extends AbstractMigration
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
        $table = $this->table('timed_review_prompts');
        if(!$table->hasColumn('name')) {
            $table->addColumn('name', 'string', array( 'limit'=>255,'null' => true))->update();
        }
    }

    /**
     * Migrate Down.
     */
    public function down()
    {

    }
}