// =====================================================================
// TerraClimate · mapas mensais de um ano
// Escolha o ano, a variável e a região no painel e clique em "Carregar"
// =====================================================================

// ---------- Valores iniciais ----------
var ANO_INICIAL = 2023;
var VARIAVEL_INICIAL = 'pr';
var REGIAO_INICIAL = 'Paraná';

// ---------- Coleção e variáveis (com fator de escala) ----------
var TC = ee.ImageCollection('IDAHO_EPSCOR/TERRACLIMATE');

var VARS = {
  pr:   {nome: 'Precipitação', un: 'mm/mês', escala: 1,
         pal: ['ffffcc', 'a1dab4', '41b6c4', '2c7fb8', '253494']},
  tmed: {nome: 'Temperatura média', un: '°C', escala: 0.1,
         pal: ['313695', '74add1', 'ffffbf', 'f46d43', 'a50026']},
  tmmx: {nome: 'Temperatura máxima', un: '°C', escala: 0.1,
         pal: ['313695', '74add1', 'ffffbf', 'f46d43', 'a50026']},
  tmmn: {nome: 'Temperatura mínima', un: '°C', escala: 0.1,
         pal: ['313695', '74add1', 'ffffbf', 'f46d43', 'a50026']},
  pet:  {nome: 'Evapotranspiração de referência', un: 'mm/mês', escala: 0.1,
         pal: ['ffffe5', 'd9f0a3', '78c679', '238443', '004529']},
  aet:  {nome: 'Evapotranspiração real', un: 'mm/mês', escala: 0.1,
         pal: ['ffffe5', 'd9f0a3', '78c679', '238443', '004529']},
  def:  {nome: 'Deficiência hídrica', un: 'mm/mês', escala: 0.1,
         pal: ['ffffff', 'fee391', 'fe9929', 'cc4c02', '662506']},
  soil: {nome: 'Água no solo', un: 'mm', escala: 0.1,
         pal: ['fff7ec', 'fdbb84', 'd7301f', '7f0000'].reverse()},
  ro:   {nome: 'Escoamento superficial', un: 'mm/mês', escala: 1,
         pal: ['f7fbff', '9ecae1', '4292c6', '084594']},
  srad: {nome: 'Radiação solar incidente', un: 'W/m²', escala: 0.1,
         pal: ['ffffcc', 'fed976', 'fd8d3c', 'e31a1c', '800026']},
  vap:  {nome: 'Pressão de vapor', un: 'kPa', escala: 0.001,
         pal: ['fff7fb', 'a6bddb', '3690c0', '016450']},
  vpd:  {nome: 'Déficit de pressão de vapor', un: 'kPa', escala: 0.01,
         pal: ['ffffd4', 'fed98e', 'fe9929', 'cc4c02', '8c2d04']},
  vs:   {nome: 'Velocidade do vento a 10 m', un: 'm/s', escala: 0.01,
         pal: ['f7f4f9', 'c994c7', 'dd1c77', '67001f']},
  pdsi: {nome: 'Índice de seca de Palmer (PDSI)', un: 'adimensional', escala: 0.01,
         pal: ['8c510a', 'd8b365', 'f5f5f5', '5ab4ac', '01665e'], simetrica: true}
};

var MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
             'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

var REGIOES = {
  'Paraná': ee.FeatureCollection('FAO/GAUL/2015/level1')
    .filter(ee.Filter.eq('ADM0_NAME', 'Brazil')).filter(ee.Filter.eq('ADM1_NAME', 'Parana')),
  'Brasil': ee.FeatureCollection('FAO/GAUL/2015/level0')
    .filter(ee.Filter.eq('ADM0_NAME', 'Brazil'))
};

// ---------- Série mensal de um ano para uma variável ----------
function serieMensal(ano, v) {
  var col = TC.filter(ee.Filter.calendarRange(ano, ano, 'year')).sort('system:time_start');
  return col.map(function (img) {
    var x = (v === 'tmed')
      ? img.select('tmmx').add(img.select('tmmn')).divide(2)
      : img.select(v);
    return x.multiply(VARS[v].escala).rename(v)
      .copyProperties(img, ['system:time_start']);
  });
}

// =====================================================================
// Interface
// =====================================================================
var painel = ui.Panel({style: {width: '300px', padding: '8px'}});
var painelMeses = ui.Panel({style: {width: '480px', padding: '6px'}});
ui.root.insert(0, painel);
ui.root.add(painelMeses);

painel.add(ui.Label('TerraClimate · mapas mensais',
                    {fontWeight: 'bold', fontSize: '18px'}));
painel.add(ui.Label('Dados mensais, ~4 km (Abatzoglou et al., 2018)',
                    {fontSize: '11px', color: '666666'}));

painel.add(ui.Label('Ano:', {fontWeight: 'bold', margin: '10px 8px 0'}));
var caixaAno = ui.Textbox({value: '' + ANO_INICIAL, placeholder: 'ex.: 2023',
                           style: {stretch: 'horizontal'}});
painel.add(caixaAno);

painel.add(ui.Label('Variável:', {fontWeight: 'bold', margin: '10px 8px 0'}));
var seletorVar = ui.Select({
  items: Object.keys(VARS).map(function (k) { return {label: VARS[k].nome, value: k}; }),
  value: VARIAVEL_INICIAL, style: {stretch: 'horizontal'}
});
painel.add(seletorVar);

painel.add(ui.Label('Região:', {fontWeight: 'bold', margin: '10px 8px 0'}));
var seletorRegiao = ui.Select({items: Object.keys(REGIOES), value: REGIAO_INICIAL,
                               style: {stretch: 'horizontal'}});
painel.add(seletorRegiao);

var botao = ui.Button({label: 'Carregar', style: {stretch: 'horizontal', margin: '12px 8px'}});
painel.add(botao);

painel.add(ui.Label('Mês no mapa principal:', {fontWeight: 'bold', margin: '6px 8px 0'}));
var slider = ui.Slider({min: 1, max: 12, step: 1, value: 1, style: {stretch: 'horizontal'}});
var rotuloMes = ui.Label('Jan', {fontSize: '12px', margin: '0 8px'});
painel.add(slider);
painel.add(rotuloMes);

var areaLegenda = ui.Panel();
var areaStatus = ui.Label('', {color: '888888', fontSize: '12px'});
var botaoExport = ui.Button({label: 'Exportar os 12 meses para o Drive',
                             style: {stretch: 'horizontal'}, disabled: true});
var areaGrafico = ui.Panel();
painel.add(areaLegenda);
painel.add(areaStatus);
painel.add(botaoExport);
painel.add(ui.Label('Clique no mapa para ver a série mensal do ponto.',
                    {fontSize: '12px', color: '555555', margin: '12px 8px 4px'}));
painel.add(areaGrafico);

Map.setOptions('HYBRID');

// ---------- Estado atual ----------
var atual = {ano: null, v: null, col: null, lista: null, vis: null, regiao: null};

// ---------- Legenda ----------
function legenda(titulo, un, vis) {
  var barra = ui.Thumbnail({
    image: ee.Image.pixelLonLat().select(0),
    params: {bbox: [0, 0, 1, 0.1], dimensions: '240x12', format: 'png',
             min: 0, max: 1, palette: vis.palette},
    style: {stretch: 'horizontal', margin: '2px 8px', maxHeight: '18px'}
  });
  var rot = ui.Panel([
    ui.Label(vis.min.toFixed(1), {margin: '2px 8px', fontSize: '11px'}),
    ui.Label(un, {margin: '2px 8px', fontSize: '11px', textAlign: 'center', stretch: 'horizontal'}),
    ui.Label(vis.max.toFixed(1), {margin: '2px 8px', fontSize: '11px'})
  ], ui.Panel.Layout.flow('horizontal'));
  return ui.Panel([ui.Label(titulo, {fontWeight: 'bold', fontSize: '12px', margin: '10px 8px 2px'}),
                   barra, rot]);
}

// ---------- Mapa principal (um mês) ----------
function mostrarMes(m) {
  rotuloMes.setValue(MESES[m - 1] + ' de ' + atual.ano);
  if (!atual.lista) return;
  var geom = atual.regiao.geometry();
  var img = ee.Image(atual.lista.get(m - 1)).clip(geom);
  Map.layers().reset();
  Map.addLayer(img, atual.vis, VARS[atual.v].nome + ' · ' + MESES[m - 1] + '/' + atual.ano);
  Map.addLayer(ee.Image().byte().paint({featureCollection: atual.regiao, color: 1, width: 2}),
               {palette: ['000000']}, 'Limite');
}
slider.onChange(mostrarMes);

// ---------- Miniaturas dos 12 meses ----------
function mostrarMiniaturas() {
  painelMeses.clear();
  painelMeses.add(ui.Label(VARS[atual.v].nome + ' · ' + atual.ano,
                           {fontWeight: 'bold', fontSize: '16px'}));
  painelMeses.add(ui.Label('Mesma escala de cor para os 12 meses · clique para abrir no mapa',
                           {fontSize: '11px', color: '666666'}));
  var grade = ui.Panel({layout: ui.Panel.Layout.flow('horizontal', true)});
  var geom = atual.regiao.geometry();
  for (var i = 0; i < 12; i++) {
    (function (m) {
      var thumb = ui.Thumbnail({
        image: ee.Image(atual.lista.get(m - 1)).clip(geom).visualize(atual.vis),
        params: {region: geom.bounds(), dimensions: 140, format: 'png'},
        onClick: function () { slider.setValue(m); },
        style: {margin: '0'}
      });
      grade.add(ui.Panel([ui.Label(MESES[m - 1], {fontWeight: 'bold', fontSize: '12px',
                                                    margin: '2px 4px'}), thumb],
                         null, {margin: '2px', border: '1px solid #dddddd'}));
    })(i + 1);
  }
  painelMeses.add(grade);
}

// ---------- Carregar ano e variável ----------
function carregar() {
  var ano = parseInt(caixaAno.getValue(), 10);
  var v = seletorVar.getValue();
  if (isNaN(ano)) { areaStatus.setValue('Digite um ano válido.'); return; }

  atual.regiao = REGIOES[seletorRegiao.getValue()];
  var geom = atual.regiao.geometry();
  var col = serieMensal(ano, v);

  areaStatus.setValue('Carregando ' + VARS[v].nome + ' de ' + ano + '...');
  botaoExport.setDisabled(true);

  col.size().evaluate(function (n) {
    if (n === 0) {
      areaStatus.setValue('Sem dados para ' + ano + '. O TerraClimate começa em 1958 e é ' +
                          'atualizado com atraso de alguns meses.');
      return;
    }

    // Escala comum aos 12 meses: percentil 2 do mínimo e 98 do máximo
    var escala = seletorRegiao.getValue() === 'Brasil' ? 20000 : 4000;
    var lo = col.min().reduceRegion({reducer: ee.Reducer.percentile([2]), geometry: geom,
                                     scale: escala, bestEffort: true}).values().get(0);
    var hi = col.max().reduceRegion({reducer: ee.Reducer.percentile([98]), geometry: geom,
                                     scale: escala, bestEffort: true}).values().get(0);

    ee.List([lo, hi]).evaluate(function (lim) {
      var a = lim[0], b = lim[1];
      if (VARS[v].simetrica) { var m = Math.max(Math.abs(a), Math.abs(b)); a = -m; b = m; }
      if (a === b) { b = a + 1; }

      atual.ano = ano; atual.v = v; atual.col = col;
      atual.lista = col.toList(12);
      atual.vis = {min: a, max: b, palette: VARS[v].pal};

      areaLegenda.clear();
      areaLegenda.add(legenda(VARS[v].nome, VARS[v].un, atual.vis));
      areaStatus.setValue(n + ' meses carregados.' + (n < 12 ? ' (ano incompleto)' : ''));
      botaoExport.setDisabled(false);

      Map.centerObject(atual.regiao, seletorRegiao.getValue() === 'Brasil' ? 4 : 7);
      mostrarMes(Math.min(slider.getValue(), n));
      mostrarMiniaturas();
    });
  });
}
botao.onClick(carregar);

// ---------- Série mensal no ponto clicado ----------
Map.onClick(function (c) {
  if (!atual.col) return;
  var ponto = ee.Geometry.Point([c.lon, c.lat]);
  areaGrafico.clear();
  var grafico = ui.Chart.image.series({
    imageCollection: atual.col, region: ponto, reducer: ee.Reducer.mean(), scale: 4000
  }).setChartType('ColumnChart').setOptions({
    title: VARS[atual.v].nome + ' · ' + atual.ano +
           ' (lat ' + c.lat.toFixed(2) + ', lon ' + c.lon.toFixed(2) + ')',
    hAxis: {format: 'MMM'},
    vAxis: {title: VARS[atual.v].un},
    legend: {position: 'none'},
    colors: ['#' + VARS[atual.v].pal[Math.floor(VARS[atual.v].pal.length * 0.7)]]
  });
  areaGrafico.add(grafico);
});

// ---------- Exportação ----------
botaoExport.onClick(function () {
  var nomes = MESES.slice(0, 12).map(function (m) { return atual.v + '_' + m; });
  var img = atual.col.toBands().rename(ee.List(nomes).slice(0, atual.col.size()))
    .clip(atual.regiao.geometry()).toFloat();
  Export.image.toDrive({
    image: img,
    description: 'TerraClimate_' + atual.v + '_' + atual.ano + '_' +
                 seletorRegiao.getValue().replace('á', 'a'),
    folder: 'GEE_TerraClimate',
    region: atual.regiao.geometry(),
    scale: 4638.3,
    crs: 'EPSG:4326',
    maxPixels: 1e10
  });
  areaStatus.setValue('Tarefa criada: abra a aba Tasks e clique em Run.');
});

// Carregamento inicial
carregar();
