const fs = require('fs');
const path = require('path');
const http = require('http');

// 检查图片文件是否存在
const bannersDir = path.join(process.cwd(), 'public', 'images', 'ppt-contest-banners');
console.log('检查图片目录:', bannersDir);

if (!fs.existsSync(bannersDir)) {
  console.error('❌ 目录不存在:', bannersDir);
  process.exit(1);
}

// 列出所有文件
const files = fs.readdirSync(bannersDir);
console.log(`\n找到 ${files.length} 个文件:`);
files.forEach((file, index) => {
  const filePath = path.join(bannersDir, file);
  const stats = fs.statSync(filePath);
  console.log(`${index + 1}. ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
});

// 测试URL访问
console.log('\n测试URL访问:');
const testUrl = 'http://localhost:3000/images/ppt-contest-banners/微信图片_20260307191647_334_52.jpg';
console.log('测试URL:', testUrl);

// 简单的HTTP请求测试
const req = http.get(testUrl, (res) => {
  console.log(`状态码: ${res.statusCode}`);
  console.log(`内容类型: ${res.headers['content-type']}`);
  console.log(`内容长度: ${res.headers['content-length']} bytes`);
  
  if (res.statusCode === 200) {
    console.log('✅ 图片可正常访问');
  } else {
    console.log('❌ 图片访问失败');
  }
  
  res.on('data', () => {}); // 消耗数据
  res.on('end', () => {
    console.log('\n测试完成');
  });
});

req.on('error', (err) => {
  console.error('❌ 请求错误:', err.message);
  console.log('提示: 请确保开发服务器正在运行 (npm run dev)');
});

req.setTimeout(5000, () => {
  console.error('❌ 请求超时');
  req.destroy();
});