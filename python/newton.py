import numpy as np

def newton(x, y, val):
    """
    x   : liste des noeuds
    y   : liste des valeurs f(x)
    val : point où on veut interpoler
    """
    n = len(x)

    # Table des différences divisées
    m = np.zeros((n, n))
    m[:, 0] = y

    for i in range(1, n):
        for j in range(i, n):
            m[j, i] = (m[j, i-1] - m[j-1, i-1]) / (x[j] - x[j-i])

    # Évaluation du polynôme en val
    result = m[0, 0]
    product = 1.0

    for i in range(1, n):
        product *= (val - x[i-1])
        result  += m[i, i] * product

    return round(float(result), 8), m.tolist()