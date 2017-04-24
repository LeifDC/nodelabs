var builder = require('botbuilder');

// Create bot and bind to console
var connector = new builder.ConsoleConnector().listen();
var bot = new builder.UniversalBot(connector);

// Create LUIS recognizer that points at our model and add it as the root '/' dialog for our Cortana Bot.
var model = 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/28c9dce1-9bb9-4f3c-8fc5-63a33ff00938?subscription-key=bb704119e2874d68885155a582262ec0&timezoneOffset=0.0&verbose=true&q=';
var recognizer = new builder.LuisRecognizer(model);
var dialog = new builder.IntentDialog({ recognizers: [recognizer] });
bot.dialog('/', dialog);

// Add intent handlers
dialog.matches(/^lookup/, builder.DialogAction.send('Looking up url...'));
dialog.onDefault(builder.DialogAction.send("I'm sorry I didn't understand."));