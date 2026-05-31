package com.chess.online.service;

import com.chess.online.dto.LoginRequest;
import com.chess.online.dto.RegisterRequest;
import com.chess.online.entity.User;
import com.chess.online.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserMapper userMapper;

    public Map<String, Object> login(LoginRequest request) {
        User user = userMapper.findByUsername(request.getUsername());
        if (user == null) {
            throw new RuntimeException("用户不存在");
        }
        if (!user.getPassword().equals(request.getPassword())) {
            throw new RuntimeException("密码错误");
        }
        userMapper.updateOnline(user.getId(), 1);
        user.setOnline(1);

        Map<String, Object> result = new HashMap<>();
        result.put("id", user.getId());
        result.put("username", user.getUsername());
        result.put("nickname", user.getNickname());
        result.put("winCount", user.getWinCount());
        result.put("loseCount", user.getLoseCount());
        result.put("drawCount", user.getDrawCount());
        return result;
    }

    public Map<String, Object> register(RegisterRequest request) {
        User existing = userMapper.findByUsername(request.getUsername());
        if (existing != null) {
            throw new RuntimeException("用户名已存在");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(request.getPassword());
        user.setNickname(request.getNickname() != null ? request.getNickname() : request.getUsername());
        user.setWinCount(0);
        user.setLoseCount(0);
        user.setDrawCount(0);
        user.setOnline(0);
        userMapper.insert(user);

        Map<String, Object> result = new HashMap<>();
        result.put("id", user.getId());
        result.put("username", user.getUsername());
        result.put("nickname", user.getNickname());
        return result;
    }

    public User getUserInfo(Long userId) {
        return userMapper.findById(userId);
    }

    public void logout(Long userId) {
        userMapper.updateOnline(userId, 0);
    }
}
