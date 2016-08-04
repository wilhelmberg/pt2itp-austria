var fs = require('fs');
var util = require('util');
var gdal = require('gdal');

gdal.verbose();
gdal.config.set('CPL_DEBUG', 'ON');
gdal.config.set('CPL_LOG_ERRORS', 'ON');

var gip_file_shp = process.argv[2];
var json_name = process.argv[3];
var write_flag = process.argv[4] || 'w';

var feats_cnter = 0;
var feats_processed_cnter = 0;
//LUT_FRC.csv: https://www.data.gv.at/katalog/dataset/intermodales-verkehrsreferenzsystem-osterreich-gip-at-beta/resource/d96eab63-0618-47ec-ba70-2b2ae15fb18d
var use_frc = [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 107];

var start_time = new Date();

var json_write_stream = fs.createWriteStream(json_name, { 'flags': write_flag });
var gip = gdal.open(gip_file_shp);

gip.layers.forEach(function (lyr) {
    var idx_linkid = lyr.fields.indexOf('LINK_ID');
    var idx_name1 = lyr.fields.indexOf('NAME1');
    var idx_name2 = lyr.fields.indexOf('NAME2');
    var idx_frc = lyr.fields.indexOf('FRC');
    lyr.features.forEach(function (feat) {
        feats_cnter++;
        var geom = feat.getGeometry();
        if (gdal.wkbLineString !== geom.wkbType) {
            console.error('---- NO LINESTRING ----');
            return;
        }
        var frc = feat.fields.get(idx_frc);
        if (frc in use_frc) {
            var link_id = feat.fields.get(idx_linkid);
            var name1 = feat.fields.get(idx_name1);
            var name2 = feat.fields.get(idx_name2);
            var street_name = util.format(
                '%s %s'
                , null === name1 ? '' : name1
                , null === name2 ? '' : name2
            ).trim();
            var coords = [];
            geom.points.forEach(function (pnt) {
                coords.push([pnt.x, pnt.y]);
            });
            var link_feat = util.format(
                '{"type":"Feature","properties":{"lid":%d,"street":"%s"},"geometry":{"type":"LineString","coordinates":%s}}\n'
                , link_id
                , street_name
                , JSON.stringify(coords)
            );
            json_write_stream.write(link_feat);
            feats_processed_cnter++;
        }
    })
});

gip.close();
gip = null;

var end_time = new Date();
console.log('--------------- finished ----------------');
console.log('start:', start_time.toString());
console.log('stop :', end_time.toString());
console.log(util.format('%s gip.at features', feats_cnter));
console.log(util.format('%s features exported', feats_processed_cnter));
