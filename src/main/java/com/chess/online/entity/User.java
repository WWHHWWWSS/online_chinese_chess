package com.chess.online.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class User {
    private Long id;
    private String username;
    private String password;
    private String nickname;
    private String avatar;
    private Integer winCount;
    private Integer loseCount;
    private Integer drawCount;
    private Integer online;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}
