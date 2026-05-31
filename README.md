# 在线中国象棋 (Online Chinese Chess)

一个功能完整的在线中国象棋项目，支持双人对战和人机对战，包含AI算法优化和棋盘翻转功能。

## 功能特性

### 核心功能
- ✅ 用户注册和登录
- ✅ 创建和加入房间
- ✅ 双人实时对战 (WebSocket)
- ✅ 人机对战 (初级AI + 特级AI)
- ✅ 对局记录保存
- ✅ 棋盘翻转（选择黑方时自动翻转）
- ✅ 求和、认输功能
- ✅ 聊天功能
- ✅ 开局库支持

### AI 特性
- 初级AI: Minimax + Alpha-Beta剪枝 + 迭代加深 + 静态搜索 + 空着裁剪 + LMR + PVS + 历史启发 + Killer Move + Zobrist置换表 + PST位置权重表
- 特级AI: Pikafish UCI 引擎集成 (深度20)
- 开局库: 支持红方常见开局的黑方应对

## 技术栈

### 后端
- Java 17+
- Spring Boot 3.1.5
- Spring WebSocket
- MyBatis
- MySQL 8.0
- Lombok

### 前端
- HTML5 + CSS3 + JavaScript
- Canvas 绘制棋盘
- 原生 WebSocket 客户端

## 项目结构

```
online-chinese-chess/
├── src/
│   └── main/
│       ├── java/com/chess/online/
│       │   ├── ChineseChessApplication.java  # 启动类
│       │   ├── common/                        # 通用类
│       │   ├── config/                        # 配置类
│       │   ├── controller/                    # 控制器
│       │   ├── dto/                           # 数据传输对象
│       │   ├── entity/                        # 实体类
│       │   ├── mapper/                        # MyBatis Mapper
│       │   ├── service/                       # 业务逻辑
│       │   └── websocket/                     # WebSocket处理
│       └── resources/
│           ├── static/                        # 前端资源
│           │   ├── css/style.css
│           │   ├── js/
│           │   │   ├── chess.js              # 棋盘核心逻辑
│           │   │   ├── chess-ai.js           # 初级AI算法
│           │   │   ├── game.js               # 游戏主逻辑
│           │   │   └── openingbook.js        # 开局库
│           │   ├── index.html
│           │   ├── lobby.html
│           │   ├── game.html
│           │   └── records.html
│           ├── application.yml               # 配置文件
│           └── schema.sql                    # 数据库脚本
├── engine/                                    # Pikafish引擎
│   ├── pikafish.exe
│   └── pikafish.nnue
└── pom.xml
```

## 快速开始

### 前置要求
- JDK 17+
- MySQL 8.0+
- Maven 3.6+
- (Windows) 或 Linux/macOS 系统

### 数据库配置

1. 创建数据库:
```sql
CREATE DATABASE IF NOT EXISTS chinese_chess CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. 修改 [application.yml](file:///d:/Homework/online_chinese_chess/src/main/resources/application.yml#L8-L10) 中的数据库连接信息:
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/chinese_chess?...
    username: root
    password: 你的密码
```

### 运行项目

```bash
# 编译项目
mvn clean compile

# 运行项目
mvn spring-boot:run
```

项目启动后访问: http://localhost:8080

### 构建 WAR 包

```bash
mvn clean package
```

WAR 包位于: `target/online-chinese-chess.war`

## 主要功能说明

### 棋盘翻转
当用户选择黑方时，棋盘会自动上下翻转，黑方在下方，红方在上方。
- 棋子的逻辑坐标保持不变，仅在绘制和点击时进行坐标转换
- 前端 [game.js](file:///d:/Homework/online_chinese_chess/src/main/resources/static/js/game.js#L62-L63) 在初始化时设置翻转状态
- 后端 [RoomService](file:///d:/Homework/online_chinese_chess/src/main/java/com/chess/online/service/RoomService.java#L120-L147) 保存记录时正确处理玩家颜色

### 对局记录保存
- 在线对战: 调用 `/api/room/finish` 接口
- 人机对战: 调用 `/api/room/ai-record` 接口，新增 `playerColor` 参数正确处理胜负
- 初级AI无棋可走时也会触发 `endGame` 保存记录

## 配置说明

### Pikafish 引擎配置

```yaml
pikafish:
  path: engine/pikafish.exe  # 引擎路径
  enabled: true              # 是否启用
  depth: 20                  # 搜索深度
  threads: 1                 # 线程数
```

## 数据库表结构

参见 [schema.sql](file:///d:/Homework/online_chinese_chess/src/main/resources/schema.sql)

- `user`: 用户表
- `room`: 房间表
- `game_record`: 游戏记录表

## 开发说明

### Java 编译注意事项
项目使用 Lombok，确保 IDE 已安装 Lombok 插件并启用注解处理。

### 前端开发
- 核心棋盘逻辑: [chess.js](file:///d:/Homework/online_chinese_chess/src/main/resources/static/js/chess.js)
- 游戏流程控制: [game.js](file:///d:/Homework/online_chinese_chess/src/main/resources/static/js/game.js)
- 棋盘翻转通过 `setFlipped()` 方法控制

## 许可证

本项目仅供学习交流使用。
