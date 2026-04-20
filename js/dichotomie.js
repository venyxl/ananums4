// ═══════════════════════════════════════
//  DICHOTOMIE — LOGIQUE INTERACTIVE
// ═══════════════════════════════════════

let chart = null;

async function calculate() {
  const func = document.getElementById('func').value.trim();
  const a    = parseFloat(document.getElementById('val-a').value);
  const b    = parseFloat(document.getElementById('val-b').value);
  const s    = parseFloat(document.getElementById('val-s').value);

  if (!func || isNaN(a) || isNaN(b) || isNaN(s)) {
    alert('⚠️ Veuillez remplir tous les champs correctement.');
    return;
  }

  const btn = document.querySelector('.btn-primary');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Calcul en cours...';
  btn.disabled = true;

  const code = `
import numpy as np
import json

def dicho(f, s, a, b, max_iter=1000):
    iterations = []
    if f(a) * f(b) >= 0:
        raise ValueError("f(a) et f(b) doivent avoir des signes opposés")
    n = 0
    m = (a + b) / 2
    while abs(f(m)) > s and n < max_iter:
        m = (a + b) / 2
        iterations.append({'n': n, 'a': round(a, 8), 'b': round(b, 8), 'm': round(m, 8), 'fm': round(f(m), 8)})
        if f(m) * f(a) > 0:
            a = m
        else:
            b = m
        n += 1
    return round(m, 8), n, iterations

def f(x):
    return ${func}

root, n_iter, iters = dicho(f, ${s}, ${a}, ${b})

exact_root = None
try:
    from sympy import solve, symbols, sympify, N
    x_sym = symbols('x')
    expr = sympify("${func}".replace("np.sin", "sin").replace("np.cos", "cos").replace("np.tan", "tan")
        .replace("np.exp", "exp").replace("np.log", "log").replace("np.sqrt", "sqrt")
        .replace("np.pi", "pi").replace("np.abs", "Abs").replace("np.arcsin", "asin")
        .replace("np.arccos", "acos").replace("np.arctan", "atan").replace("np.", ""))
    sols = solve(expr, x_sym)
    candidates = []
    for sol in sols:
        try:
            v = float(N(sol))
            candidates.append(v)
        except:
            pass
    if candidates:
        exact_root = min(candidates, key=lambda v: abs(v - root))
        exact_root = round(exact_root, 8)
except Exception as e:
    exact_root = None

err_abs = round(abs(root - exact_root), 8) if exact_root is not None else None
err_rel = round(abs(root - exact_root) / abs(exact_root) * 100, 6) if exact_root is not None and exact_root != 0 else None

json.dumps({'root': root, 'exact_root': exact_root, 'err_abs': err_abs, 'err_rel': err_rel, 'iterations': n_iter, 'table': iters})
`;

  const { success, result, error } = await runPython(code);
  btn.innerHTML = '<i class="fas fa-calculator"></i> Calculer';
  btn.disabled = false;

  if (!success) { alert('❌ Erreur Python : ' + error); return; }

  const data = JSON.parse(result);

  document.getElementById('result-value').textContent = `Racine ≈ ${data.root}`;
  document.getElementById('result-iter').textContent  = `Convergence en ${data.iterations} itérations`;
  document.getElementById('result-box').classList.add('visible');

  const grid = document.getElementById('result-grid');
  grid.innerHTML = `<div class="result-card"><div class="rc-label">Valeur approchée</div><div class="rc-value">${data.root}</div></div>`;

  if (data.exact_root !== null) {
    grid.innerHTML += `
      <div class="result-card exact"><div class="rc-label">Valeur exacte</div><div class="rc-value">${data.exact_root}</div></div>
      <div class="result-card error"><div class="rc-label">Erreur absolue</div><div class="rc-value">${data.err_abs}</div></div>`;
    if (data.err_rel !== null)
      grid.innerHTML += `<div class="result-card error"><div class="rc-label">Erreur relative</div><div class="rc-value">${data.err_rel} %</div></div>`;
  }

  fillTable(data.table);
  drawChart(data.table);
}

function fillTable(table) {
  const tbody     = document.getElementById('table-body');
  const container = document.getElementById('table-container');
  tbody.innerHTML = '';
  table.forEach((row, index) => {
    const tr = document.createElement('tr');
    tr.style.animation = `fadeIn 0.3s ease ${index * 0.03}s both`;
    tr.innerHTML = `<td>${row.n}</td><td>${row.a}</td><td>${row.b}</td><td><strong>${row.m}</strong></td>
      <td style="color:${Math.abs(row.fm) < 0.001 ? 'var(--accent)' : 'inherit'}">${row.fm}</td>`;
    tbody.appendChild(tr);
  });
  container.style.display = 'block';
}

function drawChart(table) {
  const container = document.getElementById('chart-container');
  container.style.display = 'block';
  if (chart) { chart.destroy(); chart = null; }

  const ctx = document.getElementById('myChart').getContext('2d');
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: table.map(r => `n=${r.n}`),
      datasets: [
        { label: '|f(m)|', data: table.map(r => Math.abs(r.fm)), borderColor: 'rgba(79,70,229,1)', backgroundColor: 'rgba(79,70,229,0.1)', borderWidth: 2, pointRadius: 3, fill: true, tension: 0.3, yAxisID: 'y' },
        { label: 'm', data: table.map(r => r.m), borderColor: 'rgba(16,185,129,1)', backgroundColor: 'rgba(16,185,129,0.1)', borderWidth: 2, pointRadius: 3, fill: false, tension: 0.3, yAxisID: 'y1' }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: 'var(--text-primary)' } },
        zoom: { zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'xy' }, pan: { enabled: true, mode: 'xy' } }
      },
      scales: {
        x: { ticks: { color: 'var(--text-secondary)' }, grid: { color: 'var(--border)' } },
        y: { type: 'logarithmic', position: 'left', title: { display: true, text: '|f(m)|', color: 'rgba(79,70,229,1)' }, ticks: { color: 'rgba(79,70,229,1)' } },
        y1: { type: 'linear', position: 'right', title: { display: true, text: 'm', color: 'rgba(16,185,129,1)' }, ticks: { color: 'rgba(16,185,129,1)' }, grid: { drawOnChartArea: false } }
      }
    }
  });
}

function resetZoom() { if (chart) chart.resetZoom(); }