<?php


class FatalErrorMailer{
    private static $developers = ['dennyserejom@gmail.com'];
    public static $echo = false;
    public static $registered = false;
    private static $script  = '';
    public static function  shutdown()
    {
        $errfile = "unknown file";
        $errstr  = "shutdown";
        $errno   = E_CORE_ERROR;
        $errline = 0;

        $error = error_get_last();

        if( $error !== NULL) {
            $errno   = $error["type"];
            $errfile = $error["file"];
            $errline = $error["line"];
            $errstr  = $error["message"];
            $formatted = self::format_error( $errno, $errstr, $errfile, $errline);
            self::sendEmail($formatted);
            if(self::$echo){
                echo $formatted;
            }

        }

    }
    public static function sendEmail($message){
        global $PATHS;
        $mail = new Mailer();
        $mail->send(self::$developers,'Error report '.$PATHS->serverName .' '.self::$script,$message);
    }
    public static function format_error( $errno, $errstr, $errfile, $errline ) {
        $trace = print_r( debug_backtrace( false ), true );

        $content = "
          <table>
          <thead><th>Item</th><th>Description</th></thead>
          <tbody>
          <tr>
            <th>Error</th>
            <td><pre>$errstr</pre></td>
          </tr>
          <tr>
            <th>Errno</th>
            <td><pre>$errno</pre></td>
          </tr>
          <tr>
            <th>File</th>
            <td>$errfile</td>
          </tr>
          <tr>
            <th>Line</th>
            <td>$errline</td>
          </tr>
          <tr>
            <th>Trace</th>
            <td><pre>$trace</pre></td>
          </tr>
          </tbody>
          </table>";

        return $content;
    }
    public static function register($script=''){
        self::$script = $script;
        self::$registered = true;
        register_shutdown_function(['FatalErrorMailer','shutdown']);
    }
}
Class Mailer{
    protected $mailer;
    public function __construct(){
        global $MAIL_SECURITY;
        $userName = array_key_exists('MAIL_SECURITY', $GLOBALS) && isset($MAIL_SECURITY->username)?$MAIL_SECURITY->username:'noreply@english3.com';
        $pwd = array_key_exists('MAIL_SECURITY', $GLOBALS) && isset($MAIL_SECURITY->password)?$MAIL_SECURITY->password:'E3noreply$!';
        $mailer = new \PHPMailer();
        $mailer->IsSMTP();
        $mailer->SMTPDebug = 0;
        $mailer->Mailer = 'smtp';
        $mailer->SMTPAuth = true;
        $mailer->Host = 'smtp.gmail.com';
        $mailer->Port = 587;
        $mailer->SMTPSecure = 'tls';
        $mailer->CharSet = 'UTF-8';
        $mailer->Username = $userName;
        $mailer->Password = $pwd;
        $mailer->IsHTML(true); // if you are going to send HTML formatted emails
        $mailer->SingleTo = true; // if you want to send a same email to multiple users. multiple emails will be sent one-by-one.
        $mailer->From = $userName;
        $mailer->FromName = 'English3 Error Reporter';
        $this->mailer = $mailer;
    }
    public function getMailerObject(){
        return $this->mailer;
    }
    public function send($to,$subject,$message){
        $this->mailer->Subject = $subject;
        #$to->setEmail('dennyserejom@gmail.com'); //for testing
        if(gettype($to)!=='array'){
            $this->mailer->addAddress($to);
        }else{
            foreach($to as $user){
                $this->mailer->addAddress($user);
            }
        }

        $this->mailer->Body = $message;
        return $this->mailer->send();
    }

}


