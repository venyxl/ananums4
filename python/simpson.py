import numpy as np

def simpson(f, a, b, m):
    """
    f : fonction à intégrer
    a : borne inférieure
    b : borne supérieure
    m : nombre de sous-intervalles (doit être pair)
    """
    h = (b - a) / (2 * m)
    s = 0
    steps = []

    for i in range(1, 2 * m):
        xi = a + i * h
        if i % 2 == 0:
            coeff = 2
        else:
            coeff = 4
        s += coeff * f(xi)
        steps.append({
            'i':     i,
            'xi':    round(xi, 6),
            'f(xi)': round(f(xi), 6),
            'coeff': coeff
        })

    I = (h / 3) * (f(a) + f(b) + s)
    return round(I, 8), steps