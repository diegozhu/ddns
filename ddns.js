const { networkInterfaces, hostname } = require('os'),
  logfile = 'C:\\ddns.log',
  fs = require('fs'),
  args = process.argv.slice(2),
  { execSync } require('child_process');

console.log(process.argv.slice(2));

process.env.LOGIN_TOKEN = args[0];
process.env.DOMAIN_ID = args[1];

const updateDns = require('dnspod-import-core');

const nets = networkInterfaces();
const res = [];
Object.keys(nets).forEach((name) => {
  const net = nets[name].filter((m) => !m.internal && m.family === 'IPv6' && m.address.indexOf('fe80') !== 0 && m.netmask.match(/ffff/gi).length !== 8);
  res.push(net);
});

const ipv6 = res.filter((e) => e.length)[0][0].address,
  name = args[2] || hostname().toLowerCase();

if (ipv6) {
  console.log(`${name}: ${ipv6 || ''}`);
  const data = {};
  data[name] = ipv6;
  console.log(data);
  fs.appendFileSync(logfile, `${new Date().toISOString().substring(0, 19).replace('T', ' ')} ${JSON.stringify(data)}`);
  try {
	  if(!args[0] || !args[0]){
		console.log('please provide dnspod login token and domain id');
	  }else{
		updateDns(data); 
	  }
  } catch (e) {
    console.error(e);
    fs.appendFileSync(logfile, `${new Date().toISOString().substring(0, 19).replace('T', ' ')} ${JSON.stringify(e)}`);
  }
} else {
  fs.appendFileSync(logfile, `${new Date().toISOString().substring(0, 19).replace('T', ' ')} could not find IPv6 address`);
}

console.log('check ddns update');
execSync('git pull', {stdio: 'inherit'})

