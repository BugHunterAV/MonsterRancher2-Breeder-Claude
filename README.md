# MR2 Breeding Calculator 🐉

Calculadora de combinações para **Monster Rancher 2 DX (Steam)** em Python/Flask.

## Como usar

### Windows (mais fácil)
1. Instale Python 3.x em python.org se não tiver
2. Dê duplo clique em `RODAR.bat`
3. O navegador abre automaticamente em http://127.0.0.1:5000

### Manual
```
pip install flask
python app.py
```
Depois abra http://127.0.0.1:5000 no navegador.

---

## Funcionalidades

### ✅ Já funcionando
- **Entrada manual** dos stats dos dois pais
- Cálculo dos **stats ajustados** (com multiplicadores por raça)
- **Ordem dos stats** ajustados
- **Todos os possíveis filhos** ordenados por compatibilidade
- **Score de matches** (0-12) por filho — quanto mais alto, melhor o filho sai
- Mensagem do Dadge com avaliação da combinação
- Interface visual estilo jogo retrô

### 🔧 Leitura do Save (experimental)
O app tenta ler automaticamente o save de:
`Documentos\KoeiTecmo\mfdx_en\`

O formato binário do save do MR2 DX não é público. O app usa offsets descobertos
pela comunidade via Cheat Engine. **Se não funcionar**, use a entrada manual —
é igualmente eficaz.

Para melhorar a leitura do save, você pode usar o **Cheat Engine** com a table
da comunidade (disponível em legendcup.com) para encontrar os offsets corretos
dos stats do seu monstro e nos informar.

---

## Como o Breeding funciona (a mecânica real)

O jogo usa stats **AJUSTADOS**, não os brutos:
- Cada raça tem um multiplicador por stat (ex: Tiger tem Skill x2.0, Defense x0.0)
- O stat ajustado = stat_atual × multiplicador
- Os stats são **ordenados** do maior para o menor
- O jogo compara a **ordem** do pai 1 e pai 2 com a **ordem baseline** do filho
- Cada match na ordem = +1 ponto de compatibilidade (máx 6 por pai, 12 total)
- Mais matches → filho com stats melhores E mais chance de sair

### Por que seu monstro com 600 vira 150 na combinação?
Exemplo: você treinou Life=600 num Tiger.
- Tiger tem multiplicador Life = 0.50x → ajustado = 300
- Se o baseline do filho tem Life em posição diferente → match falha
- Resultado: o filho "herda" o stat em posição errada → vem baixo

**A solução**: antes de treinar, já calcule qual filho quer fazer e treine
os stats que terão os MAIORES multiplicadores naquele tipo de monstro.

---

## Dados das Raças
Baseado no "Monster Rancher: Combining FAQ" de Kurasu Soratobu e no pacote R
`ranchr` de duckmayr. Os multiplicadores são os mesmos da versão PS1/DX.

## Disclaimer
Projeto fan-made, sem afiliação com Koei Tecmo / Tecmo.
# MonsterRancher2-Breeder-Claude
