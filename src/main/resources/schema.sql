CREATE TABLE IF NOT EXISTS `user` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `password` VARCHAR(100) NOT NULL,
    `nickname` VARCHAR(50) DEFAULT '',
    `avatar` VARCHAR(255) DEFAULT '',
    `win_count` INT DEFAULT 0,
    `lose_count` INT DEFAULT 0,
    `draw_count` INT DEFAULT 0,
    `online` TINYINT DEFAULT 0,
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `room` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `room_name` VARCHAR(100) NOT NULL,
    `red_player_id` BIGINT DEFAULT NULL,
    `black_player_id` BIGINT DEFAULT NULL,
    `status` TINYINT DEFAULT 0 COMMENT '0:waiting 1:playing 2:finished',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `game_record` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `room_id` BIGINT DEFAULT NULL,
    `red_player_id` BIGINT DEFAULT NULL,
    `black_player_id` BIGINT DEFAULT NULL,
    `result` TINYINT COMMENT '0:red_win 1:black_win 2:draw',
    `moves` TEXT COMMENT 'JSON array of moves',
    `total_moves` INT DEFAULT 0,
    `duration` INT DEFAULT 0 COMMENT 'seconds',
    `game_type` TINYINT DEFAULT 0 COMMENT '0:online 1:ai',
    `ai_difficulty` VARCHAR(20) DEFAULT NULL COMMENT 'beginner/master',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
