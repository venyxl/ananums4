// ═══════════════════════════════════════
//  NEWTON — LOGIQUE INTERACTIVE
// ═══════════════════════════════════════

let chart = null;
let polyCoeffs = null;

// Incremental state (all pure JS — no Pyodide needed after first calc)
let incState = null; // { xNodes, yNodes, table (2D), lastCoeff }

async function calculate() {
  const xInput = document.getElementById('val-x').value.trim();
  const yInput = document.getElementById('val-y').value.trim();

  if (!xInput || !yInput) { alert('⚠️ Veuillez remplir tous les champs.'); return; }

  const xArr = xInput.split(',').map(v => parseFloat(v.trim()));
  const yArr = yInput.split(',').map(v => parseFloat(v.trim()));

  if (xArr.length !== yArr.length) { alert('⚠️ Les listes x et y doivent avoir la même longueur.'); return; }
  if (xArr.some(isNaN) || yArr.some(isNaN)) { alert('⚠️ Valeurs invalides.'); return; }

  const btn = document.querySelector('.btn-primary');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Calcul en cours...';
  btn.disabled = true;

  const code = `
import numpy as np
import json

def newton_table(x, y):
    n = len(x)
    m = np.zeros((n, n))
    m[:, 0] = y
    for i in range(1, n):
        for j in range(i, n):
            m[j, i] = (m[j, i-1] - m[j-1, i-1]) / (x[j] - x[j-i])
    return m.tolist()

def eval_newton(x_nodes, table, val):
    n = len(x_nodes)
    result = table[0][0]
    product = 1.0
    for i in range(1, n):
        product *= (val - x_nodes[i-1])
        result  += table[i][i] * product
    return round(float(result), 8)

x = ${JSON.stringify(xArr)}
y = ${JSON.stringify(yArr)}

table = newton_table(x, y)

# Expression symbolique
poly_str = None
try:
    from sympy import symbols, simplify, expand
    x_sym = symbols('x')
    n = len(x)
    P = table[0][0]
    product = 1
    for i in range(1, n):
        product = product * (x_sym - x[i-1])
        P = P + table[i][i] * product
    P_simplified = expand(P)
    try:
        from sympy import nsimplify
        P_simplified = nsimplify(P_simplified, tolerance=1e-8, rational=True)
    except:
        pass
    poly_str = str(P_simplified)
except Exception as e:
    poly_str = "Polynôme calculé (affichage symbolique indisponible)"

x_min  = min(x) - 0.5
x_max  = max(x) + 0.5
x_plot = list(np.linspace(x_min, x_max, 200))
y_plot = [round(eval_newton(x, table, xi), 6) for xi in x_plot]

json.dumps({
    'poly_str': poly_str,
    'table':    table,
    'x_nodes':  x,
    'y_nodes':  y,
    'x_plot':   [round(v, 6) for v in x_plot],
    'y_plot':   y_plot
})
`;

  const { success, result, error } = await runPython(code);
  btn.innerHTML = '<i class="fas fa-calculator"></i> Calculer le polynôme';
  btn.disabled = false;
  if (!success) { alert('❌ Erreur : ' + error); return; }

  const data = JSON.parse(result);
  polyCoeffs = { xArr, table: data.table };

  document.getElementById('poly-expr').textContent = `P(x) = ${data.poly_str}`;
  document.getElementById('poly-box').classList.add('visible');
  document.getElementById('result-box').classList.add('visible');
  document.getElementById('result-value').textContent = `Polynôme de degré ${xArr.length - 1} trouvé`;
  document.getElementById('result-info').textContent  = `Interpolation de Newton avec ${xArr.length} points`;

  // ── Init incremental state ──
  incState = {
    xNodes: [...xArr],
    yNodes: [...yArr],
    table: data.table.map(r => [...r])
  };
  initIncremental();

  fillTable(data.x_nodes, data.table);
  drawChart(data);
}

// ═══════════════════════════════════════
//  ÉVALUATION EN UN POINT
// ═══════════════════════════════════════

async function evaluateAtPoint() {
  if (!polyCoeffs) { alert('⚠️ Calculez d\'abord le polynôme.'); return; }

  const xVal = parseFloat(document.getElementById('eval-x').value);
  if (isNaN(xVal)) { alert('⚠️ Entrez une valeur numérique.'); return; }

  const { xArr, table } = polyCoeffs;
  const val = evalNewtonJS(xArr, table, xVal);

  const el = document.getElementById('eval-result');
  el.textContent = `P(${xVal}) = ${val.toFixed(8)}`;
  el.classList.add('visible');
}

// ═══════════════════════════════════════
//  AJOUT INCRÉMENTAL — PURE JS
//  (No Pyodide needed after first calc)
// ═══════════════════════════════════════

function evalNewtonJS(xNodes, table, val) {
  const n = xNodes.length;
  let result = table[0][0];
  let product = 1.0;
  for (let i = 1; i < n; i++) {
    product *= (val - xNodes[i - 1]);
    result  += table[i][i] * product;
  }
  return result;
}

function dividedDiffNewPoint(xNodes, table, xNew, yNew) {
  // Add a new row to the divided difference table using only the diagonal
  const n = xNodes.length;       // current count before adding
  const newRow = new Array(n + 1).fill(0);
  newRow[0] = yNew;              // f[xNew] = yNew

  for (let i = 1; i <= n; i++) {
    // f[xNew, x_{n-i}, ..., x_{n-1}] — walk up the existing last column
    newRow[i] = (newRow[i - 1] - table[n - i][i - 1]) / (xNew - xNodes[n - i]);
  }
  return newRow;
}

function buildPolyStringJS(xNodes, table) {
  const n = xNodes.length;
  const coeffs = table.map((row, i) => row[i]);

  // Build incremental Newton form string
  let terms = [fmtNum(coeffs[0])];
  for (let i = 1; i < n; i++) {
    const c = coeffs[i];
    if (Math.abs(c) < 1e-12) continue;
    let term = '';
    for (let k = 0; k < i; k++) {
      const xk = xNodes[k];
      term += `(x ${xk >= 0 ? '- ' + fmtNum(xk) : '+ ' + fmtNum(-xk)})`;
    }
    const sign = c >= 0 ? ' + ' : ' - ';
    terms.push(`${sign}${fmtNum(Math.abs(c))}·${term}`);
  }
  return 'P(x) = ' + terms.join('');
}

function fmtNum(v) {
  if (Number.isInteger(v)) return String(v);
  return parseFloat(v.toFixed(6)).toString();
}

function evalPolyForPlot(xNodes, table, xMin, xMax) {
  const pts = 200;
  const step = (xMax - xMin) / (pts - 1);
  const xPlot = [], yPlot = [];
  for (let i = 0; i < pts; i++) {
    const xi = xMin + i * step;
    xPlot.push(parseFloat(xi.toFixed(5)));
    yPlot.push(parseFloat(evalNewtonJS(xNodes, table, xi).toFixed(6)));
  }
  return { xPlot, yPlot };
}

function initIncremental() {
  const panel = document.getElementById('incremental-panel');
  panel.style.display = 'block';
  panel.style.animation = 'fadeSlideUp 0.5s ease both';
  refreshIncUI(null); // initial render without new term
}

function addPoint() {
  if (!incState) return;

  const xNew = parseFloat(document.getElementById('inc-x').value);
  const yNew = parseFloat(document.getElementById('inc-y').value);

  if (isNaN(xNew) || isNaN(yNew)) {
    showInputError('⚠️ Entrez des valeurs numériques valides.');
    return;
  }
  if (incState.xNodes.includes(xNew)) {
    showInputError('⚠️ Ce point x existe déjà dans le polynôme.');
    return;
  }

  const newRow = dividedDiffNewPoint(incState.xNodes, incState.table, xNew, yNew);
  const newCoeff = newRow[newRow.length - 1];

  // Update state
  incState.xNodes.push(xNew);
  incState.yNodes.push(yNew);
  for (let i = 0; i < incState.table.length; i++) {
    incState.table[i].push(0); // pad old rows
  }
  incState.table.push(newRow);

  // Build new term label
  const n = incState.xNodes.length;
  let termParts = [];
  for (let k = 0; k < n - 1; k++) {
    const xk = incState.xNodes[k];
    termParts.push(`(x ${xk >= 0 ? '- ' + fmtNum(xk) : '+ ' + fmtNum(-xk)})`);
  }
  const newTermStr = `+ ${fmtNum(newCoeff)} · ${termParts.join('')}`;

  // Update chart & UI
  refreshIncUI(newTermStr, newCoeff);
  updateChart();
  clearInputError();

  // Flash the add button
  const btn = document.getElementById('btn-add-point');
  btn.classList.add('btn-success-flash');
  setTimeout(() => btn.classList.remove('btn-success-flash'), 800);

  // Clear inputs
  document.getElementById('inc-x').value = '';
  document.getElementById('inc-y').value = '';
}

function refreshIncUI(newTermStr, newCoeff) {
  const { xNodes, yNodes, table } = incState;
  const n = xNodes.length;

  // Stats
  document.getElementById('stat-n').textContent = n;
  document.getElementById('stat-deg').textContent = n - 1;
  const lastCoeff = table[n - 1][n - 1];
  document.getElementById('stat-coeff').textContent = fmtNum(parseFloat(lastCoeff.toFixed(5)));

  // Points list
  const list = document.getElementById('inc-points-list');
  list.innerHTML = '';
  xNodes.forEach((x, i) => {
    const chip = document.createElement('div');
    chip.className = 'inc-point-chip' + (i === n - 1 && newTermStr ? ' chip-new' : '');
    chip.innerHTML = `<span class="chip-x">x=${fmtNum(x)}</span><span class="chip-y">f=${fmtNum(yNodes[i])}</span>`;
    list.appendChild(chip);
  });

  // New term notification
  const termEl = document.getElementById('inc-new-term');
  if (newTermStr) {
    termEl.innerHTML = `<span class="term-label">Nouveau terme ajouté :</span><code class="term-code">${newTermStr}</code>`;
    termEl.classList.add('visible', 'term-flash');
    setTimeout(() => termEl.classList.remove('term-flash'), 1000);
  }

  // Polynomial display
  const polyDisp = document.getElementById('inc-poly-display');
  polyDisp.innerHTML = `<span class="inc-poly-str">${buildPolyStringJS(xNodes, table)}</span>`;
}

function updateChart() {
  if (!chart || !incState) return;
  const { xNodes, yNodes, table } = incState;

  const allX = [...xNodes];
  const xMin = Math.min(...allX) - 0.5;
  const xMax = Math.max(...allX) + 0.5;
  const { xPlot, yPlot } = evalPolyForPlot(xNodes, table, xMin, xMax);

  chart.data.labels = xPlot;
  chart.data.datasets[0].data = yPlot;
  chart.data.datasets[0].label = `P(x) — Newton (degré ${xNodes.length - 1})`;
  chart.data.datasets[1].data = xNodes.map((x, i) => ({ x, y: yNodes[i] }));
  chart.update('active');
}

function showInputError(msg) {
  let err = document.getElementById('inc-error');
  if (!err) {
    err = document.createElement('div');
    err.id = 'inc-error';
    err.className = 'inc-error';
    document.getElementById('btn-add-point').after(err);
  }
  err.textContent = msg;
  err.style.display = 'block';
}

function clearInputError() {
  const err = document.getElementById('inc-error');
  if (err) err.style.display = 'none';
}

// ═══════════════════════════════════════
//  TABLEAU DES DIFFÉRENCES DIVISÉES
// ═══════════════════════════════════════

function fillTable(xNodes, table) {
  const thead = document.getElementById('table-head');
  const tbody = document.getElementById('table-body');
  const container = document.getElementById('table-container');
  const n = xNodes.length;

  thead.innerHTML = '<th>xᵢ</th><th>f[xᵢ]</th>';
  for (let k = 1; k < n; k++) thead.innerHTML += `<th>Ordre ${k}</th>`;

  tbody.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const tr = document.createElement('tr');
    tr.style.animation = `fadeIn 0.3s ease ${i*0.05}s both`;
    let row = `<td><strong>${xNodes[i]}</strong></td>`;
    for (let j = 0; j < n; j++) {
      if (j <= i) {
        const val = table[i][j];
        row += `<td style="${i===j ? 'color:var(--accent);font-weight:700;' : ''}">${Math.abs(val) < 1e-10 ? '—' : val.toFixed(6)}</td>`;
      } else {
        row += '<td style="color:var(--border);">—</td>';
      }
    }
    tr.innerHTML = row;
    tbody.appendChild(tr);
  }
  container.style.display = 'block';
}

function drawChart(data) {
  const container = document.getElementById('chart-container');
  container.style.display = 'block';
  if (chart) { chart.destroy(); chart = null; }
  const ctx = document.getElementById('myChart').getContext('2d');
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.x_plot,
      datasets: [
        {
          label: `P(x) — Newton (degré ${data.x_nodes.length - 1})`,
          data: data.y_plot,
          borderColor: 'rgba(79,70,229,1)',
          backgroundColor: 'rgba(79,70,229,0.08)',
          borderWidth: 2.5,
          pointRadius: 0,
          fill: true,
          tension: 0.4
        },
        {
          label: 'Points de contrôle',
          data: data.x_nodes.map((x,i) => ({ x, y: data.y_nodes[i] })),
          borderColor: 'rgba(16,185,129,1)',
          backgroundColor: 'rgba(16,185,129,1)',
          borderWidth: 2,
          pointRadius: 7,
          showLine: false,
          type: 'scatter'
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: 'var(--text-primary)' } },
        zoom: {
          zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'xy' },
          pan: { enabled: true, mode: 'xy' }
        }
      },
      scales: {
        x: { type: 'linear', ticks: { color: 'var(--text-secondary)' }, grid: { color: 'var(--border)' } },
        y: { ticks: { color: 'var(--text-secondary)' }, grid: { color: 'var(--border)' } }
      },
      animation: { duration: 600, easing: 'easeInOutQuart' }
    }
  });
}

function resetZoom() { if (chart) chart.resetZoom(); }