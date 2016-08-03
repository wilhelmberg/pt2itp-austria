const fs = require('fs');
const util = require('util');
var csv = require('fast-csv');

var line_cnter = 0;
var line_empty_cnter = 0;
var oa_file = process.argv[2];
var json_name = process.argv[3];
var write_flag = process.argv[4] || 'a';

var json_write_stream = fs.createWriteStream(json_name, { 'flags': write_flag });
var csv_read_stream = fs.createReadStream(oa_file);

var csv_stream = csv({
    headers: true,
    quote: '"',
    escape: '"'
})
    .on('data', function (data) {
        line_cnter++;
        if (line_cnter < 5) { console.log(line_cnter, data); }
        if (
            '' === data.LON
            || '' === data.LAT
            || '' === data.STREET
            || '' === data.NUMBER
        ) {
            line_empty_cnter++;
            return;
        }
        var lng = +data.LON;
        var lat = +data.LAT;
        var street = data.STREET.replace(/"/g, '');
        var pnt = util.format(
            '{"type":"Feature","geometry":{"type":"Point","coordinates":[%s,%s]},"properties":{"street":"%s","number":"%s"}}\n'
            , lng
            , lat
            , street
            , data.NUMBER
        );
        json_write_stream.write(pnt);
    })
    .on('end', function () {
        console.log('\n\n--------------- finished ----------------');
        console.log(util.format('%s lines processed', line_cnter));
        console.log(util.format('%s lines with empty data', line_empty_cnter));
    });

csv_read_stream.pipe(csv_stream);
