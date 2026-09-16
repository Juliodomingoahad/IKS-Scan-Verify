importScripts('https://cdn.jsdelivr.net/npm/@sythos/js_barcode_universal@1.6.3/bundle/sythos-barcode.js');
const S=globalThis.SythosBarcode;
function run(img){
  if(!S) throw Error('Decoder library not loaded');
  const opts=[
    {formats:['dotcode'],tryHarder:true,binarizer:'hybrid'},
    {formats:['dotcode'],tryHarder:true,binarizer:'global'}
  ];
  for(const o of opts){
    try{const r=S.decode(img,o)||[]; const hit=r.find(x=>x&&x.text); if(hit)return hit;}catch(e){}
  }
  return null;
}
self.onmessage=e=>{
  const {data,width,height}=e.data;
  try{ const hit=run({data:new Uint8ClampedArray(data),width,height}); self.postMessage({ok:true,hit:hit?{text:hit.text,format:hit.format}:null}); }
  catch(err){ self.postMessage({ok:false,error:String(err&&err.message||err)}); }
};
