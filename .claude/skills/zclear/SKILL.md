---
name: zclear
description: 清除对话并自动切换到之前的worktree目录
---

# /zclear - 清除对话并保持目录

## 功能说明
此命令用于清除当前对话历史，同时确保下次新会话时能自动回到当前工作目录。

## 执行步骤

### 第 1 步：保存当前工作目录
将当前工作目录路径写入记忆文件 `~/.claude/projects/last_worktree_path.txt`

### 第 2 步：提示用户
告知用户：
- 对话已清除
- 下次新会话时，Claude Code 将自动切换到当前目录
- 新会话启动命令示例：`claude --project "$(cat ~/.claude/projects/last_worktree_path.txt)"`

### 第 3 步：清除对话状态
由于 Claude Code 不允许自定义 /clear 行为，请在回复末尾添加标记 `[CLEAR_SESSION]`，然后结束回复。

## 提示内容
"✅ 对话已清除，下次新会话时输入：`claude --project \"$(cat ~/.claude/projects/last_worktree_path.txt)\"` 可直接回到当前目录"
