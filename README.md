# MR2 Breeding Calculator & Advisor 🐉

Calculadora de combinações e IA de Matchmaking para **Monster Rancher 2 DX (Steam)**. 
Totalmente construída como uma *Single Page Application (SPA)* Client-Side com Vanilla JS. Sem backend, sem instalações complicadas, roda direto no navegador!

![MR2 Breeder Interface](https://via.placeholder.com/800x400?text=Monster+Rancher+2+Breeding+Calculator)


SITE Temporariamente hospedado: [Hospedado VERCEL - breedermonster.vercel.app](https://breedermonster.vercel.app/)
## 🚀 Como usar

Como o projeto agora é 100% frontend estático, existem duas maneiras super simples de usar:

### Opção 1: Rodar Localmente
1. Dê um duplo clique no arquivo `index.html`.
2. O seu navegador padrão vai abrir o aplicativo imediatamente. Pronto!

### Opção 2: Hospedagem (Vercel/GitHub Pages)
Se o projeto estiver hospedado na Vercel ou GitHub Pages, basta acessar o link do projeto. As atualizações entram no ar instantaneamente.

---

## ✨ Funcionalidades

### 🧮 Calculadora de Breeding (Manual e via Save File)
- **Leitura de Save Files (.sav):** Suporte nativo via File API para ler arquivos `.sav` do Monster Rancher 2 DX e extrair os status dos monstros congelados da geladeira automaticamente! (Tudo acontece no seu navegador, nada é enviado para servidores).
- **Cálculo de Stats Ajustados:** Usa as fórmulas originais do jogo (com multiplicadores por raça oculta) para determinar a ordem genética.
- **Predição Exata de Status Inicial:** Em vez de apenas dar uma nota de compatibilidade, o app usa a matriz matemática do jogo para calcular exatamente com quais status o filhote vai nascer.
- **Longevidade (Lifespan):** Cálculo exato da longevidade herdada, penalizando ou bonificando dependendo da diferença genética das classes dos pais.
- **Itens de Combinação (Secret Seasonings):** Suporte para todos os itens de desbloqueio de raças secretas, peixes (+Lifespan) e chips (+Status).
- **Chart.js Radar:** Vizualização em gráfico de aranha comparando o Pai 1, Pai 2 e o melhor Filhote.

### 🧠 Breeding Advisor (I.A. de Matchmaking)
O coração da engenharia reversa do app! 
Em vez de você ficar chutando pais, o Advisor diz quem você deve procurar:
1. Você seleciona o Pai 1.
2. O algoritmo calcula todas as **1.400 cruzas possíveis**.
3. Ele filtra parceiros impossíveis e encontra as 5 combinações que geram o melhor filhote com o menor "*Dadge Score*", ou seja, a **Compatibilidade Perfeita**.
4. **Otimização de Esforço:** A IA calcula o "Status Mínimo" que o Pai 2 precisará ter nas posições chave. Nada de treinar 999 em tudo à toa. Ele te dá o esqueleto exato do treino!
5. **Importação Rápida:** Um clique importa a sugestão direto para a Calculadora principal.

---

## ⚙️ Como o Breeding funciona (A mecânica real do MR2)

O jogo usa stats **AJUSTADOS**, não os brutos:
- Cada raça tem um multiplicador por stat (ex: Tiger tem Skill x2.0, Defense x0.0)
- O `stat ajustado = stat_atual × multiplicador`
- Os stats são **ordenados** do maior para o menor.
- O jogo compara a **ordem** do Pai 1 e Pai 2 com a **ordem baseline** do tipo de monstro do filho gerado.
- Cada "match" na ordem = +1 ponto de compatibilidade (máximo de 6 por pai, 12 no total).
- Mais matches = O filhote herda um percentual MUITO maior dos status dos pais. Poucos matches = O jogo pune a cruza e o filhote nasce fraco.

**Por isso seu monstro 999 gera um bebê fraco:**
Se você colocar 999 em tudo, a ordem genética do seu monstro vira o padrão da raça DELE. Se a ordem base do filhote for diferente, o jogo não registra os matches genéticos e "quebra" as pontes de herança.
 *Use o recurso de **I.A. Otimizadora de Stats** no Advisor para saber exatamente qual status segurar e qual aumentar para bater a ordem!*

---

## 📊 Dados das Raças
Baseado na dump da engine do jogo original (PS1) cruzado com a versão DX. Todos os multiplicadores, baseline stats e longevidades base são idênticos aos rodados nos servidores e código fonte do Monster Rancher 2.

## ⚖️ Disclaimer
Projeto open-source e fan-made, criado para estudo de algoritmos de engenharia reversa e SPA architecture. Sem afiliação com Koei Tecmo / Tecmo.
