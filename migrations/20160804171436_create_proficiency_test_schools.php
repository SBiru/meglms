<?php

use Phinx\Migration\AbstractMigration;

class CreateProficiencyTestSchools extends AbstractMigration
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
        $exists = $this->hasTable('proficiency_test_schools');
        if(!$exists){
            $table = $this->table('proficiency_test_schools');
            $table->addColumn('name','string',['limit'=>255])
                ->addColumn('country','string',['limit'=>255])
                ->addColumn('state','string',['limit'=>255])
                ->addIndex(array('name'), array('unique' => true))
                ->create();
        }
        $exists = $this->hasTable('proficiency_schools_admins');
        if(!$exists){
            $table = $this->table('proficiency_schools_admins');
            $table->addColumn('userid','integer')
                ->addColumn('schoolid','integer')
                ->addIndex(array('userid','schoolid'), array('unique' => true))
                ->create();
        }
        $exists = $this->hasTable('proficiency_tests_submitted');
        if(!$exists){
            $table = $this->table('proficiency_tests_submitted');
            $table->addColumn('userid','integer')
                ->addColumn('schoolid','integer')
                ->addColumn('testid','integer')
                ->addColumn('attemptid','integer',['null'=>true])
                ->addIndex(array('userid','schoolid','testid'), array('unique' => true))
                ->create();
        }
    }
}
