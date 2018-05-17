<?php

use Phinx\Migration\AbstractMigration;

class CreateQuizScoresTable extends AbstractMigration
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
CREATE TABLE quiz_scores (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT(10) NOT NULL,
  quiz_id INT(11) NOT NULL,
  score INT(8) NULL,
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
DROP TABLE quiz_scores;
SQL;
        $this->execute($sql);
    }
}
