package com.chess.online.controller;

import com.chess.online.common.Result;
import com.chess.online.dto.LoginRequest;
import com.chess.online.dto.RegisterRequest;
import com.chess.online.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpSession;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/login")
    public Result<Map<String, Object>> login(@RequestBody LoginRequest request, HttpSession session) {
        try {
            Map<String, Object> userInfo = userService.login(request);
            session.setAttribute("userId", userInfo.get("id"));
            session.setAttribute("username", userInfo.get("username"));
            return Result.success(userInfo);
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/register")
    public Result<Map<String, Object>> register(@RequestBody RegisterRequest request) {
        try {
            Map<String, Object> userInfo = userService.register(request);
            return Result.success(userInfo);
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/logout")
    public Result<Void> logout(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId != null) {
            userService.logout(userId);
            session.invalidate();
        }
        return Result.success();
    }

    @GetMapping("/info")
    public Result<Map<String, Object>> getUserInfo(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return Result.error(401, "未登录");
        }
        var user = userService.getUserInfo(userId);
        if (user == null) {
            return Result.error("用户不存在");
        }
        Map<String, Object> info = Map.of(
                "id", user.getId(),
                "username", user.getUsername(),
                "nickname", user.getNickname(),
                "winCount", user.getWinCount(),
                "loseCount", user.getLoseCount(),
                "drawCount", user.getDrawCount(),
                "online", user.getOnline()
        );
        return Result.success(info);
    }
}
