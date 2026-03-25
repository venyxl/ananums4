// ═══════════════════════════════════════
//  TRAPÈZE — LOGIQUE INTERACTIVE
// ═══════════════════════════════════════

let chart = null;

async function calculate() {
  const func = document.getElementById('func').value.trim();
  const a    = parseFloat(document.getElementById('val-a').value);
  const b    = parseFloat(document.getElementById('val-b').value);
  const m    = parseInt(document.getElementById('val-m').value);

  // Validation
  if (!func || isNaN(a) || isNaN(b) || isNaN(m)) {
    alert('⚠️ Veuillez remplir tous les champs correctement.');
    return;
  }

  if (m < 1) {
    alert('⚠️ m doit être un entier positif.');
    return;
  }

  if (a >= b) {
    alert('⚠️ La borne a doit être strictement inférieure à b.');
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

def trapeze(f, a, b, m):
    h = (b - a) / m
    s = 0
    steps = []

    for j in range(1, m):
        xj = a + j * h
        s += f(xj)
        steps.append({
            'j':      j,
            'xj':     round(xj, 6),
            'fxj':    round(f(xj), 6),
            'contrib': round(f(xj), 6)
        })

    I = h * s + (h / 2) * (f(a) + f(b))
    return round(I, 8), steps, round(float(h), 8)

def f(x):
    return ${func}

a = ${a}
b = ${b}
m = ${m}

result, steps, h = trapeze(f, a, b, m)

# Points pour le graphe
x_plot = list(np.linspace(a, b, 300))
y_plot = [round(f(xi), 6) for xi in x_plot]

# Points des sous-intervalles
x_nodes = [round(a + j * h, 6) for j in range(m + 1)]
y_nodes = [round(f(xj), 6) for xj in x_nodes]

json.dumps({
    'result':  result,
    'steps':   steps,
    'h':       h,
    'x_plot':  [round(v, 6) for v in x_plot],
    'y_plot':  y_plot,
    'x_nodes': x_nodes,
    'y_nodes': y_nodes,
    'fa':      round(f(a), 6),
    'fb':      round(f(b), 6)
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
  document.getElementById('result-value').textContent = `I ≈ ${data.result}`;
  document.getElementById('result-info').textContent  =
    `h = ${data.h} — ${m} sous-intervalles — ${m + 1} points`;
  document.getElementById('result-box').classList.add('visible');

  // Tableau
  fillTable(data.steps, data.fa, data.fb, a, b);

  // Graphe
  drawChart(data, a, b);
}

// ═══════════════════════════════════════
//  TABLEAU DES ÉTAPES
// ═══════════════════════════════════════

function fillTable(steps, fa, fb, a, b) {
  const tbody     = document.getElementById('table-body');
  const container = document.getElementById('table-container');

  tbody.innerHTML = '';

  // Ligne a
  const trA = document.createElement('tr');
  trA.innerHTML = `
    <td>0</td>
    <td><strong>${a}</strong></td>
    <td>${fa}</td>
    <td style="color:var(--accent); font-weight:700;">1/2</td>
    <td>${(fa / 2).toFixed(6)}</td>
  `;
  tbody.appendChild(trA);

  // Lignes intermédiaires
  steps.forEach((row, index) => {
    const tr = document.createElement('tr');
    tr.style.animation = `fadeIn 0.3s ease ${index * 0.03}s both`;
    tr.innerHTML = `
      <td>${row.j}</td>
      <td><strong>${row.xj}</strong></td>
      <td>${row.fxj}</td>
      <td style="color:rgba(79,70,229,1); font-weight:700;">1</td>
      <td>${row.contrib}</td>
    `;
    tbody.appendChild(tr);
  });

  // Ligne b
  const trB = document.createElement('tr');
  trB.innerHTML = `
    <td>${steps.length + 1}</td>
    <td><strong>${b}</strong></td>
    <td>${fb}</td>
    <td style="color:var(--accent); font-weight:700;">1/2</td>
    <td>${(fb / 2).toFixed(6)}</td>
  `;
  tbody.appendChild(trB);

  container.style.display = 'block';
}

// ═══════════════════════════════════════
//  GRAPHE
// ═══════════════════════════════════════

function drawChart(data, a, b) {
  const container = document.getElementById('chart-container');
  container.style.display = 'block';

  if (chart) {
    chart.destroy();
    chart = null;
  }

  const ctx = document.getElementById('myChart').getContext('2d');

  // Données des trapèzes
  const trapezoidData = [];
  for (let i = 0; i < data.x_nodes.length - 1; i++) {
    trapezoidData.push({ x: data.x_nodes[i],     y: data.y_nodes[i] });
    trapezoidData.push({ x: data.x_nodes[i + 1], y: data.y_nodes[i + 1] });
    trapezoidData.push({ x: data.x_nodes[i + 1], y: 0 });
    trapezoidData.push({ x: data.x_nodes[i],     y: 0 });
    trapezoidData.push({ x: data.x_nodes[i],     y: data.y_nodes[i] });
  }

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.x_plot,
      datasets: [
        {
          label: 'f(x)',
          data: data.y_plot,
          borderColor: 'rgba(79, 70, 229, 1)',
          backgroundColor: 'rgba(79, 70, 229, 0.08)',
          borderWidth: 2.5,
          pointRadius: 0,
          fill: true,
          tension: 0.4
        },
        {
          label: 'Trapèzes',
          data: data.x_nodes.map((x, i) => ({ x, y: data.y_nodes[i] })),
          borderColor: 'rgba(239, 68, 68, 0.8)',
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          borderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
          fill: false,
          tension: 0,
          type: 'line'
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
          title: { display: true, text: 'f(x)', color: 'var(--text-secondary)' },
          ticks: { color: 'var(--text-secondary)' },
          grid:  { color: 'var(--border)' }
        }
      }
    }
  });
}