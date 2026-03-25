import numpy as np

def dicho(f, s, a, b, max_iter=1000):
    iterations = []

    if f(a) * f(b) >= 0:
        raise ValueError("f(a) et f(b) doivent avoir des signes opposés")

    n = 0
    m = (a + b) / 2

    while abs(f(m)) > s and n < max_iter:
        m = (a + b) / 2
        iterations.append({
            'n':    n,
            'a':    round(a, 8),
            'b':    round(b, 8),
            'm':    round(m, 8),
            'f(m)': round(f(m), 8)
        })
        if f(m) * f(a) > 0:
            a = m
        else:
            b = m
        n += 1

    return round(m, 8), n, iterations