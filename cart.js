/* =============== 基本工具（全站一致） =============== */
const CART_KEY = 'cart';

function readCart(){
  try{
    const arr = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    return Array.isArray(arr) ? arr : [];
  }catch(e){ return []; }
}
function writeCart(list){
  localStorage.setItem(CART_KEY, JSON.stringify(list));
  updateBadge();
}
function updateBadge(){
  const n = readCart().reduce((s, it)=> s + (Number(it.qty)||0), 0);
  const badge = document.getElementById('cart-count');
  if (badge) badge.textContent = n;
}

/* =============== 舊 key 遷移（防止「有數量、沒清單」） =============== */
function migrateLegacyKeys(){
  const candidates = ['cartItems','shoppingCart','productsInCart','myCart'];
  let merged = readCart();

  candidates.forEach(k=>{
    const raw = localStorage.getItem(k);
    if(!raw) return;
    try{
      const arr = JSON.parse(raw);
      if(Array.isArray(arr)){
        arr.forEach(x=>{
          // 嘗試對齊欄位
          const item = {
            id   : x.id ?? x.productId ?? x.sku ?? crypto.randomUUID(),
            title: x.title ?? x.name ?? '未命名商品',
            price: Number(x.price ?? x.unitPrice ?? 0),
            img  : x.img ?? x.image ?? '',
            qty  : Number(x.qty ?? x.quantity ?? 1)
          };
          if(!item.id) return;
          const hit = merged.find(m => String(m.id) === String(item.id));
          if(hit) hit.qty += item.qty;
          else merged.push(item);
        });
      }
      // 合併完就移除舊 key，避免下次又疊一次
      localStorage.removeItem(k);
    }catch(e){}
  });

  writeCart(merged);
}

/* =============== DOM 參考 =============== */
const listEl     = document.getElementById('cart-list');
const emptyEl    = document.getElementById('cart-empty');
const subtotalEl = document.getElementById('cart-subtotal');

/* =============== 渲染 =============== */
function money(n){ return 'NT$ ' + (Number(n)||0).toLocaleString(); }

function render(){
  const cart = readCart();

  // 空車顯示
  if(cart.length === 0){
    emptyEl?.classList.remove('d-none');
    listEl.innerHTML = '';
    subtotalEl.textContent = money(0);
    updateBadge();
    return;
  }else{
    emptyEl?.classList.add('d-none');
  }

  // 建立每筆項目
  listEl.innerHTML = cart.map(it=>{
    return `
      <div class="cart-item" data-id="${it.id}">
        <img src="${it.img || 'https://placehold.co/200x200?text=No+Image'}" alt="${it.title}">
        <div class="flex-grow-1">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <div class="cart-item-title">${it.title}</div>
              <a href="#" class="remove-btn small mt-1 d-inline-block">移除</a>
            </div>
            <div class="cart-item-price">${money(it.price)}</div>
          </div>

          <div class="mt-2 d-flex justify-content-between align-items-center">
            <div class="qty-box">
              <button class="qty-btn btn-minus" aria-label="減少">−</button>
              <input class="qty-input" type="number" min="0" step="1" value="${Number(it.qty)||1}">
              <button class="qty-btn btn-plus" aria-label="增加">＋</button>
            </div>
            <div class="text-muted small">小計：<strong>${money(it.price * (Number(it.qty)||0))}</strong></div>
          </div>
        </div>
      </div>`;
  }).join('');

  // 小計
  const subtotal = cart.reduce((s, it)=> s + (Number(it.price)||0) * (Number(it.qty)||0), 0);
  subtotalEl.textContent = money(subtotal);

  // 徽章
  updateBadge();
}

/* =============== 事件：增減 / 輸入 / 移除 =============== */
listEl?.addEventListener('click', e=>{
  const itemEl = e.target.closest('.cart-item');
  if(!itemEl) return;
  const id = itemEl.dataset.id;
  let cart = readCart();
  const idx = cart.findIndex(x => String(x.id) === String(id));
  if(idx < 0) return;

  if(e.target.classList.contains('btn-minus')){
    cart[idx].qty = Math.max(0, (Number(cart[idx].qty)||0) - 1);
  }
  if(e.target.classList.contains('btn-plus')){
    cart[idx].qty = (Number(cart[idx].qty)||0) + 1;
  }
  if(e.target.classList.contains('remove-btn')){
    e.preventDefault();
    cart.splice(idx,1);
  }

  // qty = 0 視同移除
  cart = cart.filter(x => (Number(x.qty)||0) > 0);
  writeCart(cart);
  render();
});

listEl?.addEventListener('change', e=>{
  if(!e.target.classList.contains('qty-input')) return;
  const itemEl = e.target.closest('.cart-item');
  const id = itemEl.dataset.id;
  let cart = readCart();
  const idx = cart.findIndex(x => String(x.id) === String(id));
  if(idx < 0) return;

  const v = Math.max(0, Number(e.target.value)||0);
  if(v === 0) cart.splice(idx,1);
  else cart[idx].qty = v;
  writeCart(cart);
  render();
});

/* =============== 初始化 =============== */
document.addEventListener('DOMContentLoaded', ()=>{
  migrateLegacyKeys(); // 先把舊 key 合併成 cart
  updateBadge();
  render();

  // 讓導覽列在頂部時也有正確顏色
  const nav = document.querySelector('.navbar');
  if(nav){
    function onScroll(){ window.scrollY > 10 ? nav.classList.add('scrolled') : nav.classList.remove('scrolled'); }
    document.addEventListener('scroll', onScroll, {passive:true});
    onScroll();
  }

  // 假結帳
  const checkout = document.getElementById('checkout-btn');
  checkout?.addEventListener('click', ()=>{
    if(readCart().length === 0) return alert('購物車是空的。');
    alert('這裡導到你的金流/結帳頁。');
  });
});
