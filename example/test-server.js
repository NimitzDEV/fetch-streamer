const http = require('http');
const {parse} = require('url');
const {createHash, randomBytes} = require('crypto');
const {createReadStream} = require('fs');

const server = http.createServer((req, res) => {
  const type = parse(req.url, true).query.type;
  res.writeHead(200, {'Access-Control-Allow-Origin': '*'})

  switch (type) {
    case 'dynamic': {
      let counter = 0;
      const timer = setInterval(() => {
        const data = randomBytes(Math.ceil(48 * Math.random()) + 1).toString('hex');
        const lengthHeader = data.length.toString().padStart(2, '0');
        console.log(`Writing dynamic size chunk, size header ${lengthHeader}, with data ${data}`);
        res.write(`${lengthHeader}${data}`);
        if (counter === 10) {
          clearInterval(timer);
          res.end();
        }
        counter++;
      }, 100);
      break;
    }

    case "fixed":
    default: {
      let counter = 0;
      const timer = setInterval(() => {
        const data = createHash('md5').update(`${Date.now()}`).digest('hex');
        console.log(`Writing fixed size chunk ${data}`)
        res.write(data);
        if (counter === 10) {
          clearInterval(timer);
          res.end();
        }

        counter++;
      }, 100);

      break;
    }
  }
});

server.listen(5001);
