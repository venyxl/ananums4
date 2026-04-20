// ═══════════════════════════════════════
//  THEME MANAGER
// ═══════════════════════════════════════

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  document.querySelectorAll('.theme-dot').forEach(dot => {
    dot.classList.remove('active');
    if (dot.classList.contains(theme)) dot.classList.add('active');
  });
}

function loadTheme() {
  const saved = localStorage.getItem('theme') || 'system';
  setTheme(saved);
}

// ═══════════════════════════════════════
//  LANGUAGE MANAGER
// ═══════════════════════════════════════

async function setLang(lang) {
  localStorage.setItem('lang', lang);
  try {
    const file = lang === 'es' ? 'sp' : lang;
    const isRoot = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
    const basePath = isRoot ? './locales/' : '../locales/';
    const response = await fetch(`${basePath}${file}.json`);
    const t = await response.json();
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (t[key]) el.innerHTML = t[key];
    });
    const select = document.querySelector('.lang-select');
    if (select) select.value = lang;
  } catch (err) {
    console.error('Erreur chargement traduction:', err);
  }
}

async function loadLang() {
  const saved = localStorage.getItem('lang') || 'fr';
  await setLang(saved);
}

// ═══════════════════════════════════════
//  COPY CODE BUTTON
// ═══════════════════════════════════════

function copyCode(btn) {
  const block = btn.closest('.code-block');
  const code  = block.querySelector('code');
  navigator.clipboard.writeText(code.innerText).then(() => {
    btn.textContent = '✅ Copié !';
    setTimeout(() => btn.textContent = '📋 Copier', 2000);
  });
}

// ═══════════════════════════════════════
//  INIT
// ═══════════════════════════════════════

document.addEventListener('DOMContentLoaded', async () => {
  loadTheme();
  await loadLang();
});