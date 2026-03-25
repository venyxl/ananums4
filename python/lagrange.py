import numpy as np

def lagrange(a, b, x):
    """
    a : liste des points x (noeuds)
    b : liste des valeurs f(x)
    x : point où on veut interpoler
    """
    n = len(a)
    result = 0.0

    for i in range(n):
        # Calcul du polynôme de base L_i(x)
        numerator   = 1.0
        denominator = 1.0

        for j in range(n):
            if j != i:
                numerator   *= (x - a[j])
                denominator *= (a[i] - a[j])

        result += b[i] * (numerator / denominator)

    return round(result, 8)