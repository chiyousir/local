#!/bin/bash

# 位置追踪网站部署脚本

echo "🚀 开始部署位置追踪网站..."

# 检查Node.js环境
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装Node.js"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装，请先安装npm"
    exit 1
fi

echo "✅ Node.js 环境检查通过"

# 安装依赖
echo "📦 安装依赖包..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi

echo "✅ 依赖安装成功"

# 创建日志目录
echo "📁 创建日志目录..."
mkdir -p logs

# 设置文件权限
echo "🔐 设置文件权限..."
chmod 755 server-production.js
chmod 755 public/
chmod 666 location_tracker.db 2>/dev/null || echo "数据库文件不存在，将在首次运行时创建"

# 安装PM2（如果未安装）
if ! command -v pm2 &> /dev/null; then
    echo "📦 安装PM2进程管理器..."
    npm install -g pm2
fi

# 停止现有进程
echo "🛑 停止现有进程..."
pm2 stop location-tracker 2>/dev/null || echo "没有运行中的进程"

# 启动应用
echo "🚀 启动应用..."
pm2 start ecosystem.config.js --env production

if [ $? -eq 0 ]; then
    echo "✅ 应用启动成功"
    
    # 保存PM2配置
    pm2 save
    pm2 startup
    
    echo "📊 应用状态："
    pm2 status
    
    echo "📝 查看日志："
    echo "pm2 logs location-tracker"
    
    echo "🔄 重启应用："
    echo "pm2 restart location-tracker"
    
    echo "🛑 停止应用："
    echo "pm2 stop location-tracker"
    
else
    echo "❌ 应用启动失败"
    exit 1
fi

echo "🎉 部署完成！"
echo "🌐 访问地址：http://your-domain.com"
