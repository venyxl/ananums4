// ═══════════════════════════════════════
//  LAGRANGE — LOGIQUE INTERACTIVE
// ═══════════════════════════════════════

let chart = null;

async function calculate() {
  const xInput  = document.getElementById('val-x').value.trim();
  const yInput  = document.getElementById('val-y').value.trim();
  const point   = parseFloat(document.getElementById('val-point').value);

  // Validation
  if (!xInput || !yInput || isNaN(point)) {
    alert('⚠️ Veuillez remplir tous les champs correctement.');
    return;
  }

  const xArr = xInput.split(',').map(v => parseFloat(v.trim()));
  const yArr = yInput.split(',').map(v => parseFloat(v.trim()));

  if (xArr.length !== yArr.length) {
    alert('⚠️ Les listes x et y doivent avoir la même longueur.');
    return;
  }

  if (xArr.some(isNaN) || yArr.some(isNaN)) {
    alert('⚠️ Valeurs invalides dans les listes.');
    return;
  }

  // Bouton en chargement
  const btn = document.querySelector('.btn-primary');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Calcul en cours...';
  btn.disabled = true;

  // Code Python
  const code = `
import numpy as np
import json

def lagrange(a, b, x):
    n = len(a)
    result = 0.0
    for i in range(n):
        numerator   = 1.0
        denominator = 1.0
        for j in range(n):
            if j != i:
                numerator   *= (x - a[j])
                denominator *= (a[i] - a[j])
        result += b[i] * (numerator / denominator)
    return round(result, 8)

# Points
a = ${JSON.stringify(xArr)}
b = ${JSON.stringify(yArr)}
x = ${point}

# Calcul du résultat au point demandé
result = lagrange(a, b, x)

# Calcul du polynôme sur tout l'intervalle pour le graphe
x_min = min(a) - 0.5
x_max = max(a) + 0.5
x_plot = list(np.linspace(x_min, x_max, 200))
y_plot = [lagrange(a, b, xi) for xi in x_plot]

json.dumps({
    'result':  result,
    'x_plot':  [round(v, 6) for v in x_plot],
    'y_plot':  [round(v, 6) for v in y_plot],
    'x_nodes': a,
    'y_nodes': b,
    'point':   x
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

  const data = JSON.parse(result);

  // Afficher le résultat
  document.getElementById('result-value').textContent = `P(${point}) ≈ ${data.result}`;
  document.getElementById('result-info').textContent  =
    `Interpolation avec ${xArr.length} points — Polynôme de degré ${xArr.length - 1}`;
  document.getElementById('result-box').classList.add('visible');

  // Tableau des points
  fillTable(data.x_nodes, data.y_nodes);

  // Graphe
  drawChart(data);
}

// ═══════════════════════════════════════
//  TABLEAU DES POINTS
// ═══════════════════════════════════════

function fillTable(xNodes, yNodes) {
  const tbody     = document.getElementById('table-body');
  const container = document.getElementById('table-container');

  tbody.innerHTML = '';

  xNodes.forEach((xi, i) => {
    const tr = document.createElement('tr');
    tr.style.animation = `fadeIn 0.3s ease ${i * 0.05}s both`;
    tr.innerHTML = `
      <td>${i}</td>
      <td><strong>${xi}</strong></td>
      <td>${yNodes[i]}</td>
    `;
    tbody.appendChild(tr);
  });

  container.style.display = 'block';
}

// ═══════════════════════════════════════
//  GRAPHE
// ═══════════════════════════════════════

function drawChart(data) {
  const container = document.getElementById('chart-container');
  container.style.display = 'block';

  if (chart) {
    chart.destroy();
    chart = null;
  }

  const ctx = document.getElementById('myChart').getContext('2d');

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.x_plot,
      datasets: [
        {
          label: 'Polynôme de Lagrange P(x)',
          data: data.y_plot,
          borderColor: 'rgba(79, 70, 229, 1)',
          backgroundColor: 'rgba(79, 70, 229, 0.08)',
          borderWidth: 2.5,
          pointRadius: 0,
          fill: true,
          tension: 0.4
        },
        {
          label: 'Points de contrôle',
          data: data.x_nodes.map((x, i) => ({ x, y: data.y_nodes[i] })),
          borderColor: 'rgba(16, 185, 129, 1)',
          backgroundColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 2,
          pointRadius: 7,
          pointHoverRadius: 9,
          showLine: false,
          type: 'scatter'
        },
        {
          label: `Point interpolé P(${data.point})`,
          data: [{ x: data.point, y: data.result }],
          borderColor: 'rgba(239, 68, 68, 1)',
          backgroundColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 2,
          pointRadius: 10,
          pointStyle: 'star',
          showLine: false,
          type: 'scatter'
        }
      ]
    },
    options: {
      responsive: true,
      animation: { duration: 800, easing: 'easeInOutQuart' },
      plugins: {
        legend: {
          labels: { color: 'var(--text-primary)' }
        },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${
              ctx.parsed.y !== undefined
                ? ctx.parsed.y.toFixed(6)
                : ctx.raw.y.toFixed(6)
            }`
          }
        }
      },
      scales: {
        x: {
          type: 'linear',
          title: { display: true, text: 'x', color: 'var(--text-secondary)' },
          ticks: { color: 'var(--text-secondary)' },
          grid:  { color: 'var(--border)' }
        },
        y: {
          title: { display: true, text: 'P(x)', color: 'var(--text-secondary)' },
          ticks: { color: 'var(--text-secondary)' },
          grid:  { color: 'var(--border)' }
        }
      }
    }
  });
}