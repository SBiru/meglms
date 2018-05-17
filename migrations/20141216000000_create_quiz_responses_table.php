<?php

use Phinx\Migration\AbstractMigration;

class CreateQuizResponsesTable extends AbstractMigration
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
CREATE TABLE quiz_responses (
quiz_response_id INT NOT NULL AUTO_INCREMENT,
  quiz_id INT(11) NOT NULL,
  user_id INT(10) NOT NULL,
  question_id INT(11) NOT NULL,
  response VARCHAR(255) NULL,
  PRIMARY KEY (quiz_response_id));
SQL;
        $this->execute($sql);

    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
DROP TABLE quiz_responses;
SQL;
        $this->execute($sql);
    }
}
