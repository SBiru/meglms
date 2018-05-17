<?php

use Phinx\Migration\AbstractMigration;

class AddingIndexesToPostsAndGradePosts extends AbstractMigration
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
ALTER TABLE `posts`
ADD INDEX `postrootparentid` (`postrootparentid` ASC),
ADD INDEX `pageid` (`pageid` ASC);
ALTER TABLE `grade_posts` ADD INDEX `teacher_post_id` (`teacher_post_id` ASC);
SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {

    }
}