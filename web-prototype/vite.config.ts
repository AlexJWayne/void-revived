import { defineConfig } from 'vite';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const path=(name:string)=>fileURLToPath(new URL(`./.certs/${name}`,import.meta.url));
export default defineConfig(({command})=>{
  if(command==='serve'&&!existsSync(path('server-key.pem')))throw new Error('Run npm run cert once before starting HTTPS.');
  const qa=process.env.VOID_QA_HTTP==='1';
  const https=!qa&&existsSync(path('server-key.pem'))?{key:readFileSync(path('server-key.pem')),cert:readFileSync(path('server.pem'))}:undefined;
  return {base:process.env.VITE_BASE_PATH??'/',server:{host:qa?'127.0.0.1':'0.0.0.0',port:qa?5187:5186,strictPort:true,https},preview:{host:'0.0.0.0',port:4186,strictPort:true,https},
    plugins:[{name:'local-public-certificate',configureServer(server){
      server.middlewares.use('/__local-ca.cer',(_req,res)=>{
        res.setHeader('Content-Type','application/x-x509-ca-cert');
        res.setHeader('Content-Disposition','attachment; filename="VOID-local-ca.cer"');
        res.end(readFileSync(path('VOID-local-ca.cer')));
      });
    }}]};
});
