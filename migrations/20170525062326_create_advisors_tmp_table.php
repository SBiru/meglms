<?php

use Phinx\Migration\AbstractMigration;

class CreateAdvisorsTmpTable extends AbstractMigration
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
        $table = $this->table('temp_user_advisors');
        if(!$table->exists()){
            $this->execute("CREATE TABLE temp_user_advisors like user_advisors");
        }
        $table = $this->table('temp_user_guardians');
        if(!$table->exists()){
            $this->execute("CREATE TABLE temp_user_guardians like user_guardians");
        }
    }
}
