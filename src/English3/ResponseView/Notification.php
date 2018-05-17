<?php

namespace English3\ResponseView;

class Notification
{
    private $newChatMessagesCount;

    /**
     * @return int
     */
    public function getNewChatMessagesCount()
    {
        return $this->newChatMessagesCount;
    }

    /**
     * @param int $newChatMessagesCount
     * @return Notification
     */
    public function setNewChatMessagesCount($newChatMessagesCount)
    {
        $this->newChatMessagesCount = $newChatMessagesCount;
        return $this;
    }
}