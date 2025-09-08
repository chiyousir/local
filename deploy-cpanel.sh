#!/bin/bash

# cPanel环境部署脚本

echo "🚀 开始cPanel环境部署..."

# 检查当前目录
echo "📁 当前目录: $(pwd)"
echo "📋 目录内容:"
ls -la

# 检查Node.js环境
echo "🔍 检查Node.js环境..."
if command -v node &> /dev/null; then
    echo "✅ Node.js版本: $(node --version)"
else
    echo "❌ Node.js未安装，请联系主机商安装Node.js"
    exit 1
fi

if command -v npm &> /dev/null; then
    echo "✅ npm版本: $(npm --version)"
else
    echo "❌ npm未安装"
    exit 1
fi

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

# 检查PM2
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
    echo "尝试直接启动..."
    node server-production.js &
    echo "✅ 应用已后台启动"
fi

echo "🎉 cPanel部署完成！"
echo "🌐 请确保在cPanel中配置域名和SSL证书"
echo "📱 移动端定位需要HTTPS支持"
