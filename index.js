const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000; // 使用动态端口（Render 提供的环境变量）

// 指定访问记录的 JSON 文件
const visitsFile = 'visits.json';

// 读取访问记录
function readVisits() {
  try {
    const data = fs.readFileSync(visitsFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // 如果文件不存在或者解析出错，返回空数组
    return [];
  }
}

// 写入访问记录
function writeVisits(visits) {
  fs.writeFileSync(visitsFile, JSON.stringify(visits, null, 2));
}

// 静态托管 public 文件夹，让浏览器可以访问里面的 index.html
app.use(express.static(path.join(__dirname, 'public')));

// 定义你的“秘密”路径
const secretPath = '/secret-abc123';

// 处理对秘密路径的 GET 请求
app.get(secretPath, (req, res) => {
  // 获取来访 IP。若有反向代理，可考虑使用 req.headers['x-forwarded-for']
  const visitorIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  // 获取访问时间
  const visitTime = new Date().toISOString();

  // 从文件中读取当前已有的访问记录
  const visits = readVisits();

  // 构造新的访问记录
  const newVisit = {
    ip: visitorIp,
    time: visitTime,
  };

  // 将新记录加入到数组里
  visits.push(newVisit);

  // 写回文件
  writeVisits(visits);

  // 给予访问者一个简单的响应
  res.send('访问已记录！这是一个秘密链接，你的访问已被记录。');
});

// 添加一个路由以通过 HTTP 查看 visits.json 文件内容
app.get('/get-visits', (req, res) => {
  const visits = readVisits();
  res.json(visits); // 将文件内容返回为 JSON 格式
});

// 启动服务器
app.listen(port, () => {
  console.log(`服务器已启动，访问地址: http://localhost:${port}`);
  console.log(`秘密链接: http://localhost:${port}${secretPath}`);
});