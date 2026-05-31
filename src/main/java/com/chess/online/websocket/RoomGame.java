package com.chess.online.websocket;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class RoomGame {
    private Long roomId;
    private Long redUserId;
    private Long blackUserId;
    private boolean redReady;
    private boolean blackReady;
    private List<MoveData> moves = new ArrayList<>();
    private long startTime = System.currentTimeMillis();

    public void addMove(int fromX, int fromY, int toX, int toY, String piece, int moveIndex) {
        moves.add(new MoveData(fromX, fromY, toX, toY, piece, moveIndex));
    }

    public int getMoveCount() {
        return moves.size();
    }

    public int getDurationSeconds() {
        return (int) ((System.currentTimeMillis() - startTime) / 1000);
    }

    @Data
    public static class MoveData {
        private int fromX;
        private int fromY;
        private int toX;
        private int toY;
        private String piece;
        private int moveIndex;

        public MoveData(int fromX, int fromY, int toX, int toY, String piece, int moveIndex) {
            this.fromX = fromX;
            this.fromY = fromY;
            this.toX = toX;
            this.toY = toY;
            this.piece = piece;
            this.moveIndex = moveIndex;
        }
    }
}
