// ═══════════════════════════════════════
//  MATH KEYBOARD — Clavier mathématique
//  CORRIGÉ : fonctionne en inline script
// ═══════════════════════════════════════

const MATH_KEYS = [
  { label: 'sin', insert: 'np.sin(', title: 'Sinus' },
  { label: 'cos', insert: 'np.cos(', title: 'Cosinus' },
  { label: 'tan', insert: 'np.tan(', title: 'Tangente' },
  { label: 'arcsin', insert: 'np.arcsin(', title: 'Arcsin' },
  { label: 'arccos', insert: 'np.arccos(', title: 'Arccos' },
  { label: 'arctan', insert: 'np.arctan(', title: 'Arctan' },
  { label: 'sinh', insert: 'np.sinh(', title: 'Sinus hyperbolique' },
  { label: 'cosh', insert: 'np.cosh(', title: 'Cosinus hyperbolique' },
  { label: 'tanh', insert: 'np.tanh(', title: 'Tangente hyperbolique' },
  { label: 'eˣ', insert: 'np.exp(', title: 'Exponentielle' },
  { label: 'ln', insert: 'np.log(', title: 'Logarithme naturel' },
  { label: 'log₁₀', insert: 'np.log10(', title: 'Log base 10' },
  { label: 'log₂', insert: 'np.log2(', title: 'Log base 2' },
  { label: '√x', insert: 'np.sqrt(', title: 'Racine carrée' },
  { label: 'x²', insert: '**2', title: 'Carré' },
  { label: 'x³', insert: '**3', title: 'Cube' },
  { label: 'xⁿ', insert: '**', title: 'Puissance n' },
  { label: '|x|', insert: 'np.abs(', title: 'Valeur absolue' },
  { label: 'π', insert: 'np.pi', title: 'Pi ≈ 3.14159' },
  { label: 'e', insert: 'np.e', title: 'Euler ≈ 2.71828' },
  { label: '(', insert: '(', title: 'Parenthèse ouvrante' },
  { label: ')', insert: ')', title: 'Parenthèse fermante' },
  { label: 'x', insert: 'x', title: 'Variable x' },
  { label: '+', insert: '+', title: 'Addition' },
  { label: '−', insert: '-', title: 'Soustraction' },
  { label: '×', insert: '*', title: 'Multiplication' },
  { label: '/', insert: '/', title: 'Division' },
  { label: 'floor', insert: 'np.floor(', title: 'Partie entière inf.' },
  { label: 'ceil', insert: 'np.ceil(', title: 'Partie entière sup.' },
  { label: 'round', insert: 'np.round(', title: 'Arrondi' },
  { label: 'sign', insert: 'np.sign(', title: 'Signe' },
];

function buildMathKeyboard(inputId, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = `
    <div class="mkb-wrapper">
      <div class="mkb-header">
        <span class="mkb-title">⌨️ Clavier mathématique</span>
        <button class="mkb-toggle" onclick="toggleKeyboard('${containerId}')">Masquer ▲</button>
      </div>
      <div class="mkb-grid" id="${containerId}-grid">
        ${MATH_KEYS.map(k => `
          <button class="mkb-btn" title="${k.title}"
            onclick="insertMath('${inputId}', '${k.insert}')"
          >${k.label}</button>
        `).join('')}
        <button class="mkb-btn mkb-clear" onclick="clearInput('${inputId}')">⌫ Clear</button>
      </div>
      <div class="mkb-hint">💡 Cliquez pour insérer à la position du curseur. Variable : <code>x</code></div>
    </div>`;
}

function insertMath(inputId, text) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const s = input.selectionStart, e = input.selectionEnd, v = input.value;
  input.value = v.slice(0, s) + text + v.slice(e);
  const pos = s + text.length;
  input.setSelectionRange(pos, pos);
  input.focus();
}

function clearInput(inputId) {
  const input = document.getElementById(inputId);
  if (input) { input.value = ''; input.focus(); }
}

function toggleKeyboard(containerId) {
  const grid = document.getElementById(`${containerId}-grid`);
  const btn = document.querySelector(`#${containerId} .mkb-toggle`);
  if (!grid) return;
  if (grid.style.display === 'none') {
    grid.style.display = 'flex';
    btn.textContent = 'Masquer ▲';
  } else {
    grid.style.display = 'none';
    btn.textContent = 'Afficher ▼';
  }
}