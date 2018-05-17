<?php

class multipartPrepare
{

    public function questionLifter($question, $id)
    {
        $this->question = $question;
        //This will for part of the answer id
        $this->namepart = 'Qe3' . $id;
        
        $this->answers = array();
        $replace       = array(
            "\s+",
            '&amp;',
            '&gt;',
            '&lt;',
            '&nbsp;',
            '&ge;',
            '&le;',
            '&quot;',
            '&minus;',
            '&\#39;'
        );
        $with          = array(
            ' ',
            '&',
            '>',
            '<',
            ' ',
            '≥',
            '≤',
            '"',
            '-',
            "'"
        );
        foreach ($replace as $i => $value) {
            $this->question = preg_replace('@' . $replace[$i] . '@xsi', $with[$i], $this->question);
        }
        
        $this->SetQuestionReference();
        
    }
    
    
    private function SetQuestionReference()
    {
        
        //Removing html from answer 
        $this->question = preg_replace_callback("@{\d+\:.*?}@xsi", function($m)
        {
            return preg_replace('@<\/script.*?>|<script.*?>@xsi', '', $m[0]);
        }, $this->question);
        
        
        $this->question = preg_replace('@({\d+\:.*?\})@', '__$1__', $this->question);
        $this->question = preg_replace('@____@', '__', $this->question);
        
        $this->count = -1;
        $this->question = preg_replace_callback("@__\{\d+\:(\w+)\:(.*?)\}__@xsi", function($m)
        {
            
            $this->count += 1;
            /*
             * if the options contain html, we will use it's position
             */
            $this->containsHtml = $m[2]!=strip_tags($m[2]);
            $explode = explode('~', $m[2]);
            
            if (!preg_match('@\w@', $explode[0])) {
                array_shift($explode);
            }
            
            if (!isset($explode[0])) {
                return '<span style="color:red;font-weight:bold">QUESTION ERROR TYPE "NOTHING" PLEASE REPORT</span>';
            }
            if (trim($explode[0] == '=')) {
                if (!isset($explode[1])) {
                    return '<span style="color:red;font-weight:bold">QUESTION ERROR TYPE "NOTHING 1" PLEASE REPORT</span>';
                }
                $explode[1] = $explode[0] . $explode[1];
                array_shift($explode);
            }
            $answers  = array();
            $selected = '';
            foreach ($explode as $i => $value) {
                if (preg_match('@^=@', $value)) {
                    $answers[] = $this->containsHtml?$i:strtolower(trim(preg_replace('@^=@', '', $value)));
                }
            }
            $id                 = $this->namepart . count($explode) . '_' . count($this->answers);
            $this->answers[$id] = $answers;
            
            $style = '';
            //Setting to show value if in teacher view for inputs....
            if (isset($this->is_response)) {
                $value = preg_replace('@^=|\s@','',$value);

                $tmpR =  preg_replace('@.*?\:|"|\}$|\.$@xsi', '', trim($this->response[$this->count]));
                if ($value == $tmpR){
                    $style= ';color:green';
                }
                else
                {
                    $style = ';color:red';
                }
                $style .= ';font-weight:bold';
                $value = $tmpR;
                //echo '$value = '.$value."\n";
                //echo '$style = '.$style."\n\n";
                
            } else if (isset($this->is_teacher)) {
                $value = preg_replace('@^\s,\s@', '', preg_replace('@=@xsi', '', implode(" , ", $explode)));
            } else {
                $value = '';
            }
            
            $data          = '';
            $selectedValue = '';
            if (isset($this->teacher_true)) {
                $answer        = preg_replace('@^\s,\s@', '', preg_replace('@=@xsi', '', implode(" , ", $explode)));
                $answer        = preg_replace('@(\d)\:\d.*@', '$1', $answer);
                $data          = 'class="tobeDoubleClicked" ng-dblclick="question.answers.' . $id . ' = \'' . $answer . '\'"';
                $selectedValue = 'class="tobeDoubleClicked" ng-dblclick="question.answers.' . $id . ' = \'' . '__ENG3SelectedValue__' . '\'"';
            }
            //echo '$value = '.$value."\n";
            
            switch ($m[1]) {
                case 'NUMERICAL':
                    return '<input ' . $data . ' value="' . $value . '" id="' . $id . '" style="width:200px;height:27px'.$style.'" ng-model="question.answers.' . $id . '">';
                case 'SHORTANSWER':
                    return '<input ' . $data . ' value="' . $value . '" id="' . $id . '" style="width:200px;height:27px'.$style.'" ng-model="question.answers.' . $id . '">';
                case 'NM':
                    return '<input ' . $data . ' id="' . $id . '" style="width:200px;height:27px'.$style.'" value="' . $value . '" ng-model="question.answers.' . $id . '">';
                case 'SA':
                    return '<input ' . $data . ' id="' . $id . '" style="width:200px;height:27px'.$style.'" value="' . $value . '" ng-model="question.answers.' . $id . '">';
                case 'NP':
                    return '<input ' . $data . ' id="' . $id . '" style="width:200px;height:27px'.$style.'" value="' . $value . '" ng-model="question.answers.' . $id . '">';
                case 'MULTICHOICE':
                case 'MC':
                    
                    $reference = '';
                    $style = '';
                    foreach ($explode as $key => $value) {
                        
                        if (isset($this->teacher_true)) {
                            if (preg_match('@^=@', $value)) {
                                $ENG3SelectedValue = preg_replace('@^\=@', '', $value);
                                $value             = preg_replace('@\=@', '', $value);
                            }
                        }
                        
                        else if ((isset($this->is_teacher)) || (isset($this->is_response))) {
                            if (isset($this->response[$this->count])) {
                                $test = preg_replace('@|\s+|^\=|\.$@', '', $value);
                                if ($test == preg_replace('@\.$@', '',  $this->response[$this->count] )) {
                                    if ($style == '') {
                                        if (preg_match('@=@', $value)) {
                                            $style = ';color:green';
                                        } else {
                                            $style = ';color:red';
                                        }
                                    }
                                    $selected = 'selected';
                                } else {
                                    $selected = 'disabled';
                                }
                            } else {
                                if (preg_match('@^=@', $value)) {
                                    $selected = 'selected';

                                } else {
                                    if (isset($this->is_response)) {
                                        $selected = 'disabled';
                                    } else {
                                        $selected = '';
                                    }
                                }
                            }
                        } else {
                            $value = preg_replace('@\=@', '', $value);
                        }
                        $reference .= '<option ' . $selected . '>' . $value . '</option>';
                    }
                    
                    $referenceStart = '<select   id="' . $id . '" style="height:27px' . $style . '" ng-model="question.answers.' . $id . '" ' . $selectedValue . ' >';
                    $reference      = $referenceStart . $reference . '</select>';
                    if (isset($this->teacher_true)) {
                        $reference = preg_replace('/__ENG3SelectedValue__/', $ENG3SelectedValue, $reference);
                    }
                    
                    return $reference;
                case 'MULTICHOICE_V':
                case 'MULTICHOICE_H':
                case 'MCV':
                case 'MCH':

                    $reference = '';
                    
                    
                    foreach ($explode as $key => $value) {
                        $class      = '';
                        $value      = '~' . $value;
                        $style      = '';
                        $selected   = '';

                        $valuestrip = $this->containsHtml?$key:trim(preg_replace('@[~=]@', '', $value));
                        //Checking to see if we want to load in our ansewrs
                        //for questions to be answered.
                        if (isset($this->teacher_true)) {
                            if (preg_match('@^~=@', $value)) {
                                $class = 'class="tobechecked"';
                            }
                        } else if (isset($this->is_teacher)) {
                            if (preg_match('@^~=@', $value)) {
                                $selected = 'checked';
                            }
                        } else if ((isset($this->is_response)) && (isset($this->teacher_view))) {

                            $id = $id . $this->user_id;
                            
                            if (preg_match('@^~=|^=@', $value)) {
                                $style = ';color:green;font-weight:bold';
                            }
                          
                            if (trim($this->response[$this->count]) == $valuestrip || trim($this->response[$this->count]) == preg_replace('@\s+|[~=]|\&\w+\;|\W[,.]+@s', '', $valuestrip) ) {
                                $selected = 'checked';
                                if (!$style) {
                                    $style = ';color:red;font-weight:bold';
                                }
                            }
                        }

                        $reference .= "<div style='padding:10px;font-weight:bold" . $style . "'><input " . $class . " ng-click='multipartRadio(question,\"" . $valuestrip . "\",\"" . $id . "\")'  ng-model='question.answers." . $id . "'  name='" . $id . "' type='radio' value='" . $valuestrip . "' " . $selected . " style='margin-right: 10px;;font-weight:bold'>" . preg_replace("@~=|~@", "", $value) . "</div>";
                    }
                    return $reference;
            }
            return '<span style="color:red;font-weight:bold">QUESTION ERROR PLEASE REPORT</span>';
        }, $this->question);
    }
}
?>