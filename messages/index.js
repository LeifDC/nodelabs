"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");

var useEmulator = (process.env.NODE_ENV == 'development');

var Store = require('./store');

// Create connector and listen for messages
var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

var bot = new builder.UniversalBot(connector, function (session) {
    session.send('Sorry, I did not understand. Type \'help\' if you need assistance.');
});

if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());    
} else {
    module.exports = { default: connector.listen() }
}

var model = 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/28c9dce1-9bb9-4f3c-8fc5-63a33ff00938?subscription-key=bb704119e2874d68885155a582262ec0&timezoneOffset=0.0&verbose=true&q=';
var recognizer = new builder.LuisRecognizer(model);
bot.recognizer(recognizer);

bot.dialog('LookupUrl', [
    function (session, args, next) {
        //session.send('Welcome to the Url Explorer! We are analyzing your message: \'%s\'', session.message.text);

        // try extracting entities
        var url = builder.EntityRecognizer.findEntity(args.intent.entities, 'builtin.url');
        if (url) {
            // url entity detected, continue to next step
            session.dialogData.url = 'url';
            next({ response: url.entity });
        } else {
        	//console.log(args.intent.entities)
            // no entities detected, ask user for a destination
            builder.Prompts.text(session, 'Please provide a url');
        }
    },
    function (session, results) {
        var url = results.response;

        Store.lookupUrl(url)
            .then(function (data) {
		        session.send(data.join('\n'));
		        session.endDialog();
            });
    }
]).triggerAction({
    matches: 'LookupUrl',
    onInterrupted: function (session) {
        session.send('Um. Please provide a url');
    }
});

bot.dialog('Help', function (session) {
    session.endDialog('Hi! Try asking things like \'lookup [url]\' or \'What do we have for [ur]\'.');
}).triggerAction({
    matches: 'Help'
});