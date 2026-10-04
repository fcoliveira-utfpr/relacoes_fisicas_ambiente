# Aula 03 · Modelo da Zona Agroecológica da FAO (MZA-FAO)

> **Disciplina:** Relações Físicas do Ambiente Agrícola
> **Encontro:** 7 de 9 · 30/11/2026
> **Duração sugerida:** 100 min (ajuste conforme a turma)
> **Trabalho:** Projeto 3, Produtividade potencial, atingível e janelas de semeadura (apresentação e entrega em 07/12/2026, peso 40%)

---

## Objetivos de aprendizagem

Ao final desta aula, você será capaz de:

1. Explicar a lógica do MZA-FAO: da fotossíntese bruta à produtividade potencial (PPf) e à produtividade atingível (PA).
2. Calcular a produtividade potencial bruta padrão (PPBp) com as correções de temperatura para culturas C3 e C4.
3. Aplicar as correções de índice de área foliar (CIAF), respiração (CR), parte colhida (Cc) e umidade (U%).
4. Definir, para soja, milho, trigo, feijão e girassol, as fases fenológicas, os coeficientes kc e ky e a profundidade radicular.
5. Calcular a CAD por fase a partir da profundidade radicular.
6. Penalizar a PPf pelo déficit hídrico, comparando o produtório e a penalização em etapa única.
7. Calcular a eficiência climática (EC) e a eficiência agrícola (EA).

---

## Plano da aula

| Bloco | Tempo | Conteúdo |
|---|---|---|
| 1 | 5 min | Retomada: o que vem do P1 e do P2 |
| 2 | 10 min | Visão geral do MZA-FAO |
| 3 | 15 min | Produtividade potencial bruta padrão (PPBp) |
| 4 | 10 min | Da PPBp à PPf |
| 5 | 20 min | Parâmetros das culturas |
| 6 | 10 min | Profundidade radicular e CAD |
| 7 | 15 min | Produtividade atingível e eficiência climática |
| 8 | 15 min | Organização do Projeto 3 |

---

## 1. Retomada: o que vem do P1 e do P2 (5 min)

O P3 fecha a cadeia construída na disciplina:

| Projeto | O que entrega para o P3 |
|---|---|
| P1 | Qo, N e Qg (medida ou estimada pela temperatura) → razão de insolação n/N |
| P2 | Melhor combinação de base de dados e método de ETo → ETc e balanço hídrico |
| P3 | PPf, PA, EC e janelas de semeadura |

```python
!pip install -q agrometeorologiapy
import agrometeorologiapy as amp
```

---

## 2. Visão geral do MZA-FAO (10 min)

O modelo de Doorenbos & Kassam (1979, 1994) estima a produtividade em dois níveis:

- **Produtividade potencial (PPf):** limitada apenas por radiação solar, temperatura e características da cultura. Água, nutrientes, pragas e doenças não limitam.
- **Produtividade atingível (PA):** a PPf penalizada pelo déficit hídrico de cada fase.

```
 Qo, n/N, T ──► PPBp ──► × CIAF × CR × Cc ÷ (1 − 0,01·U%) ──► PPf
                                                               │
 Chuva, ETo, kc, CAD ──► Balanço hídrico ──► ETr/ETc ──► × ky  ▼
                                                               PA
                                                               │
                                               EC = PA / PPf ◄─┘
```

| Nível | Fatores considerados | Uso típico |
|---|---|---|
| PPf | Radiação, temperatura, fotoperíodo, cultura | Teto de produtividade do local |
| PA | PPf + déficit hídrico | Comparação entre locais e datas de semeadura |
| PO (observada, IBGE) | Tudo, inclusive manejo e tecnologia | Cálculo da eficiência agrícola |

---

## 3. Produtividade potencial bruta padrão (PPBp) (15 min)

### 3.1 A cultura padrão

A PPBp é a produção de matéria seca de uma **cultura padrão hipotética**, com IAF = 5, bem suprida de água e nutrientes. O dia é dividido em uma fração de céu claro (n/N) e uma de céu nublado (1 − n/N):

$$PPBp = PPBc + PPBn$$

$$PPBc = (107{,}2 + 8{,}604 \cdot Q_o) \cdot cT_c \cdot \frac{n}{N}$$

$$PPBn = (31{,}7 + 5{,}234 \cdot Q_o) \cdot cT_n \cdot \left(1 - \frac{n}{N}\right)$$

em que PPBp, PPBc e PPBn estão em kg MS ha⁻¹ d⁻¹, Qo em MJ m⁻² d⁻¹, e cTc e cTn são as correções de temperatura para céu claro e nublado.

> 🔎 Em textos mais antigos, Qo aparece em cal cm⁻² d⁻¹ e os coeficientes são 0,36 e 0,219. Os valores 8,604 e 5,234 são a conversão para MJ m⁻² d⁻¹.

### 3.2 Razão de insolação (n/N) sem heliógrafo

O BR-DWGD não tem insolação. A razão n/N é obtida **invertendo a equação de Angström-Prescott** com a Qg:

$$\frac{n}{N} = \frac{Q_g / Q_o - a}{b} \qquad a = 0{,}29 \cdot \cos(\varphi) \qquad b = 0{,}52$$

limitando o resultado entre 0 e 1.

### 3.3 Correções de temperatura (cTc e cTn)

A eficiência fotossintética depende da rota de fixação de carbono e da temperatura média do ar (T, em °C). As correções foram ajustadas em polinômios por Barbieri & Tuon (1992) e estão em Pereira et al. (2002).

**Culturas C4** (milho):

| Condição | cTn | cTc |
|---|---|---|
| T ≥ 16,5 °C | $-1{,}064 + 0{,}173 \cdot T - 0{,}0029 \cdot T^2$ | $-4{,}16 + 0{,}4325 \cdot T - 0{,}00725 \cdot T^2$ |
| T < 16,5 °C | $-4{,}16 + 0{,}4325 \cdot T - 0{,}00725 \cdot T^2$ | $-9{,}32 + 0{,}865 \cdot T - 0{,}0145 \cdot T^2$ |

**Culturas C3** (soja, trigo, feijão e girassol):

$$cT_n = -0{,}0425 + 0{,}035 \cdot T + 0{,}00325 \cdot T^2 - 0{,}0000925 \cdot T^3$$

$$cT_c = 0{,}583 + 0{,}014 \cdot T + 0{,}0013 \cdot T^2 - 0{,}000037 \cdot T^3$$

Valores calculados para conferência:

| T (°C) | C3 · cTn | C3 · cTc | C4 · cTn | C4 · cTc |
|---|---|---|---|---|
| 10,0 | 0,540 | 0,816 | 0* | 0* |
| 12,5 | 0,722 | 0,889 | 0,113 | 0* |
| 15,0 | 0,902 | 0,961 | 0,696 | 0,392 |
| 17,5 | 1,070 | 1,028 | 1,075 | 1,188 |
| 20,0 | 1,218 | 1,087 | 1,236 | 1,590 |
| 22,5 | 1,337 | 1,135 | 1,360 | 1,901 |
| 25,0 | 1,418 | 1,167 | 1,448 | 2,121 |
| 27,5 | 1,454 | 1,182 | 1,500 | 2,251 |
| 30,0 | 1,435 | 1,174 | 1,516 | 2,290 |
| 32,5 | 1,352 | 1,141 | 1,495 | 2,238 |
| 35,0 | 1,198 | 1,079 | 1,438 | 2,096 |

\* Os polinômios C4 dão valores **negativos** abaixo de cerca de 14 °C (−0,56 e −2,12 a 10 °C). No código, limite as correções a zero.

> 💬 **Pergunta 1:** por que a vantagem do milho (C4) sobre a soja (C3) aparece quase só no cTc, e não no cTn?

### 3.4 Grupos de culturas

| Cultura | Rota | Adaptação térmica | Correções |
|---|---|---|---|
| Soja | C3 | Clima quente | C3 |
| Feijão | C3 | Clima ameno a quente | C3 |
| Girassol | C3 | Ampla | C3 |
| Trigo | C3 | Clima frio a ameno | C3 |
| Milho | C4 | Clima quente | C4 |

---

## 4. Da PPBp à PPf (10 min)

### 4.1 As quatro correções

| Correção | Significado | Expressão |
|---|---|---|
| CIAF | Ajusta a cultura padrão (IAF = 5) ao IAF máximo da cultura | $0{,}0093 + 0{,}185 \cdot IAF - 0{,}0175 \cdot IAF^2$ (IAF ≥ 5 → 0,5) |
| CR | Desconta a respiração de manutenção | 0,6 se T < 20 °C; 0,5 se T ≥ 20 °C |
| Cc | Índice de colheita: fração da matéria seca que é produto | Tabela da seção 5 |
| U% | Umidade do produto colhido | Tabela da seção 5 |

Valores de CIAF:

| IAF máximo | 3,0 | 3,5 | 4,0 | 4,5 | 5,0 |
|---|---|---|---|---|---|
| CIAF | 0,407 | 0,442 | 0,469 | 0,487 | 0,500 |

> 🔎 O CR é aplicado **decêndio a decêndio**, conforme a temperatura de cada decêndio. Em temperaturas mais altas, a planta gasta mais com respiração de manutenção.

### 4.2 Acúmulo decendial ao longo do ciclo

A PPBp é diária. Em escala decendial, multiplica-se pelo número de dias de cada decêndio (ND_d) e acumula-se ao longo do ciclo:

$$PPf = \frac{\sum_{d} \left(PPBp_d \cdot ND_d \cdot CIAF \cdot CR_d \cdot Cc\right)}{1 - 0{,}01 \cdot U\%}$$

em que ND_d = 10 para os dois primeiros decêndios do mês e 8, 9 ou 11 para o terceiro, conforme o mês. No primeiro e no último decêndio do ciclo, considere apenas os dias em que a cultura estava no campo.

> 💬 **Pergunta 2:** por que acumular decêndio a decêndio é melhor do que usar a PPBp média multiplicada pelo número de dias do ciclo?

### 4.3 Exemplo numérico: 1º decêndio de janeiro em Santa Helena

Dados do decêndio: φ = −24,86°, T = 26,5 °C, Qg = 22,5 MJ m⁻² d⁻¹.

```python
import numpy as np

lat = -24.86
NDA = np.arange(1, 11)                                   # 1 a 10 de janeiro
dec = amp.declinacao_solar(NDA)
Hn  = amp.angulo_horario_nascer(lat, dec)
dD2 = amp.fator_correcao_distancia(NDA)
Qo  = amp.irradiancia_extraterrestre(lat, dec, Hn, dD2).mean()
N   = amp.fotoperiodo(Hn).mean()

Qg = 22.5
a, b = 0.29 * np.cos(np.radians(lat)), 0.52
nN = np.clip((Qg / Qo - a) / b, 0, 1)

print(f'Qo = {Qo:.2f}  N = {N:.2f} h  Qg/Qo = {Qg/Qo:.3f}  n/N = {nN:.3f}')
# Qo = 42.96  N = 13.47 h  Qg/Qo = 0.524  n/N = 0.501
```

| Etapa | Milho (C4) | Soja (C3) |
|---|---|---|
| cTc / cTn | 2,210 / 1,484 | 1,178 / 1,446 |
| PPBc (kg ha⁻¹ d⁻¹) | 528,2 | 281,6 |
| PPBn (kg ha⁻¹ d⁻¹) | 189,9 | 185,0 |
| **PPBp (kg ha⁻¹ d⁻¹)** | **718,0** | **466,6** |
| CIAF (IAF máx.) | 0,500 (5,0) | 0,487 (4,5) |
| CR (T ≥ 20 °C) | 0,5 | 0,5 |
| Cc | 0,35 | 0,35 |
| U% | 13 | 13 |
| **Contribuição do decêndio para a PPf (kg ha⁻¹)** | **722** | **458** |

> 🔎 Repare que a PPBc do milho é quase o dobro da soja, enquanto a PPBn é praticamente igual. É a resposta da Pergunta 1 em números.

---

## 5. Parâmetros das culturas (20 min)

### 5.1 Tabela geral

| Parâmetro | Soja | Milho 1ª safra | Milho 2ª safra | Trigo | Feijão | Girassol |
|---|---|---|---|---|---|---|
| Rota fotossintética | C3 | C4 | C4 | C3 | C3 | C3 |
| Ciclo de referência (dias) | 125 | 140 | 120 | 120 | 90 | 115 |
| IAF máximo | 4,5 | 5,0 | 5,0 | 4,0 | 3,5 | 3,5 |
| CIAF | 0,487 | 0,500 | 0,500 | 0,469 | 0,442 | 0,442 |
| Coef. de colheita (Cc) | 0,35 | 0,35 | 0,35 | 0,40 | 0,30 | 0,30 |
| Umidade do produto (U%) | 13 | 13 | 13 | 13,5 | 13 | 11 |
| Profundidade radicular máxima, FAO-56 (m) | 0,6–1,3 | 1,0–1,7 | 1,0–1,7 | 1,0–1,5 | 0,6–0,9 | 0,8–1,5 |
| Zr máx. sugerida para o PR (m) | 0,6 | 0,8 | 0,8 | 0,6 | 0,5 | 0,8 |
| Fração de depleção p, FAO-56 | 0,50 | 0,55 | 0,55 | 0,55 | 0,45 | 0,45 |
| Kc ini / Kc mid / Kc end, FAO-56 | 0,40 / 1,15 / 0,50 | 0,30 / 1,20 / 0,35 | 0,30 / 1,20 / 0,35 | 0,30 / 1,15 / 0,25 | 0,40 / 1,15 / 0,35 | 0,35 / 1,10 / 0,35 |
| ky do ciclo, D&K | 0,85 | 1,25 | 1,25 | 1,15 | 1,15 | 0,95 |

> ⚠️ **Cc do milho:** o valor 0,35 vem de Doorenbos & Kassam e dos artigos de referência. Híbridos modernos chegam a índices de colheita de 0,45 a 0,55. O grupo deve testar a sensibilidade da PPf a esse parâmetro.

> ⚠️ **Zr máxima:** a profundidade da FAO-56 é a potencial. No Paraná, alumínio em subsuperfície e compactação costumam limitar as raízes aos primeiros 50 a 80 cm. Os valores sugeridos refletem essa condição e devem ser justificados pelo solo da região.

### 5.2 Fases, kc, ky e profundidade radicular por cultura

As fases seguem a divisão de Doorenbos & Kassam para o ky: **vegetativa** (estabelecimento e desenvolvimento vegetativo), **floração**, **formação da produção** (enchimento de grãos) e **maturação**.

O kc de cada fase foi obtido da curva da FAO-56:

- **Vegetativa:** média ponderada entre o período inicial (Kc ini) e a rampa de desenvolvimento até o Kc mid.
- **Floração e formação da produção:** Kc mid.
- **Maturação:** média da rampa entre Kc mid e Kc end.

A profundidade radicular cresce linearmente de 0,2 m na semeadura até a Zr máxima no fim da fase vegetativa.

#### Soja (ciclo de 125 dias)

| Fase | Estádios | Duração (d) | Dias após a semeadura | kc | ky | Zr média (m) |
|---|---|---|---|---|---|---|
| Vegetativa | VE–R1 | 50 | 0–50 | 0,62 | 0,2 | 0,40 |
| Floração | R1–R4 | 20 | 51–70 | 1,15 | 0,8 | 0,60 |
| Formação da produção | R5–R6 | 35 | 71–105 | 1,15 | 1,0 | 0,60 |
| Maturação | R7–R8 | 20 | 106–125 | 0,83 | 0,0 | 0,60 |

#### Milho 1ª safra (ciclo de 140 dias)

| Fase | Estádios | Duração (d) | Dias após a semeadura | kc | ky | Zr média (m) |
|---|---|---|---|---|---|---|
| Vegetativa | VE–VT | 60 | 0–60 | 0,60 | 0,4 | 0,50 |
| Floração | VT–R1 | 20 | 61–80 | 1,20 | 1,5 | 0,80 |
| Formação da produção | R2–R5 | 45 | 81–125 | 1,20 | 0,5 | 0,80 |
| Maturação | R5–R6 | 15 | 126–140 | 0,78 | 0,2 | 0,80 |

#### Milho 2ª safra (ciclo de 120 dias)

| Fase | Estádios | Duração (d) | Dias após a semeadura | kc | ky | Zr média (m) |
|---|---|---|---|---|---|---|
| Vegetativa | VE–VT | 50 | 0–50 | 0,61 | 0,4 | 0,50 |
| Floração | VT–R1 | 15 | 51–65 | 1,20 | 1,5 | 0,80 |
| Formação da produção | R2–R5 | 40 | 66–105 | 1,20 | 0,5 | 0,80 |
| Maturação | R5–R6 | 15 | 106–120 | 0,78 | 0,2 | 0,80 |

#### Trigo (ciclo de 120 dias)

| Fase | Estádios (Zadoks) | Duração (d) | Dias após a semeadura | kc | ky | Zr média (m) |
|---|---|---|---|---|---|---|
| Vegetativa | Emergência ao emborrachamento (Z10–Z45) | 50 | 0–50 | 0,60 | 0,2 | 0,40 |
| Floração | Espigamento e antese (Z50–Z69) | 15 | 51–65 | 1,15 | 0,6 | 0,60 |
| Formação da produção | Grão leitoso a massa (Z70–Z87) | 35 | 66–100 | 1,15 | 0,5 | 0,60 |
| Maturação | Maturação fisiológica e de colheita (Z90–Z99) | 20 | 101–120 | 0,70 | 0,0 | 0,60 |

#### Feijão (ciclo de 90 dias)

| Fase | Estádios | Duração (d) | Dias após a semeadura | kc | ky | Zr média (m) |
|---|---|---|---|---|---|---|
| Vegetativa | V0–V4 | 35 | 0–35 | 0,61 | 0,2 | 0,35 |
| Floração | R5–R6 | 15 | 36–50 | 1,15 | 1,1 | 0,50 |
| Formação da produção | R7–R8 | 25 | 51–75 | 1,15 | 0,75 | 0,50 |
| Maturação | R9 | 15 | 76–90 | 0,75 | 0,2 | 0,50 |

#### Girassol (ciclo de 115 dias)

| Fase | Estádios | Duração (d) | Dias após a semeadura | kc | ky | Zr média (m) |
|---|---|---|---|---|---|---|
| Vegetativa | VE–R4 | 50 | 0–50 | 0,61 | 0,25 | 0,50 |
| Floração | R5 | 15 | 51–65 | 1,10 | 1,0 | 0,80 |
| Formação da produção | R6–R8 | 35 | 66–100 | 1,10 | 0,8 | 0,80 |
| Maturação | R9 | 15 | 101–115 | 0,73 | 0,0 | 0,80 |

> 🔎 **ky = 0,0 na maturação** significa que, para soja, trigo e girassol, Doorenbos & Kassam consideram o efeito do déficit nessa fase desprezível sobre a produtividade.

> 💬 **Pergunta 3:** observando os ky, qual é a fase crítica de cada cultura? Por que o milho é a cultura mais sensível?

### 5.3 Parâmetros usados nos artigos de referência

| Parâmetro | Soja (Battisti) | Trigo (Battisti) | Milho (Cangela) |
|---|---|---|---|
| Ciclo (dias) | 140 | 130 | 120 |
| IAF máximo | 4,5 | 4,0 | 5,0 |
| Cc | 0,35 | 0,40 | 0,35 |
| U% | 13 | 13,5 | 13 |
| Número de fases | 3 | 3 | 4 |
| kc por fase | 0,5 / 1,15 / 0,5 | 0,7 / 0,9 / 0,65 | 0,40 / 0,825 / 1,125 / 0,875 |
| ky por fase | 0,2 / 0,8 / 1,0 | 0,2 / 0,6 / 0,0 | 0,4 / 1,5 / 0,5 / 1,25 |
| CAD | 50 mm fixa | 50 mm fixa | Crescente com a raiz |
| ETo | Camargo | Camargo | Ver artigo |

> ⚠️ **Atenção ao ky do milho em Cangela et al.:** em Doorenbos & Kassam, o valor 1,25 é o ky do **ciclo inteiro**, e o ky da maturação é 0,2. O grupo deve verificar no artigo como esse valor foi aplicado e justificar a escolha.

> 💡 Os ciclos e as durações das fases das tabelas da seção 5.2 são **pontos de partida**. O grupo deve ajustá-los para as cultivares usadas na região, citando a fonte (ensaios da IDR-Paraná, Embrapa, informações técnicas das cultivares).

---

## 6. Profundidade radicular e CAD (10 min)

A capacidade de água disponível (CAD) depende do solo e da profundidade explorada pelas raízes:

$$CAD = AD \cdot Z_r$$

em que AD é a água disponível do solo (mm cm⁻¹) e Zr a profundidade radicular efetiva (cm).

Com crescimento linear da raiz durante a fase vegetativa:

$$Z_r(t) = Z_{r,0} + \left(Z_{r,max} - Z_{r,0}\right) \cdot \frac{t}{t_{veg}} \qquad (t \le t_{veg})$$

com Zr,0 = 20 cm e t_veg a duração da fase vegetativa. Depois, Zr = Zr,max.

**Exemplo** para um solo com AD = 1,0 mm cm⁻¹ (ordem de grandeza de um Latossolo argiloso):

| Cultura | CAD na fase vegetativa (mm) | CAD nas demais fases (mm) | Battisti (fixa) |
|---|---|---|---|
| Soja | 40 | 60 | 50 |
| Milho | 50 | 80 | 50 |
| Trigo | 40 | 60 | 50 |
| Feijão | 35 | 50 | 50 |
| Girassol | 50 | 80 | 50 |

No balanço hídrico decendial, a CAD pode mudar a cada decêndio. A função `amp.balanco_hidrico_cultura` aceita isso diretamente: basta montar um DataFrame com as colunas `Chuva`, `ETc` e `CAD`, já calculadas por decêndio.

```python
# df: um decêndio por linha, em ordem cronológica, do plantio à colheita
# df['ETc'] = kc_da_fase * ETo_decendial
# df['CAD'] = AD * Zr_do_decendio
bh = amp.balanco_hidrico_cultura(df[['Chuva', 'ETc', 'CAD']])
bh[['ETc', 'ETR', 'DEF', 'ARM']]
```

> 💬 **Pergunta 4:** usar CAD fixa de 50 mm desde a semeadura superestima ou subestima a PA no início do ciclo?

---

## 7. Produtividade atingível e eficiência climática (15 min)

### 7.1 Penalização pelo déficit hídrico

O ky relaciona a queda relativa de produtividade com a queda relativa da evapotranspiração:

$$1 - \frac{PA}{PPf} = k_y \cdot \left(1 - \frac{ETr}{ETc}\right)$$

**Produtório (Battisti et al., 2013).** A penalização é aplicada em sequência, fase a fase: a PA ao fim de uma fase é a "PPf" da fase seguinte.

$$PA = PPf \cdot \prod_{i} \left[1 - k_{y,i} \cdot \left(1 - \frac{ETr_i}{ETc_i}\right)\right]$$

**Etapa única (forma de Doorenbos & Kassam para o ciclo).** Usa o ky do ciclo e as somas de ETr e ETc:

$$PA = PPf \cdot \left[1 - k_{y,ciclo} \cdot \left(1 - \frac{\sum ETr}{\sum ETc}\right)\right]$$

### 7.2 Exemplo numérico: milho com déficit na floração

| Fase | ETc (mm) | ETr (mm) | ETr/ETc | ky | Fator da fase |
|---|---|---|---|---|---|
| Vegetativa | 60 | 57 | 0,95 | 0,4 | 0,980 |
| Floração | 110 | 77 | 0,70 | 1,5 | 0,550 |
| Formação da produção | 120 | 102 | 0,85 | 0,5 | 0,925 |
| Maturação | 40 | 36 | 0,90 | 0,2 | 0,980 |
| **Ciclo** | **330** | **272** | **0,824** | **1,25** | |

- **Produtório:** PA/PPf = 0,980 · 0,550 · 0,925 · 0,980 = **0,489**
- **Etapa única:** PA/PPf = 1 − 1,25 · (1 − 0,824) = **0,780**

> 💬 **Pergunta 5:** por que as duas formas dão resultados tão diferentes neste exemplo? Qual delas representa melhor o que acontece no campo?

### 7.3 Eficiências

| Índice | Expressão | Interpretação |
|---|---|---|
| Eficiência climática | $EC = PA / PPf$ | Fração da produtividade potencial preservada apesar do déficit hídrico |
| Eficiência agrícola | $EA = PO / PA$ | Fração da produtividade atingível alcançada pelo produtor |
| Yield gap | $PA - PO$ | Produtividade perdida por manejo, tecnologia, pragas e doenças |

> 🔎 Battisti et al. (2013) encontraram EC de 0,31 a 0,61 para soja e acima de 0,81 para trigo no RS. No trigo, a escolha da data deve seguir a maior PPf; na soja, a maior EC.

---

## 8. Organização do Projeto 3 (15 min)

### 8.1 Janelas de semeadura de referência no Paraná

| Cultura | Janela indicativa | Observação |
|---|---|---|
| Soja | Setembro a dezembro | Início depende do vazio sanitário de cada região |
| Milho 1ª safra | Agosto a novembro | Mais cedo no norte e oeste |
| Milho 2ª safra | Janeiro a início de março | Limitada pelo risco de geada no fim do ciclo |
| Trigo | Março a julho | Mais cedo no norte, mais tarde no sul e sudoeste |
| Feijão | Safra das águas (ago–out) e da seca (jan–mar) | Duas janelas por ano |
| Girassol | Safrinha (jan–mar) ou agosto–setembro | Ver ZARC regional |

> ⚠️ Estas janelas são apenas indicativas. As datas simuladas no P3 devem seguir a **portaria do ZARC vigente** para cada cultura e município.

### 8.2 Sugestão de cronograma

O P3 tem **uma semana**. A divisão abaixo supõe que as bases do P1 e do P2 já estão prontas.

| Dias | Etapas | Meta |
|---|---|---|
| 30/11 e 01/12 | 0, 1 e 2 | Parâmetros definidos, base decendial pronta, PPf nas estações |
| 02/12 e 03/12 | 3 e 4 | PA, EC, ANOVA e regressões por data de semeadura |
| 04/12 e 05/12 | 5 e 6 | Variabilidade interanual e zoneamento municipal |
| 06/12 | 7 | Calibração e incerteza (parte avançada) |
| 07/12 | Entrega | Notebook, relatório e apresentação |

### 8.3 Dicas práticas

- **Escreva o MZA como uma função** que recebe a série decendial e a data de semeadura e devolve PPf, PA e EC. Todo o resto do projeto é chamar essa função em laços.
- **Teste com o exemplo da seção 4.3** antes de rodar 30 anos.
- **Limite as correções de temperatura a zero** e a razão n/N entre 0 e 1.
- **Decêndio parcial:** a semeadura nem sempre cai no primeiro dia do decêndio. Defina uma regra e documente.
- **Ciclo que atravessa o ano:** soja semeada em dezembro termina em abril do ano seguinte. Organize a série como contínua, e não ano a ano.

### 8.4 Checklist antes de sair da aula

- [ ] O grupo escolheu as duas culturas
- [ ] Definimos ciclo, duração das fases, kc, ky e Zr, com fonte
- [ ] Sabemos a AD do solo predominante da região
- [ ] Temos a ETo do melhor método do P2 em escala decendial
- [ ] Temos a Qg (Xavier e estimada no P1) para calcular n/N
- [ ] Baixamos a portaria do ZARC das culturas escolhidas

---

## 9. Respostas das perguntas da aula

**Pergunta 1. Por que a vantagem do milho (C4) sobre a soja (C3) aparece quase só no cTc?**

Com céu nublado, a luz é o fator limitante, e as duas rotas fotossintéticas têm eficiência parecida em baixa irradiância. A vantagem das plantas C4 aparece com luz intensa e temperatura alta: o mecanismo de concentração de CO₂ evita a fotorrespiração, que nas C3 cresce justamente nessas condições. Por isso, a 25 °C, o cTn é praticamente igual (1,45 contra 1,42), mas o cTc do milho é 82% maior (2,12 contra 1,17).

**Pergunta 2. Por que acumular decêndio a decêndio é melhor que usar a PPBp média vezes o número de dias?**

Porque radiação, temperatura e nebulosidade mudam ao longo do ciclo, e a resposta da cultura a elas não é linear: as correções de temperatura são polinômios, e o CR muda de valor em 20 °C. A média das condições não produz a média das respostas. O acúmulo também permite que cada data de semeadura "veja" uma sequência diferente de condições, que é exatamente o que o P3 quer comparar.

**Pergunta 3. Qual é a fase crítica de cada cultura? Por que o milho é a mais sensível?**

Em todas, a fase crítica é a floração ou a formação da produção, onde está o maior ky: floração no milho (1,5), no feijão (1,1), no girassol (1,0) e no trigo (0,6); formação da produção na soja (1,0). O milho é o mais sensível porque o déficit na floração causa assincronia entre a liberação do pólen e a emissão dos estilo-estigmas, com falhas de fecundação que não podem ser compensadas depois. A soja, por ter florescimento escalonado ao longo de semanas, consegue repor parte das flores e vagens perdidas.

**Pergunta 4. Usar CAD fixa de 50 mm desde a semeadura superestima ou subestima a PA no início do ciclo?**

Depende da profundidade radicular inicial, mas em geral **superestima**. No início, as raízes exploram apenas 20 a 30 cm de solo; com CAD de 50 mm desde a semeadura, o modelo supõe que a planta tem acesso a mais água do que realmente tem, e o déficit em veranicos logo após a emergência fica subestimado. O efeito sobre a PA é pequeno porque o ky da fase vegetativa é baixo, mas a diferença aparece no armazenamento que chega à floração.

**Pergunta 5. Por que o produtório e a etapa única dão resultados tão diferentes?**

Na etapa única, o déficit concentrado na floração é "diluído" pelas fases sem déficit: a razão ETr/ETc do ciclo fica em 0,82, e o ky médio de 1,25 não captura a alta sensibilidade daquela fase específica. No produtório, a floração recebe seu próprio ky de 1,5 e derruba a produtividade em 45%, e as fases seguintes não conseguem recuperá-la. O produtório representa melhor o campo quando o déficit é concentrado em uma fase crítica, que é o caso típico dos veranicos. Quando o déficit é distribuído ao longo do ciclo, as duas formas se aproximam.

---

## Referências

BARBIERI, V.; TUON, R. L. **Metodologia para estimativa da produção potencial de algumas culturas**. Piracicaba: ESALQ/USP, 1992.

BATTISTI, R.; SENTELHAS, P. C.; PILAU, F. G.; WOLLMANN, C. A. Eficiência climática para as culturas da soja e do trigo no estado do Rio Grande do Sul em diferentes datas de semeadura. **Ciência Rural**, v. 43, n. 3, p. 390-396, 2013.

CANGELA, G. L. C. et al. Estimativa da produtividade potencial e real do milho utilizando o Modelo da Zona Agroecológica da FAO. **Agrometeoros**, v. 29, e026874, 2021.

DE LIMA, C. I. S. et al. Método alternativo de zoneamento agroclimático do milho para o estado de Alagoas. **Revista Brasileira de Meteorologia**, v. 35, n. especial, p. 1057-1067, 2020.

DOORENBOS, J.; KASSAM, A. H. **Yield response to water**. Rome: FAO, 1979. (Irrigation and Drainage Paper, 33).

DOORENBOS, J.; KASSAM, A. H. **Efeito da água no rendimento das culturas**. Campina Grande: UFPB, 1994. (Estudos FAO: Irrigação e Drenagem, 33).

ALLEN, R. G.; PEREIRA, L. S.; RAES, D.; SMITH, M. **Crop evapotranspiration**: guidelines for computing crop water requirements. Rome: FAO, 1998. (Irrigation and Drainage Paper, 56).

PEREIRA, A. R.; ANGELOCCI, L. R.; SENTELHAS, P. C. **Agrometeorologia**: fundamentos e aplicações práticas. Guaíba: Agropecuária, 2002.
