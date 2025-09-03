/***** 導覽列 & 購物車 *****/
// 徽章顯示目前購物車數量（依 localStorage）
(function syncCartBadge(){
  const badge = document.getElementById('cart-count');
  if (!badge) return;
  try {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const count = Array.isArray(cart) ? cart.reduce((s, it) => s + (Number(it.qty)||0), 0) : 0;
    badge.textContent = count;
  } catch(e){
    badge.textContent = 0;
  }
})();

// 不要再攔截 #cart-icon 的點擊，讓 <a href="cart.html"> 正常導頁


// 首頁透明導覽列滾動切換（內頁帶 scrolled 就不處理）
const navbar = document.querySelector(".navbar");
if (navbar && !navbar.classList.contains("scrolled")) {
  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) navbar.classList.add("scrolled");
    else navbar.classList.remove("scrolled");
  });
}

/***** 全部作品頁（products.html）邏輯 *****/
/* =======================全站共用：購物車工具======================= */
const CART_KEY = 'cart';

/** 讀取購物車陣列 */
function readCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch (e) { return []; }
}

/** 寫回購物車並刷新徽章 */
function writeCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

/** 取得數量總和 */
function getCartCount() {
  return readCart().reduce((sum, it) => sum + (Number(it.qty) || 0), 0);
}

/** 刷新右上角徽章（跨頁通用） */
function updateCartBadge() {
  const badge = document.getElementById('cart-count');
  if (badge) badge.textContent = getCartCount();
}

/** 專供加入購物車呼叫 */
function addToCart(item) {
  // item 需含 {id, title, price, img}；qty 預設 +1
  const cart = readCart();
  const hit  = cart.find(p => String(p.id) === String(item.id));
  if (hit) hit.qty = (Number(hit.qty) || 0) + 1;
  else cart.push({ ...item, qty: 1 });
  writeCart(cart);
}

// 進站/換頁 → 同步徽章
document.addEventListener('DOMContentLoaded', updateCartBadge);


/* =======================全部作品頁（products.html）======================= */
const productGrid = document.getElementById('product-grid');
if (productGrid) {
  // Demo 產品資料（可改為從後端載入）
  const products = [
    { id: 'p-1', title: '手作茶杯',  category: '茶具', price: 880,  img: 'https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?w=800' },
    { id: 'p-2', title: '拉胚碗',    category: '碗盤', price: 1280, img: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800' },
    { id: 'p-3', title: '釉燒花器',  category: '花器', price: 1680, img: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=800' },
    { id: 'p-4', title: '咖啡杯',    category: '茶具', price: 980,  img: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=800' },
    { id: 'p-5', title: '甜點盤',    category: '碗盤', price: 640,  img: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=800' },
    { id: 'p-6', title: '迷你花瓶',  category: '花器', price: 520,  img: 'https://images.unsplash.com/photo-1503602642458-232111445657?w=800' },
    { id: 'p-7', title: '抹茶碗',    category: '茶具', price: 1980, img: 'https://images.unsplash.com/photo-1497515114629-f71d768fd07c?w=800' },
    { id: 'p-8', title: '深口盤',    category: '碗盤', price: 1120, img: 'https://images.unsplash.com/photo-1498654200943-1088dd4438ae?w=800' }
  ];

  // 篩選/排序控制
  const searchInput  = document.getElementById('search-input');
  const searchBtn    = document.getElementById('search-btn');
  const sortSelect   = document.getElementById('sort-select');
  const resultInfo   = document.getElementById('result-info');
  const categoryList = document.getElementById('category-list');

  // 產生分類複選
  const catSet = Array.from(new Set(products.map(p => p.category)));
  catSet.forEach(cat => {
    const el = document.createElement('label');
    el.className = 'list-group-item d-flex align-items-center gap-2';
    el.innerHTML = `
      <input class="form-check-input me-1 category-check" type="checkbox" value="${cat}">
      <span>${cat}</span>`;
    categoryList.appendChild(el);
  });

  // 狀態
  const state = { q: '', cats: new Set(), sort: 'popular' };

  // 渲染產品卡
  function render(list) {
    productGrid.innerHTML = '';
    list.forEach(p => {
      const col = document.createElement('div');
      col.className = 'col-6 col-md-4 col-lg-3';
      col.innerHTML = `
        <div class="card h-100 product-card">
          <img src="${p.img}" class="card-img-top" alt="${p.title}">
          <div class="card-body d-flex flex-column">
            <h6 class="card-title mb-2 text-truncate">${p.title}</h6>
            <div class="mt-auto d-flex justify-content-between align-items-center">
              <span class="fw-bold">NT$ ${p.price.toLocaleString()}</span>
              <button class="btn btn-sm btn-outline-dark add-to-cart" data-id="${p.id}">
                <i class="bi bi-cart-plus"></i>
              </button>
            </div>
          </div>
        </div>`;
      productGrid.appendChild(col);
    });

    // 更新筆數
    if (resultInfo) resultInfo.textContent = `共 ${list.length} 件商品`;
  }

  // 事件：加入購物車（事件代理，避免重新渲染後事件消失）
  productGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.add-to-cart');
    if (!btn) return;
    const id = String(btn.dataset.id);
    const p  = products.find(x => String(x.id) === id);
    if (!p) return;

    addToCart({ id: p.id, title: p.title, price: p.price, img: p.img });
  });

  // 篩選/排序
  function getFiltered() {
    let arr = products.slice();
    if (state.q) {
      const q = state.q.toLowerCase();
      arr = arr.filter(p => p.title.toLowerCase().includes(q));
    }
    if (state.cats.size) arr = arr.filter(p => state.cats.has(p.category));
    if (state.sort === 'price-asc')  arr.sort((a,b)=> a.price - b.price);
    if (state.sort === 'price-desc') arr.sort((a,b)=> b.price - a.price);
    return arr;
  }
  function doSearch(){ state.q = (searchInput.value || '').trim(); render(getFiltered()); }

  searchBtn.addEventListener('click', doSearch);
  searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
  sortSelect.addEventListener('change', () => { state.sort = sortSelect.value; render(getFiltered()); });
  categoryList.addEventListener('change', e => {
    if (!e.target.classList.contains('category-check')) return;
    const v = e.target.value;
    e.target.checked ? state.cats.add(v) : state.cats.delete(v);
    render(getFiltered());
  });

  // 初次渲染
  render(products);
}





/***** 最新消息頁（news.html）邏輯 *****/
const postList = document.getElementById("post-list");
if (postList) {
  // 模擬文章資料：之後可接後端或 CMS
  const posts = [
    {
      id: 101,
      title: "釉色實驗紀錄：窯內不同溫區的變化",
      category: "創作筆記",
      date: "2025-04-16",
      cover: "https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?w=1200",
      excerpt: "這次以還原氣氛測試青瓷釉，記錄同一批試片在上下層的差異，並整理配方、保溫時間與開窯觀察。",
      url: "#"
    },
    {
      id: 102,
      title: "手拉胚教學：新手從零到完成杯",
      category: "工作坊",
      date: "2025-03-07",
      cover: "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=1200",
      excerpt: "整理入門手拉胚的重點與易犯錯誤：土團準備、定中心、拉高、定型與修坯，內含課程影片回放連結。",
      url: "#"
    },
    {
      id: 103,
      title: "展覽公告：『土與火之歌』聯展",
      category: "展覽活動",
      date: "2025-02-18",
      cover: "https://images.unsplash.com/photo-1503602642458-232111445657?w=1200",
      excerpt: "與三位陶藝家聯合展出，展期三週，現場可體驗杯盤刻紋，歡迎蒞臨交流。",
      url: "#"
    },
    {
      id: 104,
      title: "新釉色試燒心得與參數",
      category: "創作筆記",
      date: "2025-08-27",                  // YYYY-MM-DD
      cover: "https://images.unsplash.com/photo-1629440400842-9108c0ccf336?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8dGVhcG90fGVufDB8fDB8fHww", // 圖片網址或相對路徑
      excerpt: "記錄本次還原氣氛下的配方比例、升溫曲線與開窯觀察。",
      url: "post.html?id=104"               // 未來要做文章內頁可用這種連結
    }

  ];

  const byDateDesc = (a,b)=> new Date(b.date) - new Date(a.date);
  posts.sort(byDateDesc);

  // 側欄：分類
  const postCategories = document.getElementById("post-categories");
  const cats = Array.from(new Set(posts.map(p=>p.category)));
  cats.forEach(c=>{
    const el = document.createElement("a");
    el.href = "#";
    el.className = "list-group-item list-group-item-action";
    el.textContent = c;
    el.addEventListener("click", (e)=>{
      e.preventDefault();
      state.cat = (state.cat === c) ? "" : c;
      render();
    });
    postCategories.appendChild(el);
  });

  // 側欄：近期文章
  const recentWrap = document.getElementById("recent-posts");
  posts.slice(0,5).forEach(p=>{
    const el = document.createElement("a");
    el.href = p.url;
    el.className = "recent-item text-decoration-none text-reset";
    el.innerHTML = `
      <img src="${p.cover}" alt="${p.title}">
      <div>
        <div class="fw-semibold">${p.title}</div>
        <div class="text-muted">${p.date}</div>
      </div>`;
    recentWrap.appendChild(el);
  });

  // 搜尋狀態
  const state = { q:"", cat:"" };
  const searchInput = document.getElementById("post-search");
  const searchBtn   = document.getElementById("post-search-btn");

  searchBtn.addEventListener("click", doSearch);
  searchInput.addEventListener("keydown", e=>{ if (e.key === "Enter") doSearch(); });
  function doSearch(){ state.q = (searchInput.value||"").trim(); render(); }

  //渲染時，每篇文章外層包一個 .col，讓 Bootstrap 幫你一列兩張排好文章小卡
  function render(){
    postList.innerHTML = "";
    let list = posts.slice();

    if (state.q) {
      const q = state.q.toLowerCase();
      list = list.filter(p => p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q));
    }
    if (state.cat) list = list.filter(p => p.category === state.cat);

  list.forEach(p=>{
    // 讓 row-cols-* 決定每列幾張
    const col = document.createElement("div");
    col.className = "col";   // 不要再用 Masonry 或固定寬，交給 row-cols

    const d = new Date(p.date);
    const month = (d.getMonth()+1).toString().padStart(2,"0");
    const day   = d.getDate().toString().padStart(2,"0");

    col.innerHTML = `
      <article class="post-card h-100">
        <div class="post-cover">
          <img src="${p.cover}" alt="${p.title}">
          <div class="post-date"><div class="day">${day}</div><div class="month">${month} 月</div></div>
          <div class="post-category">${p.category}</div>
        </div>
        <div class="post-body">
          <h3 class="post-title">${p.title}</h3>
          <p class="post-excerpt">${p.excerpt}</p>
          <a class="post-read text-decoration-none" href="${p.url}">繼續閱讀</a>
        </div>
      </article>`;
    postList.appendChild(col);
  });
}

  render();
}


// 手機選單開/關時鎖住背景捲動，並提供 nav-open 這個狀態讓 CSS 覆蓋顏色
(function(){
  const nav = document.querySelector('.navbar .navbar-collapse');
  if (!nav) return;
  nav.addEventListener('shown.bs.collapse', () => document.body.classList.add('nav-open'));
  nav.addEventListener('hidden.bs.collapse', () => document.body.classList.remove('nav-open'));
})();






