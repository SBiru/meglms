<?php

use Phinx\Migration\AbstractMigration;

class CreateGradebookCategories extends AbstractMigration
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
        $exists = $this->hasTable('gradebook_categories');
        if(!$exists){
            $table = $this->table('gradebook_categories');
            $table->addColumn('name','string',array('limit'=>100))
                ->addColumn('class_id','integer')
                ->addColumn('points','integer')
                ->addColumn('created','timestamp',array('default' => 'CURRENT_TIMESTAMP'))
                ->addIndex(array('class_id'))
                ->create();
        }

        $exists = $this->hasTable('gradebook_category_pages');
        if(!$exists){
            $table = $this->table('gradebook_category_pages', array('id' => false, 'primary_key' => array('category_id', 'page_id')));
            $table->addColumn('category_id','integer')
                ->addColumn('page_id','integer')
                ->addColumn('created','timestamp',array('default' => 'CURRENT_TIMESTAMP'))
                ->addIndex(array('page_id'))
                ->create();
        }
    }
}
