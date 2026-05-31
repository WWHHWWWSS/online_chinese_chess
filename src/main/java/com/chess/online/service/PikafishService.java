package com.chess.online.service;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.*;
import java.util.concurrent.*;
import java.util.concurrent.locks.ReentrantLock;

@Service
public class PikafishService {

    private static final Logger log = LoggerFactory.getLogger(PikafishService.class);

    @Value("${pikafish.path:engine/pikafish.exe}")
    private String enginePath;

    @Value("${pikafish.enabled:true}")
    private boolean enabled;

    @Value("${pikafish.depth:20}")
    private int defaultDepth;

    @Value("${pikafish.threads:1}")
    private int threads;

    private Process process;
    private BufferedWriter writer;
    private BufferedReader reader;
    private final ReentrantLock lock = new ReentrantLock();
    private boolean initialized = false;

    @PostConstruct
    public void init() {
        if (!enabled) {
            log.info("Pikafish engine is disabled");
            return;
        }

        File exe = new File(enginePath);
        if (!exe.exists()) {
            log.warn("Pikafish engine not found at: {} - 特级AI will be unavailable", exe.getAbsolutePath());
            return;
        }

        try {
            File nnueFile = new File(exe.getParent(), "pikafish.nnue");
            if (!nnueFile.exists()) {
                log.warn("Pikafish nnue file not found at: {} - 特级AI will be unavailable", nnueFile.getAbsolutePath());
                return;
            }

            ProcessBuilder pb = new ProcessBuilder(exe.getAbsolutePath());
            pb.directory(exe.getParentFile());
            pb.redirectErrorStream(true);
            process = pb.start();

            writer = new BufferedWriter(new OutputStreamWriter(process.getOutputStream()));
            reader = new BufferedReader(new InputStreamReader(process.getInputStream()));

            sendCommand("uci");
            waitForResponse("uciok", 10000);

            sendCommand("setoption name EvalFile value " + nnueFile.getAbsolutePath());
            sendCommand("setoption name Threads value " + threads);
            sendCommand("setoption name Hash value 128");
            sendCommand("isready");
            waitForResponse("readyok", 10000);

            initialized = true;
            log.info("Pikafish engine initialized successfully (depth={}, threads={}, nnue={})", defaultDepth, threads, nnueFile.getAbsolutePath());
        } catch (Exception e) {
            log.error("Failed to initialize Pikafish engine: {}", e.getMessage());
            cleanup();
        }
    }

    public boolean isAvailable() {
        return enabled && initialized;
    }

    public String getBestMove(String fen, int depth) {
        if (!isAvailable()) {
            return null;
        }

        lock.lock();
        try {
            sendCommand("ucinewgame");
            sendCommand("isready");
            waitForResponse("readyok", 5000);

            sendCommand("position fen " + fen);

            int searchDepth = depth > 0 ? depth : defaultDepth;
            sendCommand("go depth " + searchDepth);

            String bestMove = null;
            String line;
            long startTime = System.currentTimeMillis();
            long timeout = 30000;

            while ((line = reader.readLine()) != null) {
                log.debug("Pikafish output: {}", line);
                if (System.currentTimeMillis() - startTime > timeout) {
                    log.warn("Pikafish search timeout");
                    break;
                }

                if (line.startsWith("bestmove")) {
                    String[] parts = line.split("\\s+");
                    if (parts.length >= 2) {
                        bestMove = parts[1];
                    }
                    break;
                }
            }

            log.info("Pikafish bestMove result for fen={}: {}", fen, bestMove);
            return bestMove;
        } catch (Exception e) {
            log.error("Error getting best move from Pikafish: {}", e.getMessage());
            initialized = false;
            init();
            return null;
        } finally {
            lock.unlock();
        }
    }

    private void sendCommand(String command) throws IOException {
        if (writer == null) return;
        writer.write(command + "\n");
        writer.flush();
    }

    private String waitForResponse(String expected, long timeoutMs) throws IOException, TimeoutException {
        long startTime = System.currentTimeMillis();
        String line;
        while ((line = reader.readLine()) != null) {
            log.debug("Pikafish wait[{}]: {}", expected, line);
            if (line.startsWith(expected)) {
                return line;
            }
            if (System.currentTimeMillis() - startTime > timeoutMs) {
                throw new TimeoutException("Timeout waiting for: " + expected);
            }
        }
        return null;
    }

    @PreDestroy
    public void cleanup() {
        try {
            if (writer != null) {
                sendCommand("quit");
                writer.close();
            }
        } catch (Exception ignored) {
        }
        try {
            if (reader != null) reader.close();
        } catch (Exception ignored) {
        }
        try {
            if (process != null) process.destroy();
        } catch (Exception ignored) {
        }
        initialized = false;
    }
}
