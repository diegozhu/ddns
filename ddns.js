const { networkInterfaces, hostname } = require('os'),
  { execSync } = require('child_process'),
  logfile = 'C:\\ddns.log',
  fs = require('fs'),
  args = process.argv.slice(2);

process.env.LOGIN_TOKEN = args[0];
process.env.DOMAIN_ID = args[1];
 
const updateDns = require('dnspod-import-core'),
	log = (str)=>{
	  const text = `${new Date().toISOString().substring(0, 19).replace('T', ' ')} ${JSON.stringify(str)}`;
	  fs.appendFileSync(logfile, text + '\r\n');
	  console.log(text);
	};

log(process.argv.slice(2));

const nets = networkInterfaces();
const res = [];
Object.keys(nets).forEach((name) => {
  const net = nets[name].filter((m) => !m.internal && m.family === 'IPv6' && m.address.indexOf('fe80') !== 0 && m.netmask.match(/ffff/gi).length !== 8);
  res.push(net);
});

const ipv6 = res.filter((e) => e.length)[0][0].address,
  name = args[2] || hostname().toLowerCase();

if (ipv6) {
  log(`${name}: ${ipv6 || ''}`);
  const data = {};
  data[name] = ipv6;
  log(data);
  try {
	  if(!args[0] || !args[0]){
		log('please provide dnspod login token and domain id');
	  }else{
		updateDns(data); 
	  }
  } catch (e) {
    log(e);
  }
} else {
  log('could not find IPv6 address');
}

log('check ddns update');

