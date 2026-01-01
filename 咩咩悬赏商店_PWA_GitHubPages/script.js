(() => {
  const LS_KEY = "mie_mie_bounty_tasks_v1";
  const AVATAR_KEY = "mie_mie_avatar_v1";
  const TAB_KEY = "mie_mie_tab_v1";
  const MAX_STARS = 6;

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  const state = {
    tab: localStorage.getItem(TAB_KEY) || "all",
    tasks: loadTasks(),
  };

  function uid(){ return Math.random().toString(16).slice(2) + Date.now().toString(16); }

  function loadTasks(){
    try{
      const raw = localStorage.getItem(LS_KEY);
      if(!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    }catch{ return []; }
  }

  function saveTasks(){ localStorage.setItem(LS_KEY, JSON.stringify(state.tasks)); }

  function setTab(tab){
    state.tab = tab;
    localStorage.setItem(TAB_KEY, tab);
    $$(".tab").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
    render();
  }

  function statusLabel(status){
    return ({open:"可接单", taken:"已接单", done:"已完成", canceled:"已取消"})[status] || status;
  }

  function starsView(n){
    const row = document.createElement("div");
    row.className = "starRow";
    for(let i=1;i<=MAX_STARS;i++){
      const s = document.createElement("span");
      s.className = "star" + (i<=n ? " on" : "");
      s.textContent = "★";
      row.appendChild(s);
    }
    return row;
  }

  function updateStats(){
    $("#statOpen").textContent = String(state.tasks.filter(t=>t.status==="open").length);
    $("#statTaken").textContent = String(state.tasks.filter(t=>t.status==="taken").length);
    $("#statDone").textContent = String(state.tasks.filter(t=>t.status==="done").length);
  }

  function filteredTasks(){
    const tab = state.tab;
    let arr = [...state.tasks];
    if(tab !== "all") arr = arr.filter(t => t.status === tab);
    arr.sort((a,b)=>b.createdAt - a.createdAt);
    return arr;
  }

  function render(){
    updateStats();
    const list = $("#taskList");
    list.innerHTML = "";
    const arr = filteredTasks();
    $("#emptyState").hidden = arr.length !== 0;

    const tpl = $("#taskTpl");
    for(const task of arr){
      const node = tpl.content.firstElementChild.cloneNode(true);
      node.dataset.id = task.id;

      node.querySelector(".cardTitle").textContent = task.name;
      node.querySelector(".chip.status").textContent = statusLabel(task.status);
      node.querySelector(".badge.money").textContent = `💰 ¥${task.money}`;

      node.querySelector(".starRow").replaceWith(starsView(task.stars));
      node.querySelector(".desc").textContent = (task.detail || "").trim() || "（无详情）";

      const actions = node.querySelector(".cardActions");
      const show = (action, on) => actions.querySelector(`[data-action="${action}"]`).hidden = !on;

      show("take", task.status === "open");
      show("done", task.status === "taken");
      show("cancel", task.status === "open" || task.status === "taken");
      show("reopen", task.status === "done" || task.status === "canceled");
      show("delete", true);

      list.appendChild(node);
    }
  }

  function openModal(){
    $("#modalOverlay").hidden = false;
    $("#nameInput").focus();
  }
  function closeModal(){
    $("#modalOverlay").hidden = true;
    $("#taskForm").reset();
    setStarPicker(0);
  }

  let currentStars = 0;
  function setStarPicker(n){
    currentStars = n;
    const box = $("#starPicker");
    box.innerHTML = "";
    for(let i=1;i<=MAX_STARS;i++){
      const b = document.createElement("button");
      b.type = "button";
      b.className = "starBtn";
      b.textContent = i<=n ? "★" : "☆";
      b.style.opacity = i<=n ? "1" : ".55";
      b.addEventListener("click", ()=>setStarPicker(i));
      box.appendChild(b);
    }
  }

  function loadAvatar(){
    const raw = localStorage.getItem(AVATAR_KEY);
    const img = $("#avatarImg");
    const fallback = $("#avatarFallback");
    if(raw){
      img.src = raw;
      img.style.display = "block";
      fallback.style.display = "none";
    }else{
      img.removeAttribute("src");
      img.style.display = "none";
      fallback.style.display = "grid";
    }
  }

  function fileToDataURL(file, maxSize){
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = () => {
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/png", 0.92));
        };
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function bind(){
    $$(".tab").forEach(b => b.addEventListener("click", () => setTab(b.dataset.tab)));
    $("#newBtn").addEventListener("click", openModal);
    $("#closeModal").addEventListener("click", closeModal);
    $("#modalOverlay").addEventListener("click", (e) => { if(e.target === $("#modalOverlay")) closeModal(); });

    $("#taskForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const name = $("#nameInput").value.trim();
      const money = Number($("#moneyInput").value);
      const detail = $("#detailInput").value.trim();
      if(!name) return;

      state.tasks.unshift({
        id: uid(),
        name,
        money: Number.isFinite(money) ? money : 0,
        stars: currentStars || 0,
        detail,
        status: "open",
        createdAt: Date.now(),
      });

      saveTasks();
      closeModal();
      render();
    });

    $("#taskList").addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if(!btn) return;
      const card = e.target.closest(".card");
      if(!card) return;
      const id = card.dataset.id;
      const action = btn.dataset.action;
      const idx = state.tasks.findIndex(t => t.id === id);
      if(idx < 0) return;

      const t = state.tasks[idx];
      if(action === "take") t.status = "taken";
      if(action === "done") t.status = "done";
      if(action === "cancel") t.status = "canceled";
      if(action === "reopen") t.status = "open";
      if(action === "delete") state.tasks.splice(idx, 1);

      saveTasks();
      render();
    });

    $("#clearBtn").addEventListener("click", () => {
      if(!confirm("确定要清空全部任务吗？此操作不可恢复。")) return;
      state.tasks = [];
      saveTasks();
      render();
    });

    $("#avatarBtn").addEventListener("click", () => $("#avatarFile").click());
    $("#avatarFile").addEventListener("change", async (e) => {
      const file = e.target.files && e.target.files[0];
      if(!file) return;
      const dataUrl = await fileToDataURL(file, 256);
      localStorage.setItem(AVATAR_KEY, dataUrl);
      loadAvatar();
      $("#avatarFile").value = "";
    });
  }

  function registerSW(){
    if(!("serviceWorker" in navigator)) return;
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(()=>{}));
  }

  setStarPicker(0);
  bind();
  setTab(state.tab);
  loadAvatar();
  registerSW();
})();
