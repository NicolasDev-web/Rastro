import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { loadBundle } from '../lib/validation-bundle.mjs';

function fixture(t, change) {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rastro-bundle-'));
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const id='a'.repeat(64), snapshot='b'.repeat(64), sources={DEMO:'c'.repeat(64)};
  const data={ 'ce-municipios':{municipalities:[],non_municipal:[],years:[2025]}, autores:{authors:[],collective:[],years:[2025]}, emendas:{emendas:{}}, municipios:{municipios:{}} };
  const manifest={version:1,id,snapshot,document_sources:sources,files:{}};
  for(const [prefix,fields] of Object.entries(data)){
    const raw={kind:'VALIDACAO',snapshot:{raw_sha256:snapshot},document_sources:sources,...fields};
    change?.(prefix,raw);
    const content=JSON.stringify(raw), file=`bundles/${id}/${prefix}.json`;
    fs.mkdirSync(path.dirname(path.join(dir,file)),{recursive:true}); fs.writeFileSync(path.join(dir,file),content);
    manifest.files[prefix]={path:file,sha256:createHash('sha256').update(content).digest('hex')};
  }
  fs.writeFileSync(path.join(dir,'active-bundle.json'),JSON.stringify(manifest));
  return {dir,manifest};
}
test('pacote completo carrega',t=>assert.ok(loadBundle(fixture(t).dir).emendas));
for(const [name,mutation] of [
  ['snapshot diferente',r=>r.snapshot.raw_sha256='other'],
  ['modo errado',r=>r.kind='DEMO_ONLY'],
  ['documentos incompatíveis',r=>r.document_sources={DEMO:'other'}],
  ['estrutura inválida',r=>r.emendas=[]],
  ['dinheiro inválido',r=>r.emendas={DEMO:{pago:'100'}}],
]) test(name,t=>assert.throws(()=>loadBundle(fixture(t,(prefix,raw)=>{if(prefix==='emendas')mutation(raw);}).dir)));
test('hash alterado e arquivo ausente bloqueiam o conjunto',t=>{
  const {dir,manifest}=fixture(t); const file=path.join(dir,manifest.files.emendas.path);
  fs.appendFileSync(file,' '); assert.throws(()=>loadBundle(dir));
  fs.unlinkSync(file); assert.throws(()=>loadBundle(dir));
});
