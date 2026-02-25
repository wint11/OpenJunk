
const http = require('http');

const hostname = '0.0.0.0';
const port = 3000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.end('Network Test Successful\n');
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
  console.log(`Try accessing http://192.168.0.105:${port}/ from your phone browser.`);
});
