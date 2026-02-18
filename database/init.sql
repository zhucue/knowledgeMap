-- ============================================
-- Knowledge Map 数据库初始化脚本
-- ============================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS knowledge_map CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE knowledge_map;

-- ============================================
-- 1. 用户表
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ============================================
-- 2. 知识主题表
-- ============================================
CREATE TABLE IF NOT EXISTS topics (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL COMMENT '原始主题名',
  normalized_name VARCHAR(200) NOT NULL UNIQUE COMMENT '标准化名称(去重匹配)',
  domain VARCHAR(100) DEFAULT NULL COMMENT '知识领域',
  search_count INT UNSIGNED DEFAULT 0 COMMENT '搜索热度',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_normalized_name (normalized_name),
  INDEX idx_search_count (search_count DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='知识主题表';

-- ============================================
-- 3. 知识图谱表
-- ============================================
CREATE TABLE IF NOT EXISTS knowledge_graphs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  topic_id BIGINT UNSIGNED NOT NULL COMMENT '关联主题',
  version INT UNSIGNED DEFAULT 1 COMMENT '版本号',
  title VARCHAR(300) NOT NULL COMMENT '图谱标题',
  summary TEXT COMMENT 'AI生成的摘要',
  status ENUM('generating', 'completed', 'failed') DEFAULT 'generating' COMMENT '生成状态',
  llm_provider VARCHAR(50) DEFAULT NULL COMMENT '使用的LLM提供商',
  llm_model VARCHAR(100) DEFAULT NULL COMMENT '使用的模型',
  node_count INT UNSIGNED DEFAULT 0 COMMENT '节点数量',
  max_depth TINYINT UNSIGNED DEFAULT 0 COMMENT '当前已生成的最大深度',
  created_by BIGINT UNSIGNED DEFAULT NULL COMMENT '创建用户',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_topic_id (topic_id),
  INDEX idx_created_by (created_by),
  INDEX idx_status (status),
  FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='知识图谱表';

-- ============================================
-- 4. 图谱节点表（树形结构）
-- ============================================
CREATE TABLE IF NOT EXISTS graph_nodes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  graph_id BIGINT UNSIGNED NOT NULL COMMENT '所属图谱',
  parent_id BIGINT UNSIGNED DEFAULT NULL COMMENT '父节点ID(NULL=根节点)',
  node_key VARCHAR(100) NOT NULL COMMENT '图内唯一标识',
  label VARCHAR(200) NOT NULL COMMENT '显示名称',
  description TEXT COMMENT '知识点描述',
  node_type ENUM('root', 'branch', 'leaf') DEFAULT 'leaf' COMMENT '节点类型',
  depth_level TINYINT UNSIGNED DEFAULT 0 COMMENT '所在层级(0=根)',
  sort_order INT UNSIGNED DEFAULT 0 COMMENT '同级排序',
  is_expandable BOOLEAN DEFAULT TRUE COMMENT '是否可继续展开',
  is_expanded BOOLEAN DEFAULT FALSE COMMENT '是否已展开过',
  metadata JSON DEFAULT NULL COMMENT '扩展数据',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_graph_id (graph_id),
  INDEX idx_parent_id (parent_id),
  INDEX idx_node_key (graph_id, node_key),
  FOREIGN KEY (graph_id) REFERENCES knowledge_graphs(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES graph_nodes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='图谱节点表';

-- ============================================
-- 5. 知识库资源表
-- ============================================
CREATE TABLE IF NOT EXISTS resources (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(300) NOT NULL COMMENT '资源标题',
  url VARCHAR(1000) NOT NULL COMMENT '资源链接',
  resource_type ENUM('article', 'video', 'document', 'tutorial', 'book') DEFAULT 'article' COMMENT '资源类型',
  domain VARCHAR(100) DEFAULT NULL COMMENT '所属知识领域',
  tags JSON DEFAULT NULL COMMENT '标签数组',
  description TEXT COMMENT '资源描述',
  source ENUM('system', 'user_upload') DEFAULT 'system' COMMENT '来源',
  uploaded_by BIGINT UNSIGNED DEFAULT NULL COMMENT '上传用户',
  quality_score FLOAT DEFAULT 0.0 COMMENT '资源质量评分',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_domain (domain),
  INDEX idx_resource_type (resource_type),
  INDEX idx_quality_score (quality_score DESC),
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='知识库资源表';

-- ============================================
-- 6. 节点-资源关联表（多对多）
-- ============================================
CREATE TABLE IF NOT EXISTS node_resources (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  node_id BIGINT UNSIGNED NOT NULL COMMENT '图谱节点',
  resource_id BIGINT UNSIGNED NOT NULL COMMENT '关联资源',
  relevance_score FLOAT DEFAULT 0.0 COMMENT '相关度评分',
  is_primary BOOLEAN DEFAULT FALSE COMMENT '是否为主要推荐资源',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_node_resource (node_id, resource_id),
  INDEX idx_node_id (node_id),
  INDEX idx_resource_id (resource_id),
  FOREIGN KEY (node_id) REFERENCES graph_nodes(id) ON DELETE CASCADE,
  FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='节点-资源关联表';

-- ============================================
-- 7. 对话会话表
-- ============================================
CREATE TABLE IF NOT EXISTS chat_sessions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL COMMENT '所属用户',
  graph_id BIGINT UNSIGNED DEFAULT NULL COMMENT '关联的图谱',
  title VARCHAR(200) DEFAULT 'New Conversation' COMMENT '会话标题',
  status ENUM('active', 'archived') DEFAULT 'active' COMMENT '会话状态',
  message_count INT UNSIGNED DEFAULT 0 COMMENT '消息数量',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_graph_id (graph_id),
  INDEX idx_updated_at (updated_at DESC),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (graph_id) REFERENCES knowledge_graphs(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='对话会话表';

-- ============================================
-- 8. 对话消息表
-- ============================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  session_id BIGINT UNSIGNED NOT NULL COMMENT '所属会话',
  role ENUM('user', 'assistant', 'system') NOT NULL COMMENT '消息角色',
  content TEXT NOT NULL COMMENT '消息内容',
  context_node_id BIGINT UNSIGNED DEFAULT NULL COMMENT '关联的图谱节点',
  metadata JSON DEFAULT NULL COMMENT '扩展数据',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_session_created (session_id, created_at),
  INDEX idx_context_node (context_node_id),
  FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (context_node_id) REFERENCES graph_nodes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='对话消息表';

-- ============================================
-- 9. 资源浏览记录表
-- ============================================
CREATE TABLE IF NOT EXISTS resource_browse_history (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL COMMENT '用户',
  resource_id BIGINT UNSIGNED NOT NULL COMMENT '浏览的资源',
  graph_node_id BIGINT UNSIGNED DEFAULT NULL COMMENT '从哪个图谱节点跳转的',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_time (user_id, created_at DESC),
  INDEX idx_resource_id (resource_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
  FOREIGN KEY (graph_node_id) REFERENCES graph_nodes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资源浏览记录表';

-- ============================================
-- 插入一些示例数据
-- ============================================

-- 插入测试用户（密码: password123，已用 bcrypt 加密）
INSERT INTO users (username, email, password_hash) VALUES
('admin', 'admin@example.com', '$2a$10$YourHashedPasswordHere'),
('test_user', 'test@example.com', '$2a$10$YourHashedPasswordHere')
ON DUPLICATE KEY UPDATE username=username;

-- 插入一些预置资源
INSERT INTO resources (title, url, resource_type, domain, tags, description, quality_score) VALUES
('数据结构与算法教程', 'https://example.com/dsa', 'tutorial', '计算机科学', '["数据结构", "算法"]', '全面的数据结构与算法教程', 9.5),
('JavaScript 权威指南', 'https://example.com/js-guide', 'book', 'Web开发', '["JavaScript", "前端"]', 'JavaScript 经典书籍', 9.8),
('机器学习入门', 'https://example.com/ml-intro', 'article', '人工智能', '["机器学习", "AI"]', '机器学习基础知识', 9.0)
ON DUPLICATE KEY UPDATE title=title;

-- 完成
SELECT 'Database initialization completed!' AS status;
