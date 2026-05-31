package com.chess.online.controller;

import com.chess.online.common.Result;
import com.chess.online.entity.GameRecord;
import com.chess.online.entity.Room;
import com.chess.online.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpSession;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/room")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;

    @GetMapping("/list")
    public Result<List<Room>> listRooms() {
        return Result.success(roomService.getAllRooms());
    }

    @GetMapping("/waiting")
    public Result<List<Room>> waitingRooms() {
        return Result.success(roomService.getWaitingRooms());
    }

    @PostMapping("/create")
    public Result<Room> createRoom(@RequestBody Map<String, String> body, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return Result.error(401, "未登录");
        }
        String roomName = body.getOrDefault("roomName", "象棋房间");
        try {
            Room room = roomService.createRoom(roomName, userId);
            return Result.success(room);
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/join/{roomId}")
    public Result<Room> joinRoom(@PathVariable Long roomId, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return Result.error(401, "未登录");
        }
        try {
            Room room = roomService.joinRoom(roomId, userId);
            return Result.success(room);
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/{roomId}")
    public Result<Room> getRoom(@PathVariable Long roomId) {
        Room room = roomService.getRoom(roomId);
        if (room == null) {
            return Result.error("房间不存在");
        }
        return Result.success(room);
    }

    @PostMapping("/leave/{roomId}")
    public Result<Void> leaveRoom(@PathVariable Long roomId, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId != null) {
            roomService.leaveRoom(roomId, userId);
        }
        return Result.success();
    }

    @PostMapping("/finish")
    public Result<Void> finishGame(@RequestBody Map<String, Object> body) {
        try {
            Long roomId = Long.valueOf(body.get("roomId").toString());
            Integer result = Integer.valueOf(body.get("result").toString());
            String moves = (String) body.get("moves");
            Integer totalMoves = Integer.valueOf(body.get("totalMoves").toString());
            Integer duration = Integer.valueOf(body.get("duration").toString());
            roomService.finishGame(roomId, result, moves, totalMoves, duration);
            return Result.success();
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/records")
    public Result<List<GameRecord>> getGameRecords(@RequestParam(required = false) Long userId) {
        return Result.success(roomService.getGameRecords(userId));
    }

    @GetMapping("/record/{recordId}")
    public Result<GameRecord> getGameRecord(@PathVariable Long recordId) {
        GameRecord record = roomService.getGameRecord(recordId);
        if (record == null) {
            return Result.error("记录不存在");
        }
        return Result.success(record);
    }

    @DeleteMapping("/record/{recordId}")
    public Result<Void> deleteGameRecord(@PathVariable Long recordId, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return Result.error(401, "未登录");
        }
        roomService.deleteGameRecord(recordId);
        return Result.success();
    }

    @DeleteMapping("/records")
    public Result<Void> deleteAllGameRecords(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return Result.error(401, "未登录");
        }
        roomService.deleteAllGameRecords(userId);
        return Result.success();
    }

    @PostMapping("/ai-record")
    public Result<Void> saveAIGameRecord(@RequestBody Map<String, Object> body, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return Result.error(401, "未登录");
        }
        try {
            Integer result = Integer.valueOf(body.get("result").toString());
            String moves = (String) body.get("moves");
            Integer totalMoves = Integer.valueOf(body.get("totalMoves").toString());
            Integer duration = Integer.valueOf(body.get("duration").toString());
            String aiDifficulty = (String) body.getOrDefault("aiDifficulty", "beginner");
            String playerColor = (String) body.getOrDefault("playerColor", "red");
            roomService.saveAIGameRecord(userId, result, moves, totalMoves, duration, aiDifficulty, playerColor);
            return Result.success();
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
}
