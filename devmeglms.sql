-- phpMyAdmin SQL Dump
-- version 4.2.11
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Dec 04, 2014 at 07:14 AM
-- Server version: 5.5.38
-- PHP Version: 5.5.18

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `devmeglms`
--

-- --------------------------------------------------------

--
-- Table structure for table `banks`
--

CREATE TABLE IF NOT EXISTS `banks` (
`id` int(11) unsigned NOT NULL,
  `title` varchar(128) NOT NULL,
  `course_id` int(11) unsigned NOT NULL DEFAULT '0',
  `default_objective_id` int(11) unsigned NOT NULL DEFAULT '0',
  `created_by` int(11) unsigned NOT NULL DEFAULT '0',
  `modified` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `bank_questions`
--

CREATE TABLE IF NOT EXISTS `bank_questions` (
`id` int(11) unsigned NOT NULL,
  `bank_id` int(11) unsigned NOT NULL,
  `question_id` int(11) unsigned NOT NULL,
  `position` tinyint(3) unsigned NOT NULL DEFAULT '0'
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `chats`
--

CREATE TABLE IF NOT EXISTS `chats` (
`id` int(11) NOT NULL,
  `class_id` int(11) NOT NULL,
  `from_user_id` int(11) NOT NULL,
  `to_user_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `classes`
--

CREATE TABLE IF NOT EXISTS `classes` (
`id` int(10) unsigned NOT NULL,
  `courseid` int(10) unsigned NOT NULL,
  `name` varchar(50) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `class_assignments`
--

CREATE TABLE IF NOT EXISTS `class_assignments` (
`id` int(11) NOT NULL,
  `class_id` int(11) NOT NULL,
  `page_id` int(11) NOT NULL,
  `points` int(11) NOT NULL,
  `due` datetime NOT NULL,
  `due_offset_days` mediumint(9) NOT NULL,
  `allowed_takes` int(11) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `courses`
--

CREATE TABLE IF NOT EXISTS `courses` (
`id` int(10) unsigned NOT NULL,
  `departmentid` int(10) unsigned NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` text NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `position` smallint(5) unsigned NOT NULL DEFAULT '0',
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE IF NOT EXISTS `departments` (
`id` int(10) unsigned NOT NULL,
  `organizationid` int(10) unsigned NOT NULL,
  `name` varchar(30) NOT NULL,
  `subdomain` varchar(30) NOT NULL,
  `is_active` int(11) NOT NULL,
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `grade_posts`
--

CREATE TABLE IF NOT EXISTS `grade_posts` (
`id` int(11) NOT NULL,
  `post_id` int(11) NOT NULL,
  `teacher_post_id` int(11) NOT NULL DEFAULT '0',
  `user_id` int(11) NOT NULL,
  `grade` varchar(3) NOT NULL,
  `teacher_notes` text NOT NULL,
  `viewed` tinyint(4) NOT NULL DEFAULT '0',
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `interviewees`
--

CREATE TABLE IF NOT EXISTS `interviewees` (
`id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `city` varchar(60) NOT NULL,
  `state` varchar(60) NOT NULL,
  `country` varchar(60) NOT NULL,
  `education` varchar(32) NOT NULL,
  `native_language` varchar(60) NOT NULL,
  `second_language` varchar(60) NOT NULL,
  `additional_language` varchar(120) NOT NULL,
  `hours_expecting` varchar(120) NOT NULL,
  `hear_about_us` varchar(255) NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `localize_navs`
--

CREATE TABLE IF NOT EXISTS `localize_navs` (
`id` int(11) NOT NULL,
  `nav_id` int(11) NOT NULL,
  `language` enum('en','es','fr','de','th','ar','zh','pt','ko') NOT NULL,
  `translation` varchar(80) NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=104 DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `modules`
--

CREATE TABLE IF NOT EXISTS `modules` (
`id` int(10) unsigned NOT NULL,
  `type` enum('VOCAB') NOT NULL DEFAULT 'VOCAB',
  `name` varchar(45) NOT NULL,
  `description` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `navs`
--

CREATE TABLE IF NOT EXISTS `navs` (
`id` int(10) unsigned NOT NULL,
  `key` varchar(60) NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `objectives`
--

CREATE TABLE IF NOT EXISTS `objectives` (
`id` int(11) unsigned NOT NULL,
  `course_id` int(11) unsigned NOT NULL,
  `name` varchar(64) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `created_by` int(11) NOT NULL DEFAULT '0'
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci COMMENT='aka standards';

-- --------------------------------------------------------

--
-- Table structure for table `organizations`
--

CREATE TABLE IF NOT EXISTS `organizations` (
`id` int(10) unsigned NOT NULL,
  `name` varchar(50) NOT NULL,
  `domain` varchar(50) NOT NULL,
  `email` varchar(60) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `pages`
--

CREATE TABLE IF NOT EXISTS `pages` (
`id` int(10) unsigned NOT NULL,
  `unitid` int(10) unsigned NOT NULL,
  `pagegroupid` int(10) unsigned NOT NULL,
  `name` varchar(70) NOT NULL,
  `subtitle` varchar(70) NOT NULL,
  `moduleid` int(10) unsigned NOT NULL,
  `content` text NOT NULL,
  `layout` enum('CONTENT','VOCAB','HEADER','EXTERNAL_LINK','QUIZ') NOT NULL DEFAULT 'CONTENT',
  `position` smallint(6) NOT NULL DEFAULT '0',
  `allow_video_post` tinyint(1) NOT NULL DEFAULT '0',
  `allow_text_post` tinyint(1) NOT NULL DEFAULT '0',
  `allow_upload_post` tinyint(1) NOT NULL DEFAULT '0',
  `is_private` tinyint(1) NOT NULL,
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB AUTO_INCREMENT=210 DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `posts`
--

CREATE TABLE IF NOT EXISTS `posts` (
`id` int(10) unsigned NOT NULL,
  `classid` int(10) unsigned NOT NULL DEFAULT '1',
  `userid` int(10) unsigned NOT NULL,
  `pageid` int(10) unsigned NOT NULL,
  `postrootparentid` int(10) unsigned NOT NULL DEFAULT '0',
  `post_reply_id` int(10) unsigned NOT NULL DEFAULT '0',
  `video_url` varchar(255) NOT NULL,
  `video_thumbnail_url` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `upload_url` varchar(255) NOT NULL,
  `upload_file_name` varchar(60) NOT NULL,
  `is_teacher` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `is_private` tinyint(1) NOT NULL DEFAULT '0',
  `is_deleted` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB AUTO_INCREMENT=297 DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `questions`
--

CREATE TABLE IF NOT EXISTS `questions` (
`id` int(11) unsigned NOT NULL,
  `title` varchar(127) NOT NULL DEFAULT '',
  `prompt` text NOT NULL,
  `type` enum('open','single','multiple') NOT NULL DEFAULT 'open',
  `options` varchar(1023) NOT NULL DEFAULT '',
  `solution` varchar(255) NOT NULL DEFAULT '',
  `feedback` varchar(255) NOT NULL DEFAULT '',
  `modified` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `modified_by` int(11) unsigned NOT NULL DEFAULT '0'
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `quizzes`
--

CREATE TABLE IF NOT EXISTS `quizzes` (
`id` int(11) NOT NULL,
  `title` varchar(128) NOT NULL,
  `course_id` int(11) unsigned NOT NULL DEFAULT '0',
  `created_by` int(11) unsigned NOT NULL DEFAULT '0',
  `modified` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `quiz_questions`
--

CREATE TABLE IF NOT EXISTS `quiz_questions` (
`id` int(11) NOT NULL,
  `quiz_id` int(11) NOT NULL,
  `question_id` int(11) unsigned NOT NULL DEFAULT '0',
  `position` smallint(6) NOT NULL DEFAULT '0'
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `Sheet1`
--

CREATE TABLE IF NOT EXISTS `Sheet1` (
  `A` int(3) DEFAULT NULL,
  `B` int(2) DEFAULT NULL,
  `C` varchar(30) DEFAULT NULL,
  `D` varchar(9) DEFAULT NULL,
  `E` int(2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `units`
--

CREATE TABLE IF NOT EXISTS `units` (
`id` int(10) unsigned NOT NULL,
  `courseid` int(10) unsigned NOT NULL DEFAULT '0',
  `name` int(11) NOT NULL,
  `description` text NOT NULL,
  `position` mediumint(8) unsigned NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE IF NOT EXISTS `users` (
`id` int(10) unsigned NOT NULL,
  `organizationid` int(10) unsigned NOT NULL,
  `fname` varchar(20) NOT NULL,
  `lname` varchar(25) NOT NULL,
  `email` varchar(150) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `password` varchar(32) NOT NULL,
  `salt_for_password` varchar(44) NOT NULL,
  `is_logged_in` smallint(6) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `user_admin_organizations`
--

CREATE TABLE IF NOT EXISTS `user_admin_organizations` (
`id` int(10) unsigned NOT NULL,
  `userid` int(10) unsigned NOT NULL,
  `organizationid` int(10) unsigned NOT NULL,
  `can_add_admin_users` tinyint(1) NOT NULL DEFAULT '0',
  `can_add_users` tinyint(1) NOT NULL DEFAULT '0',
  `can_edit_courses` tinyint(1) NOT NULL DEFAULT '0',
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `user_admin_super`
--

CREATE TABLE IF NOT EXISTS `user_admin_super` (
`id` int(10) unsigned NOT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `can_create_super_users` tinyint(4) NOT NULL DEFAULT '0',
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `user_assignments`
--

CREATE TABLE IF NOT EXISTS `user_assignments` (
`id` int(11) NOT NULL,
  `userid` int(11) NOT NULL,
  `class_assignment_id` int(11) NOT NULL,
  `due` datetime NOT NULL,
  `points` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `user_classes`
--

CREATE TABLE IF NOT EXISTS `user_classes` (
`id` int(10) unsigned NOT NULL,
  `userid` int(10) unsigned NOT NULL,
  `classid` int(10) unsigned NOT NULL,
  `is_student` tinyint(1) NOT NULL DEFAULT '0',
  `is_teacher` tinyint(1) NOT NULL DEFAULT '0',
  `is_edit_teacher` tinyint(1) NOT NULL DEFAULT '0',
  `is_observer` tinyint(1) NOT NULL DEFAULT '0',
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB AUTO_INCREMENT=58 DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `user_guardians`
--

CREATE TABLE IF NOT EXISTS `user_guardians` (
  `id` int(10) unsigned NOT NULL,
  `userid` int(10) unsigned NOT NULL,
  `userchildid` int(10) unsigned NOT NULL,
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `user_preferences`
--

CREATE TABLE IF NOT EXISTS `user_preferences` (
`id` int(10) unsigned NOT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `preference` enum('language','time_zone') NOT NULL,
  `value` varchar(25) NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `vocabularies`
--

CREATE TABLE IF NOT EXISTS `vocabularies` (
`id` int(10) unsigned NOT NULL,
  `module_id` int(10) unsigned NOT NULL,
  `translation` varchar(255) NOT NULL,
  `phrase` varchar(255) NOT NULL,
  `position` smallint(5) unsigned NOT NULL DEFAULT '0'
) ENGINE=InnoDB AUTO_INCREMENT=773 DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `vocabulary_audios`
--

CREATE TABLE IF NOT EXISTS `vocabulary_audios` (
`id` int(10) unsigned NOT NULL,
  `vocabulary_id` int(10) unsigned NOT NULL,
  `audio_url` varchar(255) NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=1843 DEFAULT CHARSET=utf8;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `banks`
--
ALTER TABLE `banks`
 ADD PRIMARY KEY (`id`), ADD KEY `course_id` (`course_id`);

--
-- Indexes for table `bank_questions`
--
ALTER TABLE `bank_questions`
 ADD PRIMARY KEY (`id`), ADD KEY `bank_id` (`bank_id`), ADD KEY `question_id` (`question_id`);

--
-- Indexes for table `chats`
--
ALTER TABLE `chats`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `classes`
--
ALTER TABLE `classes`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `class_assignments`
--
ALTER TABLE `class_assignments`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `courses`
--
ALTER TABLE `courses`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `organizationid` (`departmentid`,`name`);

--
-- Indexes for table `departments`
--
ALTER TABLE `departments`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `grade_posts`
--
ALTER TABLE `grade_posts`
 ADD PRIMARY KEY (`id`), ADD KEY `post_id` (`post_id`);

--
-- Indexes for table `interviewees`
--
ALTER TABLE `interviewees`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indexes for table `localize_navs`
--
ALTER TABLE `localize_navs`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `nav_id_2` (`nav_id`,`language`), ADD KEY `nav_id` (`nav_id`), ADD KEY `language` (`language`);

--
-- Indexes for table `modules`
--
ALTER TABLE `modules`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `navs`
--
ALTER TABLE `navs`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `key` (`key`);

--
-- Indexes for table `objectives`
--
ALTER TABLE `objectives`
 ADD PRIMARY KEY (`id`), ADD KEY `course_id` (`course_id`), ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `organizations`
--
ALTER TABLE `organizations`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `pages`
--
ALTER TABLE `pages`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `posts`
--
ALTER TABLE `posts`
 ADD PRIMARY KEY (`id`), ADD KEY `classid` (`classid`);

--
-- Indexes for table `questions`
--
ALTER TABLE `questions`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `quizzes`
--
ALTER TABLE `quizzes`
 ADD PRIMARY KEY (`id`), ADD KEY `course_id` (`course_id`);

--
-- Indexes for table `quiz_questions`
--
ALTER TABLE `quiz_questions`
 ADD PRIMARY KEY (`id`), ADD KEY `quiz_id` (`quiz_id`), ADD KEY `question_id` (`question_id`);

--
-- Indexes for table `units`
--
ALTER TABLE `units`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `email` (`email`,`organizationid`);

--
-- Indexes for table `user_admin_organizations`
--
ALTER TABLE `user_admin_organizations`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `user_admin_super`
--
ALTER TABLE `user_admin_super`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `user_assignments`
--
ALTER TABLE `user_assignments`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `user_classes`
--
ALTER TABLE `user_classes`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `userid` (`userid`,`classid`);

--
-- Indexes for table `user_guardians`
--
ALTER TABLE `user_guardians`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `user_preferences`
--
ALTER TABLE `user_preferences`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `user_id_2` (`user_id`,`preference`), ADD KEY `user_id` (`user_id`), ADD KEY `value` (`value`);

--
-- Indexes for table `vocabularies`
--
ALTER TABLE `vocabularies`
 ADD PRIMARY KEY (`id`), ADD KEY `module_id` (`module_id`);

--
-- Indexes for table `vocabulary_audios`
--
ALTER TABLE `vocabulary_audios`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `vocabulary_id_2` (`vocabulary_id`,`audio_url`), ADD KEY `vocabulary_id` (`vocabulary_id`);
