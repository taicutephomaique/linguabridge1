const LANGUAGES = new Set(['vi','en','zh-CN','ja','de','ko']);
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Chỉ hỗ trợ POST.'});}
 const {text,source,target}=req.body||{};
 if(typeof text!=='string'||!text.trim()||text.length>450||!LANGUAGES.has(source)||!LANGUAGES.has(target))return res.status(400).json({error:'Văn bản hoặc ngôn ngữ không hợp lệ.'});
 if(source===target)return res.status(200).json({translatedText:text.trim()});
 try{
  const params=new URLSearchParams({q:text.trim(),langpair:source+'|'+target});
  const response=await fetch('https://api.mymemory.translated.net/get?'+params.toString(),{signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw new Error('Dịch vụ không phản hồi.');
  const data=await response.json();
  if(Number(data.responseStatus)!==200||!data.responseData?.translatedText)throw new Error('Dịch vụ chưa trả về bản dịch.');
  return res.status(200).json({translatedText:data.responseData.translatedText});
 }catch{return res.status(502).json({error:'Dịch vụ dịch tạm thời không khả dụng hoặc hết lượt miễn phí. Hãy thử lại sau.'});}
}
