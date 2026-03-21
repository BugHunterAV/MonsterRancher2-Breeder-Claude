"""
breeding.py — Lógica central de breeding do Monster Rancher 2
Baseado no "Monster Rancher: Combining FAQ" de Kurasu Soratobu
e no pacote R 'ranchr' de duckmayr.

Como o breeding funciona:
  1. Cada tipo de monstro tem um multiplicador por stat (gain_rate).
  2. O stat *ajustado* = stat_atual * multiplicador.
  3. Os stats ajustados são ORDENADOS (maior → menor).
  4. A combinação compara a ORDEM dos dois pais com a ORDEM BASELINE do possível filho.
  5. Quantos stats têm a mesma posição relativa = "matches".
  6. Mais matches = maior chance de sair esse filho e com stats melhores.
"""

STAT_NAMES = ["Life", "Power", "Intelligence", "Skill", "Speed", "Defense"]
STAT_ABBR  = ["L", "P", "I", "Sk", "Sp", "D"]

# ---------------------------------------------------------------------------
# MONSTER_DATA: {breed_name: {stat_name: (gain_value, multiplier), baseline}}
# gain_value: pontos de ganho por treino (1-5)
# multiplier: fator de ajuste do stat
# baseline: stat base ao sair de um CD
# stat order: ["Life","Power","Intelligence","Skill","Speed","Defense"] index
# ---------------------------------------------------------------------------

MONSTER_DATA = {
    # Format: breed: {"gains": [L,P,I,Sk,Sp,D], "mults": [L,P,I,Sk,Sp,D], "baseline": [L,P,I,Sk,Sp,D]}
    # gains = pontos de ganho (1=+25%,2=+50%,3=+100%,4=+150%,5=+200%)
    # mult map: gain -> multiplier: 1->0.25, 2->0.50, 3->1.00, 4->1.50, 5->2.00
    # (gain 0 -> mult 0.00, used rarely)
    "Pixie":       {"gains":[2,2,4,3,4,1], "baseline":[100,100,160,130,120,50]},
    "Dragon":      {"gains":[4,4,2,3,2,3], "baseline":[120,130,90,100,90,130]},
    "Centaur":     {"gains":[3,3,2,4,4,2], "baseline":[100,120,80,130,140,90]},
    "ColorPandora":{"gains":[2,2,4,4,3,2], "baseline":[80,80,150,160,100,70]},
    "Beaclon":     {"gains":[3,4,1,3,2,4], "baseline":[140,160,40,100,80,160]},
    "Henger":      {"gains":[2,2,4,3,2,4], "baseline":[120,100,160,120,80,160]},
    "Wracky":      {"gains":[2,3,3,4,4,1], "baseline":[80,100,120,160,160,40]},
    "Golem":       {"gains":[4,4,1,2,1,5], "baseline":[200,180,30,60,30,200]},
    "Zuum":        {"gains":[3,3,2,4,4,2], "baseline":[120,120,80,130,150,80]},
    "Durahan":     {"gains":[4,4,2,3,2,4], "baseline":[160,170,60,100,70,170]},
    "Arrow Head":  {"gains":[2,3,3,4,5,1], "baseline":[80,100,120,150,180,40]},
    "Tiger":       {"gains":[2,2,4,5,3,1], "baseline":[90,80,130,170,100,60]},
    "Hopper":      {"gains":[2,2,3,4,5,1], "baseline":[80,70,100,150,180,40]},
    "Suezo":       {"gains":[2,1,4,4,3,1], "baseline":[100,60,160,170,100,50]},
    "Baku":        {"gains":[4,3,2,2,3,4], "baseline":[180,130,80,70,100,160]},
    "Gali":        {"gains":[2,2,4,4,3,2], "baseline":[80,80,160,160,100,80]},
    "Kato":        {"gains":[3,3,4,4,4,1], "baseline":[100,110,150,160,150,40]},
    "Zilla":       {"gains":[4,5,1,2,1,5], "baseline":[200,200,30,50,30,200]},
    "Bajarl":      {"gains":[3,2,4,3,3,2], "baseline":[120,80,160,120,120,80]},
    "Mew":         {"gains":[2,2,4,4,4,1], "baseline":[80,70,160,160,150,40]},
    "Phoenix":     {"gains":[3,2,4,4,4,2], "baseline":[110,80,160,160,160,70]},
    "Ghost":       {"gains":[1,2,5,4,3,1], "baseline":[50,80,200,160,100,50]},
    "Metalner":    {"gains":[2,2,4,4,3,2], "baseline":[80,80,160,160,110,80]},
    "Sponge":      {"gains":[3,2,3,3,3,3], "baseline":[120,80,120,120,120,120]},
    "Jell":        {"gains":[3,2,3,4,2,4], "baseline":[120,80,120,160,80,160]},
    "Hare":        {"gains":[2,2,4,5,4,1], "baseline":[80,70,150,180,160,40]},
    "Baddies":     {"gains":[3,3,3,4,3,2], "baseline":[110,110,120,160,110,80]},
    "Mono Eye":    {"gains":[2,2,4,5,3,1], "baseline":[90,80,130,170,100,60]},
    "Plant":       {"gains":[3,2,4,3,3,3], "baseline":[120,80,160,120,120,120]},
    "Monol":       {"gains":[3,2,4,4,2,4], "baseline":[120,80,160,160,80,160]},
    "Naga":        {"gains":[3,3,3,4,4,2], "baseline":[110,110,110,160,160,70]},
    "Worm":        {"gains":[3,4,2,3,2,5], "baseline":[120,160,80,110,80,200]},
    "Gitan":       {"gains":[3,3,3,3,4,2], "baseline":[120,110,110,110,160,80]},
    "Mock":        {"gains":[3,3,3,3,3,3], "baseline":[120,120,120,120,120,120]},
    "Joker":       {"gains":[2,2,5,5,3,1], "baseline":[70,70,180,180,100,40]},
    "Gaboo":       {"gains":[4,4,1,2,2,5], "baseline":[180,180,30,70,70,200]},
    "Jill":        {"gains":[3,4,2,3,2,4], "baseline":[130,160,80,110,80,160]},
    "Undine":      {"gains":[3,2,4,3,4,2], "baseline":[120,80,160,110,160,80]},
    "Niton":       {"gains":[2,3,4,3,2,4], "baseline":[80,110,160,120,80,160]},
    "Zan":         {"gains":[2,3,3,4,4,2], "baseline":[80,110,110,160,160,70]},
    "Ducken":      {"gains":[3,2,3,3,4,2], "baseline":[120,80,110,110,160,80]},
    "Orion":       {"gains":[2,2,4,5,4,1], "baseline":[80,70,150,180,160,40]},
    "Hachitaro":   {"gains":[3,3,3,4,3,2], "baseline":[120,120,110,160,110,70]},
}

# Gain value → stat multiplier
GAIN_TO_MULT = {0: 0.00, 1: 0.25, 2: 0.50, 3: 1.00, 4: 1.50, 5: 2.00}

def get_breed(name):
    """Return breed data, fallback to Tiger if unknown."""
    return MONSTER_DATA.get(name, MONSTER_DATA["Tiger"])

def calc_adjusted(main, sub, stats):
    """
    Calcula stats ajustados de um monstro.
    stats = [Life, Power, Intelligence, Skill, Speed, Defense]
    Retorna: (adjusted_list, stat_order_by_name)
    """
    main_data = get_breed(main)
    gains = main_data["gains"]

    adjusted = []
    for i, s in enumerate(stats):
        g = gains[i]
        mult = GAIN_TO_MULT[g]
        adj = int(s * mult)
        adj = min(adj, 999)
        adjusted.append(adj)

    # Ordenar índices por stat ajustado (maior → menor)
    order_idx = sorted(range(6), key=lambda i: adjusted[i], reverse=True)
    order = [STAT_NAMES[i] for i in order_idx]
    order_abbr = [STAT_ABBR[i] for i in order_idx]

    return adjusted, order_abbr

def get_baseline_order(breed):
    """Retorna a ordem dos stats baseline (maior → menor) de um tipo de monstro."""
    data = get_breed(breed)
    baseline = data["baseline"]
    order_idx = sorted(range(6), key=lambda i: baseline[i], reverse=True)
    return [STAT_NAMES[i] for i in order_idx], [STAT_ABBR[i] for i in order_idx]

def count_matches(order1, order2):
    """Conta quantos stats estão na mesma posição relativa entre duas ordens."""
    return sum(1 for a, b in zip(order1, order2) if a == b)

def dadge_says(matches):
    if matches == 6:
        return "Ótimo! Essa combinação não pode dar errado a não ser que algo muito estranho aconteça."
    elif matches >= 4:
        return "Parece uma boa combinação. Deve sair bem."
    elif matches >= 2:
        return "É uma combinação razoável. Pode sair bem, pode não sair."
    else:
        return "Essa combinação não parece tão boa. O resultado pode ser imprevisível."

def calc_all_combos(main1, sub1, stats1, main2, sub2, stats2):
    """
    Calcula todos os possíveis filhos de uma combinação.
    Retorna lista ordenada por número de matches.
    """
    adj1, order1 = calc_adjusted(main1, sub1, stats1)
    adj2, order2 = calc_adjusted(main2, sub2, stats2)

    # Possíveis filhos: combinações de main/sub dos pais
    possible_children = set()
    parents_breeds = {main1, sub1, main2, sub2}
    for b1 in [main1, sub1]:
        for b2 in [main1, sub1, main2, sub2]:
            possible_children.add((b1, b2))
        for b2 in [main2, sub2]:
            possible_children.add((b1, b2))
            possible_children.add((b2, b1))
    for b1 in [main2, sub2]:
        for b2 in [main1, sub1, main2, sub2]:
            possible_children.add((b1, b2))

    results = []
    seen = set()
    for (cm, cs) in possible_children:
        key = (cm, cs)
        if key in seen:
            continue
        seen.add(key)

        child_name = f"{cm}" if cm == cs else f"{cm}/{cs} hybrid"
        # Nome do monstro filho: usa o nome especial se main==sub, senão o nome do main
        display_name = breed_child_name(cm, cs)

        bl_order_names, bl_order_abbr = get_baseline_order(cm)

        # matches: comparar ordem do pai1 com baseline do filho (usando abreviações)
        m1 = count_matches(order1, bl_order_abbr)
        m2 = count_matches(order2, bl_order_abbr)
        total = m1 + m2  # máximo = 12, usual = 0-6 each

        # Para fins de display, usar o menor dos dois (mais conservador)
        matches = min(m1, m2)
        both_matches = m1 + m2

        results.append({
            "main": cm,
            "sub": cs,
            "display_name": display_name,
            "baseline_order": bl_order_abbr,
            "matches_p1": m1,
            "matches_p2": m2,
            "total_matches": both_matches,
            "min_matches": matches,
        })

    results.sort(key=lambda x: x["total_matches"], reverse=True)

    # Dados de retorno completos
    return {
        "parent1": {
            "main": main1, "sub": sub1,
            "stats": stats1,
            "adjusted": adj1,
            "order": order1,
        },
        "parent2": {
            "main": main2, "sub": sub2,
            "stats": stats2,
            "adjusted": adj2,
            "order": order2,
        },
        "children": results[:12],
        "dadge": dadge_says(results[0]["min_matches"] if results else 0),
        "best": results[0] if results else None,
    }

def breed_child_name(main, sub):
    """Gera nome de exibição do filho."""
    if main == sub:
        return main
    # Alguns nomes especiais conhecidos
    specials = {
        ("Tiger","Suezo"): "Mono Eye",
        ("Zuum","Suezo"): "Mustardy",
        ("Tiger","Tiger"): "Tiger",
        ("Suezo","Suezo"): "Suezo",
        ("Pixie","Dragon"): "Granity",
    }
    return specials.get((main,sub), f"{main} ({sub})")
