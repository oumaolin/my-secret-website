const express = require('express');
const { Pool } = require('pg');
const path = require('path');

// Express 应用设置
const app = express();
const port = 3000;

// PostgreSQL 数据库连接池
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'YOUR_RENDER_DATABASE_URL', // 替换为 Render 提供的连接字符串
  ssl: { rejectUnauthorized: false }, // 启用 SSL
});

// 创建访问记录表（如果不存在）
async function createTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS visits (
      id SERIAL PRIMARY KEY,
      ip VARCHAR(255),
      visit_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await pool.query(query);
  console.log("Table 'visits' is ready.");
}
createTable();

// 静态托管 public 文件夹
app.use(express.static(path.join(__dirname, 'public')));

// 定义秘密路径
const secretPath = '/secret-abc123';

// 记录访问日志
app.get(secretPath, async (req, res) => {
  const visitorIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  try {
    await pool.query('INSERT INTO visits (ip) VALUES ($1)', [visitorIp]);
    res.send('访问已记录！这是一个秘密链接，你的访问已被记录。');
  } catch (err) {
    console.error("Error recording visit:", err);
    res.status(500).send("记录访问失败");
  }
});

// 提供接口查看访问记录
app.get('/get-visits', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM visits ORDER BY visit_time DESC');
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching visits:", err);
    res.status(500).send("无法获取访问记录");
  }
});

// 启动服务器
app.listen(port, () => {
  console.log(`服务器已启动，访问地址: http://localhost:${port}`);
  console.log(`秘密链接: http://localhost:${port}${secretPath}`);
});
