<?php

namespace English3\Controller;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class ExampleController
{
    public function getExampleAction(Request $request)
    {
        return new JsonResponse(array('example'));
    }
}