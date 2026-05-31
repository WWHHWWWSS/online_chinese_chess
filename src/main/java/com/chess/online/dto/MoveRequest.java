package com.chess.online.dto;

import lombok.Data;

@Data
public class MoveRequest {
    private Long roomId;
    private Integer fromX;
    private Integer fromY;
    private Integer toX;
    private Integer toY;
    private String piece;
    private Integer moveIndex;
}
