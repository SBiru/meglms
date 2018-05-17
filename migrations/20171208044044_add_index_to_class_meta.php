<?php


use Phinx\Migration\AbstractMigration;

class AddIndexToClassMeta extends AbstractMigration
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
$sql1 = <<< SQL
    DELETE m1 FROM class_meta m1, class_meta m2 WHERE m1.id > m2.id AND m1.classid = m2.classid and m1.meta_key = m2.meta_key;
SQL;
$sql2 = <<<SQL
    ALTER TABLE class_meta ADD UNIQUE INDEX (classid, meta_key)
SQL;
    $this->execute($sql1);
    $this->execute($sql2);

    }
}
