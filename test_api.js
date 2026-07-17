const http = require('http');

const options = {
  hostname: '127.0.0.1',
  port: 8080,
  path: '/admin/page?page=1&pageSize=2',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('返回数据:');
      console.log(JSON.stringify(json, null, 2));
      if (json.data && json.data.list && json.data.list.length > 0) {
        const first = json.data.list[0];
        console.log('\n第一条数据的字段:');
        console.log(Object.keys(first));
        console.log('\nPhone值:', first.Phone);
      }
    } catch (e) {
      console.error('解析失败:', e.message);
      console.log('原始数据:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('请求失败:', e.message);
});

req.end();
