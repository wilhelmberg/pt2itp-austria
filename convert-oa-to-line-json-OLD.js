const readline = require('readline');
const fs = require('fs');
const util = require('util');

var line_cnter = 0;
var line_empty_cnter = 0;
var oa_file = process.argv[2];
var json_name = process.argv[3];
var write_flag = process.argv[4] || 'a';

var json_write_stream = fs.createWriteStream(json_name, { 'flags': write_flag });

const rl = readline.createInterface({
    input: fs.createReadStream(oa_file)
});

rl.on('line', (line) => {
    line_cnter++;
    if (1 === line_cnter) { return; }
    var comman_cnt = line.match(/,/g).length || [].length;
    //console.log(comman_cnt);
    if (10 !== comman_cnt) {
        console.log('TODO: improve parsing for [,] in street names');
        return;
    }
    var tokens = line.split(',');
    var lng = tokens[0];
    var lat = tokens[1];
    var street = tokens[3];
    var housenr = tokens[2];
    if (
        '' === lng
        || '' === lat
        || '' === street
        || '' === housenr
    ) {
        //console.log(util.format('line %s: empty data', line_cnter));
        line_empty_cnter++;
        return;
    }

    //remove special characters
    street = street.replace(/"/g, '');

    var pnt = util.format(
        '{"type":"Feature","geometry":{"type":"Point","coordinates":[%s,%s]},"properties":{"street":"%s","number":"%s"}}\n'
        , lng
        , lat
        , street
        , housenr
    );
    json_write_stream.write(pnt);
});

rl.on('close', () => {
    console.log('--------------- finished ----------------');
    console.log(util.format('%s lines processed', line_cnter));
    console.log(util.format('%s lines with empty data', line_empty_cnter));
});