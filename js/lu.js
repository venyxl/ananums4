// ═══════════════════════════════════════
//  DÉCOMPOSITION LU
// ═══════════════════════════════════════

let chart = null;

function parseMatrix(str) {
    try {
        return str.trim().split(';').map(row =>
            row.trim().split(',').map(v => parseFloat(v.trim()))
        );
    } catch { return null; }
}

function parseVector(str) {
    try {
        return str.trim().split(',').map(v => parseFloat(v.trim()));
    } catch { return null; }
}

function validateInputs() {
    const { aStr, bStr } = window.matrixInput.getValues();
    const A = parseMatrix(aStr);
    const b = parseVector(bStr);
    if (!A || !b) { alert('⚠️ Format invalide.'); return null; }
    const n = A.length;
    if (A.some(r => r.length !== n)) { alert('⚠️ A doit être carrée.'); return null; }
    if (b.length !== n) { alert('⚠️ B doit avoir autant d\'éléments que les lignes de A.'); return null; }
    return { A, b, n };
}

async function calculate() {
    const parsed = validateInputs();
    if (!parsed) return;
    const { A, b } = parsed;

    const btn = document.querySelector('.btn-primary');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Calcul en cours...';
    btn.disabled = true;

    const Astr = JSON.stringify(A);
    const bstr = JSON.stringify(b);

    const code = `
import numpy as np
import json

A = np.array(${Astr}, dtype=float)
B = np.array(${bstr}, dtype=float).reshape(-1,1)

det = np.linalg.det(A)
if abs(det) < 1e-10:
    raise ValueError("Matrice singulière")

n = A.shape[0]
Ac = A.copy()
L = np.zeros((n,n))
for i in range(n-1):
    E = np.eye(n)
    for j in range(i+1,n):
        w = Ac[j,i]/Ac[i,i]
        E[j,i] = -w
    Ac = E @ Ac
    L = L + E
L = -L
for i in range(n): L[i,i] = 1
U = Ac

Y = np.zeros(n)
Y[0] = B[0,0]
for i in range(1,n):
    s = sum(L[i,j]*Y[j] for j in range(i))
    Y[i] = B[i,0] - s

X = np.zeros(n)
for i in range(n-1,-1,-1):
    s = sum(U[i,j]*X[j] for j in range(i+1,n))
    X[i] = (Y[i]-s)/U[i,i]

verify = np.allclose(A @ X, B.flatten())

json.dumps({
    'L': L.tolist(), 'U': U.tolist(),
    'Y': Y.tolist(), 'X': X.tolist(),
    'det': round(float(det),6),
    'verify': bool(verify),
    'n': int(n)
})
`;

    const { success, result, error } = await runPython(code);
    btn.innerHTML = '<i class="fas fa-calculator"></i> Décomposer & Résoudre';
    btn.disabled = false;
    if (!success) { alert('❌ Erreur : ' + error); return; }

    const data = JSON.parse(result);
    showResults(data);
    showMatrices(data);
    drawChart(data);
}

function showResults(data) {
    const box = document.getElementById('result-box');
    box.classList.add('visible');
    document.getElementById('result-value').textContent =
        `Solution : x = [${data.X.map(v => v.toFixed(6)).join(', ')}]`;
    document.getElementById('result-info').textContent =
        `det(A) = ${data.det} | Vérification Ax=B : ${data.verify ? '✅ OK' : '❌ Erreur'}`;

    const grid = document.getElementById('result-grid');
    grid.innerHTML = data.X.map((v, i) =>
        `<div class="result-card exact"><div class="rc-label">x${i + 1}</div><div class="rc-value">${v.toFixed(8)}</div></div>`
    ).join('') +
        `<div class="result-card"><div class="rc-label">det(A)</div><div class="rc-value">${data.det}</div></div>`;
}

function showMatrices(data) {
    const n = data.n;
    function matHTML(M, label, color) {
        let h = `<div class="matrix-display"><div class="matrix-label" style="color:${color}">${label}</div><div class="matrix-grid" style="grid-template-columns:repeat(${n},1fr)">`;
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
            const val = M[i][j];
            const hi = (label === 'L' && j < i) || (label === 'U' && j >= i) || (label === 'L' && i === j);
            h += `<div class="matrix-cell ${Math.abs(val) < 1e-10 ? 'zero' : ''}">${Math.abs(val) < 1e-10 ? '0' : val.toFixed(4)}</div>`;
        }
        return h + '</div></div>';
    }
    document.getElementById('matrices-box').innerHTML =
        matHTML(data.L, 'L', '#10b981') + matHTML(data.U, 'U', '#818cf8');
    document.getElementById('matrices-container').style.display = 'block';

    const yTbody = document.getElementById('y-table-body');
    yTbody.innerHTML = data.Y.map((v, i) =>
        `<tr><td>y${i + 1}</td><td>${v.toFixed(8)}</td></tr>`).join('');
    const xTbody = document.getElementById('x-table-body');
    xTbody.innerHTML = data.X.map((v, i) =>
        `<tr><td>x${i + 1}</td><td>${v.toFixed(8)}</td></tr>`).join('');
    document.getElementById('table-container').style.display = 'block';
}

function drawChart(data) {
    document.getElementById('chart-container').style.display = 'block';
    if (chart) { chart.destroy(); chart = null; }
    const ctx = document.getElementById('myChart').getContext('2d');
    const labels = data.X.map((_, i) => `x${i + 1}`);
    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Solution X',
                data: data.X,
                backgroundColor: 'rgba(79,70,229,0.7)',
                borderColor: 'rgba(79,70,229,1)',
                borderWidth: 2,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { labels: { color: 'var(--text-primary)' } },
                zoom: { zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'y' }, pan: { enabled: true, mode: 'y' } }
            },
            scales: {
                x: { ticks: { color: 'var(--text-secondary)' }, grid: { color: 'var(--border)' } },
                y: { ticks: { color: 'var(--text-secondary)' }, grid: { color: 'var(--border)' } }
            }
        }
    });
}

function resetZoom() { if (chart) chart.resetZoom(); }

function loadExample() {
    window.matrixInput.setValues('4,3;6,3', '10,12');
    calculate();
}