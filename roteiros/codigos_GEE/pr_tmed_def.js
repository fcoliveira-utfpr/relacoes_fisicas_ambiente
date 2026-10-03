// =====================================================================
// Aula 01 · Mapas climatológicos do Paraná
// Precipitação (CHIRPS), temperatura (ERA5-Land) e deficiência hídrica
// (TerraClimate)
// =====================================================================

// ================== PERÍODO DE ANÁLISE (AJUSTÁVEL) ==================
var ANO_INICIO = 1991;   // primeiro ano (inclusivo)
var ANO_FIM    = 2020;   // último ano (inclusivo)
// ====================================================================

// Em filterDate a data final é EXCLUSIVA: usamos 1º de janeiro do ano
// seguinte para que o ANO_FIM entre completo
var INI = ee.Date.fromYMD(ANO_INICIO, 1, 1);
var FIM = ee.Date.fromYMD(ANO_FIM + 1, 1, 1);
var N_ANOS = ANO_FIM - ANO_INICIO + 1;
var PERIODO = (N_ANOS > 1) ? ANO_INICIO + '–' + ANO_FIM : '' + ANO_INICIO;

// ---------- Outras opções ----------
var METODO = 'bicubic';        // suavização visual: 'bilinear' ou 'bicubic'
var ESCALA_EXPORT = 1000;      // resolução da exportação (m)
var SANTA_HELENA = ee.Geometry.Point([-54.33, -24.86]);

// ---------- Área de estudo: Paraná (FAO GAUL nível 1) ----------
var parana = ee.FeatureCollection('FAO/GAUL/2015/level1')
  .filter(ee.Filter.eq('ADM0_NAME', 'Brazil'))
  .filter(ee.Filter.eq('ADM1_NAME', 'Parana'));
var geom = parana.geometry();

// ---------- Funções auxiliares ----------

// Interpolação aplicada imagem a imagem, ANTES da redução (.sum/.mean),
// pois o composto perde a projeção original. Efeito apenas visual.
function suavizar(img) {
  return img.resample(METODO);
}

// Mostra no Console quantas imagens e quais anos a coleção cobre
function verificarPeriodo(colecao, nome) {
  var t0 = ee.Date(colecao.aggregate_min('system:time_start')).format('YYYY');
  var t1 = ee.Date(colecao.aggregate_max('system:time_start')).format('YYYY');
  print(nome + ' · imagens no filtro:', colecao.size(),
        'Anos disponíveis no filtro:', ee.String(t0).cat('–').cat(t1));
}

// =====================================================================
// 1. Precipitação média anual (CHIRPS, pêntadas)
//    soma do período ÷ número de anos = mm/ano
// =====================================================================
var colPrec = ee.ImageCollection('UCSB-CHG/CHIRPS/PENTAD')
  .filterDate(INI, FIM)
  .select('precipitation');
verificarPeriodo(colPrec, 'CHIRPS');

var prec = colPrec
  .map(suavizar)
  .sum()
  .divide(N_ANOS)
  .rename('prec_mm_ano')
  .clip(geom);

var visPrec = {min: 1200, max: 2400,
  palette: ['fff7bc', 'c7e9b4', '7fcdbb', '41b6c4', '1d91c0', '225ea8', '0c2c84']};

// =====================================================================
// 2. Temperatura média anual do ar (ERA5-Land, mensal)
//    média de todos os meses − 273,15 = °C
// =====================================================================
var colTemp = ee.ImageCollection('ECMWF/ERA5_LAND/MONTHLY_AGGR')
  .filterDate(INI, FIM)
  .select('temperature_2m');
verificarPeriodo(colTemp, 'ERA5-Land');

var temp = colTemp
  .map(suavizar)
  .mean()
  .subtract(273.15)
  .rename('temp_C')
  .clip(geom);

var visTemp = {min: 14, max: 24,
  palette: ['313695', '4575b4', '74add1', 'fee090', 'f46d43', 'd73027', 'a50026']};

// =====================================================================
// 3. Deficiência hídrica média anual (TerraClimate, mensal)
//    soma × 0,1 (fator de escala) ÷ número de anos = mm/ano
// =====================================================================
var colDef = ee.ImageCollection('IDAHO_EPSCOR/TERRACLIMATE')
  .filterDate(INI, FIM)
  .select('def');
verificarPeriodo(colDef, 'TerraClimate');

var defic = colDef
  .map(suavizar)
  .sum()
  .multiply(0.1)
  .divide(N_ANOS)
  .rename('def_mm_ano')
  .clip(geom);

var visDef = {min: 0, max: 150,
  palette: ['ffffff', 'fee391', 'fec44f', 'fe9929', 'ec7014', 'cc4c02', '8c2d04']};

// =====================================================================
// Visualização no mapa
// =====================================================================
Map.centerObject(parana, 7);
Map.setOptions('HYBRID');

Map.addLayer(prec,  visPrec, 'Precipitação (' + PERIODO + ')', true);
Map.addLayer(temp,  visTemp, 'Temperatura (' + PERIODO + ')', false);
Map.addLayer(defic, visDef,  'Deficiência hídrica (' + PERIODO + ')', false);

// Contorno do estado e ponto de referência
var contorno = ee.Image().byte().paint({featureCollection: parana, color: 1, width: 2});
Map.addLayer(contorno, {palette: '000000'}, 'Limite do Paraná');
Map.addLayer(SANTA_HELENA, {color: 'red'}, 'Santa Helena');

// =====================================================================
// Legendas
// =====================================================================
function legenda(titulo, unidade, vis) {
  var barra = ui.Thumbnail({
    image: ee.Image.pixelLonLat().select(0),
    params: {bbox: [0, 0, 1, 0.1], dimensions: '220x12', format: 'png',
             min: 0, max: 1, palette: vis.palette},
    style: {stretch: 'horizontal', margin: '2px 8px', maxHeight: '18px'}
  });
  var rotulos = ui.Panel({
    widgets: [
      ui.Label(vis.min, {margin: '2px 8px', fontSize: '11px'}),
      ui.Label(unidade, {margin: '2px 8px', fontSize: '11px',
                         textAlign: 'center', stretch: 'horizontal'}),
      ui.Label(vis.max, {margin: '2px 8px', fontSize: '11px'})
    ],
    layout: ui.Panel.Layout.flow('horizontal')
  });
  return ui.Panel([
    ui.Label(titulo, {fontWeight: 'bold', fontSize: '12px', margin: '6px 8px 2px'}),
    barra, rotulos
  ]);
}

var painel = ui.Panel({style: {position: 'bottom-left', padding: '6px', width: '260px'}});
painel.add(ui.Label('Paraná · ' + PERIODO, {fontWeight: 'bold', fontSize: '14px'}));
painel.add(legenda('Precipitação média anual', 'mm/ano', visPrec));
painel.add(legenda('Temperatura média anual do ar', '°C', visTemp));
painel.add(legenda('Deficiência hídrica média anual', 'mm/ano', visDef));
Map.add(painel);

// =====================================================================
// Exportação para o Google Drive (aba Tasks → Run)
// =====================================================================
var SUFIXO = ANO_INICIO + '_' + ANO_FIM;

function exportar(img, nome) {
  Export.image.toDrive({
    image: img.toFloat(),
    description: nome + '_' + SUFIXO,
    folder: 'GEE_aula01',
    region: geom,
    scale: ESCALA_EXPORT,
    crs: 'EPSG:4326',
    maxPixels: 1e10
  });
}

exportar(prec,  'precipitacao_parana');
exportar(temp,  'temperatura_parana');
exportar(defic, 'deficit_parana');
