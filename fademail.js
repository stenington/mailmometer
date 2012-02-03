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
      gatherOpts(program);
    });
  }
  else if (!program.pass) {
    program.password("Password: ", '*', function(password){
      program.pass = password;
      gatherOpts(program);
    });
  }
  else {
    callback(program);
  }
}

function run(opts) {
  var imap = new ImapConnection({
    username: opts.user,
    password: opts.pass,
    host: 'imap.gmail.com',
    port: 993,
    secure: true
  });

  var next = 0;
  var cmds;
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
      console.log(box.messages.total + " messages in your inbox!");
      imap.search([ 'ALL' ], doNext); 
    },
    function(ids) { 
      var fetch = imap.fetch(ids, { request: { headers: ['from', 'to', 'subject', 'date'] } });
      fetch.on('message', function(msg) {
        msg.on('data', function(chunk) {
          console.log('Got message chunk of size ' + chunk.length);
        });
        msg.on('end', function() {
          var from = /"?(.+?)($|"|\s*<)/.exec(msg.headers.from[0])[1];
          if (from.length > 30) {
            from = from.slice(0, 28) + '\u2026';
          }
          else {
            from = from + new Array(30 - from.length).join(' ');
          }
          var subj = msg.headers.subject[0]; 
          console.log(from + '    ' + subj);
        });
      });
      fetch.on('end', function() {
        imap.logout();
      });
    }
  ];

  doNext();
}

gatherOpts(program, run);
