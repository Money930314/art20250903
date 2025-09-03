// 分頁切換
(function(){
  const tabs = document.querySelectorAll('.auth-tab');
  const signin = document.getElementById('form-signin');
  const signup = document.getElementById('form-signup');

  if (!tabs.length) return;

  tabs.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      tabs.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');

      const target = btn.dataset.target;
      signin.classList.toggle('d-none', target !== '#form-signin');
      signup.classList.toggle('d-none', target !== '#form-signup');
    });
  });

  // 簡易驗證（需要接後端時把 alert 換成 fetch/axios）
  function wire(form, type){
    form.addEventListener('submit', e=>{
      if (!form.checkValidity()){
        e.preventDefault(); e.stopPropagation();
      } else {
        e.preventDefault();
        // TODO: 呼叫登入/註冊 API
        alert(type === 'in' ? '已送出登入' : '已送出註冊');
      }
      form.classList.add('was-validated');
    });
  }
  wire(signin, 'in');
  wire(signup, 'up');
})();

// 手機選單開/關時鎖住背景捲動（避免底下卡片跟著動）
(function(){
  const nav = document.querySelector('.navbar .navbar-collapse');
  if (!nav) return;
  nav.addEventListener('shown.bs.collapse', () => document.body.classList.add('nav-open'));
  nav.addEventListener('hidden.bs.collapse', () => document.body.classList.remove('nav-open'));
})();
