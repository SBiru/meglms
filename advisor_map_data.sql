-- MySQL dump 10.13  Distrib 5.7.17, for Linux (x86_64)
--
-- Host: localhost    Database: meglms
-- ------------------------------------------------------
-- Server version	5.7.17-0ubuntu0.16.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `advisor_map`
--

DROP TABLE IF EXISTS `advisor_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `advisor_map` (
  `id` int(11) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `name` varchar(50) NOT NULL,
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `advisor_map`
--

LOCK TABLES `advisor_map` WRITE;
/*!40000 ALTER TABLE `advisor_map` DISABLE KEYS */;
INSERT INTO `advisor_map` VALUES (475,'janderson@edkey.org','Jared','Anderson','Anderson'),(4451,'rbawiec@edkey.org','Richard','Bawiec','Bawiec'),(1004,'dorenbenally@yahoo.com','Doren','Benally','Benally'),(128,'jcallender@edkey.org','Jennifer','Callender','Callender'),(101,'coach.ccjc@gmail.com','Coconino County Juv.','CCJC','CCJC'),(303,'chs@email.org','Compass','High School','CHS'),(1353,'aclark@edkey.org','Anthony','Clark','Clark'),(439,'bcook@edkey.org','Brian','Cook','Cook'),(133,'kcruz@edkey.org','Kim','Cruz','Cruz'),(127,'ejones@edkey.org','Erica','Jones','eJones'),(129,'jflohr@edkey.org','Janet','Flohr','Flohr'),(335,'rfudge@edkey.org','Robert','Fudge','Fudge'),(2864,'lgarcia@edkey.org','Lorena','Garcia','Garcia'),(450,'jgarwood@edkey.org','Jennifer','Garwood','Garwood'),(786,'labadvisor@arivacaboysranch.com','Justin','Gibson','Gibson'),(310,'jgilgen@edkey.org','Joseph','Gilgen','Gilgen'),(137,'phauchrog@edkey.org','Patty','Hauchrog','Hauchrog'),(727,'hlaine@edkey.org','Heather','Laine','Heather Laine'),(202,'mrs.dconnolly3@gmail.com','Danielle','Connolly','Hill'),(130,'jhullenaar@edkey.org','Jennifer','Hullenaar','Hullenaar'),(128,'flee@edkey.org','Fayette','Lee','Lee'),(359,'majones@edkey.org','Mathew','Jones','majones'),(359,'kmannis@edkey.org','Kalman','Mannis','Mannis'),(6105,'mgaraczyk@edkey.org','Mark','Garalczyk','MGaralczyk'),(3301,'kmims@edkey.org','Killy','Mims','Mims'),(3066,'mpettit@edkey.org','Michael','Pettit','Pettit'),(2895,'wphan@edkey.org','Wendy','Phan','Phan'),(138,'rpriego@edkey.org','Ronnette','Priego','Priego'),(131,'jradigan@edkey.org','Jenny','Radigan','Radigan'),(1203,'mramos@edkey.org','Marla','Ramos','Ramos'),(617,'trichardson@edkey.org','Tammy','Richardson','Richardson'),(638,'kriley@edkey.org','Kimberly','Riley','Riley'),(2754,'esantiago@edkey.org','Elizabeth','Santiago','Santiago'),(3112,'scoleman@edkey.org','Shawn','Coleman','SColeman'),(2707,'bjones@edkey.org','Bob','Jones','SSLCJones'),(2903,'rtaylor@edkey.org','Ryan','Taylor','Taylor'),(3068,'svangorp@edkey.org','Stephanie','Van Gorp','VanGorp'),(299,'dawhite@edkey.org','Darrell','White','White'),(320,'jwisniewski@edkey.org','Jeff','Wisniewski','Wisniewski'),(2996,'jyoungkin@edkey.org','John','Youngkin','Youngkin'),(2505,'ezmyslinski@edkey.org','Erica','Zmyslinski','Zmyslinski');
/*!40000 ALTER TABLE `advisor_map` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2017-03-22  0:42:02
