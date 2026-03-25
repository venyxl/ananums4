import numpy as np

def trapeze(f, a, b, m):
    """
    f : fonction à intégrer
    a : borne inférieure
    b : borne supérieure
    m : nombre de sous-intervalles
    """
    h = (b - a) / m
    s = 0
    steps = []

    for j in range(1, m):
        xj = a + j * h
        s += f(xj)
        steps.append({
            'j':     j,
            'xj':    round(xj, 6),
            'f(xj)': round(f(xj), 6)
        })

    I = h * s + (h / 2) * (f(a) + f(b))
    return round(I, 8), steps