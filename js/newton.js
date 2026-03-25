// ═══════════════════════════════════════
//  NEWTON — LOGIQUE INTERACTIVE
// ═══════════════════════════════════════

let chart = null;

async function calculate() {
  const xInput = document.getElementById('val-x').value.trim();
  const yInput = document.getElementById('val-y').value.trim();
  const point  = parseFloat(document.getElementById('val-point').value);

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

def newton(x, y, val):
    n = len(x)
    m = np.zeros((n, n))
    m[:, 0] = y

    for i in range(1, n):
        for j in range(i, n):
            m[j, i] = (m[j, i-1] - m[j-1, i-1]) / (x[j] - x[j-i])

    result  = m[0, 0]
    product = 1.0

    for i in range(1, n):
        product *= (val - x[i-1])
        result  += m[i, i] * product

    return round(float(result), 8), m.tolist()

x   = ${JSON.stringify(xArr)}
y   = ${JSON.stringify(yArr)}
val = ${point}

result, table = newton(x, y, val)

# Calcul du polynôme pour le graphe
x_min  = min(x) - 0.5
x_max  = max(x) + 0.5
x_plot = list(np.linspace(x_min, x_max, 200))

def eval_newton(x_nodes, table, val):
    n       = len(x_nodes)
    result  = table[0][0]
    product = 1.0
    for i in range(1, n):
        product *= (val - x_nodes[i-1])
        result  += table[i][i] * product
    return result

y_plot = [round(eval_newton(x, table, xi), 6) for xi in x_plot]

json.dumps({
    'result':  result,
    'table':   table,
    'x_nodes': x,
    'y_nodes': y,
    'point':   val,
    'x_plot':  [round(v, 6) for v in x_plot],
    'y_plot':  y_plot
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

  // Tableau des différences divisées
  fillTable(data.x_nodes, data.table);

  // Graphe
  drawChart(data);
}

// ═══════════════════════════════════════
//  TABLE DES DIFFÉRENCES DIVISÉES
// ═══════════════════════════════════════

function fillTable(xNodes, table) {
  const thead     = document.getElementById('table-head');
  const tbody     = document.getElementById('table-body');
  const container = document.getElementById('table-container');
  const n         = xNodes.length;

  // En-têtes
  thead.innerHTML = '<th>xᵢ</th><th>f[xᵢ]</th>';
  for (let k = 1; k < n; k++) {
    thead.innerHTML += `<th>Ordre ${k}</th>`;
  }

  // Lignes
  tbody.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const tr = document.createElement('tr');
    tr.style.animation = `fadeIn 0.3s ease ${i * 0.05}s both`;

    let row = `<td><strong>${xNodes[i]}</strong></td>`;
    for (let j = 0; j < n; j++) {
      if (j <= i) {
        const val = table[i][j];
        const isCoeff = (i === j);
        row += `<td style="${isCoeff ? 'color:var(--accent);font-weight:700;' : ''}">
          ${Math.abs(val) < 1e-10 ? '—' : val.toFixed(6)}
        </td>`;
      } else {
        row += '<td style="color:var(--border);">—</td>';
      }
    }

    tr.innerHTML = row;
    tbody.appendChild(tr);
  }

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
          label: 'Polynôme de Newton P(x)',
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