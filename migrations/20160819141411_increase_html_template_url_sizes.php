<?php

use Phinx\Migration\AbstractMigration;

class IncreaseHtmlTemplateUrlSizes extends AbstractMigration
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
    ALTER TABLE `html_templates`
CHANGE COLUMN `template_url` `template_url` VARCHAR(200) NULL DEFAULT NULL ,
CHANGE COLUMN `template_image` `template_image` VARCHAR(200) NULL DEFAULT NULL ;
SQL;
    $this->execute($sql);

    }
}
