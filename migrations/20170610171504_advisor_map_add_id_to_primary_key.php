<?php

use Phinx\Migration\AbstractMigration;

class AdvisorMapAddIdToPrimaryKey extends AbstractMigration
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
        $sql = <<<SQL
    ALTER TABLE advisor_map CHANGE COLUMN id id INT NOT NULL DEFAULT 0;
    ALTER TABLE advisor_map DROP PRIMARY KEY;
    ALTER TABLE advisor_map ADD PRIMARY KEY (name,id);
SQL;
        $this->execute($sql);
    }
}
