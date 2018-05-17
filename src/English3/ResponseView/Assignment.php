<?php

namespace English3\ResponseView;

class Assignment
{
    public function __construct(){
        $this->feedback = new \stdClass();

    }
    /**
     * @var string
     */
    private $name;
    /**
     * @var int
     */
    private $class_id;
    /**
     * @var int
     */
    private $score;
    /**
     * @var \DateTime
     */
    private $due;
    /**
     * @var \DateTime
     */
    private $submitted;
    /**
     * @var int
     */
    private $total;
    /**
     * @var int
     */
    private $user_id;
    private $unit;
    private $page_id;
    public $feedback;
    /**
     * @return int
     */
    public function getUserId()
    {
        return $this->user_id;
    }

    /**
     * @param int $user_id
     *
     * @return Assignment
     */
    public function setUserId($user_id)
    {
        $this->user_id = $user_id;
        return $this;
    }


    /**
     * @return int
     */
    public function getClassId()
    {
        return $this->class_id;
    }

    /**
     * @param int $class_id
     *
     * @return Assignment
     */
    public function setClassId($class_id)
    {
        $this->class_id = $class_id;
        return $this;
    }
    public function getShow_grades()
    {
        return $this->show_grades;
    }
    public function setShow_grades($show_grades)
    {
        $this->show_grades = $show_grades;
        return $this;
    }
    public function getShow_dates()
    {
        return $this->show_dates;
    }
    public function setShow_dates($show_dates)
    {
        $this->show_dates = $show_dates;
        return $this;
    }

    /**
     * @return \DateTime
     */
    public function getDue()
    {
        return $this->due;
    }

    /**
     * @param \DateTime $due
     *
     * @return Assignment
     */
    public function setDue($due)
    {
        $this->due = $due;
        return $this;
    }

    /**
     * @return string
     */
    public function getName()
    {
        return $this->name;
    }

    /**
     * @param string $name
     *
     * @return Assignment
     */
    public function setName($name)
    {
        $this->name = $name;
        return $this;
    }

    /**
     * @return int
     */
    public function getScore()
    {
        return $this->score;
    }

    /**
     * @param int $score
     *
     * @return Assignment
     */
    public function setScore($score)
    {
        $this->score = $score;
        return $this;
    }

    /**
     * @return \DateTime
     */
    public function getSubmitted()
    {
        return $this->submitted;
    }

    /**
     * @param \DateTime $submitted
     *
     * @return Assignment
     */
    public function setSubmitted($submitted)
    {
        $this->submitted = $submitted;
        return $this;
    }

    /**
     * @return int
     */
    public function getTotal()
    {
        return $this->total;
    }

    /**
     * @param int $total
     *
     * @return Assignment
     */
    public function setTotal($total)
    {
        $this->total = $total;
        return $this;
    }
    /**
     * @param string $unit
     *
     * @return Assignment
     */
    public function getUnit()
    {
        return $this->unit;
    }
    public function setUnit($unit){
        $this->unit = $unit;
        return $this;
    }
    public function getUnitPosition()
    {
        return $this->unitPosition;
    }
    public function setUnitPosition($unit){
        $this->unitPosition = $unit;
        return $this;
    }
    public function getPageGroupId()
    {
        return $this->page_group_id;
    }
    public function setPageGroupId($pageid){
        $this->page_group_id = $pageid;
        return $this;
    }
    public function getPageId()
    {
        return $this->page_id;
    }
    public function setPageId($pageid){
        $this->page_id = $pageid;
        return $this;
    }
    
    public function setFeedback($feedback){
        $this->feedback = $feedback;
        return $this;
    }
}
