// ═══════════════════════════════════════
//  POINT FIXE
// ═══════════════════════════════════════

let chart = null;

async function calculate() {
    const g = document.getElementById('func-g').value.trim();
    const x0 = parseFloat(document.getElementById('val-x0').value);
    const tol = parseFloat(document.getElementById('val-tol').value);
    const maxIt = parseInt(document.getElementById('val-maxiter').value);

    if (!g || isNaN(x0) || isNaN(tol) || isNaN(maxIt)) {
        alert('⚠️ Veuillez remplir tous les champs.'); return;
    }

    const btn = document.querySelector('.btn-primary');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Calcul...';
    btn.disabled = true;

    const code = `
import numpy as np
import json

def g(x):
    return ${g}

x = ${x0}
n = 0
iterations = []
converged = False
max_iter = ${maxIt}
tol = ${tol}

while n < max_iter:
    x_new = g(x)
    erreur = abs(x_new - x)
    iterations.append({'n': n+1, 'x': round(float(x_new),10), 'erreur': round(float(erreur),10)})
    n += 1
    if erreur < tol or x_new == x:
        converged = True
        break
    x = x_new

root = round(float(x_new if n>0 else x), 10)

exact = None
try:
    from sympy import symbols, solve, sympify
    x_sym = symbols('x')
    expr = sympify("${g}".replace("np.sin","sin").replace("np.cos","cos")
        .replace("np.exp","exp").replace("np.sqrt","sqrt")
        .replace("np.log","log").replace("np.pi","pi").replace("np.","")) - x_sym
    sols = solve(expr, x_sym)
    if sols:
        candidates = [float(s) for s in sols if s.is_real]
        if candidates:
            exact = round(min(candidates, key=lambda v: abs(v-root)), 10)
except:
    exact = None

err_abs = round(abs(root - exact), 10) if exact is not None else None

json.dumps({
    'root': root, 'iterations': n, 'converged': converged,
    'table': iterations, 'exact': exact, 'err_abs': err_abs
})
`;

    const { success, result, error } = await runPython(code);
    btn.innerHTML = '<i class="fas fa-calculator"></i> Calculer';
    btn.disabled = false;
    if (!success) { alert('❌ Erreur : ' + error); return; }

    const data = JSON.parse(result);
    showResults(data);
    fillTable(data.table);
    drawChart(data.table);
}

function showResults(data) {
    document.getElementById('result-box').classList.add('visible');
    document.getElementById('result-value').textContent =
        `Racine ≈ ${data.root}`;
    document.getElementById('result-info').textContent =
        `${data.converged ? '✅ Convergence' : '⚠️ Limite atteinte'} en ${data.iterations} itérations`;

    const grid = document.getElementById('result-grid');
    grid.innerHTML = `<div class="result-card"><div class="rc-label">Valeur approchée</div><div class="rc-value">${data.root}</div></div>`;
    if (data.exact !== null) {
        grid.innerHTML += `<div class="result-card exact"><div class="rc-label">Valeur exacte</div><div class="rc-value">${data.exact}</div></div>
    <div class="result-card error"><div class="rc-label">Erreur absolue</div><div class="rc-value">${data.err_abs}</div></div>`;
    }
    grid.innerHTML += `<div class="result-card"><div class="rc-label">Itérations</div><div class="rc-value">${data.iterations}</div></div>`;
}

function fillTable(table) {
    const tbody = document.getElementById('table-body');
    const container = document.getElementById('table-container');
    tbody.innerHTML = '';
    table.forEach((row, i) => {
        const tr = document.createElement('tr');
        tr.style.animation = `fadeIn 0.3s ease ${i * 0.02}s both`;
        tr.innerHTML = `<td>${row.n}</td><td><strong>${row.x}</strong></td>
      <td style="color:${row.erreur < 0.001 ? 'var(--accent)' : 'inherit'}">${row.erreur.toExponential(4)}</td>`;
        tbody.appendChild(tr);
    });
    container.style.display = 'block';
}

function drawChart(table) {
    document.getElementById('chart-container').style.display = 'block';
    if (chart) { chart.destroy(); chart = null; }
    const ctx = document.getElementById('myChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: table.map(r => `n=${r.n}`),
            datasets: [
                { label: 'x (approximation)', data: table.map(r => r.x), borderColor: 'rgba(79,70,229,1)', backgroundColor: 'rgba(79,70,229,0.1)', borderWidth: 2.5, pointRadius: 3, fill: true, tension: 0.3, yAxisID: 'y' },
                { label: 'Erreur', data: table.map(r => r.erreur), borderColor: 'rgba(239,68,68,1)', backgroundColor: 'rgba(239,68,68,0.05)', borderWidth: 1.5, pointRadius: 2, fill: false, tension: 0.3, yAxisID: 'y1' }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { labels: { color: 'var(--text-primary)' } }, zoom: { zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'xy' }, pan: { enabled: true, mode: 'xy' } } },
            scales: {
                x: { ticks: { color: 'var(--text-secondary)' }, grid: { color: 'var(--border)' } },
                y: { position: 'left', ticks: { color: 'rgba(79,70,229,1)' }, grid: { color: 'var(--border)' } },
                y1: { type: 'logarithmic', position: 'right', ticks: { color: 'rgba(239,68,68,1)' }, grid: { drawOnChartArea: false } }
            }
        }
    });
}

function resetZoom() { if (chart) chart.resetZoom(); }