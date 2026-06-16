package com.chess.online.websocket;

import com.chess.online.entity.Room;
import com.chess.online.service.RoomService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
@RequiredArgsConstructor
public class GameWebSocketHandler extends TextWebSocketHandler {

    private static final ObjectMapper objectMapper = new ObjectMapper();
    private final RoomService roomService;

    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    private final Map<Long, String> userSessionMap = new ConcurrentHashMap<>();
    private final Map<Long, RoomGame> roomGameMap = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        sessions.put(session.getId(), session);
        log.info("WebSocket connected: {}", session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        JsonNode json = objectMapper.readTree(payload);
        String type = json.get("type").asText();

        switch (type) {
            case "auth":
                handleAuth(session, json);
                break;
            case "move":
                handleMove(session, json);
                break;
            case "chat":
                handleChat(session, json);
                break;
            case "ready":
                handleReady(session, json);
                break;
            case "surrender":
                handleSurrender(session, json);
                break;
            case "draw_request":
                handleDrawRequest(session, json);
                break;
            case "draw_response":
                handleDrawResponse(session, json);
                break;
            case "leave":
                handleLeave(session, json);
                break;
            case "switch_side":
                handleSwitchSide(session, json);
                break;
            default:
                log.warn("Unknown message type: {}", type);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        sessions.remove(session.getId());

        for (Map.Entry<Long, String> entry : userSessionMap.entrySet()) {
            if (entry.getValue().equals(session.getId())) {
                Long userId = entry.getKey();
                userSessionMap.remove(userId);

                for (Map.Entry<Long, RoomGame> roomEntry : roomGameMap.entrySet()) {
                    RoomGame game = roomEntry.getValue();
                    if (userId.equals(game.getRedUserId()) || userId.equals(game.getBlackUserId())) {
                        Long roomId = roomEntry.getKey();

                        if (userId.equals(game.getRedUserId())) {
                            ObjectNode msg = objectMapper.createObjectNode();
                            msg.put("type", "host_left");
                            msg.put("userId", userId);
                            broadcastToRoom(roomId, msg.toString(), userId);

                            roomGameMap.remove(roomId);
                            roomService.resetRoomToWaiting(roomId);
                        } else {
                            ObjectNode msg = objectMapper.createObjectNode();
                            msg.put("type", "opponent_disconnected");
                            msg.put("userId", userId);
                            broadcastToRoom(roomId, msg.toString(), userId);
                            roomService.resetRoomToWaiting(roomId);
                        }
                    }
                }
                break;
            }
        }

        log.info("WebSocket disconnected: {}, status: {}", session.getId(), status);
    }

    private void handleAuth(WebSocketSession session, JsonNode json) throws IOException {
        Long userId = json.get("userId").asLong();
        Long roomId = json.has("roomId") ? json.get("roomId").asLong() : null;

        userSessionMap.put(userId, session.getId());

        if (roomId != null) {
            RoomGame game = roomGameMap.computeIfAbsent(roomId, k -> new RoomGame());
            game.setRoomId(roomId);

            if (game.getRedUserId() == null) {
                game.setRedUserId(userId);
            } else if (game.getBlackUserId() == null && !userId.equals(game.getRedUserId())) {
                game.setBlackUserId(userId);
            }

            ObjectNode msg = objectMapper.createObjectNode();
            msg.put("type", "auth_success");
            msg.put("userId", userId);
            msg.put("roomId", roomId);
            sendMessage(session, msg.toString());

            ObjectNode notifyMsg = objectMapper.createObjectNode();
            notifyMsg.put("type", "player_joined");
            notifyMsg.put("userId", userId);
            broadcastToRoom(roomId, notifyMsg.toString(), null);

            if (game.getRedUserId() != null && game.getBlackUserId() != null) {
                Room room = roomService.getRoom(roomId);
                ObjectNode bothMsg = objectMapper.createObjectNode();
                bothMsg.put("type", "both_joined");
                bothMsg.put("redUserId", game.getRedUserId());
                bothMsg.put("blackUserId", game.getBlackUserId());
                if (room != null) {
                    bothMsg.put("redPlayerName", room.getRedPlayerName() != null ? room.getRedPlayerName() : "");
                    bothMsg.put("blackPlayerName", room.getBlackPlayerName() != null ? room.getBlackPlayerName() : "");
                }
                broadcastToRoom(roomId, bothMsg.toString(), null);
            }
        }
    }

    private void handleMove(WebSocketSession session, JsonNode json) throws IOException {
        Long roomId = json.get("roomId").asLong();
        Long userId = json.get("userId").asLong();
        int fromX = json.get("fromX").asInt();
        int fromY = json.get("fromY").asInt();
        int toX = json.get("toX").asInt();
        int toY = json.get("toY").asInt();
        String piece = json.get("piece").asText();
        int moveIndex = json.get("moveIndex").asInt();

        RoomGame game = roomGameMap.get(roomId);
        if (game != null) {
            game.addMove(fromX, fromY, toX, toY, piece, moveIndex);
        }

        ObjectNode msg = objectMapper.createObjectNode();
        msg.put("type", "move");
        msg.put("userId", userId);
        msg.put("fromX", fromX);
        msg.put("fromY", fromY);
        msg.put("toX", toX);
        msg.put("toY", toY);
        msg.put("piece", piece);
        msg.put("moveIndex", moveIndex);
        broadcastToRoom(roomId, msg.toString(), userId);
    }

    private void handleChat(WebSocketSession session, JsonNode json) throws IOException {
        Long roomId = json.get("roomId").asLong();
        Long userId = json.get("userId").asLong();
        String content = json.get("content").asText();

        ObjectNode msg = objectMapper.createObjectNode();
        msg.put("type", "chat");
        msg.put("userId", userId);
        msg.put("content", content);
        broadcastToRoom(roomId, msg.toString(), null);
    }

    private void handleReady(WebSocketSession session, JsonNode json) throws IOException {
        Long roomId = json.get("roomId").asLong();
        Long userId = json.get("userId").asLong();

        RoomGame game = roomGameMap.get(roomId);
        if (game == null) return;

        if (userId.equals(game.getRedUserId())) {
            game.setRedReady(true);
        } else if (userId.equals(game.getBlackUserId())) {
            game.setBlackReady(true);
        }

        ObjectNode readyMsg = objectMapper.createObjectNode();
        readyMsg.put("type", "player_ready");
        readyMsg.put("userId", userId);
        broadcastToRoom(roomId, readyMsg.toString(), null);

        if (game.isRedReady() && game.isBlackReady()) {
            game.setRedReady(false);
            game.setBlackReady(false);

            ObjectNode startMsg = objectMapper.createObjectNode();
            startMsg.put("type", "game_start");
            startMsg.put("redUserId", game.getRedUserId());
            startMsg.put("blackUserId", game.getBlackUserId());
            broadcastToRoom(roomId, startMsg.toString(), null);
        }
    }

    private void handleSurrender(WebSocketSession session, JsonNode json) throws IOException {
        Long roomId = json.get("roomId").asLong();
        Long userId = json.get("userId").asLong();

        RoomGame game = roomGameMap.get(roomId);
        int result = 2;
        if (game != null) {
            if (userId.equals(game.getRedUserId())) {
                result = 1;
            } else {
                result = 0;
            }
        }

        ObjectNode msg = objectMapper.createObjectNode();
        msg.put("type", "game_over");
        msg.put("reason", "surrender");
        msg.put("loserId", userId);
        msg.put("result", result);
        broadcastToRoom(roomId, msg.toString(), null);

        if (game != null) {
            roomGameMap.remove(roomId);
        }
    }

    private void handleDrawRequest(WebSocketSession session, JsonNode json) throws IOException {
        Long roomId = json.get("roomId").asLong();
        Long userId = json.get("userId").asLong();

        ObjectNode msg = objectMapper.createObjectNode();
        msg.put("type", "draw_request");
        msg.put("userId", userId);
        broadcastToRoom(roomId, msg.toString(), userId);
    }

    private void handleDrawResponse(WebSocketSession session, JsonNode json) throws IOException {
        Long roomId = json.get("roomId").asLong();
        Long userId = json.get("userId").asLong();
        boolean accepted = json.get("accepted").asBoolean();

        if (accepted) {
            ObjectNode msg = objectMapper.createObjectNode();
            msg.put("type", "game_over");
            msg.put("reason", "draw");
            msg.put("result", 2);
            broadcastToRoom(roomId, msg.toString(), null);
            roomGameMap.remove(roomId);
        } else {
            ObjectNode msg = objectMapper.createObjectNode();
            msg.put("type", "draw_rejected");
            msg.put("userId", userId);
            broadcastToRoom(roomId, msg.toString(), null);
        }
    }

    private void handleLeave(WebSocketSession session, JsonNode json) throws IOException {
        Long roomId = json.get("roomId").asLong();
        Long userId = json.get("userId").asLong();

        RoomGame game = roomGameMap.get(roomId);
        if (game == null) return;

        if (userId.equals(game.getRedUserId())) {
            ObjectNode msg = objectMapper.createObjectNode();
            msg.put("type", "host_left");
            msg.put("userId", userId);
            broadcastToRoom(roomId, msg.toString(), userId);
            roomGameMap.remove(roomId);
            roomService.resetRoomToWaiting(roomId);
        } else {
            ObjectNode msg = objectMapper.createObjectNode();
            msg.put("type", "opponent_disconnected");
            msg.put("userId", userId);
            broadcastToRoom(roomId, msg.toString(), userId);
            roomService.resetRoomToWaiting(roomId);
        }
    }

    private void handleSwitchSide(WebSocketSession session, JsonNode json) throws IOException {
        Long roomId = json.get("roomId").asLong();

        RoomGame game = roomGameMap.get(roomId);
        if (game == null) return;

        if (game.getRedUserId() == null || game.getBlackUserId() == null) return;

        Long oldRed = game.getRedUserId();
        Long oldBlack = game.getBlackUserId();
        game.setRedUserId(oldBlack);
        game.setBlackUserId(oldRed);
        game.setRedReady(false);
        game.setBlackReady(false);

        try {
            roomService.swapPlayers(roomId);
        } catch (Exception e) {
            game.setRedUserId(oldRed);
            game.setBlackUserId(oldBlack);
            log.error("Swap players failed: {}", e.getMessage());
            return;
        }

        Room room = roomService.getRoom(roomId);
        ObjectNode msg = objectMapper.createObjectNode();
        msg.put("type", "side_changed");
        msg.put("redUserId", game.getRedUserId());
        msg.put("blackUserId", game.getBlackUserId());
        if (room != null) {
            msg.put("redPlayerName", room.getRedPlayerName() != null ? room.getRedPlayerName() : "");
            msg.put("blackPlayerName", room.getBlackPlayerName() != null ? room.getBlackPlayerName() : "");
        }
        broadcastToRoom(roomId, msg.toString(), null);
    }

    private void broadcastToRoom(Long roomId, String message, Long excludeUserId) throws IOException {
        RoomGame game = roomGameMap.get(roomId);
        if (game == null) return;

        if (game.getRedUserId() != null && !game.getRedUserId().equals(excludeUserId)) {
            String sessionId = userSessionMap.get(game.getRedUserId());
            if (sessionId != null) {
                WebSocketSession s = sessions.get(sessionId);
                if (s != null && s.isOpen()) {
                    s.sendMessage(new TextMessage(message));
                }
            }
        }

        if (game.getBlackUserId() != null && !game.getBlackUserId().equals(excludeUserId)) {
            String sessionId = userSessionMap.get(game.getBlackUserId());
            if (sessionId != null) {
                WebSocketSession s = sessions.get(sessionId);
                if (s != null && s.isOpen()) {
                    s.sendMessage(new TextMessage(message));
                }
            }
        }
    }

    private void sendMessage(WebSocketSession session, String message) throws IOException {
        if (session.isOpen()) {
            session.sendMessage(new TextMessage(message));
        }
    }
}
