<?php

use Phinx\Migration\AbstractMigration;

class FailTimedReviewVideos extends AbstractMigration
{
    /**
     * Change Method.
     *
     * Write your reversible migrations using this method.
     *
     * More information on writing migrations is available here:
     * http://docs.phinx.org/en/latest/migrations.html#the-abstractmigration-class
     *
     * The following commands can be used in this method and Phinx will
     * automatically reverse them when rolling back:
     *
     *    createTable
     *    renameTable
     *    addColumn
     *    renameColumn
     *    addIndex
     *    addForeignKey
     *
     * Remember to call "create()" or "update()" and NOT "save()" when working
     * with the Table class.
     */
    public function change()
    {
        $table = $this->table('fail_timed_review_videos');
        if(!$table->exists()){
            $table->addColumn('userid','integer')
                ->addColumn('pageid','integer')
                ->addColumn('video_url','string',array('limit'=>255))
                ->addColumn('time_to_prepare_values','string')
                ->addColumn('prompts','string')
                ->addColumn('answer_time_positions','string')
                ->addColumn('created','timestamp',array('default' => 'CURRENT_TIMESTAMP'))

                ->create();
        }
    }
}
