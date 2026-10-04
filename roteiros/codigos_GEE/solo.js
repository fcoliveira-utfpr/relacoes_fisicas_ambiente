// =====================================================================
// Aula 04 · O solo entre o clima e a produtividade
// Mapas: granulometria, textura, carbono, água disponível (ANA e PTF),
// CAD, clima (TerraClimate 1991–2020) e áreas de soja (MapBiomas)
// =====================================================================

// ============================ CONFIGURAÇÕES ============================
var UF = 'Parana';             // nome GAUL do estado; '' = Brasil inteiro

var PREFIXO = 'projects/mapbiomas-public/assets/brazil/soil/collection3/';
var ASSETS = {
  argila:  PREFIXO + 'mapbiomas_brazil_collection3_soil_clay_fraction_v1',
  silte:   PREFIXO + 'mapbiomas_brazil_collection3_soil_silt_fraction_v1',
  areia:   PREFIXO + 'mapbiomas_brazil_collection3_soil_sand_fraction_v1',
  textura: PREFIXO + 'mapbiomas_brazil_collection3_soil_textural_class_v1',
  COS:     ''                  // 🔧 caminho do carbono (veja a lista no Console)
};

// 🔧 Se o asset for uma coleção, qual imagem usar (system:index).
//    '' = mosaico de todas as imagens da coleção.
var IMAGEM_DA_COLECAO = {argila: '', silte: '', areia: '', textura: '', COS: ''};

// 🔧 Banda de cada asset ('' = primeira; para o carbono, '' = última)
var BANDA = {argila: '', silte: '', areia: '', textura: '', COS: ''};

// 🔧 ANA: preencha o atributo após ver as propriedades no Console ('' = não exibe)
var ASSET_AWC = 'projects/fcoliveira/assets/AWC_br';
var CAMPO_AWC = '';
var FATOR_AWC = 1;             // converte o valor da ANA para mm/cm

// Pedotransferência e CAD
var MO_PTF = 2.5;              // matéria orgânica (%)
var ZR_CM = 60;                // profundidade radicular (cm) para o mapa de CAD

// MapBiomas Cobertura
var ASSET_LULC = 'projects/mapbiomas-public/assets/brazil/lulc/collection9/' +
                 'mapbiomas_collection90_integration_v1';
var ANO_LULC = 2023;
var CLASSE_SOJA = 39;
// =======================================================================

// ---------- Região ----------
var regiao = UF
  ? ee.FeatureCollection('FAO/GAUL/2015/level1')
      .filter(ee.Filter.eq('ADM0_NAME', 'Brazil')).filter(ee.Filter.eq('ADM1_NAME', UF))
  : ee.FeatureCollection('FAO/GAUL/2015/level0').filter(ee.Filter.eq('ADM0_NAME', 'Brazil'));
var geom = regiao.geometry();
var ESCALA_ESTAT = UF ? 2000 : 10000;

// =====================================================================
// Carregamento genérico: Image ou ImageCollection
// =====================================================================
function tipoAsset(id) {
  // 'Image', 'IMAGE', 'ImageCollection' ou 'IMAGE_COLLECTION' → 'IMAGE' / 'IMAGECOLLECTION'
  return String(ee.data.getAsset(id).type).toUpperCase().replace(/_/g, '');
}

function carregar(chave) {
  var id = ASSETS[chave];
  var tipo = tipoAsset(id);
  var img;

  if (tipo === 'IMAGE') {
    img = ee.Image(id);
    print('▶ ' + chave + ' · Image', img.bandNames());
  } else if (tipo === 'IMAGECOLLECTION') {
    var col = ee.ImageCollection(id);
    print('▶ ' + chave + ' · ImageCollection',
          ee.Dictionary({
            n_imagens: col.size(),
            system_index: col.aggregate_array('system:index').slice(0, 30),
            bandas_1a_imagem: col.first().bandNames(),
            propriedades_1a_imagem: col.first().propertyNames()
          }));
    img = IMAGEM_DA_COLECAO[chave]
      ? col.filter(ee.Filter.eq('system:index', IMAGEM_DA_COLECAO[chave])).first()
      : col.mosaic();
    img = ee.Image(img);
  } else {
    throw new Error(chave + ': tipo de asset não suportado (' + tipo + '). ' +
                    'Se for uma pasta, aponte para o asset dentro dela.');
  }

  if (BANDA[chave]) return img.select(BANDA[chave]);
  if (chave === 'COS') return img.select([img.bandNames().get(-1)]);
  return img.select(0);
}

// ---------- Inspeção (Console) ----------
ee.data.listAssets(PREFIXO.slice(0, -1), {}, function (res) {
  print('Assets na pasta da coleção 3:',
        res.assets.map(function (a) { return a.type + '  ' + a.name; }));
});
var awc = ee.FeatureCollection(ASSET_AWC);
print('ANA · propriedades da 1ª feição:', awc.first().toDictionary());

// ---------- Granulometria (converte g/kg em % se necessário) ----------
function fracao(chave) {
  var img = carregar(chave);
  var p99 = ee.Number(img.reduceRegion({
    reducer: ee.Reducer.percentile([99]), geometry: geom,
    scale: ESCALA_ESTAT, bestEffort: true
  }).values().get(0));
  var fator = ee.Number(ee.Algorithms.If(p99.gt(100), 0.1, 1));
  return img.multiply(fator).rename(chave);
}
var argila = fracao('argila');
var silte  = fracao('silte');
var areia  = fracao('areia');
var textura = carregar('textura').toInt().rename('textura');

// ---------- Água disponível: Saxton & Rawls (2006) ----------
var vars = {S: areia.divide(100), C: argila.divide(100), MO: MO_PTF};
var t15 = ee.Image().expression(
  '-0.024*S + 0.487*C + 0.006*MO + 0.005*S*MO - 0.013*C*MO + 0.068*S*C + 0.031', vars);
var t33 = ee.Image().expression(
  '-0.251*S + 0.195*C + 0.011*MO + 0.006*S*MO - 0.027*C*MO + 0.452*S*C + 0.299', vars);
var pmp = t15.add(t15.multiply(0.14).subtract(0.02));
var cc  = t33.add(t33.pow(2).multiply(1.283).subtract(t33.multiply(0.374)).subtract(0.015));
var adPtf = cc.subtract(pmp).multiply(10).max(0).rename('AD_PTF');
var cadPtf = adPtf.multiply(ZR_CM).rename('CAD_PTF');

// ---------- Clima: TerraClimate 1991–2020 ----------
var tc = ee.ImageCollection('IDAHO_EPSCOR/TERRACLIMATE').filterDate('1991-01-01', '2021-01-01');
var tAnual = tc.select('tmmx').mean().add(tc.select('tmmn').mean()).multiply(0.05).rename('T_anual');
var pAnual = tc.select('pr').sum().divide(30).rename('P_anual');
var defAnual = tc.select('def').sum().multiply(0.1).divide(30).rename('DEF_anual');

// ---------- Pilha de camadas contínuas ----------
var camadas = [argila, silte, areia, adPtf, cadPtf, tAnual, pAnual, defAnual];

if (ASSETS.COS) {
  camadas.push(carregar('COS').rename('COS'));
}
if (CAMPO_AWC) {
  var adAna = awc.filter(ee.Filter.notNull([CAMPO_AWC]))
    .reduceToImage([CAMPO_AWC], ee.Reducer.first())
    .multiply(FATOR_AWC).rename('AD_ANA');
  camadas.push(adAna);
  camadas.push(adPtf.subtract(adAna).rename('DIF_AD'));
  camadas.push(adAna.multiply(ZR_CM).rename('CAD_ANA'));
}
var pilha = ee.Image.cat(camadas).clip(geom);

var soja = ee.Image(ASSET_LULC).select('classification_' + ANO_LULC)
  .eq(CLASSE_SOJA).selfMask().clip(geom);

// ---------- Descrição de cada camada ----------
var INFO = {
  argila:    {nome: 'Argila', un: '%', pal: ['fff5eb', 'fdae6b', 'e6550d', '7f2704']},
  silte:     {nome: 'Silte', un: '%', pal: ['f7fcf5', 'a1d99b', '41ab5d', '00441b']},
  areia:     {nome: 'Areia', un: '%', pal: ['ffffe5', 'fee391', 'fe9929', '993404']},
  COS:       {nome: 'Carbono orgânico do solo', un: '(unidade do asset)', pal: ['ffffcc', 'c2a5cf', '762a83', '40004b']},
  AD_ANA:    {nome: 'Água disponível · ANA', un: 'mm/cm', pal: ['f7fbff', '9ecae1', '2171b5', '08306b']},
  AD_PTF:    {nome: 'Água disponível · PTF', un: 'mm/cm', pal: ['f7fbff', '9ecae1', '2171b5', '08306b']},
  DIF_AD:    {nome: 'Diferença de AD (PTF − ANA)', un: 'mm/cm', pal: ['b2182b', 'f4a582', 'f7f7f7', '92c5de', '2166ac'], simetrica: true},
  CAD_PTF:   {nome: 'CAD · PTF (Zr = ' + ZR_CM + ' cm)', un: 'mm', pal: ['fff7fb', 'a6bddb', '3690c0', '014636']},
  CAD_ANA:   {nome: 'CAD · ANA (Zr = ' + ZR_CM + ' cm)', un: 'mm', pal: ['fff7fb', 'a6bddb', '3690c0', '014636']},
  T_anual:   {nome: 'Temperatura média anual (1991–2020)', un: '°C', pal: ['313695', '74add1', 'ffffbf', 'f46d43', 'a50026']},
  P_anual:   {nome: 'Precipitação anual (1991–2020)', un: 'mm', pal: ['ffffcc', 'a1dab4', '41b6c4', '225ea8', '081d58']},
  DEF_anual: {nome: 'Deficiência hídrica anual (1991–2020)', un: 'mm', pal: ['ffffff', 'fec44f', 'ec7014', '8c2d04']}
};
var PAL_TEXTURA = ['a6cee3', '1f78b4', 'b2df8a', '33a02c', 'fb9a99', 'e31a1c', 'fdbf6f',
                   'ff7f00', 'cab2d6', '6a3d9a', 'ffff99', 'b15928', '444444'];

// ---------- Interface ----------
var painel = ui.Panel({style: {width: '340px', padding: '8px'}});
painel.add(ui.Label('Solo, clima e água disponível',
                    {fontWeight: 'bold', fontSize: '18px'}));
painel.add(ui.Label('Calculando escalas de cor...', {color: '888888'}));
ui.root.insert(0, painel);

var contorno = ee.Image().byte().paint({featureCollection: regiao, color: 1, width: 2});
var municipios = UF
  ? ee.FeatureCollection('FAO/GAUL/2015/level2').filter(ee.Filter.eq('ADM1_NAME', UF))
  : ee.FeatureCollection([]);
var linhasMun = ee.Image().byte().paint({featureCollection: municipios, color: 1, width: 0.5});

Map.centerObject(regiao, UF ? 7 : 4);
Map.setOptions('HYBRID');

function legendaContinua(titulo, un, vis) {
  var barra = ui.Thumbnail({
    image: ee.Image.pixelLonLat().select(0),
    params: {bbox: [0, 0, 1, 0.1], dimensions: '240x12', format: 'png',
             min: 0, max: 1, palette: vis.palette},
    style: {stretch: 'horizontal', margin: '2px 8px', maxHeight: '18px'}
  });
  var rot = ui.Panel([
    ui.Label(vis.min.toFixed(2), {margin: '2px 8px', fontSize: '11px'}),
    ui.Label(un, {margin: '2px 8px', fontSize: '11px', textAlign: 'center', stretch: 'horizontal'}),
    ui.Label(vis.max.toFixed(2), {margin: '2px 8px', fontSize: '11px'})
  ], ui.Panel.Layout.flow('horizontal'));
  return ui.Panel([ui.Label(titulo, {fontWeight: 'bold', fontSize: '12px'}), barra, rot]);
}

function legendaTextura() {
  var p = ui.Panel([ui.Label('Classe textural (código)', {fontWeight: 'bold', fontSize: '12px'})]);
  for (var i = 0; i < 13; i++) {
    p.add(ui.Panel([
      ui.Label('', {backgroundColor: '#' + PAL_TEXTURA[i], padding: '7px', margin: '2px 6px'}),
      ui.Label('' + (i + 1), {margin: '3px 0', fontSize: '11px'})
    ], ui.Panel.Layout.flow('horizontal')));
  }
  return p;
}

// Escalas de cor automáticas: percentis 2 e 98 de cada camada na região
pilha.reduceRegion({
  reducer: ee.Reducer.percentile([2, 98]), geometry: geom,
  scale: ESCALA_ESTAT, bestEffort: true, maxPixels: 1e9
}).evaluate(function (est, erro) {
  painel.widgets().remove(painel.widgets().get(1));
  if (erro) {
    painel.add(ui.Label('Erro ao calcular as escalas: ' + erro, {color: 'b2182b'}));
    return;
  }

  var bandas = Object.keys(INFO).filter(function (b) {
    return (b + '_p2') in est && est[b + '_p2'] !== null;
  });
  var vis = {};
  bandas.forEach(function (b) {
    var lo = est[b + '_p2'], hi = est[b + '_p98'];
    if (INFO[b].simetrica) { var m = Math.max(Math.abs(lo), Math.abs(hi)); lo = -m; hi = m; }
    vis[b] = {min: lo, max: hi, palette: INFO[b].pal};
  });

  var opcoes = bandas.map(function (b) { return {label: INFO[b].nome, value: b}; });
  opcoes.splice(3, 0, {label: 'Classe textural', value: 'textura'});

  var areaLegenda = ui.Panel();

  function mostrar(b) {
    Map.layers().reset();
    if (b === 'textura') {
      Map.addLayer(textura.clip(geom), {min: 1, max: 13, palette: PAL_TEXTURA}, 'Classe textural');
    } else {
      Map.addLayer(pilha.select(b), vis[b], INFO[b].nome);
    }
    Map.addLayer(soja, {palette: ['000000']}, 'Soja (MapBiomas ' + ANO_LULC + ')', false, 0.5);
    Map.addLayer(linhasMun, {palette: ['ffffff']}, 'Municípios', false, 0.6);
    Map.addLayer(contorno, {palette: ['000000']}, 'Limite');
    areaLegenda.clear();
    areaLegenda.add(b === 'textura' ? legendaTextura() : legendaContinua(INFO[b].nome, INFO[b].un, vis[b]));
  }

  painel.add(ui.Label('Camada:', {fontWeight: 'bold', margin: '10px 8px 0'}));
  painel.add(ui.Select({items: opcoes, value: 'argila', onChange: mostrar,
                        style: {stretch: 'horizontal'}}));
  painel.add(areaLegenda);
  painel.add(ui.Label('Camadas extras (soja e municípios) no controle Layers.',
                      {fontSize: '11px', color: '777777'}));
  painel.add(ui.Label('Clique no mapa para ver os valores do ponto.',
                      {fontSize: '12px', color: '555555', margin: '12px 8px 4px'}));
  var areaPonto = ui.Panel();
  painel.add(areaPonto);

  Map.onClick(function (c) {
    areaPonto.clear();
    areaPonto.add(ui.Label('Consultando...', {color: '888888'}));
    pilha.addBands(textura).reduceRegion({
      reducer: ee.Reducer.first(), geometry: ee.Geometry.Point([c.lon, c.lat]), scale: 30
    }).evaluate(function (v) {
      areaPonto.clear();
      areaPonto.add(ui.Label('Lat ' + c.lat.toFixed(3) + ' · Lon ' + c.lon.toFixed(3),
                             {fontWeight: 'bold'}));
      areaPonto.add(ui.Label('Classe textural: ' + v.textura, {fontSize: '12px', margin: '1px 8px'}));
      bandas.forEach(function (b) {
        var x = v[b];
        areaPonto.add(ui.Label(INFO[b].nome + ': ' +
          (x === null || x === undefined ? 'sem dado' : x.toFixed(2) + ' ' + INFO[b].un),
          {fontSize: '12px', margin: '1px 8px'}));
      });
    });
  });

  mostrar('argila');
});
