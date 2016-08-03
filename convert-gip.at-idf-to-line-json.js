const readline = require('readline');
const fs = require('fs');
const util = require('util');

var gip_file = process.argv[2];
var json_name = process.argv[3];
var write_flag = process.argv[4] || 'w';

var line_cnter = 0;
var features_written = 0;
var show_line_till = 0;
var lines_to_show = 10;
var is_tbl_link = false;
var is_tbl_link_coordinate = false;
var link_names = {};
var link_coords = [];
var link_id_previous = -1;
var start_time = new Date();
var json_write_stream = fs.createWriteStream(json_name, { 'flags': write_flag });

const rl = readline.createInterface({
    //use "encoding:'binary'" to get 'latin-1' characters
    //https://nodejs.org/api/buffer.html#buffer_buffers_and_character_encodings
    input: fs.createReadStream(gip_file, { encoding: 'binary' })
});

rl.on('line', (line) => {
    line_cnter++;
    if (line.startsWith('tbl;')) {
        show_line_till = line_cnter + lines_to_show;
        if ('tbl;Link' === line) { is_tbl_link = true; } else { is_tbl_link = false; }
        if ('tbl;LinkCoordinate' === line) { is_tbl_link_coordinate = true; } else { is_tbl_link_coordinate = false; }
    }
    if (show_line_till >= line_cnter) { console.log(line); }

    //get names of links
    if (is_tbl_link && line.startsWith('rec;')) {
        var tokens = line.split(';');
        var link_id = +tokens[1];
        var name1 = tokens[2].replace(/"/g, '');
        var name2 = tokens[3].replace(/"/g, '');
        link_names[link_id] = (name1 + ' ' + name2).trim();
    }

    //get geometries of links
    //TODO: latest link geom gets lost
    if (is_tbl_link_coordinate && line.startsWith('rec;')) {
        var tokens = line.split(';');
        var link_id = +tokens[1];

        if (link_id_previous !== link_id) {
            //don't write empty link at start: link_coords.length > 0
            if (link_coords.length > 0) {
                //only write features with at least 2 vertices
                if (link_coords.length > 1) {
                    var link_feat = util.format(
                        '{"type":"Feature","properties":{"lid":%d,"street":"%s"},"geometry":{"type":"LineString","coordinates":%s}}\n'
                        , link_id
                        , link_names[link_id]
                        , JSON.stringify(link_coords)
                    );
                    json_write_stream.write(link_feat);
                    features_written++;
                }
            }
            link_coords = [];
        }

        var lng = +tokens[3];
        var lat = +tokens[4];
        link_coords.push([lng, lat]);
        link_id_previous = link_id;
    }

});

rl.on('close', () => {
    var end_time = new Date();
    console.log('--------------- finished ----------------');
    console.log('start:', start_time.toString());
    console.log('stop :', end_time.toString());
    console.log(util.format('%s lines processed', line_cnter));
    console.log(util.format('%s features written', features_written));
});