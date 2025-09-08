# 移动端位置追踪网站

一个基于Web的移动端位置追踪应用，允许用户通过手机号码查询和显示其他用户的位置信息。

## 功能特性

- 🔐 **用户注册登录** - 简单的手机号码和密码注册/登录系统
- 📍 **实时定位** - 自动获取用户当前位置并持续更新
- 🗺️ **地图显示** - 使用国内可访问的地图服务，无需VPN
- 🔍 **位置查询** - 通过手机号码查询其他用户的位置
- 📱 **移动端优化** - 专为移动设备设计的响应式界面
- 🔒 **权限管理** - 需要用户主动开启位置权限才能被定位
- 🌐 **国内优化** - 支持高德、百度、腾讯等国内地图服务

## 技术栈

- **后端**: Node.js + Express
- **数据库**: SQLite
- **前端**: 原生HTML/CSS/JavaScript
- **地图**: Leaflet + 国内地图服务（高德、百度、腾讯等）
- **实时通信**: Socket.IO
- **密码加密**: bcryptjs

## 安装和运行

### 1. 安装依赖

```bash
npm install
```

### 2. 启动服务器

```bash
npm start
```

或者使用开发模式（自动重启）：

```bash
npm run dev
```

### 3. 访问应用

打开浏览器访问：`http://localhost:3000`

### 4. 测试地图功能（可选）

如果地图显示有问题，可以访问测试页面：
- 地图源测试：`http://localhost:3000/map-test.html`
- 基础功能测试：`http://localhost:3000/test-map.html`
- 坐标转换测试：`http://localhost:3000/coordinate-test.html`
- 位置调试工具：`http://localhost:3000/debug-location.html`

## 使用说明

### 注册和登录

1. 首次使用需要注册账号
2. 输入有效的手机号码（11位数字）
3. 设置密码（至少6位）
4. 注册成功后可以登录

### 位置定位

1. 登录后系统会自动请求位置权限
2. 允许位置权限后，系统会持续获取和更新您的位置
3. 位置信息会实时保存到服务器

### 查询他人位置

1. 在主页输入要查询的手机号码
2. 点击"开始定位"按钮
3. 如果对方已注册并开启位置权限，会在地图上显示其位置
4. 同时显示详细的位置信息（经纬度、精度、更新时间）

## 项目结构

```
├── server.js              # 服务器主文件
├── package.json           # 项目配置和依赖
├── location_tracker.db    # SQLite数据库文件（自动生成）
└── public/                # 静态文件目录
    ├── login.html         # 登录页面
    └── index.html         # 主页面
```

## API接口

### 用户注册
- **POST** `/api/register`
- **参数**: `{ phone: string, password: string }`
- **返回**: `{ success: boolean, message: string }`

### 用户登录
- **POST** `/api/login`
- **参数**: `{ phone: string, password: string }`
- **返回**: `{ success: boolean, userId: number, phone: string }`

### 查询位置
- **POST** `/api/location`
- **参数**: `{ phone: string }`
- **返回**: `{ success: boolean, location: { latitude, longitude, accuracy, timestamp } }`

### 保存位置
- **POST** `/api/save-location`
- **参数**: `{ userId: number, phone: string, latitude: number, longitude: number, accuracy: number }`
- **返回**: `{ success: boolean, message: string }`

## 数据库结构

### users 表
- `id`: 用户ID（主键）
- `phone`: 手机号码（唯一）
- `password`: 加密后的密码
- `created_at`: 创建时间

### locations 表
- `id`: 位置记录ID（主键）
- `user_id`: 用户ID（外键）
- `phone`: 手机号码
- `latitude`: 纬度
- `longitude`: 经度
- `accuracy`: 定位精度
- `timestamp`: 时间戳

## 安全考虑

1. **密码加密**: 使用bcryptjs对密码进行哈希加密
2. **输入验证**: 对手机号码格式进行验证
3. **权限控制**: 只有注册用户才能查询位置
4. **位置权限**: 需要用户主动授权才能获取位置

## 地图服务说明

### 支持的地图源（无需VPN）

1. **高德地图** - 国内最稳定的地图服务
2. **百度地图** - 国内知名地图服务
3. **腾讯地图** - 腾讯提供的地图服务
4. **OpenStreetMap** - 开源地图服务（备用）

### 地图源选择策略

- 系统会自动测试各个地图源的可用性
- 优先使用国内地图服务，确保无需VPN即可访问
- 如果某个地图源不可用，会自动切换到备用源
- 可以通过测试页面查看各地图源的连接状态

### 坐标转换说明

- **GPS坐标 (WGS-84)**: 设备定位返回的原始坐标
- **高德/腾讯地图 (GCJ-02)**: 中国标准坐标系，与GPS坐标有偏移
- **百度地图 (BD-09)**: 百度专用坐标系，偏移更大
- **OpenStreetMap (WGS-84)**: 国际标准坐标系，与GPS坐标一致

系统会自动进行坐标转换，确保位置显示准确。

### 位置信息找不到的排查方法

如果用户已注册但找不到位置信息，可能的原因：

1. **用户没有开启定位权限** - 用户需要主动允许浏览器获取位置
2. **位置信息没有保存** - 检查用户是否成功登录并开启了定位
3. **数据库问题** - 检查服务器和数据库是否正常运行
4. **查询逻辑问题** - 检查手机号码格式和查询条件

使用调试工具：`http://localhost:3000/debug-location.html` 可以：
- 检查用户是否存在
- 检查位置信息是否已保存
- 查看数据库状态
- 运行完整的调试流程

## 注意事项

1. **隐私保护**: 本应用仅用于演示目的，实际使用需要考虑隐私保护
2. **位置精度**: 定位精度取决于设备和网络环境
3. **浏览器兼容**: 需要支持HTML5 Geolocation API的现代浏览器
4. **HTTPS要求**: 生产环境建议使用HTTPS以确保位置API正常工作
5. **网络环境**: 使用国内地图服务，无需VPN即可正常使用

## 开发说明

- 使用SQLite数据库，数据文件会在首次运行时自动创建
- 地图使用国内可访问的地图服务，无需API密钥和VPN
- 支持实时位置更新和Socket.IO通信
- 响应式设计，适配各种移动设备屏幕

## 许可证

MIT License
