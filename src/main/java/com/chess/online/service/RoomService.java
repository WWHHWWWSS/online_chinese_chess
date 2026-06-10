package com.chess.online.service;

import com.chess.online.entity.GameRecord;
import com.chess.online.entity.Room;
import com.chess.online.mapper.GameRecordMapper;
import com.chess.online.mapper.RoomMapper;
import com.chess.online.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomMapper roomMapper;
    private final GameRecordMapper gameRecordMapper;
    private final UserMapper userMapper;

    public List<Room> getAllRooms() {
        return roomMapper.findAll();
    }

    public List<Room> getWaitingRooms() {
        return roomMapper.findByStatus(0);
    }

    public Room createRoom(String roomName, Long redPlayerId) {
        Room room = new Room();
        room.setRoomName(roomName);
        room.setRedPlayerId(redPlayerId);
        room.setStatus(0);
        roomMapper.insert(room);
        return roomMapper.findById(room.getId());
    }

    public Room joinRoom(Long roomId, Long blackPlayerId) {
        Room room = roomMapper.findById(roomId);
        if (room == null) {
            throw new RuntimeException("房间不存在");
        }
        if (room.getStatus() != 0) {
            throw new RuntimeException("房间已满或正在游戏中");
        }
        if (room.getRedPlayerId().equals(blackPlayerId)) {
            throw new RuntimeException("不能加入自己创建的房间");
        }
        roomMapper.joinRoom(roomId, blackPlayerId);
        return roomMapper.findById(roomId);
    }

    public Room getRoom(Long roomId) {
        return roomMapper.findById(roomId);
    }

    public void leaveRoom(Long roomId, Long userId) {
        Room room = roomMapper.findById(roomId);
        if (room == null) return;

        if (room.getStatus() == 0) {
            roomMapper.deleteById(roomId);
        } else if (room.getStatus() == 1) {
            roomMapper.updateStatus(roomId, 2);
        }
    }

    public void finishGame(Long roomId, Integer result, String moves, Integer totalMoves, Integer duration) {
        Room room = roomMapper.findById(roomId);
        if (room == null) return;

        GameRecord record = new GameRecord();
        record.setRoomId(roomId);
        record.setRedPlayerId(room.getRedPlayerId());
        record.setBlackPlayerId(room.getBlackPlayerId());
        record.setResult(result);
        record.setMoves(moves);
        record.setTotalMoves(totalMoves);
        record.setDuration(duration);
        record.setGameType(0);
        gameRecordMapper.insert(record);

        if (result == 0) {
            userMapper.incrementWin(room.getRedPlayerId());
            userMapper.incrementLose(room.getBlackPlayerId());
        } else if (result == 1) {
            userMapper.incrementWin(room.getBlackPlayerId());
            userMapper.incrementLose(room.getRedPlayerId());
        } else {
            userMapper.incrementDraw(room.getRedPlayerId());
            userMapper.incrementDraw(room.getBlackPlayerId());
        }

        roomMapper.deleteById(roomId);
    }

    public List<GameRecord> getGameRecords(Long userId) {
        if (userId != null) {
            return gameRecordMapper.findByUserId(userId);
        }
        return gameRecordMapper.findAll();
    }

    public GameRecord getGameRecord(Long recordId) {
        return gameRecordMapper.findById(recordId);
    }

    public void deleteGameRecord(Long recordId) {
        gameRecordMapper.deleteById(recordId);
    }

    public void deleteAllGameRecords(Long userId) {
        if (userId != null) {
            gameRecordMapper.deleteByUserId(userId);
        } else {
            gameRecordMapper.deleteAll();
        }
    }

    public void saveAIGameRecord(Long playerId, Integer result, String moves, Integer totalMoves, Integer duration, String aiDifficulty, String playerColor) {
        GameRecord record = new GameRecord();
        record.setGameType(1);
        record.setResult(result);
        record.setMoves(moves);
        record.setTotalMoves(totalMoves);
        record.setDuration(duration);
        record.setAiDifficulty(aiDifficulty);

        if ("red".equals(playerColor)) {
            record.setRedPlayerId(playerId);
        } else {
            record.setBlackPlayerId(playerId);
        }

        gameRecordMapper.insert(record);

        boolean playerWon = ("red".equals(playerColor) && result == 0) || ("black".equals(playerColor) && result == 1);
        boolean playerLost = ("red".equals(playerColor) && result == 1) || ("black".equals(playerColor) && result == 0);

        if (playerWon) {
            userMapper.incrementWin(playerId);
        } else if (playerLost) {
            userMapper.incrementLose(playerId);
        } else {
            userMapper.incrementDraw(playerId);
        }
    }

    public Room swapPlayers(Long roomId) {
        Room room = roomMapper.findById(roomId);
        if (room == null) {
            throw new RuntimeException("房间不存在");
        }
        if (room.getRedPlayerId() == null || room.getBlackPlayerId() == null) {
            throw new RuntimeException("双方尚未就位");
        }
        if (room.getStatus() != 0 && room.getStatus() != 1) {
            throw new RuntimeException("游戏已结束");
        }
        roomMapper.swapPlayers(roomId, room.getRedPlayerId(), room.getBlackPlayerId());
        return roomMapper.findById(roomId);
    }

    public void resetRoomToWaiting(Long roomId) {
        roomMapper.resetToWaiting(roomId);
    }
}
