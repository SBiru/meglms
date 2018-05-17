<?php

use Phinx\Migration\AbstractMigration;

class CreatePostViews extends AbstractMigration
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
        $exists = $this->hasTable('post_views');
        if(!$exists){
            $table = $this->table('post_views');
            $table->addColumn('postid','integer')
                ->addColumn('userid','integer')
                ->addColumn('viewed_on','timestamp',array('default' => 'CURRENT_TIMESTAMP'))
                ->addIndex(array('postid','userid'),array('unique'=>true))
                ->create();
        }

    }
}
