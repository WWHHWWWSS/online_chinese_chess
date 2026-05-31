package com.chess.online.controller;

import com.chess.online.service.PikafishService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AIController {

    private static final Logger log = LoggerFactory.getLogger(AIController.class);

    @Autowired
    private PikafishService pikafishService;

    @PostMapping("/move")
    public ResponseEntity<Map<String, Object>> getMove(@RequestBody Map<String, Object> request) {
        Map<String, Object> result = new HashMap<>();

        String fen = (String) request.get("fen");
        Integer depth = (Integer) request.get("depth");

        if (fen == null || fen.isEmpty()) {
            result.put("code", 400);
            result.put("message", "FEN is required");
            return ResponseEntity.badRequest().body(result);
        }

        if (!pikafishService.isAvailable()) {
            result.put("code", 503);
            result.put("message", "Pikafish engine is not available");
            return ResponseEntity.status(503).body(result);
        }

        try {
            String bestMove = pikafishService.getBestMove(fen, depth != null ? depth : 0);

            if (bestMove == null || bestMove.equals("(none)")) {
                result.put("code", 404);
                result.put("message", "No valid move found");
                return ResponseEntity.ok(result);
            }

            result.put("code", 200);
            result.put("bestMove", bestMove);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error in AI move calculation: {}", e.getMessage());
            result.put("code", 500);
            result.put("message", "Internal error: " + e.getMessage());
            return ResponseEntity.status(500).body(result);
        }
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("pikafishAvailable", pikafishService.isAvailable());
        return ResponseEntity.ok(result);
    }
}
