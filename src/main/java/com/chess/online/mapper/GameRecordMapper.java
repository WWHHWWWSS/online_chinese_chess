package com.chess.online.mapper;

import com.chess.online.entity.GameRecord;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface GameRecordMapper {

    @Select("SELECT g.*, " +
            "u1.nickname AS red_player_name, " +
            "u2.nickname AS black_player_name " +
            "FROM game_record g " +
            "LEFT JOIN `user` u1 ON g.red_player_id = u1.id " +
            "LEFT JOIN `user` u2 ON g.black_player_id = u2.id " +
            "ORDER BY g.create_time DESC")
    List<GameRecord> findAll();

    @Select("SELECT g.*, " +
            "u1.nickname AS red_player_name, " +
            "u2.nickname AS black_player_name " +
            "FROM game_record g " +
            "LEFT JOIN `user` u1 ON g.red_player_id = u1.id " +
            "LEFT JOIN `user` u2 ON g.black_player_id = u2.id " +
            "WHERE g.red_player_id = #{userId} OR g.black_player_id = #{userId} " +
            "ORDER BY g.create_time DESC")
    List<GameRecord> findByUserId(Long userId);

    @Select("SELECT g.*, " +
            "u1.nickname AS red_player_name, " +
            "u2.nickname AS black_player_name " +
            "FROM game_record g " +
            "LEFT JOIN `user` u1 ON g.red_player_id = u1.id " +
            "LEFT JOIN `user` u2 ON g.black_player_id = u2.id " +
            "WHERE g.id = #{id}")
    GameRecord findById(Long id);

    @Insert("INSERT INTO game_record(room_id, red_player_id, black_player_id, result, moves, total_moves, duration, game_type, ai_difficulty) " +
            "VALUES(#{roomId}, #{redPlayerId}, #{blackPlayerId}, #{result}, #{moves}, #{totalMoves}, #{duration}, #{gameType}, #{aiDifficulty})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(GameRecord record);

    @Delete("DELETE FROM game_record WHERE id = #{id}")
    int deleteById(Long id);

    @Delete("DELETE FROM game_record")
    int deleteAll();

    @Delete("DELETE FROM game_record WHERE red_player_id = #{userId} OR black_player_id = #{userId}")
    int deleteByUserId(Long userId);
}
