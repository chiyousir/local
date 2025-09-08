// 部署检查脚本
const http = require('http');
const https = require('https');

const tests = [
  {
    name: '服务器连接测试',
    url: 'http://localhost:80',
    method: 'GET'
  },
  {
    name: '用户注册API测试',
    url: 'http://localhost:80/api/register',
    method: 'POST',
    data: JSON.stringify({
      phone: '13800138000',
      password: 'test123456'
    })
  },
  {
    name: '用户登录API测试',
    url: 'http://localhost:80/api/login',
    method: 'POST',
    data: JSON.stringify({
      phone: '13800138000',
      password: 'test123456'
    })
  },
  {
    name: '位置查询API测试',
    url: 'http://localhost:80/api/location',
    method: 'POST',
    data: JSON.stringify({
      phone: '13800138000'
    })
  }
];

async function runTest(test) {
  return new Promise((resolve) => {
    const url = new URL(test.url);
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: test.method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': test.data ? Buffer.byteLength(test.data) : 0
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            name: test.name,
            status: 'success',
            statusCode: res.statusCode,
            response: jsonData
          });
        } catch (error) {
          resolve({
            name: test.name,
            status: 'success',
            statusCode: res.statusCode,
            response: data
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        name: test.name,
        status: 'error',
        error: error.message
      });
    });

    if (test.data) {
      req.write(test.data);
    }
    req.end();
  });
}

async function runAllTests() {
  console.log('🔍 开始部署检查...\n');
  
  const results = [];
  
  for (const test of tests) {
    console.log(`正在测试: ${test.name}`);
    const result = await runTest(test);
    results.push(result);
    
    if (result.status === 'success') {
      console.log(`✅ ${result.name}: 通过 (状态码: ${result.statusCode})`);
    } else {
      console.log(`❌ ${result.name}: 失败 - ${result.error}`);
    }
    console.log('');
  }
  
  console.log('📊 测试结果汇总:');
  console.log('================');
  
  const successCount = results.filter(r => r.status === 'success').length;
  const totalCount = results.length;
  
  console.log(`总测试数: ${totalCount}`);
  console.log(`通过数: ${successCount}`);
  console.log(`失败数: ${totalCount - successCount}`);
  
  if (successCount === totalCount) {
    console.log('\n🎉 所有测试通过！部署成功！');
  } else {
    console.log('\n⚠️ 部分测试失败，请检查配置');
  }
  
  return results;
}

// 如果直接运行此脚本
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests, runTest };
