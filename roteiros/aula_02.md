# Aula 02 · Radiação solar, temperatura e umidade do ar

> **Disciplina:** Agrometeorologia com Google Earth Engine e Python
> **Encontro:** 3 de 9 · 26/10/2026
> **Duração sugerida:** 100 min (ajuste conforme a turma)
> **Trabalho:** Projeto 1, Elementos meteorológicos (apresentação e entrega em 09/11/2026, peso 30%)

---

## Objetivos de aprendizagem

Ao final desta aula, você será capaz de:

1. Explicar os fatores astronômicos e atmosféricos que controlam a radiação solar na superfície.
2. Descrever os componentes do balanço de radiação: ondas curtas, ondas longas e saldo de radiação.
3. Relacionar a amplitude térmica diária à nebulosidade e, portanto, à radiação solar global.
4. Calcular as pressões de vapor a partir da temperatura e da umidade relativa.
5. Compreender a cadeia **temperatura → Rs → Rn → ETo** que estrutura o Projeto 1.
6. Acessar o conjunto BR-DWGD (Xavier et al.) no Earth Engine.

---

## Plano da aula

| Bloco | Tempo | Conteúdo |
|---|---|---|
| 1 | 10 min | Retomada: áreas de estudo dos grupos |
| 2 | 25 min | Radiação solar e balanço de radiação |
| 3 | 10 min | Temperatura do ar e amplitude térmica |
| 4 | 10 min | Umidade do ar e pressões de vapor |
| 5 | 10 min | A cadeia do Projeto 1 |
| 6 | 15 min | Dados: BR-DWGD no Earth Engine |
| 7 | 10 min | Avaliação de modelos: métricas |
| 8 | 10 min | Organização do Projeto 1 |

---

## 1. Retomada (10 min)

Cada grupo apresenta em **1 minuto** a área de estudo definida na semana anterior.

> ⚠️ **Atenção para o P1:** o local precisa ter uma **estação INMET a até cerca de 10 km**. Se a área escolhida não atender a esse critério, o grupo deve ajustar o ponto de análise dentro dela ainda hoje.

---

## 2. Radiação solar e balanço de radiação (25 min)

### 2.1 De onde vem a energia

O Sol emite energia praticamente constante. No topo da atmosfera, uma superfície perpendicular aos raios solares recebe a **constante solar**:

$$G_{sc} = 0{,}0820 \ \text{MJ m}^{-2}\,\text{min}^{-1} \approx 1367 \ \text{W m}^{-2}$$

O que chega a uma superfície **horizontal** no topo da atmosfera, ao longo de um dia, depende apenas de três fatores astronômicos:

- a **latitude** (φ);
- a **declinação solar** (δ), que varia ao longo do ano;
- a **distância Terra-Sol**, corrigida pelo fator d_r.

### 2.2 Radiação extraterrestre (Qo ou Ra) e fotoperíodo (N)

$$d_r = 1 + 0{,}033 \cos\left(\frac{2\pi}{365} J\right) \qquad \delta = 0{,}409 \,\text{sen}\left(\frac{2\pi}{365} J - 1{,}39\right)$$

$$\omega_s = \arccos(-\tan\varphi \,\tan\delta) \qquad N = \frac{24}{\pi}\,\omega_s$$

$$R_a = \frac{24 \cdot 60}{\pi}\, G_{sc}\, d_r \left[\omega_s \,\text{sen}\,\varphi \,\text{sen}\,\delta + \cos\varphi \,\cos\delta \,\text{sen}\,\omega_s\right]$$

em que J é o dia do ano, φ e δ estão em radianos e Ra em MJ m⁻² d⁻¹.

![Ra ao longo do ano em diferentes latitudes](figuras/aula02_ra_latitudes.png)
*Radiação extraterrestre diária em diferentes latitudes brasileiras.*

> 💬 **Pergunta para a turma:** por que a amplitude anual de Ra é muito maior no Rio Grande do Sul do que em Roraima?

### 2.3 Da atmosfera à superfície: Qg ou Rs

Ao atravessar a atmosfera, a radiação é **absorvida** (vapor d'água, ozônio, CO₂), **refletida** (nuvens) e **difundida** (gases e aerossóis). O que chega à superfície é a **radiação solar global** (Qg ou Rs).

A razão entre as duas é a **transmissividade atmosférica**:

$$\tau = \frac{R_s}{R_a}$$

| Condição do céu | τ aproximado |
|---|---|
| Céu limpo | 0,70 a 0,75 |
| Parcialmente nublado | 0,40 a 0,60 |
| Encoberto | 0,15 a 0,30 |

Em céu limpo, a FAO-56 estima a **radiação de céu claro** em função da altitude z (m):

$$R_{so} = (0{,}75 + 2 \times 10^{-5} z)\, R_a$$

> 🔎 O valor **0,75** aparece em quase todos os modelos de Fernandes et al. (2018). Agora você sabe de onde ele vem.

### 2.4 Balanço de radiação

| Componente | Sigla | Significado |
|---|---|---|
| Saldo de ondas curtas | BOC ou Rns | Radiação solar absorvida pela superfície |
| Saldo de ondas longas | BOL ou Rnl | Perda líquida de radiação térmica para a atmosfera |
| Saldo de radiação | Rn | Energia disponível para aquecer o ar, o solo e evaporar água |

**Ondas curtas.** A superfície reflete parte da Rs, de acordo com seu albedo (α = 0,23 para a grama de referência):

$$R_{ns} = (1 - \alpha)\, R_s$$

**Ondas longas.** A superfície emite radiação térmica e recebe a contra-radiação da atmosfera. O saldo é quase sempre uma **perda**, maior com céu limpo e ar seco:

$$R_{nl} = \sigma \left[\frac{T_{max,K}^4 + T_{min,K}^4}{2}\right]\left(0{,}34 - 0{,}14\sqrt{e_a}\right)\left(1{,}35\,\frac{R_s}{R_{so}} - 0{,}35\right)$$

com σ = 4,903 × 10⁻⁹ MJ K⁻⁴ m⁻² d⁻¹.

**Saldo de radiação:**

$$R_n = R_{ns} - R_{nl}$$

Observe os três termos da equação de Rnl:

- a **temperatura** controla quanto a superfície emite;
- a **umidade** (ea) controla quanto a atmosfera devolve;
- a **nebulosidade** (Rs/Rso) controla o "cobertor" de nuvens.

![Climatologia mensal do balanço de radiação](figuras/aula02_climatologia_radiacao.png)
*Exemplo de climatologia mensal de Ra, Rs, Rns, Rnl e Rn. Este é o formato do gráfico pedido na Etapa 2 do P1.*

> 💬 **Pergunta para a turma:** em qual estação do ano Rnl é maior no Paraná? Por quê?

### 2.5 Panorama no Paraná

![Radiação solar global média anual no Paraná](figuras/aula02_mapa_rs_parana.png)
*Radiação solar global média diária no Paraná (BR-DWGD, 2001–2025).*

---

## 3. Temperatura do ar e amplitude térmica (10 min)

A temperatura do ar não é um elemento independente: ela é, em grande parte, **consequência do balanço de radiação**.

- **Tmax** ocorre no início da tarde, após o pico de Rn, quando o saldo energético da superfície ainda é positivo.
- **Tmin** ocorre próximo ao nascer do Sol, após uma noite inteira de perda por ondas longas.

A **amplitude térmica** (ΔT = Tmax − Tmin) carrega informação sobre as nuvens:

| Céu | Durante o dia | Durante a noite | ΔT |
|---|---|---|---|
| Limpo | Muita radiação solar → Tmax alta | Muita perda de ondas longas → Tmin baixa | **Grande** |
| Nublado | Pouca radiação solar → Tmax moderada | Nuvens retêm calor → Tmin alta | **Pequena** |

![Amplitude térmica × transmissividade](figuras/aula02_amplitude_transmissividade.png)
*Relação entre amplitude térmica diária e transmissividade atmosférica (Rs/Ra).*

Essa é a **ideia central** de todos os modelos de Fernandes et al. (2018): estimar Rs usando apenas temperatura, que é medida em praticamente qualquer estação, enquanto piranômetros são muito menos comuns.

O modelo mais simples é o de Hargreaves:

$$R_s = b \cdot R_a \cdot \Delta T^{0{,}5} + c$$

Os demais (Bristow-Campbell, Campbell-Donatelli, Donatelli-Bellocchi e DCBB) refinam essa ideia com correções para temperatura mínima, sazonalidade e variações de ΔT ao longo da semana. As equações completas estão no roteiro do Projeto 1.

![Boxplot da amplitude térmica mensal](figuras/aula02_boxplot_amplitude.png)
*Distribuição mensal da amplitude térmica (equivalente à Fig. 2 de Fernandes et al.).*

---

## 4. Umidade do ar e pressões de vapor (10 min)

A quantidade **máxima** de vapor que o ar comporta depende só da temperatura. É a **pressão de saturação de vapor** (es), dada pela equação de Tetens:

$$e^\circ(T) = 0{,}6108 \exp\left(\frac{17{,}27\,T}{T + 237{,}3}\right) \quad [\text{kPa}]$$

Como e°(T) não é linear, a FAO-56 recomenda calcular a média das saturações nas temperaturas extremas, e não a saturação da temperatura média:

$$e_s = \frac{e^\circ(T_{max}) + e^\circ(T_{min})}{2}$$

A **pressão real de vapor** (ea) é a quantidade de vapor efetivamente presente. Com a umidade relativa média:

$$e_a = \frac{UR_{med}}{100}\, e_s$$

O **déficit de pressão de vapor** (DPV = es − ea) mede o "poder de secagem" do ar e é um dos motores da evapotranspiração.

> 🔎 **Onde a umidade entra no P1?** Em Rnl (via ea) e, depois, na ETo Penman-Monteith que serve de referência.

---

## 5. A cadeia do Projeto 1 (10 min)

O P1 reproduz dois artigos e depois os integra:

```
     Fernandes et al. (2018)              Fietz & Fisch (2009)
  ┌──────────────────────────┐     ┌──────────────────────────────┐
  │ Tmax, Tmin  ──►  Rs      │ ──► │ Rs ──► Rn ──► ETo (Priestley- │
  │ (5 modelos empíricos)    │     │       (4 modelos)   Taylor)  │
  └──────────────────────────┘     └──────────────────────────────┘
```

A pergunta central do projeto é:

> **Se eu tiver apenas termômetro, quanto erro carrego até a ETo? E em que elo da cadeia esse erro nasce?**

### Priestley-Taylor em uma linha

Em condições sem advecção, a evapotranspiração é controlada essencialmente pela energia disponível:

$$ET_0 = \alpha_{PT} \cdot W \cdot \frac{R_n}{\lambda} \qquad \alpha_{PT} = 1{,}26 \qquad \lambda = 2{,}45 \ \text{MJ kg}^{-1}$$

em que W é um fator de ponderação que depende da temperatura. Se Rn ≈ k·Rs, a equação vira **ET₀ = k · W · Rs**, que é a equação local que o grupo vai deduzir.

---

## 6. Dados: BR-DWGD no Earth Engine (15 min)

O conjunto de Xavier et al. traz dados diários interpolados para todo o Brasil, em grade de 0,1° × 0,1°, de 1961 a 2025: precipitação, Tmax, Tmin, radiação solar, umidade relativa, vento a 2 m e ETo.

### 6.1 Primeiro contato com a coleção

```python
import ee
ee.Authenticate()
ee.Initialize(project='SEU-ID-DE-PROJETO')

xavier = ee.ImageCollection('projects/ee-alexandrexavier/assets/BR-DWGD')

# Quantas imagens? Quais bandas? Que propriedades cada imagem carrega?
primeira = xavier.first()
print('Bandas:', primeira.bandNames().getInfo())
print('Propriedades:', primeira.propertyNames().getInfo())
```

> 🧭 **Tarefa investigativa:** antes de extrair qualquer dado, o grupo deve responder:
> 1. As bandas estão todas em uma imagem por dia, ou cada variável é uma coleção separada?
> 2. Há **fator de escala** ou **offset**? (Dica: compare um valor bruto com a faixa esperada da variável.)
> 3. Qual é o intervalo de datas da coleção?

### 6.2 Extraindo um pequeno trecho

```python
ponto = ee.Geometry.Point([-54.33, -24.86])   # substitua pelo ponto da estação INMET

trecho = xavier.filterDate('2024-01-01', '2024-01-11')
dados = trecho.getRegion(ponto, scale=11000).getInfo()

for linha in dados[:4]:
    print(linha)
```

> ⚠️ **O desafio da extração:** 25 anos de dados diários são mais de 9 mil imagens. Pedir tudo de uma vez **vai estourar o limite do Earth Engine**. Encontrar uma estratégia para contornar isso e documentá-la faz parte da Etapa 1 do projeto.

### 6.3 Ressalvas que devem aparecer no relatório

- A Rs do Xavier **não é medida**: é interpolada a partir de estações. Por isso a estação INMET próxima é obrigatória.
- O BR-DWGD **não tem Rn medido**. O Rn de referência será calculado pela FAO-56, e isso é diferente do saldo-radiômetro usado por Fietz & Fisch.

---

## 7. Avaliação de modelos: métricas (10 min)

Sendo Oᵢ o valor observado, Pᵢ o estimado, Ō a média observada e n o número de dias:

| Métrica | Equação | Ideal |
|---|---|---|
| RMSE | $\sqrt{\frac{1}{n}\sum (P_i - O_i)^2}$ | 0 |
| RRMSE (%) | $100 \cdot \text{RMSE} / \bar{O}$ | 0 |
| MAE | $\frac{1}{n}\sum \lvert P_i - O_i \rvert$ | 0 |
| EF (Nash-Sutcliffe) | $1 - \frac{\sum (P_i - O_i)^2}{\sum (O_i - \bar{O})^2}$ | 1 |
| d (Willmott) | $1 - \frac{\sum (P_i - O_i)^2}{\sum (\lvert P_i - \bar{O}\rvert + \lvert O_i - \bar{O}\rvert)^2}$ | 1 |
| c (Camargo & Sentelhas) | $r \cdot d$ | 1 |

**Por que tantas métricas?** Porque cada uma enxerga uma coisa:

- **r** (e R²) mede a **precisão**: os pontos acompanham uma reta?
- **d** mede a **exatidão**: essa reta está perto da linha 1:1?
- **RMSE** pune erros grandes; **MAE** trata todos os erros igualmente.
- **EF** compara o modelo com a pior estimativa razoável: usar sempre a média.

> 🔎 Um modelo pode ter r = 0,95 e ainda assim ser ruim, se estiver sistematicamente deslocado. É por isso que o índice **c** combina r e d.

> ⚠️ Pelo enunciado do P1, as métricas devem ser implementadas pelo grupo como **funções próprias**.

---

## 8. Organização do Projeto 1 (10 min)

### 8.1 Sugestão de cronograma do grupo

| Semana | Etapas | Meta |
|---|---|---|
| 26/10 a 01/11 | 0, 1 e 2 | Local caracterizado, base consolidada no Drive, balanço de radiação calculado |
| 02/11 a 08/11 | 3, 4 e 5 | Modelos calibrados e validados, cadeia integrada, relatório e apresentação |

> 💡 A Etapa 1 é a mais trabalhosa em tempo de máquina. Comecem por ela **nesta semana**: todas as etapas seguintes dependem da base consolidada.

### 8.2 Dicas práticas

- **Calibração e validação:** anos ímpares para calibrar, anos pares para validar. Separe os dados uma única vez e reutilize.
- **Ajuste não linear:** `scipy.optimize.curve_fit`. O DB e o DCBB são sensíveis ao chute inicial: testem mais de um e registrem qual funcionou.
- **ΔT de Fernandes:** usa a **Tmin do dia seguinte**. Cuidado com o último dia da série.
- **agrometeorologiapy:** antes de escrever qualquer equação padrão (Ra, N, es, ea, Rso, Rns, Rnl, Rn, ETo), procurem a função na documentação da biblioteca.

### 8.3 Entregáveis (09/11/2026)

1. Notebook `.ipynb` executável de ponta a ponta no Colab, com uma seção por etapa.
2. Relatório em formato de artigo curto (6 a 8 páginas).
3. Apresentação de 15 a 20 minutos.

### 8.4 Checklist antes de sair da aula

- [ ] O ponto do grupo tem estação INMET a até ~10 km
- [ ] Já acessamos a coleção BR-DWGD e listamos as bandas
- [ ] Sabemos se há fator de escala nas variáveis
- [ ] Dividimos as etapas entre os integrantes
- [ ] Instalamos a `agrometeorologiapy` no Colab

---

## Referências

ALLEN, R. G.; PEREIRA, L. S.; RAES, D.; SMITH, M. **Crop evapotranspiration**: guidelines for computing crop water requirements. Rome: FAO, 1998. (Irrigation and Drainage Paper, 56).

CAMARGO, A. P.; SENTELHAS, P. C. Avaliação do desempenho de diferentes métodos de estimativa da evapotranspiração potencial no Estado de São Paulo, Brasil. **Revista Brasileira de Agrometeorologia**, v. 5, n. 1, p. 89-97, 1997.

FERNANDES, D. S.; HEINEMANN, A. B.; AMORIM, A. O.; PAZ, R. L. F. Estimativa da radiação solar global com base em observações de temperatura para o estado de Goiás. **Revista Brasileira de Meteorologia**, v. 33, n. 3, p. 558-566, 2018.

FIETZ, C. R.; FISCH, G. F. Avaliação de modelos de estimativa do saldo de radiação e do método de Priestley-Taylor para a região de Dourados, MS. **Revista Brasileira de Engenharia Agrícola e Ambiental**, v. 13, n. 4, p. 449-453, 2009.

WILLMOTT, C. J. On the validation of models. **Physical Geography**, v. 2, p. 184-194, 1981.

XAVIER, A. C.; SCANLON, B. R.; KING, C. W.; ALVES, A. I. New improved Brazilian daily weather gridded data (1961–2020). **International Journal of Climatology**, v. 42, n. 16, p. 8390-8404, 2022.
