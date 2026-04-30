-- Monday-style internal task management tool
-- Boards contain Groups, Groups contain Items (tasks/rows), Items can have Updates (comments)

CREATE TABLE IF NOT EXISTS task_boards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    owner_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_archived BOOLEAN DEFAULT FALSE,
    INDEX idx_owner (owner_id),
    INDEX idx_archived (is_archived)
);

CREATE TABLE IF NOT EXISTS task_board_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    board_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(20) DEFAULT '#0073ea',
    position INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_board (board_id),
    CONSTRAINT fk_group_board FOREIGN KEY (board_id) REFERENCES task_boards(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS task_board_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    board_id INT NOT NULL,
    group_id INT NOT NULL,
    title VARCHAR(500) NOT NULL,
    status VARCHAR(50) DEFAULT 'not_started',
    owner_id INT NULL,
    due_date DATE NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    notes TEXT NULL,
    position INT DEFAULT 0,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_board (board_id),
    INDEX idx_group (group_id),
    INDEX idx_owner (owner_id),
    INDEX idx_status (status),
    CONSTRAINT fk_item_board FOREIGN KEY (board_id) REFERENCES task_boards(id) ON DELETE CASCADE,
    CONSTRAINT fk_item_group FOREIGN KEY (group_id) REFERENCES task_board_groups(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS task_board_updates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_item (item_id),
    CONSTRAINT fk_update_item FOREIGN KEY (item_id) REFERENCES task_board_items(id) ON DELETE CASCADE
);
