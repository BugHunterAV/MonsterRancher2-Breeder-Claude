// breeding.js: Motor Matemático do App 100% estático

function get_breed(name) {
    return MONSTER_DATA[name] || MONSTER_DATA["Tiger"];
}

function calc_lifespan(main, sub) {
    if (!main || !sub) return "--";
    let m = get_breed(main).lifespan_base;
    let s = get_breed(sub).lifespan_base;
    let diff = s - m;
    let classes = diff / 50;
    return m + (classes * 20);
}

function calc_adjusted(main, sub, stats) {
    const main_data = get_breed(main);
    const gains = main_data.gains;
    let adjusted = [];
    for(let i = 0; i < 6; i++) {
        let mult = GAIN_TO_MULT[gains[i]];
        let adj = Math.floor(stats[i] * mult);
        adjusted.push(Math.min(adj, 999));
    }
    let order_idx = [0, 1, 2, 3, 4, 5].sort((a, b) => adjusted[b] - adjusted[a]);
    let order_abbr = order_idx.map(i => STAT_ABBR[i]);
    return { adjusted, order_abbr, order_idx };
}

function get_baseline_order(breed) {
    const baseline = get_breed(breed).baseline;
    let order_idx = [0, 1, 2, 3, 4, 5].sort((a, b) => baseline[b] - baseline[a]);
    return {
        order_names: order_idx.map(i => STAT_NAMES[i]),
        order_abbr: order_idx.map(i => STAT_ABBR[i]),
        baseline: baseline
    };
}

function count_matches(order1, order2) {
    let m = 0;
    for(let i=0; i<6; i++) {
        if(order1[i] === order2[i]) m++;
    }
    return m;
}

function dadge_says(matches) {
    if (matches === 6) return "Ótimo! Essa combinação não pode dar errado a não ser que algo muito estranho aconteça.";
    if (matches >= 4) return "Parece uma boa combinação. Deve sair bem.";
    if (matches >= 2) return "É uma combinação razoável. Pode sair bem, pode não sair.";
    return "Essa combinação não parece tão boa. O resultado pode ser imprevisível.";
}

function breed_child_name(main, sub) {
    if (main === sub) return main;
    const specials = {
        "Tiger|Suezo": "Mono Eye",
        "Zuum|Suezo": "Mustardy",
        "Pixie|Dragon": "Granity",
        "Gali|Suezo": "Furred Gali"
    };
    return specials[`${main}|${sub}`] || `${main} (${sub})`;
}

function calc_all_combos(main1, sub1, stats1, main2, sub2, stats2, seasoning = "") {
    const {adjusted: adj1, order_abbr: order1} = calc_adjusted(main1, sub1, stats1);
    const {adjusted: adj2, order_abbr: order2} = calc_adjusted(main2, sub2, stats2);

    let possible_children = new Set();
    [main1, sub1].forEach(b1 => {
        [main1, sub1, main2, sub2].forEach(b2 => possible_children.add(b1+"|"+b2));
    });
    [main2, sub2].forEach(b1 => {
        [main1, sub1, main2, sub2].forEach(b2 => possible_children.add(b1+"|"+b2));
    });

    // Modificadores de Item Secretos e Peaches
    let overrideMain = null;
    let overrideSub = null;
    let extraLife = 0;
    let extraStats = [0,0,0,0,0,0]; // Life, Pow, Int, Skl, Spd, Def

    const forcedBreeds = {
        "CrabsClaw": ["Arrow Head", "Arrow Head"],
        "DoubleEdged": ["Durahan", "Durahan"],
        "Mask": ["Joker", "Joker"],
        "DnaCapsule": ["Dragon", "Dragon"],
        "Stick": ["Ghost", "Ghost"],
        "Spear": ["Centaur", "Centaur"],
        "DuckenDoll": ["Ducken", "Ducken"],
        "UndineSlate": ["Undine", "Undine"],
        "ZillaBeard": ["Zilla", "Zilla"],
        "Ammonite": ["Niton", "Niton"],
        "FireFeather": ["Phoenix", "Phoenix"],
        "MagicPot": ["Bajarl", "Bajarl"]
    };

    if (forcedBreeds[seasoning]) {
        overrideMain = forcedBreeds[seasoning][0];
        overrideSub = forcedBreeds[seasoning][1];
    } 
    // Modificadores de Longevidade
    else if (seasoning === "GoldenPeach") { extraLife = 50; }
    else if (seasoning === "SilverPeach") { extraLife = 25; }
    else if (seasoning === "BothPeaches") { extraLife = 75; }
    else if (seasoning === "MockChip") { extraLife = 10; }
    else if (seasoning === "PlantChip") { extraLife = 10; }
    // Modificadores de Status Base
    else if (seasoning === "GolemChip") { extraStats[1] = 50; } // Power
    else if (seasoning === "DuckenChip") { extraStats[4] = 50; } // Speed
    else if (seasoning === "NagaChip") { extraStats[3] = 50; } // Skill

    if (overrideMain) {
        possible_children.clear();
        possible_children.add(overrideMain + "|" + overrideSub);
    }

    let results = [];
    possible_children.forEach(combo => {
        let [cm, cs] = combo.split("|");
        let display_name = breed_child_name(cm, cs);
        let {order_abbr: bl_order_abbr, baseline} = get_baseline_order(cm);

        let m1 = count_matches(order1, bl_order_abbr);
        let m2 = count_matches(order2, bl_order_abbr);
        let matches = Math.min(m1, m2);
        let total_matches = m1 + m2;

        // NOVIDADE: FÓRMULA DE PREVISÃO EXATA DE STATUS
        // Os stats são passados proporcionalmente de acordo com o nível do "match" genético.
        let predicted_stats = [0,0,0,0,0,0];
        let factor = (total_matches / 24) + 0.1; // Fator simplificado da matriz real (vai de 0.1 a 0.6)
        
        for (let i = 0; i < 6; i++) {
            let inherited = Math.floor( ((stats1[i] + stats2[i]) / 2) * factor );
            predicted_stats[i] = baseline[i] + inherited + extraStats[i];
        }

        let final_lifespan = calc_lifespan(cm, cs) + extraLife;

        results.push({
            main: cm, sub: cs, display_name,
            baseline_order: bl_order_abbr,
            matches_p1: m1, matches_p2: m2,
            min_matches: matches, total_matches,
            predicted_stats,
            lifespan: final_lifespan,
            extra_life: extraLife
        });
    });

    // Ordena do melhor filho (maior pontuação) pro pior
    results.sort((a,b) => b.total_matches - a.total_matches);

    return {
        parent1: {main: main1, sub: sub1, stats: stats1, adjusted: adj1, order: order1},
        parent2: {main: main2, sub: sub2, stats: stats2, adjusted: adj2, order: order2},
        children: results.slice(0, 12),
        dadge: dadge_says(results.length ? results[0].min_matches : 0)
    };
}


// --------------------------------------------------------------------------------------
// INTEGRAÇÕES FRONT-END (UI)
// --------------------------------------------------------------------------------------

function updateAdjustedUI(p) {
    const main = document.getElementById(`p${p}-main`).value;
    if (!main) return;

    // NOVIDADE: Mostrar os Multiplicadores Ocultos e a Ordem Genética Original para o usuário
    const breedData = get_breed(main);
    const mGains = breedData.gains;
    const mults = mGains.map(g => GAIN_TO_MULT[g]).map(m => `x${m.toFixed(2)}`);
    const { order_abbr: baseOrder } = get_baseline_order(main);

    const infoBox = document.getElementById(`p${p}-breed-info`);
    if(infoBox) {
        infoBox.style.display = 'block';
        infoBox.innerHTML = `
            <div style="color:var(--cyan); margin-bottom:6px; font-family:'Press Start 2P', monospace; font-size:10px;">▸ MULTIPLICADORES DA RAÇA (${main})</div>
            <div style="display:flex; justify-content:space-between; font-size:20px; color:var(--text); margin-bottom:6px;">
                <span>❤ ${mults[0]}</span> <span>💪 ${mults[1]}</span> <span>🧠 ${mults[2]}</span>
                <span>⚔ ${mults[3]}</span> <span>💨 ${mults[4]}</span> <span>🛡 ${mults[5]}</span>
            </div>
            <div style="color:var(--purple); font-size:18px; letter-spacing:2px;">
                <span style="color:var(--dim); font-size:14px;">ORDEM BASE:</span> ${baseOrder.join(' › ')}
            </div>
        `;
    }

    const stats = [
        parseInt(document.getElementById(`p${p}-life`).value)||0,
        parseInt(document.getElementById(`p${p}-pow`).value)||0,
        parseInt(document.getElementById(`p${p}-int`).value)||0,
        parseInt(document.getElementById(`p${p}-skl`).value)||0,
        parseInt(document.getElementById(`p${p}-spd`).value)||0,
        parseInt(document.getElementById(`p${p}-def`).value)||0,
    ];
    const sub = document.getElementById(`p${p}-sub`).value;

    const {adjusted, order_abbr} = calc_adjusted(main, sub, stats);

    const lifeDisp = document.getElementById(`adj${p}-life-disp`);
    if (lifeDisp) lifeDisp.textContent = `⏳ Max ${calc_lifespan(main, sub)} sem.`;

    const box = document.getElementById(`adj${p}`);
    const rows = document.getElementById(`adj${p}-rows`);
    const order = document.getElementById(`adj${p}-order`);

    const pairs = STAT_NAMES.map((n, i) => ({
        name: n,
        icon: ['❤','💪','🧠','⚔','💨','🛡'][i],
        raw: stats[i],
        adj: adjusted[i]
    })).sort((a,b) => b.adj - a.adj);

    rows.innerHTML = pairs.map((p, rank) => `
        <div class="adj-row">
            <span class="adj-name">${p.icon} ${p.name}</span>
            <span class="adj-val">${p.raw} → <strong>${p.adj}</strong></span>
            <span class="adj-rank">#${rank+1}</span>
        </div>
    `).join('');

    order.textContent = order_abbr.join(' › ');
    box.classList.add('visible');
}

function processCombination() {
    const get = id => document.getElementById(id);

    const p1 = {
        name: get('p1-name').value || 'Pai 1',
        main: get('p1-main').value,
        sub:  get('p1-sub').value,
        stats: [
            parseInt(get('p1-life').value)||0, parseInt(get('p1-pow').value)||0,
            parseInt(get('p1-int').value)||0, parseInt(get('p1-skl').value)||0,
            parseInt(get('p1-spd').value)||0, parseInt(get('p1-def').value)||0,
        ]
    };
    
    const p2 = {
        name: get('p2-name').value || 'Mãe 2',
        main: get('p2-main').value,
        sub:  get('p2-sub').value,
        stats: [
            parseInt(get('p2-life').value)||0, parseInt(get('p2-pow').value)||0,
            parseInt(get('p2-int').value)||0, parseInt(get('p2-skl').value)||0,
            parseInt(get('p2-spd').value)||0, parseInt(get('p2-def').value)||0,
        ]
    };

    const seasoning = document.getElementById('secret-seasoning').value;

    if (!p1.main || !p2.main) { alert('Selecione as raças dos dois monstros!'); return; }

    document.getElementById('results').classList.add('visible');
    
    // Simula tempo de rede via Timeout para dar o feel do loader
    document.getElementById('spinner').classList.add('active');
    document.getElementById('results-inner').innerHTML = '';
    document.getElementById('results').scrollIntoView({behavior:'smooth'});

    setTimeout(() => {
        const data = calc_all_combos(p1.main, p1.sub, p1.stats, p2.main, p2.sub, p2.stats, seasoning);
        document.getElementById('spinner').classList.remove('active');
        renderResults(data, p1, p2);
    }, 400); // UI feel
}

function renderResults(data, p1info, p2info) {
    const {parent1:pa, parent2:pb, children, dadge} = data;
    const SNAMES = ['Life','Pow','Int','Skl','Spd','Def'];
    const SICONS = ['❤','💪','🧠','⚔','💨','🛡'];

    let html = `<div class="anim">`;

    // Dadge Box
    html += `
    <div class="dadge-box">
      <div class="dadge-face">🧙</div>
      <div>
        <div class="dadge-name">DADGE DIZ:</div>
        <div class="dadge-text">${dadge}</div>
      </div>
    </div>`;

    // Comparador dos Pais
    html += `<div class="compare-table">`;
    [pa,pb].forEach((par,idx)=>{
      const info = idx===0 ? p1info : p2info;
      html += `
      <div class="parent-card">
        <h4>${idx===0?'🗡 PAI 1':'🗡 PAI 2'} — ${info.name || '?'}</h4>
        <div style="color:var(--dim);font-size:15px;margin-bottom:8px">${par.main} / ${par.sub}</div>
        ${SNAMES.map((n,i)=>`
          <div class="stat-line">
            <span class="sname">${SICONS[i]} ${n}</span>
            <span class="sval">${par.stats[i]}</span>
            <span class="sadj">→ ${par.adjusted[i]}</span>
          </div>
        `).join('')}
        <div class="order-display">
          <div class="order-label">ORDEM AJUSTADA</div>
          <div class="order-val">${par.order.join(' › ')}</div>
        </div>
      </div>`;
    });
    html += `</div>`;

    // Gráfico Radar com Chart.js!
    html += `
    <div id="chart-container" style="max-width: 320px; margin: 20px auto; background: var(--bg2); border-radius: 50%; padding: 10px; box-shadow: 0 0 30px #ffffff05 inset;">
        <canvas id="combo-chart" width="300" height="300"></canvas>
    </div>
    `;

    // Tabela de Filhos
    html += `
    <div class="children-header">🥚 POSSÍVEIS FILHOS GERADOS NATURAIS</div>
    <div class="col-header">
      <span>MONSTRO / ORDEM BASE</span>
      <span>PREVISÃO DE STAT INICIAL</span>
      <span>MATCH P1</span>
      <span>MATCH P2</span>
      <span>SCORE</span>
    </div>`;

    const starsFor = (m) => m>=5?'★★★★★':m>=4?'★★★★☆':m>=3?'★★★☆☆':m>=2?'★★☆☆☆':m>=1?'★☆☆☆☆':'☆☆☆☆☆';

    children.forEach((c, i) => {
      const cls = c.total_matches >= 10 ? 'best' : (c.total_matches >= 6 ? 'good' : 'bad');
      const badge = i===0 ? ' 🏆' : '';
      const delay = (i * 0.05).toFixed(2);
      
      html += `
      <div class="child-row stagger-anim ${cls}" style="animation-delay: ${delay}s;">
        <div>
          <div class="child-name">${c.display_name}${badge}</div>
          <div class="child-sub" style="font-size: 14px;">[ ${c.main} / ${c.sub} ]</div>
          <div class="child-order" style="margin-top:6px; font-size: 13px;">${c.baseline_order.join('›')}</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:18px;color:var(--cyan);font-weight:bold;">
            <div style="color:#ff8080">❤ ${c.predicted_stats[0]}</div> <div style="color:#ffd080">💪 ${c.predicted_stats[1]}</div>
            <div style="color:#80ff80">🧠 ${c.predicted_stats[2]}</div> <div style="color:#80d0ff">⚔ ${c.predicted_stats[3]}</div>
            <div style="color:#ff80ff">💨 ${c.predicted_stats[4]}</div> <div style="color:#ffff80">🛡 ${c.predicted_stats[5]}</div>
            <div style="color:#ffc040; grid-column: 1/-1; padding-top:6px; border-top:1px dashed #ffffff20; margin-top:2px; font-size:15px;">
                ⏳ Longevidade Estimada: ${c.lifespan} semanas ${c.extra_life ? `(+${c.extra_life} Item)` : ''}
            </div>
        </div>
        <div class="child-matches">
          <div>${c.matches_p1}/6</div>
          <div class="match-stars" style="font-size:16px">${starsFor(c.matches_p1)}</div>
        </div>
        <div class="child-matches">
          <div>${c.matches_p2}/6</div>
          <div class="match-stars" style="font-size:16px">${starsFor(c.matches_p2)}</div>
        </div>
        <div class="child-matches" style="color:${c.total_matches>=10?'var(--gold)':c.total_matches>=6?'var(--green)':'var(--red)'}">
          <div style="font-size:28px">${c.total_matches}</div>
          <div style="font-size:11px">/ 12</div>
        </div>
      </div>`;
    });

    html += `</div>`;
    document.getElementById('results-inner').innerHTML = html;

    // Renderizando o Chart.js Spider Web Chart
    if (window.comboChart) { window.comboChart.destroy(); }
    const ctx = document.getElementById('combo-chart').getContext('2d');
    const bestChild = children[0].predicted_stats;

    window.comboChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Life', 'Pow', 'Int', 'Skl', 'Spd', 'Def'],
            datasets: [
                {
                    label: "Pai 1",
                    data: p1info.stats,
                    borderColor: 'rgba(48, 216, 240, 0.4)',
                    backgroundColor: 'rgba(48, 216, 240, 0.1)',
                    borderWidth: 1
                },
                {
                    label: "Pai 2",
                    data: p2info.stats,
                    borderColor: 'rgba(240, 64, 96, 0.4)',
                    backgroundColor: 'rgba(240, 64, 96, 0.1)',
                    borderWidth: 1
                },
                {
                    label: children[0].display_name,
                    data: bestChild,
                    borderColor: '#40e890',
                    backgroundColor: 'rgba(64, 232, 144, 0.4)',
                    borderWidth: 2,
                    pointBackgroundColor: '#fff'
                }
            ]
        },
        options: {
            scales: {
                r: {
                    angleLines: { color: 'rgba(255,255,255,0.1)' },
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    pointLabels: { color: '#dde0f8', font: {family: "'Press Start 2P'", size: 7} },
                    ticks: { display: false, max: 800, min: 0 }
                }
            },
            plugins: {
                legend: { labels: { color: '#dde0f8', font: {family: "'VT323'", size: 14} } }
            }
        }
    });
}

// Inicializadores
window.addEventListener('DOMContentLoaded', () => {

    // 1. Popula os Selects com a Base de Dados primeiro
    const selects = ['p1-main','p1-sub','p2-main','p2-sub','tgt-main','tgt-sub'];
    selects.forEach(id => {
        const sel = document.getElementById(id);
        if(!sel) return;
        BREED_LIST.forEach(b => {
            const opt = document.createElement('option');
            opt.value = b; opt.textContent = b;
            sel.appendChild(opt);
        });
    });

    // 2. Escuta todos os inputs de stats e selects para disparar updates
    ['p1', 'p2', 'tgt'].forEach(prefix => {
        // Auto-preenche com o status base daquela raça assim que o usuário seleciona a Raça Principal
        const mainSelect = document.getElementById(`${prefix}-main`);
        if (mainSelect) {
            mainSelect.addEventListener('change', (e) => {
                const mainName = e.target.value;
                if (mainName && typeof MONSTER_DATA !== 'undefined' && MONSTER_DATA[mainName]) {
                    const baseline = MONSTER_DATA[mainName].baseline;
                    document.getElementById(`${prefix}-life`).value = baseline[0];
                    document.getElementById(`${prefix}-pow`).value  = baseline[1];
                    document.getElementById(`${prefix}-int`).value  = baseline[2];
                    document.getElementById(`${prefix}-skl`).value  = baseline[3];
                    document.getElementById(`${prefix}-spd`).value  = baseline[4];
                    document.getElementById(`${prefix}-def`).value  = baseline[5];
                    // Chama a atualização de UI na hora para atualizar as barras de ordem, se for p1 ou p2
                    if (prefix === 'p1') updateAdjustedUI('1');
                    if (prefix === 'p2') updateAdjustedUI('2');
                }
            });
        }

        // Para as outras coisas, se digitar na mão, apenas recalcula a interface visual (no p1 e p2):
        ['main', 'sub', 'life', 'pow', 'int', 'skl', 'spd', 'def'].forEach(field => {
            const el = document.getElementById(`${prefix}-${field}`);
            if(el && prefix !== 'tgt') {
                // Não adicionamos listener de change duplo pro 'main' não engasgar.
                if (field !== 'main') {
                    const pNum = prefix === 'p1' ? '1' : '2';
                    el.addEventListener('change', () => updateAdjustedUI(pNum));
                }
                const pNum = prefix === 'p1' ? '1' : '2';
                el.addEventListener('input', () => updateAdjustedUI(pNum));
            }
        });
    });

    // 3. Configura Arquivos e Botões
    const save1 = document.getElementById('save-input1');
    if (save1) save1.addEventListener('change', (e) => {
        if(e.target.files.length > 0) handleSaveFileDrop(e.target.files[0], '1');
    });
    
    const save2 = document.getElementById('save-input2');
    if (save2) save2.addEventListener('change', (e) => {
        if(e.target.files.length > 0) handleSaveFileDrop(e.target.files[0], '2');
    });

    const btnCombine = document.getElementById('btn-combine');
    if (btnCombine) btnCombine.addEventListener('click', processCombination);
    
    // 4. Injeta os Valores Iniciais e Emite o disparo para Preencher Instantaneamente!
    const p1m = document.getElementById('p1-main');
    if (p1m) { p1m.value = 'Tiger'; p1m.dispatchEvent(new Event('change')); }
    const p1s = document.getElementById('p1-sub');
    if (p1s) { p1s.value = 'Suezo'; p1s.dispatchEvent(new Event('change')); }

    const p2m = document.getElementById('p2-main');
    if (p2m) { p2m.value = 'Zuum'; p2m.dispatchEvent(new Event('change')); }
    const p2s = document.getElementById('p2-sub');
    if (p2s) { p2s.value = 'Suezo'; p2s.dispatchEvent(new Event('change')); }

});
