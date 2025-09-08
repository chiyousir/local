# cPanel无终端部署指南

## 📋 部署前准备

### 1. 确认cPanel功能
- ✅ 文件管理器
- ✅ Node.js支持（查找"Node.js Selector"或"应用程序"）
- ✅ 域名管理
- ✅ SSL证书管理

### 2. 准备文件
确保以下文件已准备好：
```
├── server-production.js
├── package.json
├── ecosystem.config.js
├── public/ (整个目录)
└── location_tracker.db (可选)
```

## 🚀 部署步骤

### 步骤1：上传文件
1. 登录cPanel
2. 进入"文件管理器"
3. 导航到 `public_html` 目录
4. 上传所有项目文件

### 步骤2：配置Node.js应用
1. 在cPanel中找到"Node.js Selector"或"应用程序"
2. 创建新的Node.js应用：
   - 应用目录：`public_html`
   - 启动文件：`server-production.js`
   - 端口：自动分配或指定端口

### 步骤3：安装依赖
在Node.js管理器中：
1. 进入应用管理界面
2. 找到"npm install"或"安装依赖"选项
3. 执行依赖安装

### 步骤4：启动应用
1. 在Node.js管理器中启动应用
2. 记录分配的端口号
3. 配置域名指向应用

## 🔧 cPanel配置

### 1. 域名配置
1. 进入"子域名"管理
2. 创建子域名指向应用目录
3. 或者使用主域名

### 2. SSL证书配置
1. 进入"SSL/TLS"管理
2. 申请Let's Encrypt免费证书
3. 确保HTTPS正常工作

### 3. 端口配置
如果cPanel使用特定端口：
1. 记录分配的端口号
2. 在域名解析中配置端口转发
3. 或者使用cPanel的URL重写规则

## 📱 移动端配置

### 1. HTTPS必需
移动端定位需要HTTPS：
- 确保SSL证书有效
- 所有API调用使用HTTPS
- 域名支持HTTPS访问

### 2. 跨域配置
修改 `server-production.js` 中的CORS配置：
```javascript
app.use(cors({
  origin: ['https://your-domain.com'],
  credentials: true
}));
```

## 🔍 故障排除

### 问题1：找不到Node.js功能
- 联系主机商确认是否支持Node.js
- 查看cPanel版本和功能列表
- 考虑升级到支持Node.js的主机方案

### 问题2：应用启动失败
- 检查文件权限
- 确认端口配置
- 查看错误日志

### 问题3：域名访问问题
- 检查域名解析
- 确认SSL证书配置
- 验证端口转发设置

## 📞 主机商支持

如果遇到问题，联系主机商询问：
1. 是否支持Node.js应用
2. 如何部署Node.js项目
3. 端口配置和域名绑定
4. SSL证书申请流程

## 🎯 部署成功标志

- ✅ 应用在cPanel中显示为运行状态
- ✅ 域名可以正常访问
- ✅ HTTPS证书有效
- ✅ 移动端定位功能正常
- ✅ API接口响应正常

## 💡 替代方案

如果cPanel不支持Node.js：
1. 考虑升级到支持Node.js的主机方案
2. 使用其他云服务（如阿里云、腾讯云）
3. 使用VPS服务器部署
4. 考虑使用静态网站托管服务
