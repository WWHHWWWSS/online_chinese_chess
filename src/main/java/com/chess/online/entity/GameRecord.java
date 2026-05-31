package com.chess.online.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class GameRecord {
    private Long id;
    private Long roomId;
    private Long redPlayerId;
    private Long blackPlayerId;
    private Integer result;
    private String moves;
    private Integer totalMoves;
    private Integer duration;
    private Integer gameType;
    private String aiDifficulty;
    private LocalDateTime createTime;

    private String redPlayerName;
    private String blackPlayerName;
}
