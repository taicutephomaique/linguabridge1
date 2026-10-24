const $ = id => document.getElementById(id);
const source = $('source'), target = $('target'), original = $('original');
const translated = $('translated'), status = $('status'), exercise = $('exercise');
const speechCodes = {vi:'vi-VN', en:'en-US', 'zh-CN':'zh-CN', ja:'ja-JP', de:'de-DE', ko:'ko-KR'};
function message(text){ status.textContent=text; }
$('swap').onclick=()=>{[source.value,target.value]=[target.value,source.value];[original.value,translated.value]=[translated.value,original.value];};
$('translate').onclick=async()=>{
 const text=original.value.trim();
 if(!text)return message('Hãy nhập văn bản cần dịch.');
 if(text.length>450)return message('Vui lòng nhập tối đa 450 ký tự.');
 if(source.value===target.value){translated.value=text;return message('Hai ngôn ngữ giống nhau.');}
 const button=$('translate');button.disabled=true;translated.value='';message('Đang phiên dịch...');
 try{
  const response=await fetch('/api/translate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,source:source.value,target:target.value})});
  const data=await response.json();
  if(!response.ok||!data.translatedText)throw new Error(data.error||'Không thể phiên dịch.');
  translated.value=data.translatedText;message('Đã nhận bản dịch. Hãy kiểm tra nội dung quan trọng.');
 }catch(error){message(error.message||'Có lỗi trong quá trình phiên dịch.');}finally{button.disabled=false;}
};
function speak(text,lang){
 if(!text.trim())return message('Chưa có văn bản để đọc.');
 if(!('speechSynthesis' in window))return message('Trình duyệt không hỗ trợ phát âm.');
 speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text);utterance.lang=speechCodes[lang];utterance.rate=0.85;speechSynthesis.speak(utterance);
}
$('speakSource').onclick=()=>speak(original.value,source.value);
$('speakTarget').onclick=()=>speak(translated.value,target.value);
$('copy').onclick=async()=>{if(!translated.value)return message('Chưa có bản dịch.');try{await navigator.clipboard.writeText(translated.value);message('Đã sao chép.');}catch{message('Không thể sao chép tự động.');}};
function startRecognition(onResult,language){
 const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!Recognition)return message('Trình duyệt chưa hỗ trợ nhận diện giọng nói.');
 const recognition=new Recognition();recognition.lang=speechCodes[language];recognition.interimResults=false;
 recognition.onresult=e=>{onResult(e.results[0][0].transcript);message('Đã nhận diện lời nói.');};
 recognition.onerror=()=>message('Không nhận diện được. Hãy kiểm tra quyền micro.');
 try{recognition.start();message('Đang nghe...');}catch{message('Không thể bật micro.');}
}
$('mic').onclick=()=>startRecognition(text=>{original.value=text;},source.value);
const lessons={reading:{vi:'Xin chào',en:'Hello','zh-CN':'你好',ja:'こんにちは',de:'Hallo',ko:'안녕하세요'},writing:{vi:'Cảm ơn',en:'Thank you','zh-CN':'谢谢',ja:'ありがとう',de:'Danke',ko:'감사합니다'}};
const normalize=text=>text.trim().toLocaleLowerCase().replace(/[.!?。！]/g,'');
document.querySelectorAll('[data-skill]').forEach(button=>button.onclick=()=>openSkill(button.dataset.skill));
function openSkill(skill){
 const lang=target.value,hello=lessons.reading[lang],thanks=lessons.writing[lang];exercise.replaceChildren();
 const title=document.createElement('h3'),description=document.createElement('p'),action=document.createElement('button');action.className='primary';
 const add=(...nodes)=>exercise.append(...nodes);
 if(skill==='reading'){title.textContent='📖 Luyện đọc';description.textContent='Đọc câu: '+hello+'. Câu này nghĩa là Xin chào.';action.textContent='🔊 Nghe câu';action.onclick=()=>speak(hello,lang);add(title,description,action);}
 if(skill==='listening'){title.textContent='🎧 Luyện nghe';description.textContent='Nghe câu và thử nhận ra nội dung trước khi xem đáp án.';action.textContent='▶ Phát âm thanh';action.onclick=()=>speak(hello,lang);const reveal=document.createElement('button');reveal.className='secondary';reveal.textContent='Xem đáp án';reveal.onclick=()=>description.textContent=hello+' = Xin chào';add(title,description,action,document.createTextNode(' '),reveal);}
 if(skill==='speaking'){title.textContent='🎤 Luyện nói';description.textContent='Hãy nói: '+hello;action.textContent='Bắt đầu nói';const result=document.createElement('p');action.onclick=()=>startRecognition(text=>result.textContent='Máy nhận diện: '+text+(normalize(text)===normalize(hello)?' — Trùng văn bản mẫu.':' — Chưa trùng văn bản mẫu.'),lang);add(title,description,action,result);}
 if(skill==='writing'){title.textContent='✍️ Luyện viết';description.textContent="Viết từ 'Cảm ơn' bằng ngôn ngữ đích.";const input=document.createElement('input');input.placeholder='Nhập câu trả lời';const result=document.createElement('p');action.textContent='Kiểm tra';action.onclick=()=>result.textContent=normalize(input.value)===normalize(thanks)?'Chính xác!':'Đáp án tham khảo: '+thanks;add(title,description,input,action,result);}
}
