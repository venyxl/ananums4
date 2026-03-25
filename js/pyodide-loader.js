// ═══════════════════════════════════════
//  PYODIDE LOADER
//  Charge Python dans le navigateur
// ═══════════════════════════════════════

let pyodideInstance = null;
let pyodideReady    = false;

async function loadPyodideAndPackages() {
  if (pyodideReady) return pyodideInstance;

  showPyodideStatus('⏳ Chargement de Python...');

  try {
    // Charger Pyodide
    pyodideInstance = await loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.0/full/'
    });

    showPyodideStatus('📦 Chargement des bibliothèques...');

    // Charger les bibliothèques Python
    await pyodideInstance.loadPackage(['numpy', 'sympy', 'matplotlib']);

    pyodideReady = true;
    showPyodideStatus('✅ Python prêt !', true);

    return pyodideInstance;

  } catch (err) {
    showPyodideStatus('❌ Erreur de chargement : ' + err.message);
    console.error('Pyodide error:', err);
  }
}

// ═══════════════════════════════════════
//  AFFICHER LE STATUT DE CHARGEMENT
// ═══════════════════════════════════════

function showPyodideStatus(message, success = false) {
  const el = document.getElementById('pyodide-status');
  if (!el) return;

  el.textContent = message;
  el.style.color = success ? 'var(--accent)' : 'var(--text-secondary)';

  if (success) {
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transition = 'opacity 1s ease';
    }, 2000);
  }
}

// ═══════════════════════════════════════
//  EXÉCUTER DU CODE PYTHON
// ═══════════════════════════════════════

async function runPython(code) {
  const pyodide = await loadPyodideAndPackages();
  try {
    const result = await pyodide.runPythonAsync(code);
    return { success: true, result };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ═══════════════════════════════════════
//  AFFICHER ERREUR DANS L'UI
// ═══════════════════════════════════════

function showError(containerId, message) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `
    <div style="
      background: #fee2e2;
      border: 1px solid #f87171;
      border-radius: 8px;
      padding: 16px;
      color: #991b1b;
      font-size: 0.9rem;
    ">
      ❌ <strong>Erreur :</strong> ${message}
    </div>
  `;
}

// ═══════════════════════════════════════
//  AFFICHER RÉSULTAT DANS L'UI
// ═══════════════════════════════════════

function showResult(containerId, content) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = content;
  el.classList.add('visible');
}