// ═══════════════════════════════════════
//  DICHOTOMIE — LOGIQUE INTERACTIVE
// ═══════════════════════════════════════

let chart = null;

async function calculate() {
  const func = document.getElementById('func').value.trim();
  const a    = parseFloat(document.getElementById('val-a').value);
  const b    = parseFloat(document.getElementById('val-b').value);
  const s    = parseFloat(document.getElementById('val-s').value);

  // Validation
  if (!func || isNaN(a) || isNaN(b) || isNaN(s)) {
    alert('⚠️ Veuillez remplir tous les champs correctement.');
    return;
  }

  // Bouton en chargement
  const btn = document.querySelector('.btn-primary');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Calcul en cours...';
  btn.disabled = true;

  // Code Python à exécuter
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
        iterations.append({
            'n':    n,
            'a':    round(a, 8),
            'b':    round(b, 8),
            'm':    round(m, 8),
            'fm':   round(f(m), 8)
        })
        if f(m) * f(a) > 0:
            a = m
        else:
            b = m
        n += 1
    return round(m, 8), n, iterations

def f(x):
    return ${func}

root, n_iter, iters = dicho(f, ${s}, ${a}, ${b})

json.dumps({
    'root':       root,
    'iterations': n_iter,
    'table':      iters
})
`;

  const { success, result, error } = await runPython(code);

  // Restaurer le bouton
  btn.innerHTML = '<i class="fas fa-calculator"></i> Calculer';
  btn.disabled = false;

  if (!success) {
    alert('❌ Erreur Python : ' + error);
    return;
  }

  // Parser le résultat JSON
  const data = JSON.parse(result);

  // Afficher le résultat
  document.getElementById('result-value').textContent = `Racine ≈ ${data.root}`;
  document.getElementById('result-iter').textContent  = `Convergence en ${data.iterations} itérations`;
  document.getElementById('result-box').classList.add('visible');

  // Remplir le tableau
  fillTable(data.table);

  // Tracer le graphe
  drawChart(data.table, func, a, b);
}

// ═══════════════════════════════════════
//  TABLEAU D'ITÉRATIONS
// ═══════════════════════════════════════

function fillTable(table) {
  const tbody     = document.getElementById('table-body');
  const container = document.getElementById('table-container');

  tbody.innerHTML = '';

  table.forEach((row, index) => {
    const tr = document.createElement('tr');
    tr.style.animation = `fadeIn 0.3s ease ${index * 0.03}s both`;
    tr.innerHTML = `
      <td>${row.n}</td>
      <td>${row.a}</td>
      <td>${row.b}</td>
      <td><strong>${row.m}</strong></td>
      <td style="color: ${Math.abs(row.fm) < 0.001 ? 'var(--accent)' : 'inherit'}">
        ${row.fm}
      </td>
    `;
    tbody.appendChild(tr);
  });

  container.style.display = 'block';
}

// ═══════════════════════════════════════
//  GRAPHE DE CONVERGENCE
// ═══════════════════════════════════════

function drawChart(table, func, a, b) {
  const container = document.getElementById('chart-container');
  container.style.display = 'block';

  // Détruire l'ancien graphe si existant
  if (chart) {
    chart.destroy();
    chart = null;
  }

  const labels  = table.map(r => `n=${r.n}`);
  const fmVals  = table.map(r => Math.abs(r.fm));
  const mVals   = table.map(r => r.m);

  const ctx = document.getElementById('myChart').getContext('2d');

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: '|f(m)| — Erreur',
          data: fmVals,
          borderColor: 'rgba(79, 70, 229, 1)',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          borderWidth: 2,
          pointRadius: 3,
          fill: true,
          tension: 0.3,
          yAxisID: 'y'
        },
        {
          label: 'm — Valeur du milieu',
          data: mVals,
          borderColor: 'rgba(16, 185, 129, 1)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 2,
          pointRadius: 3,
          fill: false,
          tension: 0.3,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      animation: { duration: 800, easing: 'easeInOutQuart' },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          labels: { color: getComputedStyle(document.documentElement)
            .getPropertyValue('--text-primary') }
        },
        tooltip: { mode: 'index', intersect: false }
      },
      scales: {
        x: {
          ticks: { color: 'var(--text-secondary)' },
          grid:  { color: 'var(--border)' }
        },
        y: {
          type: 'logarithmic',
          position: 'left',
          title: { display: true, text: '|f(m)|', color: 'rgba(79,70,229,1)' },
          ticks: { color: 'rgba(79,70,229,1)' },
          grid:  { color: 'var(--border)' }
        },
        y1: {
          type: 'linear',
          position: 'right',
          title: { display: true, text: 'm', color: 'rgba(16,185,129,1)' },
          ticks: { color: 'rgba(16,185,129,1)' },
          grid:  { drawOnChartArea: false }
        }
      }
    }
  });
}