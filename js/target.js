// target.js - I.A. Completa de Engenharia Reversa para encontrar P1 e P2 que gerem um filhote com Stats Alvo.

function runTargetBreeder() {
    const tgtMain = document.getElementById('tgt-main').value;
    const tgtSub = document.getElementById('tgt-sub').value;
    
    if (!tgtMain || !tgtSub) {
        alert("Selecione a Raça Main e Sub do filhote desejado!");
        return;
    }

    const tStats = [
        parseInt(document.getElementById(`tgt-life`).value)||0,
        parseInt(document.getElementById(`tgt-pow`).value)||0,
        parseInt(document.getElementById(`tgt-int`).value)||0,
        parseInt(document.getElementById(`tgt-skl`).value)||0,
        parseInt(document.getElementById(`tgt-spd`).value)||0,
        parseInt(document.getElementById(`tgt-def`).value)||0
    ];

    const resultsDiv = document.getElementById('tgt-results');
    resultsDiv.innerHTML = `<div class="spinner active" style="display:block; margin-top:20px;">🧬 MINERANDO COMBINAÇÕES GENÉTICAS DOS DEUSES... ◂</div>`;
    
    // Defer for UI update
    setTimeout(() => {
        executeTargetAlgorithm(tgtMain, tgtSub, tStats);
    }, 150);
}

function executeTargetAlgorithm(tgtMain, tgtSub, tStats) {
    const { order_abbr: childOrder, baseline } = get_baseline_order(tgtMain);
    
    // Descobrir quais raças podem gerar tgtMain/tgtSub
    // Regra Básica do jogo: Pelo menos UM dos parentes (em Main ou Sub) deve ter a Raça tgtMain, e o outro (ou ele mesmo se puro) ter o tgtSub (ou Sub do outro).
    // Para simplificar a engenharia, vamos cruzar P1Main e P2Main para ver se o filho gerado pode ser tgtMain/tgtSub
    let potentialParents = [];
    
    // Alvo Ajustado para dar um Dadge score = 12 (fator ~0.6)
    const factor = 0.55; 
    
    // Os status necessários a serem somados entre Pai 1 e Pai 2 = ((tStats - baseline) / factor) * 2;
    // Isso porque: PredStat = Baseline + ((P1 + P2) / 2) * factor
    // Logo: (PredStat - Baseline) / factor = (P1 + P2) / 2
    // Logo: P1 + P2 = ((PredStat - Baseline) / factor) * 2
    
    const requiredSum = [0,0,0,0,0,0];
    for(let i=0; i<6; i++) {
        let need = Math.max(0, tStats[i] - baseline[i]);
        requiredSum[i] = Math.max(0, Math.ceil((need / factor) * 2));
    }

    BREED_LIST.forEach(p1m => {
        BREED_LIST.forEach(p1s => {
            BREED_LIST.forEach(p2m => {
                BREED_LIST.forEach(p2s => {
                    // Ver se p1(m/s) x p2(m/s) pode gerar tgtMain/tgtSub
                    let p1s_m = p1m, p1s_s = p1s;
                    let p2s_m = p2m, p2s_s = p2s;
                    
                    let canGenerate = false;
                    let mains = [p1s_m, p1s_s, p2s_m, p2s_s];
                    
                    if (tgtMain === tgtSub) {
                        // Monstro puro: Pelo menos um tem que ser puro, ou ambos tem a raça em evidência
                        if (mains.filter(x => x === tgtMain).length >= 2) canGenerate = true;
                    } else {
                        // Monstro misto: Um deles (qqr slot) tem a tgtMain, o outro tem a tgtSub
                        if (mains.includes(tgtMain) && mains.includes(tgtSub)) canGenerate = true;
                    }

                    if (!canGenerate) return;

                    // Para otimizar a RAM no browser:
                    // Se a ordem de p1 já for HORRÍVEL (impossível chegar a Dadge), descarta.
                    // Para garantir um Dadge de pelo menos 10: p1 precisa dar match >= 4 e p2 >= 4 no childOrder
                    
                    let p1Mults = get_breed(p1s_m).gains;
                    let p2Mults = get_breed(p2s_m).gains;
                    
                    let p1Stats = [0,0,0,0,0,0];
                    let p2Stats = [0,0,0,0,0,0];
                    
                    // TARGET_ADJ array base para fazer match genético nas ordens (400, 320, 240...)
                    const TARGET_ADJ = [400, 320, 240, 160, 80, 20];
                    let p1Diff = 0, p2Diff = 0;

                    for(let i=0; i<6; i++) {
                        let statAbbr = childOrder[i];
                        let idx = STAT_ABBR.indexOf(statAbbr);
                        
                        let m1 = GAIN_TO_MULT[p1Mults[idx]];
                        let m2 = GAIN_TO_MULT[p2Mults[idx]];
                        
                        // Determinar MÍNIMO para match genético:
                        let p1ReqMatch = m1 === 0 ? 999 : Math.ceil(TARGET_ADJ[i] / m1);
                        let p2ReqMatch = m2 === 0 ? 999 : Math.ceil(TARGET_ADJ[i] / m2);
                        
                        // Dividir a "requiredSum" entre os pais equilibradamente, MAS focado em quem tem o melhor multiplicador
                        let neededTotal = requiredSum[idx];
                        
                        let alloc1 = 0, alloc2 = 0;
                        if (m1 > m2) {
                            alloc1 = Math.min(999, neededTotal);
                            alloc2 = Math.min(999, Math.max(0, neededTotal - alloc1));
                        } else if (m2 > m1) {
                            alloc2 = Math.min(999, neededTotal);
                            alloc1 = Math.min(999, Math.max(0, neededTotal - alloc2));
                        } else {
                            alloc1 = Math.min(999, Math.ceil(neededTotal/2));
                            alloc2 = Math.min(999, Math.ceil(neededTotal/2));
                        }
                        
                        // O status final do pai deve ser o MÁXIMO entre: o que ele precisa para bater a ordem genética do filhote E o que ele precisa para atingir o valor bruto do requirement Sum.
                        p1Stats[idx] = Math.min(999, Math.max(p1ReqMatch, alloc1));
                        p2Stats[idx] = Math.min(999, Math.max(p2ReqMatch, alloc2));
                        
                        p1Diff += p1Stats[idx];
                        p2Diff += p2Stats[idx];
                    }

                    // Verifica Dadge final
                    const p1A = calc_adjusted(p1s_m, p1s_s, p1Stats);
                    const p2A = calc_adjusted(p2s_m, p2s_s, p2Stats);
                    
                    let match1 = count_matches(p1A.order_abbr, childOrder);
                    let match2 = count_matches(p2A.order_abbr, childOrder);
                    
                    if (match1 + match2 >= 10) {
                        potentialParents.push({
                            p1M: p1s_m, p1S: p1s_s, p1Stats, p1Diff, p1AOrder: p1A.order_abbr, m1: match1,
                            p2M: p2s_m, p2S: p2s_s, p2Stats, p2Diff, p2AOrder: p2A.order_abbr, m2: match2,
                            totalDiff: p1Diff + p2Diff,
                            totalMatches: match1 + match2
                        });
                    }
                });
            });
        });
    });

    // Ordena pelo menor esforço total, e desempata por total de matches
    potentialParents.sort((a,b) => {
        if (a.totalDiff !== b.totalDiff) return a.totalDiff - b.totalDiff;
        return b.totalMatches - a.totalMatches;
    });

    // Filtra únicas cruzando raças pra não floodar com a mesma resposta
    let uniqueResults = [];
    let seen = new Set();
    for(let p of potentialParents) {
        let sig1 = `${p.p1M}|${p.p1S}|${p.p2M}|${p.p2S}`;
        let sig2 = `${p.p2M}|${p.p2S}|${p.p1M}|${p.p1S}`; // Commutative
        if (!seen.has(sig1) && !seen.has(sig2)) {
            seen.add(sig1); seen.add(sig2);
            uniqueResults.push(p);
        }
        if (uniqueResults.length >= 5) break;
    }

    renderTargetResults(uniqueResults, tgtMain, tgtSub, childOrder);
}

function renderTargetResults(matches, tgtMain, tgtSub, childOrder) {
    const resDiv = document.getElementById('tgt-results');
    if (matches.length === 0) {
        resDiv.innerHTML = `<div class="dadge-box" style="margin-top:20px; color:var(--red);">Inviável: É impossível achar dois pais que gerem os matches genéticos e acumulem status suficientes sem extrapolar o limite do jogo. Adiem seus alvos e seja realista.</div>`;
        return;
    }

    let html = `<div class="children-header" style="margin-top:24px; color:var(--cyan)">🌟 OS 5 PAZES MAIS EFICIENTES (MENOR ESFORÇO TOTAL)</div>`;
    
    matches.forEach((m, idx) => {
        const delays = (idx * 0.15).toFixed(2);
        const s1 = m.p1Stats;
        const s2 = m.p2Stats;
        const argString = `'${m.p1M}','${m.p1S}',${s1[0]},${s1[1]},${s1[2]},${s1[3]},${s1[4]},${s1[5]},'${m.p2M}','${m.p2S}',${s2[0]},${s2[1]},${s2[2]},${s2[3]},${s2[4]},${s2[5]}`;

        let totalPoints = m.totalDiff;
        let pClass = totalPoints > 4000 ? 'var(--red)' : totalPoints > 2000 ? 'var(--gold)' : 'var(--green)';

        html += `
        <div class="panel stagger-anim" style="animation-delay: ${delays}s; display:block; opacity:0; margin-bottom:16px; border-color:${pClass}">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border); padding-bottom:12px; margin-bottom:12px;">
                <div>
                    <h4 style="margin:0; font-size:12px; color:var(--text);">ESTRATÉGIA #${idx+1}</h4>
                    <div style="font-size:22px; color:var(--cyan); margin-top:8px;">Pai 1: ${m.p1M} / ${m.p1S}  &nbsp;×&nbsp; Pai 2: ${m.p2M} / ${m.p2S}</div>
                </div>
                <div style="text-align:right">
                    <div style="font-family:'Press Start 2P',monospace; font-size:12px; color:var(--gold);">DADGE SCORE BATE: ${m.totalMatches}/12</div>
                    <div style="color:var(--dim); font-size:15px; margin-top:6px;">Alvo Bebê Oculto: <strong style="color:var(--purple)">${childOrder.join('›')}</strong></div>
                </div>
            </div>
            
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
                <!-- PAI 1 -->
                <div style="background:var(--bg2); padding:10px; border-radius:4px; border:1px solid var(--border);">
                    <div style="color:var(--dim); font-size:14px; margin-bottom:6px;">TREINO DO PAI 1 (${m.p1Diff} pts)</div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:18px;color:var(--text);font-weight:bold;">
                        <div style="color:#ff8080">❤ ${s1[0]}</div> <div style="color:#ffd080">💪 ${s1[1]}</div>
                        <div style="color:#80ff80">🧠 ${s1[2]}</div> <div style="color:#80d0ff">⚔ ${s1[3]}</div>
                        <div style="color:#ff80ff">💨 ${s1[4]}</div> <div style="color:#ffff80">🛡 ${s1[5]}</div>
                    </div>
                </div>
                <!-- PAI 2 -->
                <div style="background:var(--bg2); padding:10px; border-radius:4px; border:1px solid var(--border);">
                    <div style="color:var(--dim); font-size:14px; margin-bottom:6px;">TREINO DO PAI 2 (${m.p2Diff} pts)</div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:18px;color:var(--text);font-weight:bold;">
                        <div style="color:#ff8080">❤ ${s2[0]}</div> <div style="color:#ffd080">💪 ${s2[1]}</div>
                        <div style="color:#80ff80">🧠 ${s2[2]}</div> <div style="color:#80d0ff">⚔ ${s2[3]}</div>
                        <div style="color:#ff80ff">💨 ${s2[4]}</div> <div style="color:#ffff80">🛡 ${s2[5]}</div>
                    </div>
                </div>
            </div>
            
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:16px;">
                <div style="font-size:16px; color:${pClass};">Treino Total Exigido de Ambos: ${totalPoints} Pts.</div>
                <button class="tab-btn" style="background:var(--purple); color:#fff; padding:8px 16px; border-radius:4px; border:none; margin:0;" onclick="importBothParents(${argString})">📥 IMPORTAR ESTES DOIS PAIS</button>
            </div>
        </div>`;
    });
    resDiv.innerHTML = html;
}

function importBothParents(m1, s1, l1, p1, i1, sk1, sp1, d1, m2, s2, l2, p2, i2, sk2, sp2, d2) {
    // Parent 1
    const pm1El = document.getElementById('p1-main');
    const ps1El = document.getElementById('p1-sub');
    if (pm1El) pm1El.value = m1;
    if (ps1El) ps1El.value = s1;
    document.getElementById('p1-life').value = l1;
    document.getElementById('p1-pow').value = p1;
    document.getElementById('p1-int').value = i1;
    document.getElementById('p1-skl').value = sk1;
    document.getElementById('p1-spd').value = sp1;
    document.getElementById('p1-def').value = d1;
    
    // Parent 2
    const pm2El = document.getElementById('p2-main');
    const ps2El = document.getElementById('p2-sub');
    if (pm2El) pm2El.value = m2;
    if (ps2El) ps2El.value = s2;
    document.getElementById('p2-life').value = l2;
    document.getElementById('p2-pow').value = p2;
    document.getElementById('p2-int').value = i2;
    document.getElementById('p2-skl').value = sk2;
    document.getElementById('p2-spd').value = sp2;
    document.getElementById('p2-def').value = d2;
    
    // Trigger UIs e Calcular a aba 1
    updateAdjustedUI('1');
    updateAdjustedUI('2');
    processCombination();
    
    // Voltar para Calculadora!
    switchTab('calculator');
    window.scrollTo({top: 0, behavior: 'smooth'});
}
