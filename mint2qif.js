#!/usr/bin/env node
var request = require('request');
var read = require('read');
var _ = require('underscore');
var fs = require('fs');
var csvtoarray = require('./csvtoarray');

function processMintCSVLine(l) {
    var args = _.map(l.split(','), function(x) { return x.replace(/\"/g,''); });
    console.dir(args);
}

var qifTemplate = _.template("!Account\nN<%= account %>\nD\nX\n^\n" +
"!Type:Bank\nD<%= datestr %>\nT<%= amount %>\nP<%= payee %>\nM<%= memo %>\nL<%= category %>\nN<%= type %>\n^\n");

console.log("Mint Login");
read({prompt:'Username: '}, function(e,username) {
    read({prompt:'Password: ', silent:true}, function(e,password) {
        read({prompt: 'Days of transactions (empty for all): '}, function(e,daysstr) {
            var days = Number(daysstr);
            var startdate = new Date();
            if(days) {
                startdate.setDate(startdate.getDate() - days);
            } else {
                startdate = new Date(0);
            }
            request({
                method: 'POST',
                url: 'https://wwws.mint.com/loginUserSubmit.xevent',
                form: {
                    username: username,
                    password: password,
                    task: 'L',
                    browser: 'Chrome',
                    browserVersion: 19,
                    os: 'Mac'
                }
            }, function(e,r,body) {
                if(e) {
                    console.log("Error logging in to mint");
                    process.exit();
                }
                request('https://wwws.mint.com/transactionDownload.event?', function(e,r,body) {
                    if(e) {
                        console.log("Error downloading mint transactions");
                        process.exit();
                    }
                    var output = "";
                    var lines = body.split('\n');
                    lines.shift(); // remove the header
                    _.each(lines, function(line) {
                        var args = csvtoarray(line, ',');
//                        console.dir(args);
                        if(args.length<7) { return; }
                        var typ, amt;
                        switch(args[4]) {
                            case "debit":
                                typ= "WITHD";
                                amt= -Number(args[3]);
                                break;
                            case "credit":
                                typ= "DEP";
                                amt = Number(args[3]);
                                break;
                            default:
                                console.log("Unhandled transaction type: " + args[4]);
                                return;
                        }

                        var transaction = {
                            date: new Date(args[0]),
                            datestr: args[0],
                            payee: args[1],
                            memo: args[2],
                            amount: amt,
                            type: typ,
                            category: args[5],
                            account: args[6]
                        };
                        if(transaction.date.getTime() < startdate.getTime()) {
                            return;
                        }
                        output+= qifTemplate(transaction);
                    });
                    fs.writeFile("output.qif", output, function(err) {
                        if(err) {
                            console.log("Could not save QIF file: " + err);
                        } else {
                            console.log("Transactions saved to output.qif");
                        }
                    });
                });

            });

        });
    });
});





