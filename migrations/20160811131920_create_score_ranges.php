<?php

use Phinx\Migration\AbstractMigration;

class CreateScoreRanges extends AbstractMigration
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
        $exists = $this->hasTable('score_range_categories');
        if(!$exists){
            $table = $this->table('score_range_categories');
            $table->addColumn('name','string',['limit'=>255])
                ->addIndex(array('name'), array('unique' => true))
                ->create();
        }
        $exists = $this->hasTable('score_range_levels');
        if(!$exists){
            $table = $this->table('score_range_levels');
            $table->addColumn('categoryid','integer',['limit'=>1])
                ->addColumn('name','string',['limit'=>255])
                ->addColumn('min','float')
                ->addColumn('max','float')
                ->addColumn('details','text')
                ->addIndex(array('name','categoryid'), array('unique' => true))
                ->create();
        }
    }
}
