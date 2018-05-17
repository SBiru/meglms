<?php

use Phinx\Migration\AbstractMigration;

class AddAdvisorMapTable extends AbstractMigration
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
CREATE TABLE IF NOT EXISTS advisor_map
(
  name VARCHAR(50) NOT NULL,
  id INT DEFAULT 0,
  email VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  PRIMARY KEY(name,id)
);
SQL;
        $this->execute($sql);
    }
}
