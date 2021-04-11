const { networkInterfaces, hostname } = require('os'),
  { execSync } = require('child_process'),
  args = process.argv.slice(2),
  fs = require('fs'),
  getLogfile = () => 'C:\\Program Files\\ddns\\' + new Date().toISOString().substring(0, 10) + '.log';
let lastIp = '';
let logFile = '';

var stdout = process.stdout.write,
  stderr = process.stderr.write;

dealWithOutput(process.stdout, stdout);
dealWithOutput(process.stderr, stderr);

function dealWithOutput(source, originFunc) {
  if (logFile !== getLogfile()) {
    logFile = getLogfile();
    function write(str) {
      const txt = `${new Date().toISOString().substring(0, 19).replace('T', ' ')} ${typeof str === 'string' ? str : JSON.stringify(str)}`;
      originFunc.apply(source, arguments);
      fs.appendFileSync(getLogfile(), txt);
    }
    source.write = write;
  }
}

process.on('uncaughtException', function (err) {
  console.error((err && err.stack) ? err.stack : err);
});

function checkIp() {
  dealWithOutput(process.stdout, stdout);
  dealWithOutput(process.stderr, stderr);
  execSync('git pull');
  process.env.LOGIN_TOKEN = args[0] || process.env.LOGIN_TOKEN;
  process.env.DOMAIN_ID = args[1] || process.env.DOMAIN_ID;
  process.env.HOSTNAME = args[2] || process.env.DOMAIN_ID || hostname().toLowerCase();
  console.log('process.env.LOGIN_TOKEN:' + process.env.LOGIN_TOKEN);
  console.log('process.env.DOMAIN_ID:' + process.env.DOMAIN_ID + ' ' + process.env.DOMAIN_ID.length);

  const nets = networkInterfaces();
  const res = [];
  Object.keys(nets).forEach((name) => {
    const net = nets[name].filter((m) => !m.internal && m.family === 'IPv6' && m.address.indexOf('fe80') !== 0 && m.netmask.match(/ffff/gi).length !== 8);
    res.push(net);
  });

  const ipv6 = res.filter((e) => e.length)[0][0].address,
    name = process.env.HOSTNAME;

  if (ipv6) {
    if (ipv6 === lastIp) {
      return console.log('same ip with last time. no change.');
    }
    console.log(`${name}: ${ipv6 || ''}`);
    const data = {};
    data[name] = ipv6;
    if (!process.env.LOGIN_TOKEN || !process.env.DOMAIN_ID) {
      throw new Error('please provide dnspod login token and domain id');
    } else {
      const updateDns = require('dnspod-import-core');
      updateDns(data);
      lastIp = ipv6
    }
  } else {
    console.log('could not find IPv6 address');
  }

  console.log('check ddns update');
}

try {
  checkIp()
} catch (e) {
  console.error(e);
}

setInterval(() => {
  try {
    checkIp()
  } catch (e) {
    console.error(e);
  }
}, 5 * 60 * 1000);