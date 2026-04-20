import os
import glob
import re

html_files = glob.glob(r'c:\Users\redaf\Projet AnaNum S4\pages\*.html')

replacements = [
    (r'<label>Fonction f\(x\)</label>', r'<label data-i18n="func">Fonction f(x)</label>'),
    (r'<label>Borne inférieure a</label>', r'<label data-i18n="lower_bound">Borne inférieure a</label>'),
    (r'<label>Borne supérieure b</label>', r'<label data-i18n="upper_bound">Borne supérieure b</label>'),
    (r'<label>Tolérance ε</label>', r'<label data-i18n="tolerance">Tolérance ε</label>'),
    (r'<label>Nombre de sous-intervalles m</label>', r'<label data-i18n="intervals">Nombre de sous-intervalles m</label>'),
    (r'<label>Points x \(noeuds\)</label>', r'<label data-i18n="x_nodes">Points x (noeuds)</label>'),
    (r'<label>Valeurs y = f\(x\)</label>', r'<label data-i18n="y_values">Valeurs y = f(x)</label>'),
    (r'<label>Point à interpoler</label>', r'<label data-i18n="interp_point">Point à interpoler</label>'),
    (r'<h3>Résultat</h3>', r'<h3 data-i18n="result">Résultat</h3>'),
    (r'Principe théorique</h2>', r'<span data-i18n="theory">Principe théorique</span></h2>'),
    (r'Zone interactive</h2>', r'<span data-i18n="interactive">Zone interactive</span></h2>'),
    (r'> Calculer\s*</button>', r'> <span data-i18n="calculate">Calculer</span>\n      </button>'),
    (r'> Décomposer &amp; Résoudre\s*</button>', r'> <span data-i18n="calculate">Décomposer &amp; Résoudre</span>\n      </button>'),
    (r'> Résoudre\s*</button>', r'> <span data-i18n="calculate">Résoudre</span>\n      </button>'),
    (r'Tableau des itérations</h2>', r'<span data-i18n="iterations_table">Tableau des itérations</span></h2>'),
    (r'Tableau des étapes</h2>', r'<span data-i18n="steps_table">Tableau des étapes</span></h2>'),
    (r'> Retour à l\'accueil</a>', r'> <span data-i18n="back_home">Retour à l\'accueil</span></a>'),
]

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    for old, new in replacements:
        new_content = re.sub(old, new, new_content)
        
    if new_content != content:
        with open(file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Updated {file}')
