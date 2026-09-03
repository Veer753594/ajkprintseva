import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const execFileAsync=promisify(execFile);
const CONFIG=path.join(path.dirname(fileURLToPath(import.meta.url)), 'config.json');
const cfg=JSON.parse(await fs.readFile(CONFIG,'utf8'));
const base=String(cfg.apiBase||'').replace(/\/$/,'');
if(!base || !cfg.agentKey) throw new Error('config.json must contain apiBase and agentKey.');
const headers={'x-agent-key':String(cfg.agentKey)};
const dir=cfg.downloadDir||path.join(os.tmpdir(),'AyushJansevaPrintJobs');
await fs.mkdir(dir,{recursive:true});
function log(...a){console.log(new Date().toISOString(),...a)}
async function api(url,opts={}){const r=await fetch(base+url,{...opts,headers:{...headers,...(opts.headers||{})}});if(!r.ok)throw new Error((await r.text()).slice(0,500));return r}
function safeName(s){return String(s||'file').replace(/[^a-zA-Z0-9._ -]/g,'_').slice(0,180)}
function findExisting(candidates){return candidates.find(Boolean) || ''}
function sumatraPath(){
  return String(cfg.sumatraPath||'').trim() || findExisting([
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA,'SumatraPDF','SumatraPDF.exe') : '',
    process.env.ProgramFiles ? path.join(process.env.ProgramFiles,'SumatraPDF','SumatraPDF.exe') : '',
    process.env['ProgramFiles(x86)'] ? path.join(process.env['ProgramFiles(x86)'],'SumatraPDF','SumatraPDF.exe') : ''
  ]);
}
function libreOfficePath(){
  return String(cfg.libreOfficePath||'').trim() || findExisting([
    process.env.ProgramFiles ? path.join(process.env.ProgramFiles,'LibreOffice','program','soffice.exe') : '',
    process.env['ProgramFiles(x86)'] ? path.join(process.env['ProgramFiles(x86)'],'LibreOffice','program','soffice.exe') : ''
  ]);
}
async function download(job){
  const r=await api(job.url); const buf=Buffer.from(await r.arrayBuffer());
  const file=path.join(dir,job.orderId+'-'+job.fileId+'-'+safeName(job.fileName));
  await fs.writeFile(file,buf); return file;
}
async function convertOfficeToPdf(file){
  const ext=path.extname(file).toLowerCase();
  const officeExt=['.doc','.docx','.xls','.xlsx','.ppt','.pptx','.odt','.ods','.odp','.txt','.rtf'];
  if(!officeExt.includes(ext)) return file;
  const soffice=libreOfficePath();
  if(!soffice) throw new Error('Office document received, but LibreOffice is not installed/configured on the shop PC. Install LibreOffice or upload PDF/image.');
  const outDir=path.join(dir,'converted'); await fs.mkdir(outDir,{recursive:true});
  await execFileAsync(soffice,['--headless','--convert-to','pdf','--outdir',outDir,file],{windowsHide:true});
  const pdf=path.join(outDir,path.basename(file,ext)+'.pdf');
  await fs.access(pdf); return pdf;
}
function printSettings(job){
  const tokens=[];
  const copies=Math.max(1,Number(job.copies||1));
  if(copies>1) tokens.push(`${copies}x`);
  tokens.push(job.printType==='bw'?'monochrome':'color');
  tokens.push(job.side==='Double Side' ? (cfg.duplexMode||'duplex') : 'simplex');
  tokens.push('fit','center');
  if(job.printType==='photo' || job.paperType==='Photo Paper') tokens.push('paper=A4');
  else if(cfg.defaultPaper) tokens.push(`paper=${cfg.defaultPaper}`);
  if(cfg.binByPaper && typeof cfg.binByPaper==='object'){
    const bin=cfg.binByPaper[job.paperType] || cfg.binByPaper[job.printType];
    if(bin) tokens.push(`bin=${bin}`);
  }
  return tokens.join(',');
}
async function printFile(file,job){
  const printable=await convertOfficeToPdf(file);
  const sumatra=sumatraPath();
  if(!sumatra) throw new Error('SumatraPDF was not found. Install SumatraPDF and set sumatraPath in config.json.');
  const printer=String(cfg.printerName||'').trim();
  if(!printer) throw new Error('printerName is empty in config.json.');
  const settings=printSettings(job);
  log('Sending to printer:',printer,'settings:',settings,'file:',path.basename(printable));
  await execFileAsync(sumatra,['-silent','-print-to',printer,'-print-settings',settings,printable],{windowsHide:true});
}
async function cleanup(file){try{await fs.unlink(file)}catch{}}
async function loop(){
  try{
    const d=await (await api('/.netlify/functions/agent?action=poll')).json();
    for(const job of d.jobs||[]){
      log('Printing',job.orderId,job.fileName);
      let file='';
      try{
        file=await download(job); await printFile(file,job);
        await api('/.netlify/functions/agent?action=result',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({orderId:job.orderId,fileId:job.fileId,success:true,message:'Printed silently by Windows AutoPrint Agent'})});
        log('Printed OK',job.fileName);
      }catch(e){
        await api('/.netlify/functions/agent?action=result',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({orderId:job.orderId,fileId:job.fileId,success:false,message:e.message})}).catch(()=>{});
        log('Print FAILED',e.message);
      }finally{if(file) await cleanup(file);}
    }
  }catch(e){log('Agent connection error:',e.message)}
}
log('Ayush Janseva AutoPrint Agent started');
log('Server:',base,'Printer:',cfg.printerName||'(not set)');
setInterval(loop,Math.max(2000,Number(cfg.pollMs||3000))); loop();
