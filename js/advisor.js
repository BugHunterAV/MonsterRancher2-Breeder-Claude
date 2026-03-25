// advisor.js - I.A. de Matchmaking para Mínimo Esforço e Máximo Ganho

function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    document.querySelector(`.tab-btn[onclick="switchTab('${tabId}')"]`).classList.add('active');
    document.getElementById(`tab-${tabId}`).classList.add('active');
}

function runAdvisor() {
    const main1 = document.getElementById('p1-main').value;
    if (!main1) {
        alert("Selecione pelo menos a Raça Principal do Pai 1 na aba 'Calculadora' primeiro!");
        switchTab('calculator');
        return;
    }
    
    const resultsDiv = document.getElementById('adv-results');
    resultsDiv.innerHTML = `<div class="spinner active" style="display:block; margin-top:20px;">🧠 ACENDENDO REDE NEURAL... CALCULANDO MAIS DE 1.400 CRUZES POSSÍVEIS... ◂</div>`;
    
    // Defer for UI update
    setTimeout(() => {
        executeAdvisorAlgorithm();
    }, 150);
}

function executeAdvisorAlgorithm() {
    const p1 = {
        main: document.getElementById('p1-main').value,
        sub: document.getElementById('p1-sub').value,
        stats: [
            parseInt(document.getElementById(`p1-life`).value)||0,
            parseInt(document.getElementById(`p1-pow`).value)||0,
            parseInt(document.getElementById(`p1-int`).value)||0,
            parseInt(document.getElementById(`p1-skl`).value)||0,
            parseInt(document.getElementById(`p1-spd`).value)||0,
            parseInt(document.getElementById(`p1-def`).value)||0
        ]
    };
    
    const { order_abbr: p1Order } = calc_adjusted(p1.main, p1.sub, p1.stats);

    document.getElementById('adv-parent1-summary').innerHTML = `
        <div style="color:var(--dim); font-size:16px;">O Advisor baseará a compatibilidade para maximizar a herança do PAI 1:</div>
        <div style="font-size:24px; color:var(--gold); margin-top:8px;">${p1.main} / ${p1.sub}</div>
        <div style="color:var(--purple); font-size:18px; margin-top:6px; letter-spacing:2px;">Alvo Genético: ${p1Order.join(' › ')}</div>
    `;

    let bestMatches = [];

    // Alvos em ordem decrescente longa para garantir que as "Bases" de filhote não quebrem a corda
    const TARGET_ADJ = [400, 320, 240, 160, 80, 20]; 

    BREED_LIST.forEach(p2Main => {
        BREED_LIST.forEach(p2Sub => {
            let possible_children = new Set();
            [p1.main, p1.sub].forEach(b1 => {
                [p1.main, p1.sub, p2Main, p2Sub].forEach(b2 => {
                    if (b1 && b2 && b1 !== "" && b2 !== "") possible_children.add(b1+"|"+b2);
                });
            });
            [p2Main, p2Sub].forEach(b1 => {
                [p1.main, p1.sub, p2Main, p2Sub].forEach(b2 => {
                    if (b1 && b2 && b1 !== "" && b2 !== "") possible_children.add(b1+"|"+b2);
                });
            });

            possible_children.forEach(combo => {
                let [cm, cs] = combo.split("|");
                let { order_abbr: childOrder, baseline } = get_baseline_order(cm);

                let m1 = count_matches(p1Order, childOrder);
                if (m1 < 4) return; // Se for combinação ruim pro Pai 1, aborta pra salvar RAM

                let p2Stats = [0,0,0,0,0,0];
                let p2Difficulty = 0;
                let p2Baseline = get_breed(p2Main).baseline;
                
                // Engenharia reversa: calcular o menor treino possível de P2 pra bater a Ordem do Bebê
                for(let i=0; i<6; i++) {
                    let statAbbr = childOrder[i];
                    let idx = STAT_ABBR.indexOf(statAbbr);
                    let mult = GAIN_TO_MULT[ get_breed(p2Main).gains[idx] ];
                    
                    let rawReq = 0;
                    if (mult === 0) rawReq = 999;
                    else rawReq = Math.ceil(TARGET_ADJ[i] / mult);
                    
                    rawReq = Math.max(rawReq, p2Baseline[idx]); 
                    if (rawReq > 999) rawReq = 999;
                    
                    p2Stats[idx] = rawReq;
                    p2Difficulty += rawReq;
                }

                const { order_abbr: p2ActualOrder } = calc_adjusted(p2Main, p2Sub, p2Stats);
                let m2 = count_matches(p2ActualOrder, childOrder);
                let total_matches = m1 + m2;
                
                // Ignorar parceiros que não dão match perfeito (ou excelente)
                if (total_matches < 10) return;

                let factor = (total_matches / 24) + 0.1;
                let predTotal = 0;
                let predicted_stats = [0,0,0,0,0,0];
                for (let i = 0; i < 6; i++) {
                    let inherited = Math.floor( ((p1.stats[i] + p2Stats[i]) / 2) * factor );
                    predicted_stats[i] = baseline[i] + inherited;
                    predTotal += predicted_stats[i];
                }

                bestMatches.push({
                    p2Main, p2Sub, p2Stats, p2Difficulty,
                    childMain: cm, childSub: cs,
                    m1, m2, total_matches, predTotal,
                    p2ActualOrder
                });
            });
        });
    });

    // Ordenação: 1º Melhores Matches, 2º Menor Esforço (Dificuldade), 3º Specs Finais Filhote
    bestMatches.sort((a,b) => {
        if (b.total_matches !== a.total_matches) return b.total_matches - a.total_matches;
        if (a.p2Difficulty !== b.p2Difficulty) return a.p2Difficulty - b.p2Difficulty;
        return b.predTotal - a.predTotal;
    });

    // Remover duplicatas de Raças para P2 (Apenas 1 indicação de Zuum/Suezo, por ex)
    let uniqueResults = [];
    let seenParents = new Set();
    for (let m of bestMatches) {
        let sig = m.p2Main + "_" + m.p2Sub;
        if (!seenParents.has(sig)) {
            seenParents.add(sig);
            uniqueResults.push(m);
        }
        if (uniqueResults.length >= 5) break; 
    }

    renderAdvisorResults(uniqueResults, p1);
}

function renderAdvisorResults(matches, p1) {
    const resDiv = document.getElementById('adv-results');
    if (matches.length === 0) {
        resDiv.innerHTML = `<div class="dadge-box" style="margin-top:20px; color:var(--red);">Nenhum parceiro viável encontrado para combinar 100% com essa base sem estragar os stats (Tente aumentar ou espalhar mais os status do Pai 1).</div>`;
        return;
    }

    let html = `<div class="children-header" style="margin-top:24px;">🏆 TOP 5 PARCEIROS PERFEITOS (MENOR ESFORÇO)</div>`;
    
    matches.forEach((m, idx) => {
        const delays = (idx * 0.15).toFixed(2);
        const st = m.p2Stats;
        const argString = `'${m.p2Main}','${m.p2Sub}',${st[0]},${st[1]},${st[2]},${st[3]},${st[4]},${st[5]}`;

        let difficultyClass = m.p2Difficulty > 2000 ? 'var(--red)' : m.p2Difficulty > 1200 ? 'var(--gold)' : 'var(--green)';
        let difficultyLabel = m.p2Difficulty > 2000 ? 'Treino Pesado' : m.p2Difficulty > 1200 ? 'Treino Médio' : 'Extremamente Fácil / Direto do Market';

        html += `
        <div class="panel stagger-anim" style="animation-delay: ${delays}s; display:block; opacity:0; margin-bottom:16px;">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border); padding-bottom:12px; margin-bottom:12px;">
                <div>
                    <h4 style="margin:0; font-size:12px; color:var(--cyan);">SUGESTÃO #${idx+1}</h4>
                    <div style="font-size:26px; color:var(--text); margin-top:8px;">${m.p2Main} / ${m.p2Sub}</div>
                </div>
                <div style="text-align:right">
                    <div style="font-family:'Press Start 2P',monospace; font-size:12px; color:var(--gold);">DADGE SCORE: ${m.total_matches}/12</div>
                    <div style="color:var(--dim); font-size:15px; margin-top:6px;">Gera Bebê: <strong style="color:#fff">${m.childMain} / ${m.childSub}</strong></div>
                </div>
            </div>

            <div style="color:var(--purple); font-size:16px; margin-bottom:8px;">Alvo Genético P2 Formado: ${m.p2ActualOrder.join('›')}</div>
            
            <div style="margin-bottom:10px; font-size:16px; color:var(--dim);">Crie o parceiro e treine SOMENTE até atingir estes Atributos ideais Mínimos para bater o multiplicador:</div>
            
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:20px;color:var(--text);font-weight:bold; background:#00000040; padding:12px; border-radius:4px; border:1px solid #ffffff10;">
                <div style="color:#ff8080">❤ Life: ${st[0]}</div> <div style="color:#ffd080">💪 Power: ${st[1]}</div>
                <div style="color:#80ff80">🧠 Intel: ${st[2]}</div> <div style="color:#80d0ff">⚔ Skill: ${st[3]}</div>
                <div style="color:#ff80ff">💨 Speed: ${st[4]}</div> <div style="color:#ffff80">🛡 Defense: ${st[5]}</div>
            </div>
            
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:16px;">
                <div style="font-size:16px; color:${difficultyClass};">Esforço Total: ${m.p2Difficulty} pts (${difficultyLabel})</div>
                <button class="tab-btn" style="background:var(--cyan); color:#000; padding:8px 16px; border-radius:4px; border:none; margin:0;" onclick="importP2(${argString})">📥 IMPORTAR COMO PAI 2</button>
            </div>
        </div>`;
    });

    resDiv.innerHTML = html;
}
