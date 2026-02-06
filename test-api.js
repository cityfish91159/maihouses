const handler = require('./api/property/generate-key-capsules.ts').default;

async function test() {
  const req = {
    method: 'POST',
    body: {
      title: '測試房源',
      advantage1: '捷運走路三分鐘',
      advantage2: '高樓層景觀好',
    },
    headers: {},
  };

  const res = {
    setHeader: () => {},
    status: (code) => ({
      json: (data) => {
        console.log(`Status: ${code}`);
        console.log('Data:', JSON.stringify(data, null, 2));
      },
      end: () => {},
    }),
  };

  await handler(req, res);
}

test();
