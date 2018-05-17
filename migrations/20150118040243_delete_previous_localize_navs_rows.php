<?php

use Phinx\Migration\AbstractMigration;

class DeletePreviousLocalizeNavsRows extends AbstractMigration
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
        DELETE FROM localize_navs;
SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
            INSERT INTO `localize_navs` (`id`, `nav_id`, `language`, `translation`) VALUES
            (1, 1, 'de', 'Willkommen'),
            (2, 1, 'fr', 'Accueil'),
            (3, 1, 'es', 'Bienvenido'),
            (4, 1, 'en', 'Welcome'),
            (5, 2, 'es', 'Nombre del curso'),
            (6, 2, 'fr', 'Le Nom du Cours'),
            (7, 2, 'de', 'Kursname'),
            (8, 2, 'en', 'Course Name'),
            (9, 3, 'de', 'Neue Nachricht'),
            (10, 3, 'fr', 'Nouveau Message'),
            (11, 3, 'es', 'nueva publicación'),
            (12, 3, 'en', 'New Post'),
            (13, 4, 'fr', 'Repondre'),
            (14, 4, 'es', 'responder'),
            (15, 4, 'de', 'Antworten'),
            (16, 4, 'en', 'Reply'),
            (17, 5, 'de', 'Konto'),
            (18, 5, 'es', 'cuenta'),
            (19, 5, 'fr', 'Compte'),
            (20, 5, 'en', 'Account'),
            (21, 6, 'fr', 'Se Déconnecter'),
            (22, 6, 'de', 'Austragen'),
            (23, 6, 'es', 'cerrar sesión'),
            (24, 6, 'en', 'Sign Out'),
            (25, 1, 'th', 'ยินดีต้อนรับ'),
            (26, 2, 'th', 'ชื่อคอร์ส'),
            (27, 3, 'th', 'โพสต์ไหม่'),
            (28, 5, 'th', 'บัญชี'),
            (29, 4, 'th', 'ตอบ'),
            (30, 6, 'th', 'ออกจากระบบ'),
            (31, 7, 'th', 'คำศัพท์'),
            (32, 7, 'en', 'vocabulary'),
            (33, 8, 'th', 'บัตรคำศัพท์'),
            (34, 8, 'en', 'Flashcards'),
            (35, 9, 'th', 'หน้าที่แล้ว'),
            (36, 9, 'en', 'prev'),
            (37, 10, 'th', 'ต่อ'),
            (38, 10, 'en', 'next'),
            (39, 11, 'th', 'ทั้งหมด'),
            (40, 11, 'en', 'all'),
            (41, 12, 'th', 'เว็บแคม'),
            (42, 12, 'en', 'Webcam'),
            (43, 13, 'th', 'อัพโหลดวิดีโอ'),
            (44, 13, 'en', 'Upload Video'),
            (45, 7, 'es', 'vocabulario'),
            (46, 8, 'es', 'tarjetas de memoria'),
            (47, 9, 'es', 'anterior'),
            (48, 10, 'es', 'siguiente'),
            (49, 11, 'es', 'todo'),
            (50, 12, 'es', 'mensaje'),
            (51, 13, 'es', 'subir archivo'),
            (52, 1, 'ar', 'اهلا و سهلا'),
            (53, 2, 'ar', 'اسم الدورة'),
            (54, 3, 'ar', 'رسالة جديدة'),
            (55, 4, 'ar', 'الرد'),
            (56, 5, 'ar', 'حساب المستخدم'),
            (57, 6, 'ar', 'تسجيل الخروج'),
            (58, 7, 'ar', 'المفردات'),
            (59, 8, 'ar', 'البطاقات التعليمية'),
            (60, 9, 'ar', 'السابق'),
            (61, 10, 'ar', 'التالي'),
            (62, 11, 'ar', 'كافة'),
            (63, 12, 'ar', 'كاميرا ويب'),
            (64, 13, 'ar', 'تحميل'),
            (65, 1, 'zh', '欢迎'),
            (66, 2, 'zh', '课程名称'),
            (67, 3, 'zh', '粘贴新的内容'),
            (68, 4, 'zh', '回复'),
            (69, 5, 'zh', '帐户'),
            (70, 6, 'zh', '登出'),
            (71, 7, 'zh', '单词'),
            (72, 8, 'zh', '抽认卡'),
            (73, 9, 'zh', '上一个'),
            (74, 10, 'zh', '下一个'),
            (75, 11, 'zh', '所有'),
            (76, 12, 'zh', '摄像头'),
            (77, 13, 'zh', '上传'),
            (78, 1, 'pt', 'Bem-vindo'),
            (79, 2, 'pt', 'Nome do Curso'),
            (80, 3, 'pt', 'Nova postagem'),
            (81, 4, 'pt', 'Responder'),
            (82, 5, 'pt', 'conta'),
            (83, 6, 'pt', 'terminar sessão'),
            (84, 7, 'pt', 'vocabulário'),
            (85, 8, 'pt', 'cartões de memória'),
            (86, 9, 'pt', 'Anterior'),
            (87, 10, 'pt', 'Próximo'),
            (88, 11, 'pt', 'todas'),
            (89, 12, 'pt', 'câmara web'),
            (90, 13, 'pt', 'upload vídeo'),
            (91, 1, 'ko', '환영하다'),
            (92, 2, 'ko', '강의 이름'),
            (93, 3, 'ko', '새 글'),
            (94, 4, 'ko', '대답'),
            (95, 5, 'ko', '계정'),
            (96, 6, 'ko', '로그아웃'),
            (97, 7, 'ko', '어휘'),
            (98, 8, 'ko', '단어장'),
            (99, 9, 'ko', '이전의'),
            (100, 10, 'ko', '다음의'),
            (101, 11, 'ko', '모두'),
            (102, 12, 'ko', '웹켐'),
            (103, 13, 'ko', '업로드');
SQL;
        $this->execute($sql);
    }
}