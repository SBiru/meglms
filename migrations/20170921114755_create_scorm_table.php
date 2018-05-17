<?php

use Phinx\Migration\AbstractMigration;

class CreateScormTable extends AbstractMigration
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

    /**
     * Migrate Up.
     */
//    public function up()
//    {
//        $table = $this->table('scorm', array('id' => false, 'primary_key' => array('classId','pageId','userId')));
//        $table->addColumn('classId', 'integer')
//            ->addColumn('pageId', 'integer')
//            ->addColumn('userId', 'integer')
//            ->addColumn('score', 'decimal', array('precision' => 11, 'scale' => 2))
//            ->addColumn('byUserId', 'integer')
//            ->addColumn('date', 'datetime')
//            ->save();
//    }

    public function change()
    {
        $sql = <<<SQL
			CREATE TABLE IF NOT EXISTS `scorm`( `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `scorm_course_id` varchar(20) NOT NULL,
  `page_id` bigint(20) DEFAULT NULL,
  `scorm_name` varchar(20) NOT NULL,
  `display_description` tinyint(1) DEFAULT '0',
  `scorm_title` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`) ); 
			
SQL;
        $this->execute($sql);
    }
}
