(function(){
  // Clean up previous versions if they exist
  document.querySelector('#briefly-chat-wrapper')?.remove();
  document.querySelector('#openChatbotBtn')?.remove();

  // Create wrapper + open button
  const wrapperHTML = `
  <div id="briefly-chat-wrapper" style="position:fixed;bottom:20px;right:20px;z-index:2147483647;
    font-family:Arial,Helvetica,sans-serif;max-width:420px;width:100%;display:none;">
    <style>
      #briefly-chat {
        border-radius:12px;
        box-shadow:0 6px 18px rgba(0,0,0,0.12);
        overflow:hidden;
        position: relative;
      }
      .bc-header {
        background:#0f172a;color:#fff;padding:12px 16px;font-weight:700;
        display:flex;justify-content:space-between;align-items:center;
      }
      .bc-header-title { flex-grow:1; }
      .bc-controls { display: flex; gap: 8px; }
      .bc-control-btn { background: none; border: none; color: white; font-size: 1.1em; cursor: pointer; padding: 0 4px; }
      .bc-body { padding:14px;background:#fff;min-height:220px;max-height:400px;overflow-y:auto; }
      .bc-msg { margin:8px 0;padding:10px 14px;border-radius:18px;line-height:1.4;display:table;clear:both; }
      .bc-user { text-align:right;background-color:#0b5cff;color:white;margin-left:auto;max-width:80%;border-bottom-right-radius:4px; }
      .bc-bot { text-align:left;background-color:#e0f2f1;color:#333;margin-right:auto;max-width:80%;border-bottom-left-radius:4px; }
      .bc-input { display:flex;gap:8px;padding:12px;background:#f6f7fb; }
      .bc-input input,.bc-input select { flex:1;padding:8px;border-radius:6px;border:1px solid #e2e8f0;background-color:#e0f2f1; }
      .bc-input select.bc-country-code { flex: 0 0 auto; width: 80px; }
      .bc-btn { background:#0b5cff;color:white;border:none;padding:8px 12px;border-radius:6px;cursor:pointer; }
      .bc-option { margin:6px;padding:10px;border-radius:8px;background:#28a745;color:white;
        cursor:pointer;text-align:center;flex:1 1 45%;box-sizing:border-box; }
      .bc-cta { display:flex;flex-wrap:wrap;justify-content:flex-start;margin-top:10px; }
      .typing-dots { font-size: 1.2em; color: #999; display: inline-block; }
    </style>

    <div id="briefly-chat">
      <div class="bc-header">
        <span class="bc-header-title">BRIEFLY - Get the course that fits you</span>
        <div class="bc-controls">
          <button class="bc-control-btn" id="bcMinimize">_</button>
          <button class="bc-control-btn" id="bcClose">X</button>
        </div>
      </div>
      <div class="bc-body" id="bcBody">
        <div class="bc-msg bc-bot">Hi - I’ll ask a few quick questions to see how we can help. Ready?</div>
      </div>
      <div class="bc-input" id="bcInputContainer"></div>
    </div>
  </div>`;

  const openBtnHTML = `
  <button id="openChatbotBtn" style="
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 2147483647;
    background-color: black;
    color: white;
    border: none;
    border-radius: 8px;
    width: 60px;
    height: 60px;
    font-size: 0.9em;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
">
    •BRIEFLY•
    <div id="bcNotifBadge" style="
        position: absolute;
        top: -5px;
        right: -5px;
        background: red;
        color: white;
        font-size: 12px;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        font-weight: bold;
        z-index: 10000;
    ">1</div>
</button>`;

  document.body.insertAdjacentHTML('beforeend', wrapperHTML);
  document.body.insertAdjacentHTML('beforeend', openBtnHTML);

  const chatWrapper = document.getElementById('briefly-chat-wrapper');
  const chatBody = document.getElementById('bcBody');
  const inputContainer = document.getElementById('bcInputContainer');
  const closeBtn = document.getElementById('bcClose');
  const minimizeBtn = document.getElementById('bcMinimize');
  const openBtn = document.getElementById('openChatbotBtn');
  const notifBadge = document.getElementById('bcNotifBadge');

  const countries = [
    { name:'South Africa', code:'+27', digits:9 },
    { name:'United States', code:'+1', digits:10 },
    { name:'United Kingdom', code:'+44', digits:10 },
    { name:'Australia', code:'+61', digits:9 },
    { name:'India', code:'+91', digits:10 },
    { name:'Germany', code:'+49', digits:10 },
    { name:'France', code:'+33', digits:9 }
  ];

  const questions = [
    {id:'name', q:"What's your full name?", type:'text'},
    {id:'phone', q:"Contact number?", type:'phone'},
    {id:'email', q:"Email to access course materials?", type:'email'},
    {id:'consent', q:"Do you consent to us contacting you about this course?", type:'options', options:['Yes','No']},
    {id:'plan', q:"Which plan would you consider buying today?", type:'options',
      options:['VIP - R7,199','Standard - R1,199','Basic - R999','Unsure']},
    {id:'start', q:"How soon do you want to start?", type:'options',
      options:['Immediately','Within 1 week','Within 3-4 weeks','Just exploring']}
  ];

  let answers = {};
  let idx = 0;
  const initialMessage = "Hi - I’ll ask a few quick questions to see how we can help. Ready?";

  // New typing function
  function showTyping(callback) {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'bc-msg bc-bot';
    typingDiv.innerHTML = '<span class="typing-dots">• • •</span>';
    chatBody.appendChild(typingDiv);
    chatBody.scrollTop = chatBody.scrollHeight;

    let dots = 0;
    const interval = setInterval(() => {
      dots = (dots + 1) % 4;
      typingDiv.innerHTML = '<span class="typing-dots">' + '•'.repeat(dots) + '</span>';
    }, 400);

    setTimeout(() => {
      clearInterval(interval);
      chatBody.removeChild(typingDiv);
      callback();
    }, 500 + Math.random() * 300); // Adjusted from 1200
  }

  function addMsg(msg, cls='bc-bot'){
    const d=document.createElement('div');
    d.className=`bc-msg ${cls}`;
    d.innerText=msg;
    chatBody.appendChild(d);
    chatBody.scrollTop=chatBody.scrollHeight;
  }

  function resetChat() {
    chatBody.innerHTML = `<div class="bc-msg bc-bot">${initialMessage}</div>`;
    idx = 0;
    answers = {};
    inputContainer.innerHTML = ''; // Clear input area as well
    askNext(); // Restart conversation flow
  }

  function askNext(){
    if(idx>=questions.length){
      showTyping(()=>addMsg("Thanks! One of our team will reach out soon."));
      inputContainer.innerHTML='';
      return;
    }
    const q=questions[idx];
    showTyping(()=>addMsg(q.q));
    renderInput(q);
  }

  function handleSend(q, inputElement, selectElement = null) {
    let val;
    if (q.type === 'phone') {
      const code = selectElement.value;
      const rawVal = inputElement.value.replace(/\D/g, '');
      const country = countries.find(c => c.code === code);
      if (!country || rawVal.length !== country.digits) {
        alert(`Please enter a valid ${country ? country.name : 'selected'} number (${country ? country.digits : ''} digits).`);
        return;
      }
      val = code + rawVal;
    } else {
      val = inputElement.value.trim();
      if (!val && q.id !== 'other') { alert('Please enter a response'); return; }
      if (q.type === 'email') {
        const regex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
        if (!regex.test(val)) { alert('Please enter a valid email address.'); return; }
      }
    }
    
    answers[q.id] = val;
    addMsg(val, 'bc-user');
    idx++;
    askNext();
  }

  function renderInput(q){
    inputContainer.innerHTML='';
    if(q.type==='options'){
      const c=document.createElement('div');
      c.className='bc-cta';
      q.options.forEach(o=>{
        const b=document.createElement('div');
        b.className='bc-option';
        b.innerText=o;
        b.onclick=()=>{answers[q.id]=o;addMsg(o,'bc-user');idx++;askNext();};
        c.appendChild(b);
      });
      inputContainer.appendChild(c);
    } else if(q.type==='phone'){
      const select=document.createElement('select');
      select.className = 'bc-country-code'; // Apply new smaller class
      countries.forEach(c=>{
        const opt=document.createElement('option');
        opt.value=c.code;
        opt.textContent=`${c.flag||''} ${c.code}`; // Display only code and flag in select
        select.appendChild(opt);
      });
      const input=document.createElement('input');
      input.type='tel';
      input.placeholder='Enter phone number';
      const btn=document.createElement('button');
      btn.className='bc-btn';
      btn.textContent='Send';
      btn.onclick=() => handleSend(q, input, select);
      input.onkeyup = (e) => { if (e.key === 'Enter') handleSend(q, input, select); };
      inputContainer.append(select,input,btn);
    } else {
      const input=document.createElement('input');
      input.type=q.type;
      input.placeholder=q.type==='email'?'Enter email address':'Type your answer';
      const btn=document.createElement('button');
      btn.className='bc-btn';
      btn.textContent='Send';
      btn.onclick=() => handleSend(q,input);
      input.onkeyup = (e) => { if (e.key === 'Enter') handleSend(q, input); };
      inputContainer.append(input,btn);
    }
    // Focus on the input field if it's a text/phone input
    const currentInput = inputContainer.querySelector('input');
    if (currentInput) {
      currentInput.focus();
    }
  }

  openBtn.onclick=()=>{
    chatWrapper.style.display='block'; // Show chat
    openBtn.style.display='none'; // Hide open button
    notifBadge.style.display = 'none'; // Hide notification badge when chat opens
  };

  closeBtn.onclick=()=>{
    chatWrapper.style.display='none'; // Hide chat
    openBtn.style.display='flex'; // Show open button
    notifBadge.style.display = 'flex'; // Show notification badge when chat closes
    resetChat(); // Reset chat when closing
  };

  minimizeBtn.onclick = () => {
    chatWrapper.style.display = 'none'; // Hide chat
    openBtn.style.display = 'flex'; // Show open button
    notifBadge.style.display = 'flex'; // Show notification badge when chat minimizes
  };

  // Initial call to ask the first question
  // The first message is already in the HTML, so we start with the first actual question
  inputContainer.innerHTML=''; // Clear input area initially
  askNext();

})();
