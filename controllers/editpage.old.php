<?php

global $PATHS, $DB;

if(isset($_SESSION['USER']) && isset($_SESSION['USER']['LOGGED_IN']) && isset($_SESSION['USER']['ID']) && $_SESSION['USER']['ID'] > 0 && $_SESSION['USER']['LOGGED_IN']==true) {


	//$query = "SELECT FROM users JOIN user_classes ON (users.id=user_classes.userid) JOIN units ON (user_classes.courseid=units.courseid) WHERE users.id={$user_id} AND user_classes.courseid={$course_id} AND user_classes.is_teacher=1 LIMIT 1";

	$uri = strtok($_SERVER['REQUEST_URI'], '?');

	$uri = str_replace('/editpage/', '', $uri);

	$action = strtok($uri, '/');

	if($action == 'save') {
		if($_SERVER['REQUEST_METHOD'] == 'POST') {
			$json_input = file_get_contents('php://input');

                     $input = json_decode($json_input);

			$data = new \stdClass();

			$unit_id = intval($input->unit_id);
			$mysql_name = $DB->mysqli->real_escape_string($input->page_title);
			$mysql_subtitle = $DB->mysqli->real_escape_string($input->page_sub_title);
                     $mysql_content = $DB->mysqli->real_escape_string($input->page_content);

                     $mysql_layout = 'CONTENT';

			if($input->page_type == 'vocabulary') {
				$mysql_layout = 'VOCAB';	
			} else if($input->page_type == 'external_link') {
				$mysql_layout = 'EXTERNAL_LINK';
			} else if($input->page_type == 'iframed') {
                            // save content to file then change content to iframe
                     } else  if($input->page_type == 'sub_unit') {
				$mysql_layout = 'HEADER';
			}


			$mysql_page_group_id = 0;


			if(is_numeric($input->page_group_id) && $input->page_group_id > 0){
				$mysql_page_group_id = intval($input->page_group_id);
			}

			$mysql_allow_video_post = 0;
			$mysql_allow_text_post = 0;
			$mysql_allow_upload_post = 0;
			$mysql_is_private_post = 0;

			if($input->allow_video_post == 1) {
				$mysql_allow_video_post = 1;
			}

			if($input->allow_text_post == 1) {
				$mysql_allow_text_post = 1;
			}

			if($mysql_allow_video_post == 0 && $input->allow_upload_post == 1) {
				$mysql_allow_upload_post = 1;
			}

			if($input->is_private_post == 1) {
				$mysql_is_private_post = 1;
			}
			
			if(strlen($mysql_name) > 0) {
				$position = 0;

				if($mysql_page_group_id > 0) {
					$query = "SELECT max(position) as 'max_position' FROM pages WHERE unitid={$unit_id} AND (pagegroupid={$mysql_page_group_id} OR id={$mysql_page_group_id})";

					$result = $DB->mysqli->query($query);

					if($result && $result->num_rows == 1) {
						$row = $result->fetch_object();

						$position = $row->max_position + 1;

						$query = "UPDATE pages SET position=position+1 WHERE unitid={$unit_id} AND position>={$position}";

						$DB->mysqli->query($query);

						$query = "INSERT INTO pages(unitid, name, subtitle, pagegroupid, content, layout, allow_video_post, allow_text_post, allow_upload_post, is_private, position) VALUES('{$unit_id}', '{$mysql_name}', '{$mysql_subtitle}', '{$mysql_page_group_id}', '{$mysql_content}', '{$mysql_layout}', '{$mysql_allow_video_post}', '{$mysql_allow_text_post}', '{$mysql_allow_upload_post}', '{$mysql_is_private_post}', '{$position}')";

						$DB->mysqli->query($query);	

						$data->message = 'successful';
	                     		$data->query = $query;
					} else {
						$data->message = 'Error: The group ID Does not exist in this Unit';
					}
				} else {
					$query = "SELECT max(position) as 'max_position' FROM pages WHERE unitid={$unit_id}";

					$result = $DB->mysqli->query($query);

					if($result && $result->num_rows == 1) {
						$row = $result->fetch_object();

						$position = $row->max_position + 1;
					}

					$query = "INSERT INTO pages(unitid, name, subtitle, pagegroupid, content, layout, allow_video_post, allow_text_post, allow_upload_post, is_private, position) VALUES('{$unit_id}', '{$mysql_name}', '{$mysql_subtitle}', '{$mysql_page_group_id}', '{$mysql_content}', '{$mysql_layout}', '{$mysql_allow_video_post}', '{$mysql_allow_text_post}', '{$mysql_allow_upload_post}', '{$mysql_is_private_post}', '{$position}')";

					$DB->mysqli->query($query);	

					$data->message = 'successful';
	                     	$data->query = $query;
				}
			} else {
				$data->message = 'Page Name Cannot Be Empty';
			}

			header('Content-Type: application/json');
			print json_encode($data);
			exit();
		}			
	} else if($action == 'update') {
		if($_SERVER['REQUEST_METHOD'] == 'POST') {
			$data = new \stdClass();

			$json_input = file_get_contents('php://input');

                     $input = json_decode($json_input);

			$page_id = intval($input->page_id);
			$mysql_name = $DB->mysqli->real_escape_string($input->page_title);
			$mysql_subtitle = $DB->mysqli->real_escape_string($input->page_sub_title);
                     $mysql_content = $DB->mysqli->real_escape_string($input->page_content);


			$mysql_page_group_id = 0;

			if(is_numeric($input->page_group_id) && $input->page_group_id > 0){
				$mysql_page_group_id = intval($input->page_group_id);
			}

                     
			$mysql_allow_video_post = 0;
			$mysql_allow_text_post = 0;
			$mysql_allow_upload_post = 0;
			$mysql_is_private_post = 0;

			if($input->allow_video_post == 1) {
				$mysql_allow_video_post = 1;
			}

			if($input->allow_text_post == 1) {
				$mysql_allow_text_post = 1;
			}

			if($mysql_allow_video_post == 0 && $input->allow_upload_post == 1) {
				$mysql_allow_upload_post = 1;
			}

			if($input->is_private_post == 1) {
				$mysql_is_private_post = 1;
			}
			
			if(strlen($mysql_name) > 0) {
				$query = "SELECT unitid, pagegroupid, position FROM pages WHERE id={$page_id} LIMIT 1";

				$result = $DB->mysqli->query($query);

				if($result && $result->num_rows==1) {
					$row = $result->fetch_object();

					$unit_id = $row->unitid;
					$old_pagegroupid = $row->pagegroupid;
					$current_position = $row->position;

					if($old_pagegroupid == $mysql_page_group_id) {
						$query = "UPDATE pages SET name='{$mysql_name}', subtitle='{$mysql_subtitle}', pagegroupid='{$mysql_page_group_id}', content='{$mysql_content}', allow_video_post={$mysql_allow_video_post}, allow_text_post={$mysql_allow_text_post}, allow_upload_post={$mysql_allow_upload_post}, is_private={$mysql_is_private_post} WHERE id={$page_id}";
	
						$DB->mysqli->query($query);	
		
						$data->message = 'successful';
	              		       $data->query = $query;
					} else if($mysql_page_group_id == 0) {
						$query = "UPDATE pages SET position=0 WHERE id={$page_id}";
					
						$DB->mysqli->query($query);



						$query = "UPDATE pages SET position=position-1 WHERE unitid={$unit_id} AND position>{$current_position}";

						$DB->mysqli->query($query);



						$query = "SELECT max(position) as 'max_position' FROM pages WHERE unitid={$unit_id} AND (pagegroupid={$old_pagegroupid} OR id={$old_pagegroupid})";

						$result = $DB->mysqli->query($query);

						if($result && $result->num_rows == 1) {
							$row = $result->fetch_object();

							$position = $row->max_position + 1;

							$query = "UPDATE pages SET position=position+1 WHERE unitid={$unit_id} AND position>={$position}";

							$DB->mysqli->query($query);

							$query = "UPDATE pages SET name='{$mysql_name}', subtitle='{$mysql_subtitle}', pagegroupid='{$mysql_page_group_id}', content='{$mysql_content}', position={$position}, allow_video_post={$mysql_allow_video_post}, allow_text_post={$mysql_allow_text_post}, allow_upload_post={$mysql_allow_upload_post}, is_private={$mysql_is_private_post} WHERE id={$page_id}";
	
							$DB->mysqli->query($query);	
		
							$data->message = 'successful';
	              		       	$data->query = $query;
						} else {
							$data->message = $query;
						}
                                   } else {
						$query = "UPDATE pages SET position=0 WHERE id={$page_id}";
					
						$DB->mysqli->query($query);



						$query = "UPDATE pages SET position=position-1 WHERE unitid={$unit_id} AND position>{$current_position}";

						$DB->mysqli->query($query);



						$query = "SELECT max(position) as 'max_position' FROM pages WHERE unitid={$unit_id} AND (pagegroupid={$mysql_page_group_id} OR id={$mysql_page_group_id})";

						$result = $DB->mysqli->query($query);

						if($result && $result->num_rows == 1) {
							$row = $result->fetch_object();

							$position = $row->max_position + 1;

							$query = "UPDATE pages SET position=position+1 WHERE unitid={$unit_id} AND position>={$position}";

							$DB->mysqli->query($query);

							$query = "UPDATE pages SET name='{$mysql_name}', subtitle='{$mysql_subtitle}', pagegroupid='{$mysql_page_group_id}', content='{$mysql_content}', position={$position}, allow_video_post={$mysql_allow_video_post}, allow_text_post={$mysql_allow_text_post}, allow_upload_post={$mysql_allow_upload_post}, is_private={$mysql_is_private_post} WHERE id={$page_id}";
	
							$DB->mysqli->query($query);	
		
							$data->message = 'successful';
	              		       	$data->query = $query;
						} else {
							$data->message = $query;
						}
                                   }
				} else {
					$data->message = "Error page id not valid.";
				}

			} else {
				$data->message = 'Page Name Cannot Be Empty';
			}

			header('Content-Type: application/json');
			print json_encode($data);
			exit();
		}
	} else if($action == 'delete') {
	} else if($action == 'movedown') {
       	if($_SERVER['REQUEST_METHOD'] == 'POST') {
			$data = new \stdClass();

			$json_input = file_get_contents('php://input');

                     $input = json_decode($json_input);

			$page_id = intval($input->page_id);

			$data = new \stdClass();

			$query = "SELECT unitid, pagegroupid, position, layout FROM pages WHERE id={$page_id} LIMIT 1";

			$result = $DB->mysqli->query($query);

			if($result && $result->num_rows == 1) {
				$row = $result->fetch_object();

				$position = $row->position;
				$unitid = $row->unitid;
				$page_group_id = $row->pagegroupid;
				$layout = $row->layout;
				
				if($layout == 'HEADER') {
					$target_ids = array();

					$target_ids[] = $page_id;

					$query = "SELECT id FROM pages WHERE unitid={$unitid} AND pagegroupid={$page_id}";

					$result = $DB->mysqli->query($query);

					if($result && $result->num_rows > 0) {
						while($row = $result->fetch_object()) {
							$target_ids[] = $row->id;
						}
					}

					$mysql_target_ids = '(' . implode(',', $target_ids) . ')';

					

					$target_length = count($target_ids);

					$query = "SELECT id, layout FROM pages WHERE unitid={$unitid} AND position={$position} + {$target_length}";

					$result = $DB->mysqli->query($query);

					if($result && $result->num_rows == 1) {
						$row =  $result->fetch_object();

						if($row->layout == 'HEADER') {
							$destination_ids = array();

							$destination_ids[] = $row->id;

							$query = "SELECT id FROM pages WHERE unitid={$unitid} AND pagegroupid={$row->id}";

							$result = $DB->mysqli->query($query);

							if($result && $result->num_rows > 0) {
								while($row = $result->fetch_object()) {
									$destination_ids[] = $row->id;
								}
							}

							$mysql_destination_ids = '(' . implode(',', $destination_ids) . ')';

							$destination_length = count($destination_ids);

							
							$query = "UPDATE pages SET position = position-{$target_length} WHERE unitid={$unitid} AND id IN $mysql_destination_ids";

							$data->query1 = $query;
	
							$DB->mysqli->query($query);


							$query = "UPDATE pages SET position = position+{$destination_length} WHERE id IN $mysql_target_ids";
	
							$DB->mysqli->query($query);

							$data->query2 = $query;

							
						} else {
							$query = "UPDATE pages SET position = position-{$target_length} WHERE unitid={$unitid} AND position={$position}+{$target_length}";

							$data->query1 = $query;
	
							$DB->mysqli->query($query);


							$query = "UPDATE pages SET position = position+1 WHERE id IN $mysql_target_ids";
	
							$DB->mysqli->query($query);

							$data->query2 = $query;
						}
					}
				} else if($page_group_id > 0) {
					$query = "SELECT max(position) as 'max_position' FROM pages WHERE unitid={$unitid} AND pagegroupid={$page_group_id}";

					$result = $DB->mysqli->query($query);

					if($result && $result->num_rows == 1) {
						$row = $result->fetch_object();

						if($position < $row->max_position) {
							$query = "UPDATE pages SET position = position-1 WHERE unitid={$unitid} AND position={$position}+1";

							$data->query1 = $query;
	
							$DB->mysqli->query($query);


							$query = "UPDATE pages SET position = position+1 WHERE id={$page_id}";
	
							$DB->mysqli->query($query);

							$data->query2 = $query;
						}
					}
				} else {
					$query = "SELECT max(position) as 'max_position' FROM pages WHERE unitid={$unitid}";

					$result = $DB->mysqli->query($query);

					if($result && $result->num_rows == 1) {
						$row = $result->fetch_object();

						if($position < $row->max_position) {
							//begin paste	
							$mysql_target_ids = '(' . $page_id . ')';

							$target_length = 1;

							$query = "SELECT id, layout FROM pages WHERE unitid={$unitid} AND position={$position} + {$target_length}";

							$result = $DB->mysqli->query($query);

							if($result && $result->num_rows == 1) {
								$row =  $result->fetch_object();

								if($row->layout == 'HEADER') {
									$destination_ids = array();

									$destination_ids[] = $row->id;

									$query = "SELECT id FROM pages WHERE unitid={$unitid} AND pagegroupid={$row->id}";

									$result = $DB->mysqli->query($query);

									if($result && $result->num_rows > 0) {
										while($row = $result->fetch_object()) {
											$destination_ids[] = $row->id;
										}
									}

									$mysql_destination_ids = '(' . implode(',', $destination_ids) . ')';

									$destination_length = count($destination_ids);

							
									$query = "UPDATE pages SET position = position-{$target_length} WHERE unitid={$unitid} AND id IN $mysql_destination_ids";

									$data->query1 = $query;
	
									$DB->mysqli->query($query);
		

									$query = "UPDATE pages SET position = position+{$destination_length} WHERE id IN $mysql_target_ids";
	
									$DB->mysqli->query($query);
		
									$data->query2 = $query;

							
								} else {
									$query = "UPDATE pages SET position = position-{$target_length} WHERE unitid={$unitid} AND position={$position}+{$target_length}";

									$data->query1 = $query;
	
									$DB->mysqli->query($query);


									$query = "UPDATE pages SET position = position+1 WHERE id IN $mysql_target_ids";
	
									$DB->mysqli->query($query);

									$data->query2 = $query;
								}
							}



							//end paste
						}
					}
				}
			}



			$data->message = 'up: ' . $page_id;
                     
			header('Content-Type: application/json');
			print json_encode($data);
			exit();
		}
       } else if($action == 'moveup') {
       	if($_SERVER['REQUEST_METHOD'] == 'POST') {
			$data = new \stdClass();

			$json_input = file_get_contents('php://input');

                     $input = json_decode($json_input);

			$page_id = intval($input->page_id);

			$query = "SELECT unitid, pagegroupid, position, layout FROM pages WHERE id={$page_id} LIMIT 1";

			$result = $DB->mysqli->query($query);

			if($result && $result->num_rows == 1) {
				$row = $result->fetch_object();

                            $position = $row->position;
				$unitid = $row->unitid;
				$page_group_id = $row->pagegroupid;
				$layout = $row->layout;
				
				if($layout == 'HEADER') {
					$target_ids = array();

					$target_ids[] = $page_id;

					$query = "SELECT id FROM pages WHERE unitid={$unitid} AND pagegroupid={$page_id}";

					$result = $DB->mysqli->query($query);

					if($result && $result->num_rows > 0) {
						while($row = $result->fetch_object()) {
							$target_ids[] = $row->id;
						}
					}

					$mysql_target_ids = '(' . implode(',', $target_ids) . ')';

					

					$target_length = count($target_ids);

					$query = "SELECT id, pagegroupid, layout FROM pages WHERE unitid={$unitid} AND position={$position} - 1";

					$result = $DB->mysqli->query($query);

					if($result && $result->num_rows == 1) {
						$row =  $result->fetch_object();

						if($row->layout == 'HEADER' || $row->pagegroupid > 0) {
							$destination_ids = array();

							if($row->layout == 'HEADER') {
								$destination_ids[] = $row->id;

								$query = "SELECT id FROM pages WHERE unitid={$unitid} AND pagegroupid={$row->id}";

								$result = $DB->mysqli->query($query);

								if($result && $result->num_rows > 0) {
									while($row = $result->fetch_object()) {
										$destination_ids[] = $row->id;
									}
								}
							} else {
								$destination_ids[] = $row->pagegroupid;

								$query = "SELECT id FROM pages WHERE unitid={$unitid} AND pagegroupid={$row->pagegroupid}";

								$result = $DB->mysqli->query($query);

								if($result && $result->num_rows > 0) {
									while($row = $result->fetch_object()) {
										$destination_ids[] = $row->id;
									}
								}
							}

							$mysql_destination_ids = '(' . implode(',', $destination_ids) . ')';

							$destination_length = count($destination_ids);

							
							$query = "UPDATE pages SET position = position+{$target_length} WHERE unitid={$unitid} AND id IN $mysql_destination_ids";

							$data->query1 = $query;
	
							$DB->mysqli->query($query);


							$query = "UPDATE pages SET position = position-{$destination_length} WHERE id IN $mysql_target_ids";
	
							$DB->mysqli->query($query);

							$data->query2 = $query;

							
						} else {
							$query = "UPDATE pages SET position = position+{$target_length} WHERE unitid={$unitid} AND position={$position}-1";

							$data->query1 = $query;
	
							$DB->mysqli->query($query);


							$query = "UPDATE pages SET position = position-1 WHERE id IN $mysql_target_ids";
	
							$DB->mysqli->query($query);

							$data->query2 = $query;
						}
					}
				} else if($page_group_id > 0) {
					$query = "SELECT position as 'min_position' FROM pages WHERE unitid={$row->unitid} AND id={$page_group_id}";

					$result = $DB->mysqli->query($query);

					if($result && $result->num_rows == 1) {
						$row = $result->fetch_object();

						$min_position = $row->min_position + 1;

						if($position > $min_position) {
							$query = "UPDATE pages SET position = position+1 WHERE unitid={$unitid} AND position={$position}-1";

							$DB->mysqli->query($query);

							$data->query1 = $query;
	
							$query = "UPDATE pages SET position = position-1 WHERE id={$page_id}";

							$DB->mysqli->query($query);

							$data->query2 = $query;
						}
					}
				} else {
					if($position > 0) {
						//begin paste


						$mysql_target_ids = '(' .  $page_id . ')';

					

						$target_length = 1;

						$query = "SELECT id, pagegroupid, layout FROM pages WHERE unitid={$unitid} AND position={$position} - 1";

						$result = $DB->mysqli->query($query);

						if($result && $result->num_rows == 1) {
							$row =  $result->fetch_object();

							if($row->layout == 'HEADER' || $row->pagegroupid > 0) {
								$destination_ids = array();

								if($row->layout == 'HEADER') {
									$destination_ids[] = $row->id;

									$query = "SELECT id FROM pages WHERE unitid={$unitid} AND pagegroupid={$row->id}";

									$result = $DB->mysqli->query($query);

									if($result && $result->num_rows > 0) {
										while($row = $result->fetch_object()) {
											$destination_ids[] = $row->id;
										}
									}
								} else {
									$destination_ids[] = $row->pagegroupid;

									$query = "SELECT id FROM pages WHERE unitid={$unitid} AND pagegroupid={$row->pagegroupid}";

									$result = $DB->mysqli->query($query);

									if($result && $result->num_rows > 0) {
										while($row = $result->fetch_object()) {
											$destination_ids[] = $row->id;
										}
									}
								}

								$mysql_destination_ids = '(' . implode(',', $destination_ids) . ')';

								$destination_length = count($destination_ids);	

							
								$query = "UPDATE pages SET position = position+{$target_length} WHERE unitid={$unitid} AND id IN $mysql_destination_ids";

								$data->query1 = $query;
	
								$DB->mysqli->query($query);


								$query = "UPDATE pages SET position = position-{$destination_length} WHERE id IN $mysql_target_ids";
	
								$DB->mysqli->query($query);

								$data->query2 = $query;

							
							} else {
								$query = "UPDATE pages SET position = position+{$target_length} WHERE unitid={$unitid} AND position={$position}-1";

								$data->query1 = $query;
	
								$DB->mysqli->query($query);


								$query = "UPDATE pages SET position = position-1 WHERE id IN $mysql_target_ids";
	
								$DB->mysqli->query($query);

								$data->query2 = $query;
							}
						}

						//end paste
					}
				}
			}



			$data->message = 'down: ' . $page_id;
                     
			header('Content-Type: application/json');
			print json_encode($data);
			exit();
		}
       } else if($action == 'getsubunits') {
       	if($_SERVER['REQUEST_METHOD'] == 'POST') {
			$data = new \stdClass();
			$data->subunits = array();

			$json_input = file_get_contents('php://input');

                     $input = json_decode($json_input);

			$unit_id = intval($input->unit_id);

			$query = "SELECT id, name FROM pages WHERE unitid={$unit_id} AND layout='HEADER'";

			$result = $DB->mysqli->query($query);

			if($result && $result->num_rows > 0) {
				while($row = $result->fetch_object()) {
					$data->subunits[] = clone $row;
				}	
			}

			header('Content-Type: application/json');
			print json_encode($data);
			exit();
		}
       } else if(is_numeric($action) && $action > 0) {
		$content_id = intval($action);
		$user_id = intval($_SESSION['USER']['ID']);


		$content_id = intval($uri);

		$query = "SELECT pages.id, pages.name, pages.subtitle, pages.content, pages.pagegroupid, pages.allow_video_post, pages.allow_text_post, pages.allow_upload_post, pages.is_private FROM `user_classes` JOIN classes ON (user_classes.classid=classes.id) JOIN units ON (classes.courseid=units.courseid) JOIN pages ON (pages.unitid=units.id) WHERE user_classes.userid={$user_id} AND pages.id={$content_id} AND pages.layout='CONTENT' LIMIT 1";
		$result = $DB->mysqli->query($query);

		if($result && $result->num_rows == 1) {
			$row = $result->fetch_object();			
		
			$data = new \stdClass();

			$data->id = $row->id;
			$data->pagename = $row->name;
			$data->subtitle = $row->subtitle;
                     $data->pagegroupid = $row->pagegroupid;
			$data->contenthtml = $row->content;
			$data->allow_video_post = $row->allow_video_post;
			$data->allow_text_post = $row->allow_text_post;
			$data->allow_upload_post = $row->allow_upload_post;
			$data->page_is_private = $row->is_private;

			header('Content-Type: application/json');

			print json_encode($data);			
		}
	}

	exit();
}

?>