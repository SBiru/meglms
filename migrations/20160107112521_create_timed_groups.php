<?php

use Phinx\Migration\AbstractMigration;

class CreateTimedGroups extends AbstractMigration
{
    /**
     * Change Method.
     *
     * More information on this method is available here:
     * http://docs.phinx.org/en/latest/migrations.html#the-change-method
     *
     * Uncomment this method if you would like to use it.
     *
    public function change()
    {
    }
    */
    
    /**
     * Migrate Up.
     */
    public function up()
    {
$sql = <<<SQL
        CREATE TABLE IF NOT EXISTS `timed_review_groups` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `classid` int(11) NOT NULL,
  `orgid` int(11) NOT NULL,
  `modified_by` int(11) NOT NULL,
  `modified_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
)
SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
        drop table timed_review_groups;
)
SQL;
        $this->execute($sql);
    }
}