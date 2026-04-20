// ═══════════════════════════════════════
//  LAGRANGE — LOGIQUE INTERACTIVE
// ═══════════════════════════════════════

let chart = null;
let polyCoeffs = null; // stocker les données pour l'évaluation

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

def lagrange_eval(a, b, x):
    n = len(a)
    result = 0.0
    for i in range(n):
        num, den = 1.0, 1.0
        for j in range(n):
            if j != i:
                num *= (x - a[j])
                den *= (a[i] - a[j])
        result += b[i] * (num / den)
    return round(result, 8)

a = ${JSON.stringify(xArr)}
b = ${JSON.stringify(yArr)}

# Expression symbolique du polynôme
poly_str = None
try:
    from sympy import symbols, simplify, Rational, latex, nsimplify
    x_sym = symbols('x')
    P = sum(
        b[i] * np.prod([(x_sym - a[j])/(a[i] - a[j]) for j in range(len(a)) if j != i])
        for i in range(len(a))
    )
    P_simplified = simplify(P)
    poly_str = str(P_simplified)
    poly_latex = latex(P_simplified)
except Exception as e:
    poly_str = "Polynôme calculé (affichage symbolique non disponible)"
    poly_latex = poly_str

x_min  = min(a) - 0.5
x_max  = max(a) + 0.5
x_plot = list(np.linspace(x_min, x_max, 200))
y_plot = [lagrange_eval(a, b, xi) for xi in x_plot]

json.dumps({
    'poly_str':  poly_str,
    'x_nodes':   a,
    'y_nodes':   b,
    'x_plot':    [round(v, 6) for v in x_plot],
    'y_plot':    [round(v, 6) for v in y_plot]
})
`;

  const { success, result, error } = await runPython(code);
  btn.innerHTML = '<i class="fas fa-calculator"></i> Calculer le polynôme';
  btn.disabled = false;
  if (!success) { alert('❌ Erreur : ' + error); return; }

  const data = JSON.parse(result);
  polyCoeffs = { xArr, yArr };

  // Afficher le polynôme
  document.getElementById('poly-expr').textContent = `P(x) = ${data.poly_str}`;
  document.getElementById('poly-box').classList.add('visible');
  document.getElementById('result-box').classList.add('visible');
  document.getElementById('result-value').textContent =
    `Polynôme de degré ${xArr.length - 1} trouvé`;
  document.getElementById('result-info').textContent =
    `Interpolation avec ${xArr.length} points`;

  fillTable(data.x_nodes, data.y_nodes);
  drawChart(data);
}

// ═══════════════════════════════════════
//  ÉVALUATION EN UN POINT
// ═══════════════════════════════════════

async function evaluateAtPoint() {
  if (!polyCoeffs) { alert('⚠️ Calculez d\'abord le polynôme.'); return; }

  const xVal = parseFloat(document.getElementById('eval-x').value);
  if (isNaN(xVal)) { alert('⚠️ Entrez une valeur numérique.'); return; }

  const { xArr, yArr } = polyCoeffs;

  const code = `
import numpy as np
import json

def lagrange_eval(a, b, x):
    n = len(a)
    result = 0.0
    for i in range(n):
        num, den = 1.0, 1.0
        for j in range(n):
            if j != i:
                num *= (x - a[j])
                den *= (a[i] - a[j])
        result += b[i] * (num / den)
    return round(result, 8)

a = ${JSON.stringify(xArr)}
b = ${JSON.stringify(yArr)}
x = ${xVal}
result = lagrange_eval(a, b, x)
json.dumps({'result': result})
`;

  const { success, result, error } = await runPython(code);
  if (!success) { alert('❌ Erreur : ' + error); return; }
  const data = JSON.parse(result);
  const el = document.getElementById('eval-result');
  el.textContent = `P(${xVal}) = ${data.result}`;
  el.classList.add('visible');
}

function fillTable(xNodes, yNodes) {
  const tbody = document.getElementById('table-body');
  const container = document.getElementById('table-container');
  tbody.innerHTML = '';
  xNodes.forEach((xi, i) => {
    const tr = document.createElement('tr');
    tr.style.animation = `fadeIn 0.3s ease ${i*0.05}s both`;
    tr.innerHTML = `<td>${i}</td><td><strong>${xi}</strong></td><td>${yNodes[i]}</td>`;
    tbody.appendChild(tr);
  });
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
        { label: 'P(x) — Lagrange', data: data.y_plot, borderColor: 'rgba(79,70,229,1)', backgroundColor: 'rgba(79,70,229,0.08)', borderWidth: 2.5, pointRadius: 0, fill: true, tension: 0.4 },
        { label: 'Points de contrôle', data: data.x_nodes.map((x,i)=>({x,y:data.y_nodes[i]})), borderColor: 'rgba(16,185,129,1)', backgroundColor: 'rgba(16,185,129,1)', borderWidth: 2, pointRadius: 7, showLine: false, type: 'scatter' }
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