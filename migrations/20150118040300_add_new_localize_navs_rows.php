<?php

use Phinx\Migration\AbstractMigration;

class AddNewLocalizeNavsRows extends AbstractMigration
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
        INSERT INTO `localize_navs` (`nav_key`, `language`, `translation`) VALUES
            ('welcome', 'de', 'Willkommen'),
            ('welcome', 'fr', 'Accueil'),
            ('welcome', 'es', 'Bienvenido'),
            ('welcome', 'en', 'Welcome'),
            ('course_name', 'es', 'Nombre del curso'),
            ('course_name', 'fr', 'Le Nom du Cours'),
            ('course_name', 'de', 'Kursname'),
            ('course_name', 'en', 'Course Name'),
            ('new_post', 'de', 'Neue Nachricht'),
            ('new_post', 'fr', 'Nouveau Message'),
            ('new_post', 'es', 'nueva publicación'),
            ('new_post', 'en', 'New Post'),
            ('reply', 'fr', 'Repondre'),
            ('reply', 'es', 'responder'),
            ('reply', 'de', 'Antworten'),
            ('reply', 'en', 'Reply'),
            ('account', 'de', 'Konto'),
            ('account', 'es', 'cuenta'),
            ('account', 'fr', 'Compte'),
            ('account', 'en', 'Account'),
            ('sign_out', 'fr', 'Se Déconnecter'),
            ('sign_out', 'de', 'Austragen'),
            ('sign_out', 'es', 'cerrar sesión'),
            ('sign_out', 'en', 'Sign Out'),
            ('welcome', 'th', 'ยินดีต้อนรับ'),
            ('course_name', 'th', 'ชื่อคอร์ส'),
            ('new_post', 'th', 'โพสต์ไหม่'),
            ('account', 'th', 'บัญชี'),
            ('reply', 'th', 'ตอบ'),
            ('sign_out', 'th', 'ออกจากระบบ'),
            ('vocabulary', 'th', 'คำศัพท์'),
            ('vocabulary', 'en', 'vocabulary'),
            ('flashcards', 'th', 'บัตรคำศัพท์'),
            ('flashcards', 'en', 'Flashcards'),
            ('prev', 'th', 'หน้าที่แล้ว'),
            ('prev', 'en', 'prev'),
            ('next', 'th', 'ต่อ'),
            ('next', 'en', 'next'),
            ('all', 'th', 'ทั้งหมด'),
            ('all', 'en', 'all'),
            ('webcam', 'th', 'เว็บแคม'),
            ('webcam', 'en', 'Webcam'),
            ('uploadvideo', 'th', 'อัพโหลดวิดีโอ'),
            ('uploadvideo', 'en', 'Upload Video'),
            ('vocabulary', 'es', 'vocabulario'),
            ('flashcards', 'es', 'tarjetas de memoria'),
            ('prev', 'es', 'anterior'),
            ('next', 'es', 'siguiente'),
            ('all', 'es', 'todo'),
            ('webcam', 'es', 'mensaje'),
            ('uploadvideo', 'es', 'subir archivo'),
            ('welcome', 'ar', 'اهلا و سهلا'),
            ('course_name', 'ar', 'اسم الدورة'),
            ('new_post', 'ar', 'رسالة جديدة'),
            ('reply', 'ar', 'الرد'),
            ('account', 'ar', 'حساب المستخدم'),
            ('sign_out', 'ar', 'تسجيل الخروج'),
            ('vocabulary', 'ar', 'المفردات'),
            ('flashcards', 'ar', 'البطاقات التعليمية'),
            ('prev', 'ar', 'السابق'),
            ('next', 'ar', 'التالي'),
            ('all', 'ar', 'كافة'),
            ('webcam', 'ar', 'كاميرا ويب'),
            ('uploadvideo', 'ar', 'تحميل'),
            ('welcome', 'zh', '欢迎'),
            ('course_name', 'zh', '课程名称'),
            ('new_post', 'zh', '粘贴新的内容'),
            ('reply', 'zh', '回复'),
            ('account', 'zh', '帐户'),
            ('sign_out', 'zh', '登出'),
            ('vocabulary', 'zh', '单词'),
            ('flashcards', 'zh', '抽认卡'),
            ('prev', 'zh', '上一个'),
            ('next', 'zh', '下一个'),
            ('all', 'zh', '所有'),
            ('webcam', 'zh', '摄像头'),
            ('uploadvideo', 'zh', '上传'),
            ('welcome', 'pt', 'Bem-vindo'),
            ('course_name', 'pt', 'Nome do Curso'),
            ('new_post', 'pt', 'Nova postagem'),
            ('reply', 'pt', 'Responder'),
            ('account', 'pt', 'conta'),
            ('sign_out', 'pt', 'terminar sessão'),
            ('vocabulary', 'pt', 'vocabulário'),
            ('flashcards', 'pt', 'cartões de memória'),
            ('prev', 'pt', 'Anterior'),
            ('next', 'pt', 'Próximo'),
            ('all', 'pt', 'todas'),
            ('webcam', 'pt', 'câmara web'),
            ('uploadvideo', 'pt', 'upload vídeo'),
            ('welcome', 'ko', '환영하다'),
            ('course_name', 'ko', '강의 이름'),
            ('new_post', 'ko', '새 글'),
            ('reply', 'ko', '대답'),
            ('account', 'ko', '계정'),
            ('sign_out', 'ko', '로그아웃'),
            ('vocabulary', 'ko', '어휘'),
            ('flashcards', 'ko', '단어장'),
            ('prev', 'ko', '이전의'),
            ('next', 'ko', '다음의'),
            ('all', 'ko', '모두'),
            ('webcam', 'ko', '웹켐'),
            ('uploadvideo', 'ko', '업로드'),



            ('chatting_to_pre_name', 'en', 'Chatting To'),
            ('chatting_to_post_name', 'en', ''),
            ('chat_textbox_placeholder', 'en', 'Type message here and press Enter'),
            ('student', 'en', 'Student'),
            ('test_bank_builder', 'en', 'Test/Bank Builder'),
            ('course_builder', 'en', 'Course Builder'),
            ('grader', 'en', 'Grader'),
            ('admin', 'en', 'Admin'),
            ('instructor_feedback', 'en', 'Instructor Feedback'),
            ('notification_no_score_pre_name', 'en', 'You received feedback from '),
            ('notification_no_score_post_name', 'en', ''),
            ('notification_with_score_pre_name', 'en', 'Teacher '),
            ('notification_with_score_post_name', 'en', ' graded an assignment'),
            ('notification_with_score_pre_score', 'en', ' and you recieved a score of '),
            ('notification_with_score_post_score', 'en', ''),
            ('chat', 'en', 'Chat'),
            ('grades', 'en', 'Grades'),
            ('previous', 'en', 'Previous'),


            ('chatting_to_pre_name', 'es', 'Charlando con'),
            ('chatting_to_post_name', 'es', ''),
            ('chat_textbox_placeholder', 'es', 'Oprima mensaje aqui y oprima Entrar'),
            ('test_bank_builder', 'es', '업로드'),
            ('course_builder', 'es', 'Editor de Curso'),
            ('grader', 'es', 'Gradador'),
            ('admin', 'es', 'Administrador'),
            ('instructor_feedback', 'es', 'Retroalimentación Instructor'),
            ('notification_no_score_pre_name', 'es', 'Usted recibió retroalimentación de '),
            ('notification_no_score_post_name', 'es', ''),
            ('notification_with_score_pre_name', 'es', 'Instructor '),
            ('notification_with_score_post_name', 'es', ' califico un asignación '),
            ('notification_with_score_pre_score', 'es', ' y usted recibió un '),
            ('notification_with_score_post_score', 'es', ''),
            ('chat', 'es', 'Charlador'),
            ('grades', 'es', 'Grados'),
            ('previous', 'es', 'Anterior');

            INSERT INTO `localize_navs` (`language`, `translation`, `nav_key`) VALUES ('en', 'Feedback', 'feedback');
            INSERT INTO `localize_navs` (`language`, `translation`, `nav_key`) VALUES ('es', 'Retroalimentación', 'feedback');
SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
        DELETE FROM localize_navs;
SQL;
        $this->execute($sql);
    }
}