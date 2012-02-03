#!/usr/bin/env node

var util = require('util');
var ImapConnection = require('imap').ImapConnection;
var color = require('cli-color');
var program = require('commander');

program
  .version('0.0.1')
  .option('-u, --user [username]', 'Username (email address)')
  .option('-p, --pass [password]', 'Password')
  .option('-c, --color', 'Colorize output')
  .parse(process.argv);

gatherOpts(program, run);

/*----------------------------*/

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

function run(opts) {
  var imap = new ImapConnection({
    username: opts.user,
    password: opts.pass,
    host: 'imap.gmail.com',
    port: 993,
    secure: true
  });

  var startDate = new Date() - (30 * 24 * 60 * 60 * 1000);
  var next = 0;
  var cmds, msgs = [];
  
  /* doNext is a callback used to iterate through the functions in 
    the cmds array. It expects any error as its first parameter (null
    if none), and will pass further parameters to the next cmd.*/
  var doNext = function doNext(err) {
    if (err) {
      console.log('Error in command[' + next + ']: ' + err);
      process.exit(1);
    }
    else if (next < cmds.length) {
      cmds[next++].apply(this, Array.prototype.slice.call(arguments).slice(1));
    }
  };

  /* These functions will get executed sequentially through repeated 
    calls to doNext, which handles errors but passes further parameters 
    on to these cmds. */
  cmds = [
    function() { imap.connect(doNext); },

    function() { imap.openBox('INBOX', true, doNext); },

    function(box) { 
      imap.search([['OR', ['SINCE', startDate], ['FLAGGED'] ]], doNext); 
    },

    function(ids) { 
      var fetch = imap.fetch(ids, { request: { headers: ['from', 'to', 'subject', 'date'] } });
      fetch.on('message', function(msg) {
        msg.on('end', function() {
          msgs.push(createMessage(msg, { color: program.color }));
          //console.log(util.inspect(msg, true, null, true));
        });
      });
      fetch.on('end', function() {
        imap.logout(doNext);
      });
    },

    function() {
      console.log(msgs.length + " messages!");
      msgs.sort(function(a, b){
        return a.temperature() - b.temperature();
      });
      msgs.forEach(function(msg){ msg.print(); });
    }
  ];

  doNext();
}

function createMessage(msg, opts){
  var options = opts || {}; 
  var sent = new Date(msg.headers.date[0]);
  var sign = -1;
  if( msg.flags.indexOf('\\Flagged') != -1 ){
    sign = 1;
  }
  var max = 30 * 24 * 60 * 60 * 1000;

  var that = {};

  that.from = /"?(.+?)($|"|\s*<)/.exec(msg.headers.from[0])[1];
  that.subject = msg.headers.subject[0]; 

  that.temperature = function(){ 
    return sign * (new Date() - sent); 
  };

  that.temperaturePercent = function(){ 
    return Math.abs(this.temperature())/max; 
  };

  that.colorize = function(s){
    if( sign == 1 ){
      if( this.temperaturePercent() >= 0.9 ){
        return color.bold.red(s);
      }
      else {
        return color.red(s);
      }
    }
    else if( sign == -1 ){
      if( this.temperaturePercent() >= 0.9 ){
        return color.cyan(s);
      }
      else {
        return color.blue(s);
      }
    }
  }

  that.print = function(){
    var line = columnize(this.temperaturePercent(), 15, 4) + columnize(this.from, 30, 4) + this.subject;
    if( options.color ){
      line = this.colorize(line);
    }
    console.log(line);
  };

  return that;
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
