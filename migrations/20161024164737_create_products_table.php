<?php

use Phinx\Migration\AbstractMigration;

class CreateProductsTable extends AbstractMigration
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
    CREATE TABLE if not exists products
(
    id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    title VARCHAR(100) NOT NULL,
    description VARCHAR(500) NOT NULL,
    price DOUBLE NOT NULL,
    classid INT NOT NULL,
    groupid INT,
    orgid INT NOT NULL,
    tag VARCHAR(50) NOT NULL,
    us_platform_url VARCHAR(200) NOT NULL,
    china_platform_url VARCHAR(200) NOT NULL
);
SQL;
        $this->execute($sql);

    }
}
