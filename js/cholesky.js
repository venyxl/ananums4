// ═══════════════════════════════════════
//  DÉCOMPOSITION DE CHOLESKY
// ═══════════════════════════════════════

let chart = null;

function parseMatrix(str) {
    return str.trim().split(';').map(row => row.trim().split(',').map(v => parseFloat(v.trim())));
}
function parseVector(str) {
    return str.trim().split(',').map(v => parseFloat(v.trim()));
}

async function calculate() {
    const { aStr, bStr } = window.matrixInput.getValues();
    const A = parseMatrix(aStr), b = parseVector(bStr);
    const n = A.length;
    if (A.some(r => r.length !== n) || b.length !== n) { alert('⚠️ Dimensions incorrectes.'); return; }

    const btn = document.querySelector('.btn-primary');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Calcul...';
    btn.disabled = true;

    const code = `
import numpy as np
import json

A = np.array(${JSON.stringify(A)}, dtype=float)
B = np.array(${JSON.stringify(b)}, dtype=float)

if not np.allclose(A, A.T):
    raise ValueError("La matrice n'est pas symétrique")
eigvals = np.linalg.eigvals(A)
if not np.all(eigvals > 0):
    raise ValueError("La matrice n'est pas définie positive")

n = A.shape[0]
R = np.zeros((n,n))
R[0,0] = np.sqrt(A[0,0])
for i in range(1,n):
    R[i,0] = A[i,0]/R[0,0]
for j in range(1,n):
    s = sum(R[j,k]**2 for k in range(j))
    R[j,j] = np.sqrt(A[j,j]-s)
    for i in range(j+1,n):
        s2 = sum(R[i,k]*R[j,k] for k in range(j))
        R[i,j] = (A[i,j]-s2)/R[j,j]

Y = np.zeros(n)
Y[0] = B[0]/R[0,0]
for i in range(1,n):
    s = sum(R[i,j]*Y[j] for j in range(i))
    Y[i] = (B[i]-s)/R[i,i]

X = np.zeros(n)
for i in range(n-1,-1,-1):
    s = sum(R[j,i]*X[j] for j in range(i+1,n))
    X[i] = (Y[i]-s)/R[i,i]

verify = np.allclose(A @ X, B)
det = float(np.linalg.det(A))
eigvals_list = eigvals.tolist()

json.dumps({
    'R': R.tolist(), 'Y': Y.tolist(), 'X': X.tolist(),
    'verify': bool(verify), 'det': round(det,6),
    'eigvals': [round(float(v),6) for v in eigvals_list], 'n': int(n)
})
`;

    const { success, result, error } = await runPython(code);
    btn.innerHTML = '<i class="fas fa-calculator"></i> Décomposer & Résoudre';
    btn.disabled = false;
    if (!success) { alert('❌ Erreur : ' + error); return; }

    const data = JSON.parse(result);
    showResults(data);
    showMatrix(data);
    drawChart(data);
}

function showResults(data) {
    document.getElementById('result-box').classList.add('visible');
    document.getElementById('result-value').textContent =
        `Solution : x = [${data.X.map(v => v.toFixed(6)).join(', ')}]`;
    document.getElementById('result-info').textContent =
        `Vérification Ax=B : ${data.verify ? '✅ OK' : '❌ Erreur'} | det = ${data.det}`;
    const grid = document.getElementById('result-grid');
    grid.innerHTML = data.X.map((v, i) =>
        `<div class="result-card exact"><div class="rc-label">x${i + 1}</div><div class="rc-value">${v.toFixed(8)}</div></div>`
    ).join('') +
        `<div class="result-card"><div class="rc-label">Valeurs propres</div><div class="rc-value" style="font-size:0.78rem">${data.eigvals.join(', ')}</div></div>`;
}

function showMatrix(data) {
    const n = data.n;
    let h = `<div class="matrix-display"><div class="matrix-label" style="color:#818cf8">R (Cholesky)</div>
    <div class="matrix-grid" style="grid-template-columns:repeat(${n},1fr)">`;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const v = data.R[i][j];
        h += `<div class="matrix-cell ${Math.abs(v) < 1e-10 ? 'zero' : ''}">${Math.abs(v) < 1e-10 ? '0' : v.toFixed(4)}</div>`;
    }
    h += '</div></div>';
    document.getElementById('matrices-box').innerHTML = h;
    document.getElementById('matrices-container').style.display = 'block';

    document.getElementById('y-table-body').innerHTML = data.Y.map((v, i) => `<tr><td>y${i + 1}</td><td>${v.toFixed(8)}</td></tr>`).join('');
    document.getElementById('x-table-body').innerHTML = data.X.map((v, i) => `<tr><td>x${i + 1}</td><td>${v.toFixed(8)}</td></tr>`).join('');
    document.getElementById('table-container').style.display = 'block';
}

function drawChart(data) {
    document.getElementById('chart-container').style.display = 'block';
    if (chart) { chart.destroy(); chart = null; }
    const ctx = document.getElementById('myChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.X.map((_, i) => `x${i + 1}`),
            datasets: [
                { label: 'Solution X', data: data.X, backgroundColor: 'rgba(129,140,248,0.7)', borderColor: 'rgba(129,140,248,1)', borderWidth: 2, borderRadius: 6 },
                { label: 'Valeurs propres', data: data.eigvals, backgroundColor: 'rgba(16,185,129,0.7)', borderColor: 'rgba(16,185,129,1)', borderWidth: 2, borderRadius: 6 }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { labels: { color: 'var(--text-primary)' } }, zoom: { zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'y' }, pan: { enabled: true, mode: 'y' } } },
            scales: { x: { ticks: { color: 'var(--text-secondary)' }, grid: { color: 'var(--border)' } }, y: { ticks: { color: 'var(--text-secondary)' }, grid: { color: 'var(--border)' } } }
        }
    });
}

function resetZoom() { if (chart) chart.resetZoom(); }

function loadExample() {
    window.matrixInput.setValues('4,2;2,3', '4,6');
    calculate();
}