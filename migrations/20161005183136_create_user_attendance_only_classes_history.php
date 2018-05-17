<?php

use Phinx\Migration\AbstractMigration;

class CreateUserAttendanceOnlyClassesHistory extends AbstractMigration
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
    CREATE TABLE IF NOT EXISTS user_attendance_only_classes_history
(
    id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    userid INT NOT NULL,
    classid INT NOT NULL,
    date_started DATE NOT NULL,
    date_left DATE
);
SQL;
        $this->execute($sql);

    }
}
