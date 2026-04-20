// ═══════════════════════════════════════
//  GAUSS-JORDAN
// ═══════════════════════════════════════

let chart = null;

function parseMatrix(str) {
    return str.trim().split(';').map(r => r.trim().split(',').map(v => parseFloat(v.trim())));
}
function parseVector(str) {
    return str.trim().split(',').map(v => parseFloat(v.trim()));
}

async function calculate() {
    const { aStr, bStr } = window.matrixInput.getValues();
    const A = parseMatrix(aStr);
    const b = parseVector(bStr);
    const n = A.length;
    if (A.some(r => r.length !== n) || b.length !== n) { alert('⚠️ Dimensions incorrectes.'); return; }

    const btn = document.querySelector('.btn-primary');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Calcul...';
    btn.disabled = true;

    const code = `
import numpy as np
import json

A_orig = np.array(${JSON.stringify(A)}, dtype=float)
b_orig = np.array(${JSON.stringify(b)}, dtype=float)

M = np.hstack((A_orig, b_orig.reshape(-1,1))).astype(float)
n = A_orig.shape[0]
steps = []

for i in range(n):
    M[i,:] = M[i,:] / M[i,i]
    for j in range(n):
        if i != j:
            M[j,:] = M[j,:] - M[j,i]*M[i,:]
    steps.append({'pivot': i, 'matrix': M.tolist()})

X = M[:,n]
verify = np.allclose(A_orig @ X, b_orig)
det = float(np.linalg.det(A_orig))

json.dumps({
    'X': X.tolist(), 'reduced': M.tolist(),
    'steps': steps, 'verify': bool(verify),
    'det': round(det,6), 'n': int(n)
})
`;

    const { success, result, error } = await runPython(code);
    btn.innerHTML = '<i class="fas fa-calculator"></i> Résoudre';
    btn.disabled = false;
    if (!success) { alert('❌ Erreur : ' + error); return; }

    const data = JSON.parse(result);
    showResults(data);
    showSteps(data);
    drawChart(data);
}

function showResults(data) {
    document.getElementById('result-box').classList.add('visible');
    document.getElementById('result-value').textContent =
        `Solution : x = [${data.X.map(v => v.toFixed(6)).join(', ')}]`;
    document.getElementById('result-info').textContent =
        `Matrice réduite — det(A) = ${data.det} | Vérification : ${data.verify ? '✅ OK' : '❌ Erreur'}`;
    document.getElementById('result-grid').innerHTML = data.X.map((v, i) =>
        `<div class="result-card exact"><div class="rc-label">x${i + 1}</div><div class="rc-value">${v.toFixed(8)}</div></div>`
    ).join('');
}

function showSteps(data) {
    const n = data.n;
    const M = data.reduced;
    let h = `<div class="matrix-display"><div class="matrix-label" style="color:#ec4899">Matrice réduite [I|X]</div>
    <div class="matrix-grid" style="grid-template-columns:repeat(${n + 1},1fr)">`;
    for (let i = 0; i < n; i++) for (let j = 0; j <= n; j++) {
        const v = M[i][j];
        const isSep = j === n, isDiag = i === j;
        h += `<div class="matrix-cell${isSep ? ' separator' : ''} ${isDiag ? 'diag' : ''} ${Math.abs(v) < 1e-10 ? 'zero' : ''}">${Math.abs(v) < 1e-10 ? '0' : v.toFixed(4)}</div>`;
    }
    h += '</div></div>';
    document.getElementById('matrices-box').innerHTML = h;
    document.getElementById('matrices-container').style.display = 'block';
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
            datasets: [{ label: 'Solution X', data: data.X, backgroundColor: 'rgba(236,72,153,0.7)', borderColor: 'rgba(236,72,153,1)', borderWidth: 2, borderRadius: 6 }]
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
    window.matrixInput.setValues('2,1,-1;-3,-1,2;-2,1,2', '8,-11,-3');
    calculate();
}