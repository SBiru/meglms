<?php

use Phinx\Migration\AbstractMigration;

class AddReadOnToAnnouncements extends AbstractMigration
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
        $table = $this->table('announcements_viewed');
        if(!$table->hasColumn('viewed_on')){
            $sql = <<<SQL
ALTER TABLE announcements_viewed ADD viewed_on DATETIME DEFAULT current_timestamp NULL;
SQL;
            $this->execute($sql);
        }


    }
}
