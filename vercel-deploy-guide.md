# Vercel免费部署指南

## 🎯 为什么选择Vercel？

- ✅ **完全免费**：无限制部署
- ✅ **自动HTTPS**：移动端定位必需
- ✅ **全球CDN**：访问速度快
- ✅ **自动部署**：Git推送即部署
- ✅ **自定义域名**：支持自己的域名
- ✅ **Node.js优化**：专为Node.js应用设计

## 🚀 部署步骤

### 步骤1：准备GitHub仓库
1. 在GitHub创建新仓库
2. 上传所有项目文件
3. 确保包含以下文件：
   ```
   ├── server-production.js
   ├── package.json
   ├── vercel.json
   └── public/
   ```

### 步骤2：连接Vercel
1. 访问 [vercel.com](https://vercel.com)
2. 使用GitHub账号登录
3. 点击"New Project"
4. 选择您的GitHub仓库
5. 点击"Deploy"

### 步骤3：配置环境变量
在Vercel项目设置中添加：
```
NODE_ENV=production
DB_PATH=./location_tracker.db
```


### 步骤4：自定义域名（可选）
1. 在项目设置中添加域名
2. 配置DNS解析
3. 等待SSL证书自动生成

## 📱 移动端配置

### 1. HTTPS自动支持
Vercel自动提供HTTPS，满足移动端定位要求

### 2. 跨域配置
修改 `server-production.js` 中的CORS：
```javascript
app.use(cors({
  origin: ['https://your-app.vercel.app', 'https://your-domain.com'],
  credentials: true
}));
```

## 🔧 数据库配置

### 方案1：使用Vercel KV（推荐）
```javascript
// 使用Vercel的Redis数据库
const { kv } = require('@vercel/kv');
```

### 方案2：使用外部数据库
- **MongoDB Atlas**：免费500MB
- **PlanetScale**：免费5GB
- **Supabase**：免费500MB

### 方案3：使用SQLite文件
Vercel支持SQLite，但数据不持久化

## 📊 监控和维护

### 1. 查看部署状态
- Vercel Dashboard显示部署状态
- 实时日志查看
- 性能监控

### 2. 自动部署
- 每次Git推送自动部署
- 分支预览功能
- 回滚到任意版本

### 3. 环境管理
- 开发环境变量
- 生产环境变量
- 预览环境变量

## 🎯 部署检查清单

- [ ] GitHub仓库创建
- [ ] 文件上传完成
- [ ] Vercel项目连接
- [ ] 环境变量配置
- [ ] 域名绑定（可选）
- [ ] HTTPS证书验证
- [ ] 移动端定位测试
- [ ] API接口测试

## 💡 优化建议

### 1. 性能优化
- 启用Vercel Edge Functions
- 使用CDN缓存
- 优化图片资源

### 2. 安全配置
- 设置环境变量
- 配置CORS策略
- 启用安全头

### 3. 监控配置
- 设置错误监控
- 配置性能监控
- 启用日志记录

## 🔍 故障排除

### 问题1：部署失败
- 检查package.json配置
- 确认vercel.json格式
- 查看构建日志

### 问题2：数据库连接失败
- 检查环境变量
- 确认数据库服务
- 验证连接字符串

### 问题3：移动端定位失败
- 确认HTTPS配置
- 检查CORS设置
- 验证权限请求

## 🎉 部署完成

恭喜！您的网站已成功部署到Vercel！

访问地址：`https://your-app.vercel.app`
