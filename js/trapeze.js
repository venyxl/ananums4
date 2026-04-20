// ═══════════════════════════════════════
//  TRAPÈZE — LOGIQUE INTERACTIVE
// ═══════════════════════════════════════

let chart = null;

function toSympy(expr) {
  return expr
    .replace(/np\.sin/g,'sin').replace(/np\.cos/g,'cos').replace(/np\.tan/g,'tan')
    .replace(/np\.arcsin/g,'asin').replace(/np\.arccos/g,'acos').replace(/np\.arctan/g,'atan')
    .replace(/np\.sinh/g,'sinh').replace(/np\.cosh/g,'cosh').replace(/np\.tanh/g,'tanh')
    .replace(/np\.exp/g,'exp').replace(/np\.log10/g,'log(x,10)').replace(/np\.log2/g,'log(x,2)')
    .replace(/np\.log/g,'log').replace(/np\.sqrt/g,'sqrt')
    .replace(/np\.abs/g,'Abs').replace(/np\.pi/g,'pi').replace(/np\.e\b/g,'E').replace(/np\./g,'');
}

async function calculate() {
  const func = document.getElementById('func').value.trim();
  const a    = parseFloat(document.getElementById('val-a').value);
  const b    = parseFloat(document.getElementById('val-b').value);
  const m    = parseInt(document.getElementById('val-m').value);

  if (!func || isNaN(a) || isNaN(b) || isNaN(m)) { alert('⚠️ Veuillez remplir tous les champs.'); return; }
  if (m < 1) { alert('⚠️ m doit être positif.'); return; }
  if (a >= b) { alert('⚠️ a doit être < b.'); return; }

  const btn = document.querySelector('.btn-primary');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Calcul en cours...';
  btn.disabled = true;

  const sympyExpr = toSympy(func);

  const code = `
import numpy as np
import json

def f(x):
    return ${func}

def trapeze(f, a, b, m):
    h = (b - a) / m
    s = 0
    steps = []
    for j in range(1, m):
        xj = a + j * h
        s += f(xj)
        steps.append({'j': j, 'xj': round(xj, 6), 'fxj': round(f(xj), 6), 'contrib': round(f(xj), 6)})
    I = h * s + (h / 2) * (f(a) + f(b))
    return round(I, 8), steps, round(float(h), 8)

a, b, m = ${a}, ${b}, ${m}
result, steps, h = trapeze(f, a, b, m)

exact_val = None
try:
    from sympy import integrate, symbols, sympify, N
    x = symbols('x')
    expr = sympify("${sympyExpr}")
    exact_val = float(N(integrate(expr, (x, a, b))))
    exact_val = round(exact_val, 8)
except:
    exact_val = None

err_abs = round(abs(result - exact_val), 8) if exact_val is not None else None
err_rel = round(abs(result - exact_val) / abs(exact_val) * 100, 6) if exact_val is not None and exact_val != 0 else None

x_plot  = list(np.linspace(a, b, 300))
y_plot  = [round(f(xi), 6) for xi in x_plot]
x_nodes = [round(a + j * h, 6) for j in range(m + 1)]
y_nodes = [round(f(xn), 6) for xn in x_nodes]

json.dumps({'result': result, 'exact_val': exact_val, 'err_abs': err_abs, 'err_rel': err_rel,
            'steps': steps, 'h': h, 'x_plot': [round(v,6) for v in x_plot], 'y_plot': y_plot,
            'x_nodes': x_nodes, 'y_nodes': y_nodes, 'fa': round(f(a), 6), 'fb': round(f(b), 6)})
`;

  const { success, result, error } = await runPython(code);
  btn.innerHTML = '<i class="fas fa-calculator"></i> Calculer';
  btn.disabled = false;
  if (!success) { alert('❌ Erreur : ' + error); return; }

  const data = JSON.parse(result);
  showResults(data, a, b, m);
  fillTable(data.steps, data.fa, data.fb, a, b);
  drawChart(data);
}

function showResults(data, a, b, m) {
  document.getElementById('result-box').classList.add('visible');
  document.getElementById('result-value').textContent = `I ≈ ${data.result}`;
  document.getElementById('result-info').textContent  = `h = ${data.h} — ${m} sous-intervalles — ${m+1} points`;

  const grid = document.getElementById('result-grid');
  grid.innerHTML = `<div class="result-card"><div class="rc-label">Valeur approchée</div><div class="rc-value">${data.result}</div></div>`;

  if (data.exact_val !== null) {
    grid.innerHTML += `
      <div class="result-card exact"><div class="rc-label">Valeur exacte</div><div class="rc-value">${data.exact_val}</div></div>
      <div class="result-card error"><div class="rc-label">Erreur absolue</div><div class="rc-value">${data.err_abs}</div></div>`;
    if (data.err_rel !== null)
      grid.innerHTML += `<div class="result-card error"><div class="rc-label">Erreur relative</div><div class="rc-value">${data.err_rel} %</div></div>`;
  } else {
    grid.innerHTML += `<div class="result-card"><div class="rc-label">Valeur exacte</div><div class="rc-value" style="font-size:0.82rem;color:var(--text-secondary)">Fonction trop complexe pour sympy</div></div>`;
  }
}

function fillTable(steps, fa, fb, a, b) {
  const tbody = document.getElementById('table-body');
  const container = document.getElementById('table-container');
  tbody.innerHTML = '';
  const trA = document.createElement('tr');
  trA.innerHTML = `<td>0</td><td><strong>${a}</strong></td><td>${fa}</td><td style="color:var(--accent);font-weight:700;">1/2</td><td>${(fa/2).toFixed(6)}</td>`;
  tbody.appendChild(trA);
  steps.forEach((row, i) => {
    const tr = document.createElement('tr');
    tr.style.animation = `fadeIn 0.3s ease ${i*0.03}s both`;
    tr.innerHTML = `<td>${row.j}</td><td><strong>${row.xj}</strong></td><td>${row.fxj}</td><td style="color:rgba(79,70,229,1);font-weight:700;">1</td><td>${row.contrib}</td>`;
    tbody.appendChild(tr);
  });
  const trB = document.createElement('tr');
  trB.innerHTML = `<td>${steps.length+1}</td><td><strong>${b}</strong></td><td>${fb}</td><td style="color:var(--accent);font-weight:700;">1/2</td><td>${(fb/2).toFixed(6)}</td>`;
  tbody.appendChild(trB);
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
        { label: 'f(x)', data: data.y_plot, borderColor: 'rgba(79,70,229,1)', backgroundColor: 'rgba(79,70,229,0.1)', borderWidth: 2.5, pointRadius: 0, fill: true, tension: 0.4 },
        { label: 'Trapèzes', data: data.x_nodes.map((x,i)=>({x,y:data.y_nodes[i]})), borderColor: 'rgba(239,68,68,0.8)', backgroundColor: 'rgba(239,68,68,0.15)', borderWidth: 2, pointRadius: 5, fill: false, tension: 0, type: 'line' }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: 'var(--text-primary)' } },
        zoom: { zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'xy' }, pan: { enabled: true, mode: 'xy' } }
      },
      scales: {
        x: { type: 'linear', ticks: { color: 'var(--text-secondary)' }, grid: { color: 'var(--border)' } },
        y: { ticks: { color: 'var(--text-secondary)' }, grid: { color: 'var(--border)' } }
      }
    }
  });
}

function resetZoom() { if (chart) chart.resetZoom(); }