<?php


use Phinx\Migration\AbstractMigration;

class CreateJ1Certificate extends AbstractMigration
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
    CREATE TABLE if not exists j1_certificate
(
  id                INT AUTO_INCREMENT
    PRIMARY KEY,
  userid            BIGINT       NULL,
  classid           INT          NULL,
  user_name         VARCHAR(150) NULL,
  user_picture      VARCHAR(255) NULL,
  email             VARCHAR(150) NULL,
  nationality       VARCHAR(50)  NULL,
  institution       VARCHAR(50)  NULL,
  applicantid       VARCHAR(50)  NULL,
  date_of_birth     VARCHAR(50)  NULL,
  language          VARCHAR(50)  NULL,
  interview_date    VARCHAR(50)  NULL,
  evaluatorid       VARCHAR(50)  NULL,
  score             VARCHAR(50)  NULL,
  score_description TEXT         NULL,
  interviewid       VARCHAR(50)  NULL
);
SQL;
    $this->execute($sql);
    }
}
