package com.chess.online.mapper;

import com.chess.online.entity.Room;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface RoomMapper {

    @Select("SELECT r.*, " +
            "u1.nickname AS red_player_name, " +
            "u2.nickname AS black_player_name " +
            "FROM room r " +
            "LEFT JOIN `user` u1 ON r.red_player_id = u1.id " +
            "LEFT JOIN `user` u2 ON r.black_player_id = u2.id " +
            "ORDER BY r.create_time DESC")
    List<Room> findAll();

    @Select("SELECT r.*, " +
            "u1.nickname AS red_player_name, " +
            "u2.nickname AS black_player_name " +
            "FROM room r " +
            "LEFT JOIN `user` u1 ON r.red_player_id = u1.id " +
            "LEFT JOIN `user` u2 ON r.black_player_id = u2.id " +
            "WHERE r.id = #{id}")
    Room findById(Long id);

    @Select("SELECT r.*, " +
            "u1.nickname AS red_player_name, " +
            "u2.nickname AS black_player_name " +
            "FROM room r " +
            "LEFT JOIN `user` u1 ON r.red_player_id = u1.id " +
            "LEFT JOIN `user` u2 ON r.black_player_id = u2.id " +
            "WHERE r.status = #{status} " +
            "ORDER BY r.create_time DESC")
    List<Room> findByStatus(Integer status);

    @Insert("INSERT INTO room(room_name, red_player_id, status) VALUES(#{roomName}, #{redPlayerId}, 0)")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(Room room);

    @Update("UPDATE room SET black_player_id = #{blackPlayerId}, status = 1 WHERE id = #{id}")
    int joinRoom(@Param("id") Long id, @Param("blackPlayerId") Long blackPlayerId);

    @Update("UPDATE room SET status = #{status} WHERE id = #{id}")
    int updateStatus(@Param("id") Long id, @Param("status") Integer status);

    @Delete("DELETE FROM room WHERE id = #{id}")
    int deleteById(Long id);

    @Update("UPDATE room SET red_player_id = #{blackPlayerId}, black_player_id = #{redPlayerId} WHERE id = #{id}")
    int swapPlayers(@Param("id") Long id, @Param("redPlayerId") Long redPlayerId, @Param("blackPlayerId") Long blackPlayerId);

    @Update("UPDATE room SET black_player_id = NULL, status = 0 WHERE id = #{id}")
    int resetToWaiting(Long id);
}
