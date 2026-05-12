#!/bin/bash
# PostgreSQL 数据库恢复脚本
# 使用方法: bash scripts/db-restore.sh <backup_file>
# 示例: bash scripts/db-restore.sh backups/ai_customer_acquisition_20260512_120000.sql.gz

set -e

if [ -z "$1" ]; then
  echo "❌ 请指定备份文件路径"
  echo "使用方法: bash scripts/db-restore.sh <backup_file.sql.gz>"
  echo ""
  echo "可用备份:"
  ls -lh backups/*.sql.gz 2>/dev/null || echo "  无备份文件"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ 备份文件不存在: $BACKUP_FILE"
  exit 1
fi

# 配置
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-ai_customer_acquisition}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-password}"

echo "⚠️  WARNING: 此操作将覆盖数据库 $DB_NAME 的所有数据！"
echo "   备份文件: $BACKUP_FILE"
echo ""
read -p "确认恢复？输入 'YES' 继续: " CONFIRM

if [ "$CONFIRM" != "YES" ]; then
  echo "❌ 操作已取消"
  exit 0
fi

echo "🔄 Restoring database from backup..."
echo "   Database: $DB_NAME"
echo "   Host: $DB_HOST:$DB_PORT"
echo "   File: $BACKUP_FILE"

# 解压并恢复
gunzip -c "$BACKUP_FILE" | PGPASSWORD="$DB_PASSWORD" psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -v ON_ERROR_STOP=0 \
  2>&1 | tail -5

echo "✅ Database restore completed!"
