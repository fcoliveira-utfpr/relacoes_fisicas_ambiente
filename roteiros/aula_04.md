# Aula 04 · O solo entre o clima e a produtividade

> **Disciplina:** Relações Físicas do Ambiente Agrícola
> **Encontro:** 9 de 9 ·
> **Duração sugerida:** 100 min (ajuste conforme a turma)
> **Formato:** aula de fechamento, com atividade em grupo não avaliada

---

## Objetivos de aprendizagem

Ao final desta aula, você será capaz de:

1. Acessar no Earth Engine os mapas de granulometria, classe textural e carbono orgânico do MapBiomas Solo e o mapa de água disponível da ANA.
2. Relacionar as propriedades do solo com variáveis e classificações climáticas.
3. Estimar a água disponível (AD) a partir da granulometria por funções de pedotransferência e compará-la com o mapa da ANA.
4. Calcular a CAD das culturas a partir de dados de solo, e não de um valor fixo.
5. Avaliar se a CAD derivada do solo melhora a estimativa da produtividade atingível em relação à produtividade observada pelo IBGE.

---

## Plano da aula

| Bloco | Tempo | Conteúdo |
|---|---|---|
| 1 | 10 min | A pergunta da aula e os dados |
| 2 | 25 min | Bloco A: solo × clima |
| 3 | 25 min | Bloco B: do solo à água disponível |
| 4 | 30 min | Bloco C: do solo à produtividade |
| 5 | 10 min | Fechamento da disciplina |

---

## 1. A pergunta da aula e os dados (10 min)

Nos projetos P2 e P3, a capacidade de água disponível (CAD) foi um número escolhido: 50 mm, ou AD = 1,0 mm cm⁻¹. Nesta aula, ela passa a ser **dado**.

> **Pergunta central:** quanto da diferença de produtividade entre municípios do Paraná é explicada pelo clima, quanto pelo solo e quanto sobra para o manejo?

### 1.1 Fontes de dados

| Variável | Fonte | Asset no GEE |
|---|---|---|
| Argila (%) | MapBiomas Solo, Coleção 3 | `.../collection3/mapbiomas_brazil_collection3_soil_clay_fraction_v1` |
| Silte (%) | MapBiomas Solo, Coleção 3 | `.../collection3/mapbiomas_brazil_collection3_soil_silt_fraction_v1` |
| Areia (%) | MapBiomas Solo, Coleção 3 | `.../collection3/mapbiomas_brazil_collection3_soil_sand_fraction_v1` |
| Classe textural (13 classes) | MapBiomas Solo, Coleção 3 | `.../collection3/mapbiomas_brazil_collection3_soil_textural_class_v1` |
| Carbono orgânico do solo | MapBiomas Solo, Coleção 3 (beta) | `projects/mapbiomas-public/assets/brazil/soil/collection3/` |
| Água disponível | ANA | `projects/fcoliveira/assets/AWC_br` |
| Clima (normais 1991–2020) | TerraClimate | `IDAHO_EPSCOR/TERRACLIMATE` |
| Uso e cobertura | MapBiomas Cobertura | coleção mais recente |
| Produtividade observada | IBGE, PAM (SIDRA) | fora do GEE |

### 1.2 Primeiro contato: inspecionar antes de usar

Antes de qualquer análise, cada asset precisa ser inspecionado. A estrutura das bandas muda entre coleções: pode haver uma banda por camada de profundidade, e o carbono pode ser uma série anual.

```python
import ee
ee.Authenticate()
ee.Initialize(project='SEU-ID-DE-PROJETO')

PREFIXO = 'projects/mapbiomas-public/assets/brazil/soil/collection3/'
ASSETS = {
    'argila':  PREFIXO + 'mapbiomas_brazil_collection3_soil_clay_fraction_v1',
    'silte':   PREFIXO + 'mapbiomas_brazil_collection3_soil_silt_fraction_v1',
    'areia':   PREFIXO + 'mapbiomas_brazil_collection3_soil_sand_fraction_v1',
    'textura': PREFIXO + 'mapbiomas_brazil_collection3_soil_textural_class_v1',
}

for nome, caminho in ASSETS.items():
    img = ee.Image(caminho)
    print(f'{nome:8s} bandas: {img.bandNames().getInfo()}')
    print(f'{"":8s} escala: {img.projection().nominalScale().getInfo():.0f} m')

# Assets disponíveis na pasta da coleção (para localizar o carbono)
for a in ee.data.listAssets({'parent': PREFIXO})['assets']:
    print(a['type'], a['name'])

# Atributos do mapa de água disponível da ANA
awc = ee.FeatureCollection('projects/fcoliveira/assets/AWC_br')
print('Feições:', awc.size().getInfo())
print('Atributos:', awc.first().propertyNames().getInfo())
```

> 🧭 **Tarefa investigativa:** antes de seguir, respondam:
> 1. Em que profundidade (ou camadas) estão a granulometria e o carbono?
> 2. O carbono está em teor (%, g kg⁻¹) ou em estoque (t ha⁻¹)? Para qual camada?
> 3. Qual atributo da ANA contém a água disponível? Em que unidade: mm cm⁻¹, mm m⁻¹ ou mm totais? Para qual profundidade?
> 4. Como estão codificadas as 13 classes texturais?

### 1.3 As 13 classes texturais

O MapBiomas usa o triângulo textural brasileiro, que tem uma classe a mais que o do USDA (**muito argilosa**, com mais de 60% de argila):

| Grupo | Classes |
|---|---|
| Arenosa | Areia, areia franca |
| Média | Franco-arenosa, franca, franco-argiloarenosa |
| Siltosa | Silte, franco-siltosa, franco-argilossiltosa |
| Argilosa | Argila, argila arenosa, argila siltosa, franco-argilosa |
| Muito argilosa | Muito argilosa |

> ⚠️ Confiram na legenda oficial da coleção qual código corresponde a cada classe.

---

## 2. Bloco A · Solo × clima: o clima deixa marca no solo? (25 min)

### 2.1 Hipóteses

As frações do solo não respondem ao clima da mesma forma:

| Variável | Controle principal | Relação esperada com o clima |
|---|---|---|
| Argila | Material de origem e intemperismo de longo prazo | Indireta: clima passado, não o atual |
| Areia | Material de origem (arenito, sedimentos) | Fraca |
| Silte | Grau de intemperismo | Diminui com intemperismo intenso (quente e úmido) |
| Carbono orgânico | Balanço entre entrada de biomassa e decomposição | Forte: temperatura acelera a decomposição, chuva aumenta a produção de biomassa, argila protege o carbono |

> 💬 **Pergunta 1:** no Paraná, você espera mais carbono no solo do Terceiro Planalto (oeste, mais quente) ou nos Campos Gerais e no sul (mais frios)? Por quê?

### 2.2 Montando a base: solo + clima no mesmo ponto

```python
parana = (ee.FeatureCollection('FAO/GAUL/2015/level1')
          .filter(ee.Filter.eq('ADM0_NAME', 'Brazil'))
          .filter(ee.Filter.eq('ADM1_NAME', 'Parana')))
geom = parana.geometry()

# Normais climatológicas mensais 1991–2020 (TerraClimate)
tc = ee.ImageCollection('IDAHO_EPSCOR/TERRACLIMATE').filterDate('1991-01-01', '2021-01-01')

def normal_mensal(m):
    mes = tc.filter(ee.Filter.calendarRange(m, m, 'month')).mean()
    T = mes.select('tmmx').add(mes.select('tmmn')).multiply(0.1 / 2)   # °C
    P = mes.select('pr')                                                # mm/mês
    return T.rename(f'T{m:02d}').addBands(P.rename(f'P{m:02d}'))

normais = ee.Image.cat([normal_mensal(m) for m in range(1, 13)])

anual = tc.select(['pet', 'def']).sum().multiply(0.1 / 30).rename(['ETP', 'DEF'])

# Pilha de solo (ajuste os nomes das bandas após a inspeção da seção 1.2)
solo = ee.Image.cat([
    ee.Image(ASSETS['argila']).select(0).rename('argila'),
    ee.Image(ASSETS['silte']).select(0).rename('silte'),
    ee.Image(ASSETS['areia']).select(0).rename('areia'),
    ee.Image(ASSETS['textura']).select(0).rename('textura').toInt(),
])

pilha = solo.addBands(normais).addBands(anual).addBands(ee.Image.pixelLonLat())

# Amostra estratificada: o mesmo número de pontos por classe textural
amostra = pilha.stratifiedSample(
    numPoints=300, classBand='textura', region=geom,
    scale=1000, seed=42, geometries=False
)
```

> 🔎 **Por que estratificar?** No Paraná predominam os solos argilosos e muito argilosos. Uma amostra aleatória simples teria pouquíssimos pontos arenosos e siltosos, e as comparações entre classes ficariam desbalanceadas.

### 2.3 Classificação climática dos pontos

A biblioteca classifica muitos pontos de uma vez. Os meses ficam no primeiro eixo:

```python
import numpy as np
import pandas as pd
import agrometeorologiapy as amp

df = pd.DataFrame([f['properties'] for f in amostra.getInfo()['features']])

T = df[[f'T{m:02d}' for m in range(1, 13)]].to_numpy().T     # formato (12, n)
P = df[[f'P{m:02d}' for m in range(1, 13)]].to_numpy().T

df['koppen']    = amp.classificacao_koppen_grade(T, P, df['latitude'].values)['classe']
df['holdridge'] = amp.classificacao_holdridge_grade(T, P, df['latitude'].values)['classe']
df['T_anual'] = T.mean(axis=0)
df['P_anual'] = P.sum(axis=0)
```

### 2.4 Análises

**Correlação de Spearman** entre cada variável do solo e as variáveis climáticas (T anual, P anual, ETP, DEF). Spearman é preferível a Pearson porque as relações raramente são lineares e as frações do solo têm distribuição assimétrica.

**Teste de Kruskal-Wallis** de cada variável do solo entre as classes de Köppen e de Holdridge, com o tamanho de efeito:

$$\eta^2_H = \frac{H - k + 1}{n - k}$$

em que H é a estatística do teste, k o número de classes e n o número de pontos. Valores de η²H acima de 0,14 indicam efeito grande.

```python
from scipy.stats import kruskal

def eta2_h(dados, var, grupo):
    grupos = [g[var].dropna().values for _, g in dados.groupby(grupo) if len(g) > 5]
    H, p = kruskal(*grupos)
    k, n = len(grupos), sum(len(g) for g in grupos)
    return H, p, (H - k + 1) / (n - k)

for var in ['argila', 'silte', 'areia']:
    for esquema in ['koppen', 'holdridge']:
        H, p, e2 = eta2_h(df, var, esquema)
        print(f'{var:7s} × {esquema:9s}  H = {H:7.1f}  p = {p:.3g}  η²H = {e2:.3f}')
```

> 💬 **Pergunta 2:** qual esquema climático separa melhor a argila? E o carbono? Se os resultados forem diferentes, o que isso diz sobre o uso de uma única classificação climática como covariável em modelos de mapeamento de solos?

### 2.5 Síntese: o carbono é mais explicado pelo clima ou pela argila?

Uma regressão com variáveis padronizadas permite comparar o peso de cada fator:

$$COS = \beta_0 + \beta_1 \cdot T + \beta_2 \cdot P + \beta_3 \cdot \text{argila} + \varepsilon$$

Com as variáveis em escore z, o valor absoluto de cada β indica a importância relativa. Como alternativa, a importância por permutação de um random forest (`sklearn.inspection.permutation_importance`) dá a mesma resposta sem supor linearidade.

---

## 3. Bloco B · Do solo à água disponível (25 min)

### 3.1 Conceitos

A **água disponível** (AD) é a água retida entre a capacidade de campo (θcc) e o ponto de murcha permanente (θpmp):

$$AD = (\theta_{cc} - \theta_{pmp}) \cdot 10 \qquad [\text{mm cm}^{-1}]$$

com θ em m³ m⁻³. A CAD de uma cultura é:

$$CAD = AD \cdot Z_r \qquad [\text{mm}]$$

com Zr em cm, como na Aula 03.

### 3.2 Fonte 1: mapa da ANA

O shapefile é convertido em imagem pelo atributo de água disponível:

```python
CAMPO_AWC = 'NOME_DO_CAMPO'      # definido na inspeção da seção 1.2

awc_img = (awc.filter(ee.Filter.notNull([CAMPO_AWC]))
              .reduceToImage([CAMPO_AWC], ee.Reducer.first())
              .rename('AD_ANA')
              .clip(geom))
```

> ⚠️ Se o valor da ANA estiver em mm totais para uma profundidade fixa, converta para mm cm⁻¹ antes de comparar com a pedotransferência.

### 3.3 Fonte 2: função de pedotransferência

Funções de pedotransferência (PTFs) estimam θcc e θpmp a partir da granulometria e da matéria orgânica. Um exemplo amplamente usado é o de Saxton & Rawls (2006), com areia (S) e argila (C) em fração decimal e matéria orgânica (MO) em %:

**Ponto de murcha permanente (−1500 kPa):**

$$\theta_{1500t} = -0{,}024 \cdot S + 0{,}487 \cdot C + 0{,}006 \cdot MO + 0{,}005 \cdot S \cdot MO - 0{,}013 \cdot C \cdot MO + 0{,}068 \cdot S \cdot C + 0{,}031$$

$$\theta_{pmp} = \theta_{1500t} + (0{,}14 \cdot \theta_{1500t} - 0{,}02)$$

**Capacidade de campo (−33 kPa):**

$$\theta_{33t} = -0{,}251 \cdot S + 0{,}195 \cdot C + 0{,}011 \cdot MO + 0{,}006 \cdot S \cdot MO - 0{,}027 \cdot C \cdot MO + 0{,}452 \cdot S \cdot C + 0{,}299$$

$$\theta_{cc} = \theta_{33t} + (1{,}283 \cdot \theta_{33t}^2 - 0{,}374 \cdot \theta_{33t} - 0{,}015)$$

Exemplos com MO fixa:

| Solo | Areia | Argila | MO (%) | θcc | θpmp | AD (mm cm⁻¹) |
|---|---|---|---|---|---|---|
| Muito argiloso (Latossolo, oeste do PR) | 0,20 | 0,60 | 2,5 | 0,458 | 0,350 | 1,08 |
| Arenoso (Arenito Caiuá, noroeste do PR) | 0,85 | 0,10 | 1,0 | 0,115 | 0,064 | 0,51 |

> ⚠️ **Limitação importante:** a equação foi ajustada para solos de clima temperado. Em Latossolos muito argilosos e oxídicos, a argila forma microagregados estáveis que se comportam como areia, e a PTF tende a **superestimar** a retenção no ponto de murcha. Para solos brasileiros, existem PTFs ajustadas localmente, como as de Tomasella et al. (2000) e a adotada no ZARC. Comparar a PTF com o mapa da ANA mostra exatamente onde esse problema aparece.

> 🔎 **E a matéria orgânica?** Se o carbono do MapBiomas estiver em estoque (t ha⁻¹), convertê-lo em teor exige a densidade do solo, que não está disponível. Uma alternativa didática é usar MO fixa e fazer uma análise de sensibilidade (MO = 1, 2,5 e 4%).

### 3.4 Produtos do Bloco B

1. Mapa de AD da ANA para o Paraná.
2. Mapa de AD pela PTF.
3. Mapa da diferença (PTF − ANA) e o seu histograma por classe textural.
4. Mapa de CAD de uma cultura (soja, Zr = 60 cm) pelas duas fontes.

> 💬 **Pergunta 3:** em quais classes texturais as duas fontes mais discordam? Isso coincide com a limitação da PTF descrita acima?

---

## 4. Bloco C · Do solo à produtividade (30 min)

### 4.1 A pergunta

> **A CAD derivada do solo melhora a correlação entre a produtividade atingível simulada e a produtividade observada pelo IBGE?**

### 4.2 Fluxo

```
  CAD fixa (50 mm) ─┐
  CAD da ANA ───────┼──► MZA-FAO (função do P3) ──► PA por município ──┐
  CAD da PTF ───────┘                                                    │
                                                                         ▼
                     Produtividade do IBGE (PAM) ──► remoção da tendência ──► r, EMA
```

### 4.3 Dois cuidados metodológicos

**1. Medir o solo onde a cultura está.** A média de argila ou AD do município inteiro inclui matas ciliares, cidades e várzeas. Use a classe de soja do MapBiomas Cobertura como máscara antes da estatística zonal:

```python
municipios = (ee.FeatureCollection('FAO/GAUL/2015/level2')
              .filter(ee.Filter.eq('ADM1_NAME', 'Parana')))

lulc = ee.Image('ASSET_DA_COLEÇÃO_MAIS_RECENTE_DO_MAPBIOMAS_COBERTURA')
soja = lulc.select('classification_2023').eq(39)      # 39 = soja

ad_soja = ee.Image.cat([awc_img, ad_ptf]).updateMask(soja)

zonal = ad_soja.reduceRegions(
    collection=municipios,
    reducer=ee.Reducer.mean(),
    scale=250
)
```

> ⚠️ A base GAUL 2015 tem diferenças em relação à malha municipal atual do IBGE. Para cruzar com o SIDRA pelo código do município, o ideal é carregar a malha do IBGE como asset.

**2. Remover a tendência tecnológica.** A produtividade observada cresce ao longo dos anos por melhoramento genético e manejo, e essa tendência domina qualquer sinal de clima ou solo. Para cada município, ajuste uma reta à série e use a razão entre o valor observado e o valor da tendência.

### 4.4 Produtividade observada: SIDRA

A tabela 1612 da Produção Agrícola Municipal traz o rendimento médio (variável 112, kg ha⁻¹) por município e cultura:

```python
import pandas as pd

# Monte a consulta no site do SIDRA e copie o link da API.
# Exemplo de estrutura (confira os códigos de produto na própria consulta):
url = ('https://apisidra.ibge.gov.br/values/t/1612/n6/in%20n3%2041'
       '/v/112/p/all/c81/2713')
ibge = pd.read_json(url)
```

> 🔎 Para o milho, use a tabela que separa primeira e segunda safra, como no P3.

### 4.5 Análises

| Análise | O que responde |
|---|---|
| r e EMA entre PA simulada e PO, para cada fonte de CAD | A CAD do solo melhora o modelo? |
| EA = PO / PA por município | Quanto do potencial hídrico o produtor alcança |
| Correlação entre EA e argila, carbono e AD | O solo afeta a produtividade por vias que o MZA não representa? |
| Mapa do yield gap (PA − PO) com a classe textural sobreposta | Onde está a maior margem de ganho |

> 💬 **Pergunta 4:** se a eficiência agrícola for maior nos solos com mais carbono, mesmo depois de a PA já considerar a água disponível, o que isso indica?

---

## 5. Fechamento da disciplina (10 min)

Ao longo dos quatro roteiros, a disciplina percorreu a cadeia completa:

| Aula | Elo da cadeia | Pergunta |
|---|---|---|
| 01 | Dados e ferramentas | Como acessar e processar dados climáticos em nuvem? |
| 02 | Radiação, temperatura e umidade | Quanta energia chega e como estimá-la sem piranômetro? |
| 03 | Produtividade potencial e atingível | Quanto o clima permite produzir e quanto a água limita? |
| 04 | Solo | O solo explica o que o clima não explica? |

### Atividade em grupo (não avaliada)

Cada grupo escolhe **um** dos blocos e responde à sua pergunta para a região estudada nos projetos:

- **Bloco A:** qual esquema climático explica melhor cada propriedade do solo na região?
- **Bloco B:** a AD da ANA e a da PTF concordam na região? Onde não concordam?
- **Bloco C:** a CAD do solo melhora a PA do P3 frente ao IBGE?

---

## 6. Respostas das perguntas da aula

**Pergunta 1. Mais carbono no oeste (quente) ou nos Campos Gerais e no sul (frios)?**

Nos Campos Gerais e no sul. Temperaturas mais baixas reduzem a atividade dos microrganismos e a velocidade de decomposição da matéria orgânica, então o carbono se acumula mesmo com entrada de biomassa semelhante ou menor. No oeste, os Latossolos muito argilosos protegem parte do carbono em microagregados, o que compensa em parte o clima mais quente, mas a decomposição acelerada costuma predominar. Somam-se a isso o histórico de uso (o oeste foi intensamente cultivado por décadas) e, nos Campos Gerais, a vegetação original de campos sobre solos com mais matéria orgânica.

**Pergunta 2. Qual esquema climático separa melhor a argila e o carbono?**

A resposta depende dos dados da região, mas o padrão esperado é que o carbono responda mais ao esquema que representa bem a **temperatura** e o **balanço hídrico atual**. Holdridge, baseado em biotemperatura, precipitação e razão de evapotranspiração, tende a capturar melhor o controle da decomposição. A argila, controlada pelo material de origem, deve ter η²H baixo em ambos os esquemas, porque o clima atual não determina a sua distribuição. Se os esquemas vencerem para variáveis diferentes, a conclusão é que não existe uma classificação climática ótima única: a escolha da covariável deve depender da propriedade do solo que se quer mapear.

**Pergunta 3. Em quais classes texturais a ANA e a PTF mais discordam?**

Espera-se a maior discordância nas classes **argila e muito argilosa**, justamente pela limitação da PTF de clima temperado em solos oxídicos: ela trata a argila dos Latossolos como argila "ativa", superestimando a retenção no ponto de murcha. Nas classes arenosas, as duas fontes tendem a concordar melhor, porque a retenção de água em areia é dominada pela granulometria, e o efeito da mineralogia é pequeno.

**Pergunta 4. EA maior em solos com mais carbono, mesmo com a PA já considerando a AD: o que isso indica?**

Que o carbono afeta a produtividade por caminhos que o MZA não representa. O modelo só "enxerga" o solo pela CAD. Na lavoura, a matéria orgânica também melhora a fertilidade (CTC, disponibilidade de nutrientes), a estrutura e a infiltração, reduzindo perdas por escoamento, e a atividade biológica. Também pode indicar um efeito de manejo: áreas bem conduzidas, com plantio direto consolidado, acumulam carbono e têm maior produtividade ao mesmo tempo. Separar causa de correlação aqui exigiria dados de manejo, o que fica como limitação a discutir.

---

## Referências

ABATZOGLOU, J. T.; DOBROWSKI, S. Z.; PARKS, S. A.; HEGEWISCH, K. C. TerraClimate, a high-resolution global dataset of monthly climate and climatic water balance from 1958–2015. **Scientific Data**, v. 5, 170191, 2018.

ALVARES, C. A.; STAPE, J. L.; SENTELHAS, P. C.; GONÇALVES, J. L. M.; SPAROVEK, G. Köppen's climate classification map for Brazil. **Meteorologische Zeitschrift**, v. 22, n. 6, p. 711-728, 2013.

HOLDRIDGE, L. R. **Life zone ecology**. San José: Tropical Science Center, 1967.

MAPBIOMAS. **Coleção 3 do mapeamento de solos do Brasil**. Disponível em: https://brasil.mapbiomas.org.

SAXTON, K. E.; RAWLS, W. J. Soil water characteristic estimates by texture and organic matter for hydrologic solutions. **Soil Science Society of America Journal**, v. 70, n. 5, p. 1569-1578, 2006.

TOMASELLA, J.; HODNETT, M. G.; ROSSATO, L. Pedotransfer functions for the estimation of soil water retention in Brazilian soils. **Soil Science Society of America Journal**, v. 64, n. 1, p. 327-338, 2000.
