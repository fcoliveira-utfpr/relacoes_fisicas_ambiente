// =====================================================================
// Qo, Qg e Rn mensais no Brasil · climatologia dos últimos 10 anos
// Dados: BR-DWGD (Xavier et al., 2022)
// Fórmulas: agrometeorologiapy (Qo, Tetens, BOC, BOL, Rn)
// =====================================================================

// ================== PERÍODO (AJUSTÁVEL) ==================
var ANO_FIM = 2025;            // último ano (inclusivo)
var N_ANOS  = 10;              // número de anos
// =========================================================
var ANO_INICIO = ANO_FIM - N_ANOS + 1;
var INI = ee.Date.fromYMD(ANO_INICIO, 1, 1);
var FIM = ee.Date.fromYMD(ANO_FIM + 1, 1, 1);   // data final exclusiva
var PERIODO = ANO_INICIO + '–' + ANO_FIM;

// ---------- Constantes ----------
var ALBEDO = 0.25;             // r, gramado
var SIGMA  = 4.903e-9;         // Stefan-Boltzmann (MJ K-4 m-2 d-1)
var RAD = Math.PI / 180;       // graus → radianos

// ---------- Área e dados auxiliares ----------
var brasil = ee.FeatureCollection('FAO/GAUL/2015/level0')
  .filter(ee.Filter.eq('ADM0_NAME', 'Brazil'));
var altitude = ee.Image('USGS/SRTMGL1_003').select('elevation').unmask(0);
var latRad = ee.Image.pixelLonLat().select('latitude').multiply(RAD);   // φ (rad)

// =====================================================================
// 1. Conversão dos valores brutos do BR-DWGD (valor = bruto · escala + offset)
// =====================================================================
function escalar(img) {
  var tmax = img.select('Tmax').multiply(0.00106815).add(15);
  var tmin = img.select('Tmin').multiply(0.00106815).add(15);
  var qg   = img.select('Rs').multiply(0.15708661).add(-0.057087);
  var ur   = img.select('RH').multiply(0.39370079).add(-0.393701);
  return ee.Image.cat([tmax, tmin, qg, ur])
    .rename(['Tmax', 'Tmin', 'Qg', 'UR'])
    .set('system:time_start', img.get('system:time_start'));
}

// Equação de Tetens: es = 0,6108 · 10^(7,5·T / (237,3 + T))   [kPa]
function tetens(T) {
  return ee.Image(10).pow(T.multiply(7.5).divide(T.add(237.3))).multiply(0.6108);
}

// =====================================================================
// 2. Qo, Qg e Rn para cada dia
// =====================================================================
function balanco(img) {
  // ---------- Variáveis astronômicas ----------
  var NDA = ee.Number(img.date().getRelative('day', 'year')).add(1);

  // δ = 23,45 · sen[360/365 · (NDA − 80)]   (graus)
  var dec = ee.Number(23.45).multiply(
    NDA.subtract(80).multiply(360 / 365).multiply(RAD).sin());
  var decRad = dec.multiply(RAD);

  // (d/D)² = 1 + 0,033 · cos(360/365 · NDA)
  var dD2 = ee.Number(1).add(
    NDA.multiply(360 / 365).multiply(RAD).cos().multiply(0.033));

  // Hn = arccos[−tg(φ) · tg(δ)]   (rad)
  var Hn = latRad.tan().multiply(decRad.tan()).multiply(-1).clamp(-1, 1).acos();

  // Qo = 37,6 · (d/D)² · [Hn · sen(φ) · sen(δ) + cos(φ) · cos(δ) · sen(Hn)]
  var Qo = Hn.multiply(latRad.sin()).multiply(decRad.sin())
    .add(latRad.cos().multiply(decRad.cos()).multiply(Hn.sin()))
    .multiply(dD2).multiply(37.6)
    .rename('Qo');

  // ---------- Dados do dia ----------
  var Tmax = img.select('Tmax');
  var Tmin = img.select('Tmin');
  var Qg   = img.select('Qg');
  var UR   = img.select('UR');

  // ---------- Umidade ----------
  var es = tetens(Tmax).add(tetens(Tmin)).divide(2);
  var ea = es.multiply(UR.divide(100));

  // ---------- Balanço de radiação ----------
  // Qg,cs = (0,75 + 2·10⁻⁵ · z) · Qo
  var Qgcs = Qo.multiply(altitude.multiply(2e-5).add(0.75));

  // BOC = Qg · (1 − r)
  var BOC = Qg.multiply(1 - ALBEDO);

  // BOL = −σ · [(Tmax,K⁴ + Tmin,K⁴)/2] · (0,34 − 0,14·√ea) · (1,35 · Qg/Qg,cs − 0,35)
  // (razão Qg/Qg,cs limitada a 1, como na FAO-56)
  var termoT = Tmax.add(273.15).pow(4).add(Tmin.add(273.15).pow(4))
    .divide(2).multiply(SIGMA);
  var termoUmid = ea.sqrt().multiply(-0.14).add(0.34);
  var termoNeb  = Qg.divide(Qgcs).min(1).multiply(1.35).subtract(0.35);
  var BOL = termoT.multiply(termoUmid).multiply(termoNeb).multiply(-1);

  // Rn = BOC + BOL
  var Rn = BOC.add(BOL).rename('Rn');

  return ee.Image.cat([Qo, Qg.rename('Qg'), Rn])
    .set('system:time_start', img.get('system:time_start'));
}

var diario = ee.ImageCollection('projects/ee-alexandrexavier/assets/BR-DWGD')
  .filterDate(INI, FIM)
  .select(['Tmax', 'Tmin', 'Rs', 'RH'])
  .map(escalar)
  .map(balanco);

// =====================================================================
// 3. Climatologia mensal (média dos valores diários de cada mês)
// =====================================================================
var mensal = ee.ImageCollection.fromImages(
  ee.List.sequence(1, 12).map(function (m) {
    return diario
      .filter(ee.Filter.calendarRange(m, m, 'month'))
      .mean()
      .set('mes', m);
  })
);
var anual = diario.mean();

// =====================================================================
// 4. Visualização
// =====================================================================
var vis = {
  Qo: {min: 15, max: 42, palette: ['313695', '74add1', 'ffffbf', 'f46d43', 'a50026']},
  Qg: {min: 10, max: 26, palette: ['ffffcc', 'fed976', 'fd8d3c', 'e31a1c', '800026']},
  Rn: {min: 2,  max: 16, palette: ['f7fcf5', 'c7e9c0', '74c476', '238b45', '00441b']}
};
var NOMES_MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho',
                   'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

Map.setCenter(-53, -14, 4);
Map.setOptions('SATELLITE');

var contorno = ee.Image().byte().paint({featureCollection: brasil, color: 1, width: 1});

function mostrar(img, rotulo) {
  Map.layers().reset();
  Map.addLayer(img.select('Qo').clip(brasil), vis.Qo, 'Qo · ' + rotulo, false);
  Map.addLayer(img.select('Qg').clip(brasil), vis.Qg, 'Qg · ' + rotulo, false);
  Map.addLayer(img.select('Rn').clip(brasil), vis.Rn, 'Rn · ' + rotulo, true);
  Map.addLayer(contorno, {palette: '000000'}, 'Brasil');
}

// =====================================================================
// 5. Painel: seleção do mês, legendas e gráfico
// =====================================================================
function legenda(titulo, v) {
  var barra = ui.Thumbnail({
    image: ee.Image.pixelLonLat().select(0),
    params: {bbox: [0, 0, 1, 0.1], dimensions: '220x12', format: 'png',
             min: 0, max: 1, palette: v.palette},
    style: {stretch: 'horizontal', margin: '2px 8px', maxHeight: '18px'}
  });
  var rotulos = ui.Panel({
    widgets: [
      ui.Label(v.min, {margin: '2px 8px', fontSize: '11px'}),
      ui.Label('MJ m⁻² d⁻¹', {margin: '2px 8px', fontSize: '11px',
                             textAlign: 'center', stretch: 'horizontal'}),
      ui.Label(v.max, {margin: '2px 8px', fontSize: '11px'})
    ],
    layout: ui.Panel.Layout.flow('horizontal')
  });
  return ui.Panel([ui.Label(titulo, {fontWeight: 'bold', fontSize: '12px',
                                     margin: '6px 8px 2px'}), barra, rotulos]);
}

var painel = ui.Panel({style: {width: '340px', padding: '8px'}});
painel.add(ui.Label('Balanço de radiação no Brasil',
                    {fontWeight: 'bold', fontSize: '18px'}));
painel.add(ui.Label('Média diária por mês · ' + PERIODO + ' · BR-DWGD',
                    {fontSize: '12px', color: '555555'}));

var seletor = ui.Select({
  items: ['Média anual'].concat(NOMES_MESES),
  value: 'Janeiro',
  onChange: function (escolha) {
    if (escolha === 'Média anual') {
      mostrar(anual, 'anual');
    } else {
      var m = NOMES_MESES.indexOf(escolha) + 1;
      mostrar(ee.Image(mensal.filter(ee.Filter.eq('mes', m)).first()), escolha);
    }
  },
  style: {stretch: 'horizontal'}
});
painel.add(ui.Label('Período exibido:', {fontWeight: 'bold', margin: '10px 8px 0'}));
painel.add(seletor);

painel.add(legenda('Qo · irradiância extraterrestre', vis.Qo));
painel.add(legenda('Qg · irradiância solar global', vis.Qg));
painel.add(legenda('Rn · saldo de radiação', vis.Rn));

painel.add(ui.Label('Clique no mapa para ver a climatologia mensal do ponto.',
                    {fontSize: '12px', color: '555555', margin: '12px 8px 4px'}));
var areaGrafico = ui.Panel();
painel.add(areaGrafico);

ui.root.insert(0, painel);

// ---------- Gráfico mensal no ponto clicado ----------
Map.onClick(function (coords) {
  var ponto = ee.Geometry.Point([coords.lon, coords.lat]);
  areaGrafico.clear();
  areaGrafico.add(ui.Label('Calculando...', {color: '888888'}));

  var grafico = ui.Chart.image.series({
    imageCollection: mensal.select(['Qo', 'Qg', 'Rn']),
    region: ponto,
    reducer: ee.Reducer.mean(),
    scale: 10000,
    xProperty: 'mes'
  }).setOptions({
    title: 'Lat ' + coords.lat.toFixed(2) + ' · Lon ' + coords.lon.toFixed(2),
    hAxis: {title: 'Mês', ticks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
            viewWindow: {min: 1, max: 12}},
    vAxis: {title: 'MJ m⁻² d⁻¹', viewWindow: {min: 0}},
    lineWidth: 2.5,
    pointSize: 4,
    series: {0: {color: '777777', lineDashStyle: [4, 4]},
             1: {color: 'f28e2b'},
             2: {color: '238b45'}}
  });

  areaGrafico.clear();
  areaGrafico.add(grafico);
});

// Exibição inicial
mostrar(ee.Image(mensal.filter(ee.Filter.eq('mes', 1)).first()), 'Janeiro');
