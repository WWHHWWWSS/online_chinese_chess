package com.chess.online.mapper;

import com.chess.online.entity.User;
import org.apache.ibatis.annotations.*;

@Mapper
public interface UserMapper {

    @Select("SELECT * FROM `user` WHERE username = #{username}")
    User findByUsername(String username);

    @Select("SELECT * FROM `user` WHERE id = #{id}")
    User findById(Long id);

    @Insert("INSERT INTO `user`(username, password, nickname) VALUES(#{username}, #{password}, #{nickname})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(User user);

    @Update("UPDATE `user` SET online = #{online} WHERE id = #{id}")
    int updateOnline(@Param("id") Long id, @Param("online") Integer online);

    @Update("UPDATE `user` SET win_count = win_count + 1 WHERE id = #{id}")
    int incrementWin(Long id);

    @Update("UPDATE `user` SET lose_count = lose_count + 1 WHERE id = #{id}")
    int incrementLose(Long id);

    @Update("UPDATE `user` SET draw_count = draw_count + 1 WHERE id = #{id}")
    int incrementDraw(Long id);
}
