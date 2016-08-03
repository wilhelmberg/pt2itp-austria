const readline = require('readline');
const fs = require('fs');
const util = require('util');

var line_cnter = 0;
var json_name = process.argv[2];
var line_idx = +process.argv[3] || 1;
const rl = readline.createInterface({
    input: fs.createReadStream(json_name)
});

rl.on('line', (line) => {
    line_cnter++;
    if (line_idx !== line_cnter) { return; }
    console.log(util.format('current line:%s line to check:%s', line_cnter, line_idx));
    console.log(line);
});

rl.on('close', () => {
    console.log('--------------- finished ----------------');
    console.log(util.format('%s lines processed', line_cnter));
});
