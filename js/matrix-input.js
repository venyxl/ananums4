class MatrixInput {
    constructor(containerId, defaultDim = 3) {
        this.container = document.getElementById(containerId);
        this.dim = defaultDim;
        if (!this.container) return;
        this.initUI();
        this.renderGrid();
    }

    initUI() {
        this.container.innerHTML = `
            <div class="modern-matrix-wrapper">
                <div class="dim-controls">
                    <label style="font-weight:600; color:var(--text-primary);">Dimension (n × n) :</label>
                    <button type="button" class="btn-dim" onclick="window.matrixInput.changeDim(-1)"><i class="fas fa-minus"></i></button>
                    <input type="number" id="mat-dim" value="${this.dim}" readonly>
                    <button type="button" class="btn-dim" onclick="window.matrixInput.changeDim(1)"><i class="fas fa-plus"></i></button>
                </div>
                
                <div class="matrix-math-layout">
                    <div class="bracket left-bracket"></div>
                    <div class="matrix-grid-dynamic" id="mat-a-grid"></div>
                    <div class="bracket right-bracket"></div>
                    
                    <div class="matrix-operator">
                        <span style="font-size:1.4rem;">×</span><br>X<br><span style="font-size:1.4rem;">=</span>
                    </div>
                    
                    <div class="bracket left-bracket" style="border-color:#ec4899;"></div>
                    <div class="vector-grid-dynamic" id="vec-b-grid"></div>
                    <div class="bracket right-bracket" style="border-color:#ec4899;"></div>
                </div>
                <div style="text-align:center; margin-top:12px;">
                    <span class="matrix-input-hint">Remplissez les cases (laissez vide = 0)</span>
                </div>
            </div>
        `;
    }

    changeDim(delta) {
        let newDim = this.dim + delta;
        if (newDim >= 2 && newDim <= 8) {
            this.dim = newDim;
            document.getElementById('mat-dim').value = this.dim;
            this.renderGrid();
        }
    }

    renderGrid() {
        const matGrid = document.getElementById('mat-a-grid');
        const vecGrid = document.getElementById('vec-b-grid');
        
        matGrid.style.gridTemplateColumns = `repeat(${this.dim}, 1fr)`;
        matGrid.innerHTML = '';
        vecGrid.innerHTML = '';

        for (let i = 0; i < this.dim; i++) {
            for (let j = 0; j < this.dim; j++) {
                matGrid.innerHTML += `<input type="number" class="mat-cell mat-a-cell" data-row="${i}" data-col="${j}" step="any" placeholder="a${i+1},${j+1}">`;
            }
            vecGrid.innerHTML += `<input type="number" class="mat-cell vec-b-cell" data-row="${i}" step="any" placeholder="b${i+1}" style="border-left: 3px solid #ec4899;">`;
        }
    }

    getValues() {
        let A = [];
        let b = [];
        for (let i = 0; i < this.dim; i++) {
            A.push([]);
            b.push(0);
        }

        document.querySelectorAll('.mat-a-cell').forEach(input => {
            A[input.dataset.row][input.dataset.col] = parseFloat(input.value) || 0;
        });

        document.querySelectorAll('.vec-b-cell').forEach(input => {
            b[input.dataset.row] = parseFloat(input.value) || 0;
        });

        const aStr = A.map(row => row.join(',')).join(';');
        const bStr = b.join(',');

        return { aStr, bStr };
    }

    setValues(aStr, bStr) {
        const A = aStr.split(';').map(r => r.split(','));
        const b = bStr ? bStr.split(',') : [];
        this.dim = A.length;
        document.getElementById('mat-dim').value = this.dim;
        this.renderGrid();

        const aCells = document.querySelectorAll('.mat-a-cell');
        const bCells = document.querySelectorAll('.vec-b-cell');

        aCells.forEach(input => {
            input.value = A[input.dataset.row][input.dataset.col];
        });

        bCells.forEach(input => {
            if (b[input.dataset.row] !== undefined) {
                input.value = b[input.dataset.row];
            }
        });
    }
}
