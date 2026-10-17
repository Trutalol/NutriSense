import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const server = http.createServer(async(req,res)=>{try{const name=decodeURIComponent(req.url.split('?')[0]);const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}const body=await readFile(file);res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript'})[path.extname(file)]||'text/plain');res.end(body);}catch{res.writeHead(404);res.end('Not found');}});

let port = 5173;
server.on('error', error => {
  if (error.code === 'EADDRINUSE' && port < 5193) {
    console.log(`Port ${port} is in use; trying ${port + 1}...`);
    server.listen(++port, '127.0.0.1');
    return;
  }
  console.error(`Unable to start preview: ${error.message}`);
  process.exitCode = 1;
});
server.on('listening', () => console.log(`Local: http://127.0.0.1:${port}`));
server.listen(port, '127.0.0.1');
