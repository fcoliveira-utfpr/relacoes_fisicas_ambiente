# Aula 01 · Colab + Google Earth Engine: primeiros passos

> **Disciplina:** Relações Físicas do Ambiente Agrícola
> **Encontro:** 1 de 9 ·
> **Duração sugerida:** 100 min (ajuste conforme a turma)
> **Trabalho para a semana:** ambiente configurado + definição da área de estudo

---

## Objetivos de aprendizagem

Ao final desta aula, você será capaz de:

1. Explicar o que é o Google Earth Engine (GEE) e por que ele mudou a forma de trabalhar com dados climáticos.
2. Criar um projeto no Google Cloud, registrá-lo no Earth Engine e autenticar o acesso pelo Google Colab.
3. Executar o primeiro script: carregar uma imagem, consultar um valor e visualizar um mapa.
4. Distinguir objetos do servidor (`ee.*`) de objetos do Python local.
5. Reconhecer as principais fontes de dados agrometeorológicos disponíveis no catálogo do GEE.
6. Delimitar uma área de estudo a partir de um limite municipal.

---

## 1. Motivação: onde vamos chegar (10 min)

Antes de qualquer configuração, veja o tipo de produto que você será capaz de gerar ao final da disciplina. Cada mapa abaixo resume **30 anos de dados** (1991–2020) para **todo o Paraná** e foi produzido com poucas dezenas de linhas de código, sem baixar nenhum arquivo para o computador.

![Precipitação média anual](figuras/aula01_precipitacao.png)
*Precipitação média anual (CHIRPS, 1991–2020).*

![Temperatura média anual](figuras/aula01_temperatura.png)
*Temperatura média anual do ar a 2 m (ERA5-Land, 1991–2020).*

![Deficiência hídrica anual](figuras/aula01_deficit.png)
*Deficiência hídrica climatológica anual (TerraClimate, 1991–2020).*

**Pergunta para a turma:** olhando os três mapas, onde você plantaria milho segunda safra sem irrigação? E onde o risco seria maior? Guarde sua resposta: voltaremos a ela no último encontro.

---

## 2. Como a disciplina funciona (10 min)

A disciplina tem **9 encontros** e alterna dois tipos de aula:

- **Encontros expositivos:** exposição curta do conteúdo, seguida de trabalho em grupo.
- **Encontros de apresentação/entrega:** os grupos apresentam o projeto desenvolvido nas semanas anteriores.

| Enc. | Data | Tipo | Conteúdo |
|---|---|---|---|
| 1 | 05/10 | Expositiva | Colab + GEE: acesso, autenticação, primeiro script, fontes de dados |
| 2 | 19/10 | — | Sem aula (SICITE) |
| 3 | 26/10 | Expositiva | Radiação solar, temperatura e umidade do ar |
| 4 | 09/11 | Apresentação | P1 |
| 5 | 16/11 | Expositiva | Modelos de chuva, evapotranspiração e balanço hídrico |
| 6 | 23/11 | Apresentação | P2 |
| 7 | 30/11 | Expositiva | MZA-FAO: produtividade potencial e atingível |
| 8 | 07/12 | Apresentação | P3 |
| 9 | 14/12 | Expositiva | Encerramento |

### Projetos e avaliação

| Projeto | Tema | Peso |
|---|---|---|
| P1 | Elementos meteorológicos: radiação solar, temperatura e umidade do ar | 30% |
| P2 | Chuva, evapotranspiração de referência e balanço hídrico | 30% |
| P3 | Produtividade potencial e atingível (MZA-FAO), integrando P1 e P2 | 40% |

Os projetos são **encadeados**: os resultados do P1 e do P2 alimentam o P3. Por isso, a área de estudo que o grupo definir agora será a mesma até o fim da disciplina. Escolha com cuidado.

Os cálculos agronômicos serão feitos com a biblioteca [`agrometeorologiapy`](https://pypi.org/project/agrometeorologiapy/). O Earth Engine será a fonte e o processador dos dados; a interpretação agronômica é responsabilidade do grupo.

---

## 3. O que é o Earth Engine (15 min)

O Google Earth Engine é uma plataforma de processamento geoespacial em nuvem que reúne:

- **Um catálogo** com petabytes de dados públicos: imagens de satélite, reanálises climáticas, modelos de elevação, uso do solo.
- **Uma infraestrutura de processamento:** os cálculos rodam nos servidores do Google, não no seu computador.
- **APIs** em JavaScript (Code Editor) e Python (que usaremos no Colab).

### 3.1 Os quatro objetos fundamentais

| Objeto | O que representa | Exemplo |
|---|---|---|
| `ee.Image` | Uma imagem (raster) com uma ou mais bandas | Altitude do SRTM |
| `ee.ImageCollection` | Um conjunto de imagens, geralmente no tempo | Chuva diária do CHIRPS |
| `ee.Feature` | Uma geometria com atributos | Limite de um município |
| `ee.FeatureCollection` | Um conjunto de feições | Todos os municípios do Paraná |

### 3.2 Servidor × cliente

Esse é o conceito que mais confunde no início. Quando você escreve `ee.Number(2).add(3)`, **nada é calculado** no seu computador: você está montando uma "receita" que será executada no servidor apenas quando pedir o resultado.

```python
x = ee.Number(2).add(3)
print(x)            # mostra a "receita", não o valor
print(x.getInfo())  # agora o servidor calcula e devolve: 5
```

**Regra prática:** use `.getInfo()` apenas para trazer resultados pequenos (um número, uma lista curta). Nunca use em uma coleção inteira.

### 3.3 Por que isso importa para a Agrometeorologia?

Antes do GEE, calcular a precipitação média de 30 anos para um estado exigia baixar gigabytes de arquivos, recortar, empilhar e processar localmente. Hoje, a mesma tarefa é uma linha de código e alguns segundos de processamento.

---

## 4. Mão na massa: acesso e autenticação (25 min)

### 4.1 Pré-requisitos

- Conta Google (de preferência a institucional).
- Navegador atualizado.

### 4.2 Criar e registrar um projeto no Google Cloud

1. Acesse <https://code.earthengine.google.com/register>.
2. Escolha **uso não comercial** (pesquisa/ensino).
3. Crie um projeto novo no Google Cloud. Sugestão de nome: `ee-seunome-agro`.
4. Anote o **ID do projeto**: você vai usá-lo em todos os notebooks.

> ⚠️ O ID do projeto nem sempre é igual ao nome. Confira no console do Google Cloud.

### 4.3 Abrir o Colab e autenticar

Abra um notebook novo em <https://colab.research.google.com> e execute:

```python
import ee

ee.Authenticate()                         # abre a janela de login do Google
ee.Initialize(project='SEU-ID-DE-PROJETO')

print(ee.String('Earth Engine conectado!').getInfo())
```

Se aparecer `Earth Engine conectado!`, está tudo pronto.

### 4.4 Problemas comuns

| Mensagem | Causa provável | Solução |
|---|---|---|
| `Project not registered` | Projeto não registrado no EE | Refazer o passo 4.2 |
| `Permission denied` | Conta diferente da que criou o projeto | Autenticar com a mesma conta |
| `ee.Initialize() requires a project` | Faltou o argumento `project` | Informar o ID do projeto |
| Janela de login não abre | Bloqueio de pop-up | Liberar pop-ups para o Colab |

---

## 5. Primeiro script (20 min)

### 5.1 Uma imagem e um ponto

Vamos consultar a altitude de Santa Helena-PR no modelo digital de elevação SRTM (resolução de 30 m).

```python
ponto = ee.Geometry.Point([-54.33, -24.86])   # [longitude, latitude]

srtm = ee.Image('USGS/SRTMGL1_003')
print(srtm.bandNames().getInfo())

altitude = srtm.sample(ponto, scale=30).first().get('elevation')
print(f'Altitude: {altitude.getInfo()} m')
```

> 🔎 **Atenção:** no GEE as coordenadas são sempre **[longitude, latitude]**, nessa ordem.

### 5.2 Explorando uma coleção

```python
chirps = (ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY')
          .filterDate('2024-01-01', '2025-01-01')
          .filterBounds(ponto))

print('Número de imagens:', chirps.size().getInfo())
print('Bandas:', chirps.first().bandNames().getInfo())
```

### 5.3 De diário para anual

```python
chuva_2024 = chirps.sum()

total = chuva_2024.sample(ponto, scale=5566).first().get('precipitation')
print(f'Chuva total em 2024: {total.getInfo():.0f} mm')
```

> 💬 **Discussão:** compare esse valor com o registrado em uma estação meteorológica próxima. Por que eles podem ser diferentes?

### 5.4 Visualizando em um mapa interativo

```python
import geemap

Mapa = geemap.Map(center=[-24.86, -54.33], zoom=8)

Mapa.addLayer(srtm, {'min': 100, 'max': 1000,
                     'palette': ['006837', 'a6d96a', 'fee08b', 'd73027']},
              'Altitude (m)')
Mapa.addLayer(chuva_2024, {'min': 1000, 'max': 2500,
                           'palette': ['f7fbff', '6baed6', '08306b']},
              'Chuva 2024 (mm)')
Mapa.addLayer(ponto, {'color': 'red'}, 'Santa Helena')

Mapa
```

Use o controle de camadas no canto superior direito para ligar e desligar cada mapa.

---

## 6. Fontes de dados (10 min)

As fontes abaixo serão usadas ao longo da disciplina. Todas estão disponíveis gratuitamente.

| Variável | Fonte | ID no GEE | Resolução | Período |
|---|---|---|---|---|
| Precipitação | CHIRPS | `UCSB-CHG/CHIRPS/DAILY` | ~5,5 km, diária | 1981– |
| Temperatura, umidade, radiação, vento | ERA5-Land | `ECMWF/ERA5_LAND/DAILY_AGGR` | ~11 km, diária | 1950– |
| Balanço hídrico, ETP, déficit | TerraClimate | `IDAHO_EPSCOR/TERRACLIMATE` | ~4 km, mensal | 1958– |
| Índice de vegetação (NDVI) | MODIS | `MODIS/061/MOD13Q1` | 250 m, 16 dias | 2000– |
| Temperatura da superfície | MODIS | `MODIS/061/MOD11A2` | 1 km, 8 dias | 2000– |
| Altitude | SRTM | `USGS/SRTMGL1_003` | 30 m | estático |
| Limites administrativos | FAO GAUL | `FAO/GAUL/2015/level2` | vetorial | estático |
| Estações meteorológicas | NASA POWER (API) | fora do GEE | pontual, diária | 1981– |

**Como escolher?** Não existe fonte "melhor": existe a mais adequada à pergunta. Resolução espacial, período disponível e forma de obtenção do dado (satélite, reanálise, interpolação de estações) definem o que cada fonte consegue responder.

Catálogo completo: <https://developers.google.com/earth-engine/datasets>

---

## 7. Área de estudo e trabalho da semana (10 min)

### 7.1 Exemplo: delimitando um município

```python
municipios = ee.FeatureCollection('FAO/GAUL/2015/level2')

area = (municipios
        .filter(ee.Filter.eq('ADM1_NAME', 'Parana'))
        .filter(ee.Filter.eq('ADM2_NAME', 'Santa Helena')))

print('Feições encontradas:', area.size().getInfo())
print(f"Área: {area.geometry().area().divide(1e6).getInfo():.0f} km²")
```

> ⚠️ Os nomes na base GAUL podem estar **sem acento**. Para conferir a grafia, liste os nomes do estado:
> ```python
> nomes = municipios.filter(ee.Filter.eq('ADM1_NAME', 'Parana')).aggregate_array('ADM2_NAME')
> print(sorted(nomes.getInfo()))
> ```

### 7.2 Trabalho para a semana

Cada grupo deve entregar um notebook no Colab contendo:

1. **Ambiente configurado:** autenticação funcionando com o projeto de cada integrante.
2. **Área de estudo definida:** um município ou conjunto de municípios, com justificativa agronômica (cultura predominante, importância regional, problema climático de interesse).
3. **Mapa interativo** mostrando o limite da área de estudo.
4. **Três informações** sobre a área, extraídas do GEE: área total (km²), altitude média e chuva total de um ano à escolha.
5. **Uma pergunta agroclimática** que o grupo gostaria de responder ao longo da disciplina.

**Formato de entrega:** link do notebook compartilhado (permissão de leitura).

### 7.3 Checklist antes de sair da aula

- [ ] Consegui autenticar e ver a mensagem `Earth Engine conectado!`
- [ ] Anotei o ID do meu projeto
- [ ] Rodei o mapa interativo
- [ ] Meu grupo já tem uma ideia de área de estudo

---

## Para saber mais

- Documentação da API Python: <https://developers.google.com/earth-engine/guides/python_install>
- Tutoriais oficiais: <https://developers.google.com/earth-engine/tutorials>
- `geemap`: <https://geemap.org>
- `agrometeorologiapy`: <https://pypi.org/project/agrometeorologiapy/>
