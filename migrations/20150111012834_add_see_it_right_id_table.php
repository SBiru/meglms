<?php

use Phinx\Migration\AbstractMigration;

class AddSeeItRightIdTable extends AbstractMigration
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
CREATE TABLE IF NOT EXISTS `see_it_right_id` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `correct` int(11) NOT NULL,
  `incorrect` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `vocabulary_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_vocab` (`user_id`,`vocabulary_id`)
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
DROP TABLE see_it_right_id;
SQL;
        $this->execute($sql);
    }
}