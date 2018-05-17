<?php

use Phinx\Migration\AbstractMigration;

class AddAnnouncementsViewed extends AbstractMigration
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
CREATE TABLE IF NOT EXISTS `announcements_viewed` (
  `announcementid` int(11) NOT NULL,
  `userid` int(11) NOT NULL,
  PRIMARY KEY (`announcementid`,`userid`)
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
    DROP TABLE announcements_viewed
SQL;
        $this->execute($sql);


    }
}