#!/usr/bin/env node

var util = require('util');
var ImapConnection = require('imap').ImapConnection;
var program = require('commander');

program
  .version('0.0.1')
  .option('-u, --user [username]', 'Username (email address)')
  .option('-p, --pass [password]', 'Password')
  .parse(process.argv);

function gatherOpts(program, callback){
  if (!program.user) {
    program.prompt("Username: ", function(username){
      program.user = username;
      gatherOpts(program, callback);
    });
  }
  else if (!program.pass) {
    program.password("Password: ", '*', function(password){
      program.pass = password;
      gatherOpts(program, callback);
    });
  }
  else {
    process.stdin.destroy();
    callback(program);
  }
}

function columnize(s, width, padding){
  s = s.toString();
  if (s.length > width) {
    s = s.slice(0, width-1) + '\u2026';
  }
  else {
    s = s + new Array(width + 1 - s.length).join(' ');
  }
  return s + new Array(padding + 1).join(' ');
}

function run(opts) {
  var imap = new ImapConnection({
    username: opts.user,
    password: opts.pass,
    host: 'imap.gmail.com',
    port: 993,
    secure: true
  });

  var now = new Date()
  var startDate = now - (30 * 24 * 60 * 60 * 1000);
  var maxTemp = now - startDate; 
  var next = 0;
  var cmds, msgs = [];
  
  var doNext = function doNext(err) {
    if (err) {
      console.log('Error in command[' + next + ']: ' + err);
      process.exit(1);
    }
    else if (next < cmds.length) {
      cmds[next++].apply(this, Array.prototype.slice.call(arguments).slice(1));
    }
  };

  cmds = [
    function() { imap.connect(doNext); },

    function() { imap.openBox('INBOX', true, doNext); },

    function(box) { 
      imap.search([['OR', ['SINCE', startDate], ['FLAGGED'] ]], doNext); 
    },

    function(ids) { 
      console.log(ids.length + " messages!");
      var fetch = imap.fetch(ids, { request: { headers: ['from', 'to', 'subject', 'date'] } });
      fetch.on('message', function(msg) {
        msg.on('end', function() {
          msgs.push(msg);
          var sent = new Date(msg.headers.date[0]);
          var now = new Date();
          var sign = -1;
          if( msg.flags.indexOf('\\Flagged') != -1 ){
            sign = 1;
          }
          msg.temperature = sign * (now - sent);
          console.log(util.inspect(msg, true, null, true));
        });
      });
      fetch.on('end', function() {
        msgs.sort(function(a, b){
          return a.temperature - b.temperature;
        });
        for(var i=0; i<msgs.length; i++){
          var msg = msgs[i];
          var from = /"?(.+?)($|"|\s*<)/.exec(msg.headers.from[0])[1];
          var subj = msg.headers.subject[0]; 
          var howExtreme = Math.abs(msg.temperature)/maxTemp;
          console.log(columnize(howExtreme, 15, 4) + columnize(from, 30, 4) + subj);
        }
        imap.logout();
      });
    }
  ];

  doNext();
}

gatherOpts(program, run);
