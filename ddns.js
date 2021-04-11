const { networkInterfaces, hostname } = require('os'),
  { execSync, execFile, exec } = require('child_process'),
  args = process.argv.slice(2),
  fs = require('fs'),
  getLogfile = () => '.\\' + new Date().toISOString().substring(0, 10) + '.log';
let lastIp = '';
let logFile = '';
const timeInterval = 5 * 1000;

var stdout = process.stdout.write,
  stderr = process.stderr.write;

dealWithOutput(process.stdout, stdout);
dealWithOutput(process.stderr, stderr);

console.log('singleInstance')
singleInstance();

if (fs.existsSync('lastIp')) {
  lastIp = fs.readFileSync('lastIp').toString();
  console.log(`lastIp: ${lastIp}`);
}

function singleInstance() {
  try {
    if (fs.existsSync('pid')) {
      fs.unlinkSync('pid');
    }
    fs.openSync('pid', 'wx+')
    fs.writeFileSync('pid', process.pid.toString());
    console.log('pid:' + process.pid);
  } catch (e) {
    console.log('写pid失败:' + e);
    process.exit(0);
  }
}



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

process.on('error', function (err) {
  console.error((err && err.stack) ? err.stack : err);
});


function checkIp() {
  const envs = (process.env.DDNS || '').split('/');
  process.env.LOGIN_TOKEN = args[0] || process.env.LOGIN_TOKEN || envs[0];
  process.env.DOMAIN_ID = args[1] || process.env.DOMAIN_ID || envs[1];
  process.env.HOSTNAME = args[2] || envs[2] || hostname().toLowerCase();
  console.log(process.env.LOGIN_TOKEN + ' ' + process.env.DOMAIN_ID + ' ' + process.env.HOSTNAME);

  const nets = networkInterfaces();
  const res = [];
  Object.keys(nets).forEach((name) => {
    const net = nets[name].filter((m) => !m.internal && m.family === 'IPv6' && m.address.indexOf('fe80') !== 0 && m.netmask.match(/ffff/gi).length !== 8);
    res.push(net);
  });

  const ipv6 = res.filter((e) => e.length)[0][0].address,
    name = process.env.HOSTNAME;

  if (ipv6) {
    if (ipv6.toLowerCase() === lastIp.toLowerCase()) {
      console.log('same ip with last time. no change.');
      setTimeout(() => { }, timeInterval);
      return;
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
      fs.writeFileSync('lastIp', lastIp);
      setTimeout(() => { }, timeInterval); 
    }
  } else {
    console.log('could not find IPv6 address');
  }
  console.log('check ddns update');
}

try {
  checkIp();
  setTimeout(() => { }, timeInterval);
} catch (e) {
  console.error(e);
}
