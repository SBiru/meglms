<?php

use Phinx\Migration\AbstractMigration;

class CreateScormRegisterations extends AbstractMigration
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
			CREATE TABLE IF NOT EXISTS `scorm_registerations`( `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_mail` varchar(50) DEFAULT NULL,
  `scorm_course_id` varchar(20) DEFAULT NULL,
  `page_id` bigint(20) DEFAULT NULL,
  `scorm_registeration_id` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`) ); 
			
SQL;
        $this->execute($sql);
    }
}
