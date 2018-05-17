<?php

use Phinx\Migration\AbstractMigration;

class TimedReviewTable extends AbstractMigration
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
CREATE TABLE timed_review (
  id INT NOT NULL AUTO_INCREMENT,
  title VARCHAR(255),
  description TEXT,
  dialog_json TEXT,
  PRIMARY KEY (id));
SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
DROP TABLE timed_review;
SQL;
        $this->execute($sql);
    }
}
