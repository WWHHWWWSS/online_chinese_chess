package com.chess.online.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class Room {
    private Long id;
    private String roomName;
    private Long redPlayerId;
    private Long blackPlayerId;
    private Integer status;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;

    private String redPlayerName;
    private String blackPlayerName;
}
