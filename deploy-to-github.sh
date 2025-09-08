#!/bin/bash

# 部署到GitHub脚本

echo "🚀 准备部署到GitHub..."

# 检查Git是否安装
if ! command -v git &> /dev/null; then
    echo "❌ Git未安装，请先安装Git"
    exit 1
fi

# 检查是否在Git仓库中
if [ ! -d ".git" ]; then
    echo "📁 初始化Git仓库..."
    git init
    echo "✅ Git仓库初始化完成"
fi

# 添加所有文件
echo "📦 添加文件到Git..."
git add .

# 提交更改
echo "💾 提交更改..."
git commit -m "Deploy location tracker to Vercel"

# 检查远程仓库
if git remote | grep -q "origin"; then
    echo "🔄 推送到远程仓库..."
    git push origin main
else
    echo "⚠️ 未设置远程仓库"
    echo "请先设置GitHub远程仓库："
    echo "git remote add origin https://github.com/yourusername/your-repo.git"
    echo "git branch -M main"
    echo "git push -u origin main"
fi

echo "✅ 部署完成！"
echo "🌐 现在可以在Vercel中连接这个GitHub仓库进行部署"
