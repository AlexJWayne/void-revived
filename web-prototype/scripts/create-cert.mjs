// Creates a project-local CA and server certificate. Never changes system trust.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, chmodSync } from 'node:fs';
import { hostname, networkInterfaces } from 'node:os';
import { fileURLToPath } from 'node:url';
const directory=fileURLToPath(new URL('../.certs/',import.meta.url));
mkdirSync(directory,{recursive:true,mode:0o700});
const run=(args)=>execFileSync('openssl',args,{cwd:directory,stdio:['ignore','pipe','pipe']});
const localName=hostname(),ips=[...new Set(Object.values(networkInterfaces()).flat().filter(x=>x&&x.family==='IPv4'&&!x.internal).map(x=>x.address))];
if(!existsSync(directory+'ca-key.pem')) {
  writeFileSync(directory+'ca.cnf','[req]\ndistinguished_name=dn\nx509_extensions=v3_ca\nprompt=no\n[dn]\nCN=VOID Local Development CA\n[v3_ca]\nbasicConstraints=critical,CA:TRUE\nkeyUsage=critical,keyCertSign,cRLSign\nsubjectKeyIdentifier=hash\n');
  run(['req','-x509','-newkey','rsa:2048','-nodes','-sha256','-days','365','-keyout','ca-key.pem','-out','ca.pem','-config','ca.cnf']);
  run(['x509','-in','ca.pem','-outform','DER','-out','VOID-local-ca.cer']);chmodSync(directory+'ca-key.pem',0o600);
}
const sans=['DNS:localhost',`DNS:${localName}`,'IP:127.0.0.1',...ips.map(ip=>'IP:'+ip)].join(',');
writeFileSync(directory+'server.cnf',`basicConstraints=critical,CA:FALSE\nkeyUsage=critical,digitalSignature,keyEncipherment\nextendedKeyUsage=serverAuth\nsubjectAltName=${sans}\n`);
run(['req','-new','-newkey','rsa:2048','-nodes','-sha256','-keyout','server-key.pem','-out','server.csr','-subj','/CN=VOID local development']);
run(['x509','-req','-in','server.csr','-CA','ca.pem','-CAkey','ca-key.pem','-CAcreateserial','-out','server.pem','-days','30','-sha256','-extfile','server.cnf']);chmodSync(directory+'server-key.pem',0o600);
console.log('Local HTTPS certificate ready. No system trust settings were changed.');
console.log('Public iPhone certificate: '+directory+'VOID-local-ca.cer');
console.log('Run npm run dev. On the same Wi-Fi, open:');
for(const ip of ips)console.log(`  https://${ip}:5186`);
console.log('Install the public CA on your iPhone and enable its full trust (see README.md). Never share either private key.');
