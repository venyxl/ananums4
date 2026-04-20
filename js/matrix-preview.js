function updateMatrixPreview() {
    const matAStr = document.getElementById('mat-a').value;
    const vecBStr = document.getElementById('vec-b') ? document.getElementById('vec-b').value : '';
    const container = document.getElementById('matrix-preview-container');

    if (!matAStr.trim()) {
        container.style.display = 'none';
        return;
    }

    try {
        const A = matAStr.trim().split(';').map(r => r.split(',').filter(v => v.trim() !== '').map(v => v.trim()));
        const b = vecBStr.trim() ? vecBStr.split(',').filter(v => v.trim() !== '').map(v => v.trim()) : [];
        
        const n = A.length;
        const m = A[0].length;

        let html = `
            <div class="matrix-display" style="margin-top:20px; animation: fadeIn 0.4s ease-out;">
                <div class="matrix-label" style="color:var(--accent); font-weight:600; margin-bottom:10px;">
                    <i class="fas fa-eye"></i> Aperçu de la matrice [A|b]
                </div>
                <div class="matrix-grid" style="grid-template-columns: repeat(${b.length > 0 ? m + 1 : m}, 1fr); max-width: fit-content; margin: 0 auto;">
        `;

        for (let i = 0; i < n; i++) {
            for (let j = 0; j < m; j++) {
                html += `<div class="matrix-cell">${A[i][j] || '?'}</div>`;
            }
            if (b.length > 0) {
                html += `<div class="matrix-cell separator">${b[i] || '?'}</div>`;
            }
        }

        html += `</div></div>`;
        container.innerHTML = html;
        container.style.display = 'block';
    } catch (e) {
        container.style.display = 'none';
    }
}

// Initialiser l'aperçu au chargement si les champs sont déjà remplis
document.addEventListener('DOMContentLoaded', () => {
    const matA = document.getElementById('mat-a');
    if (matA) {
        updateMatrixPreview();
        matA.addEventListener('input', updateMatrixPreview);
        const vecB = document.getElementById('vec-b');
        if (vecB) vecB.addEventListener('input', updateMatrixPreview);
    }
});
