var Promise = require('bluebird');
const sql   = require('mssql');

const config = {
    user: 'StoryCurator',
    password: 'd5vUmAfuCace',
    server: 'prod1.mssql.digitalcontact.local\\DCL',
    database: 'DigitalContact-Content',
}

//const sqlConnection = 'mssql://StoryCurator:d5vUmAfuCace@prod1.mssql.digitalcontact.local\\DCL/DigitalContact-Content';



module.exports = {
    lookupUrl: function (url) {
        return new Promise(function (resolve) {
            getSql().then(pool => {
                return pool.request()
                    .input('Url', sql.NVarChar, url)
                    .execute('Slack_GetArticleByUrl')
            }).then(data => {
                processUrlRecordSet(data, resolve);
            }).catch(err => {
                // ... error checks 
                console.log('[1] err:' + err);
                resolve(['Sorry. A problem occured: ', err]);
            })
             
            sql.on('error', err => {
                // ... error handler 
                console.log('[2] err:' + err);
                resolve(['Sorry. A problem occured: ', err]);
            })
        });
    }
};

var pool = null;
function getSql() {
    if (pool == null) {
        pool = sql.connect(config);
        return pool;
    }
    else {
        return pool;
    }
}

function processUrlRecordSet(data, resolve) {
    var info = [];
   //console.log('recordsets[0]=' + JSON.stringify(recordsets));
   if (data.recordsets.length == 5) {
        var article = data.recordsets[0][0];
        var topics = data.recordsets[1];
        var companies = data.recordsets[2];
        var socialTags = data.recordsets[3];
        var storyCount = data.recordsets[4];
        var fields = [];

        var shortSummary = "";
        if (article.Summary != null) {
            shortSummary = article.Summary.substr(0,255) + '...';
        }

        var topicArr = [];
        topics.forEach(function(topic) {
            //topicArr.push('`' + topic.Topic + '` ' + topic.ConfidenceScore);
            var score = topic.ConfidenceScore.toFixed(3);
            topicArr.push('`' + topic.Topic + '` ' + score);
        });

        var companyArr = [];
        companies.forEach(function(company) {
            //companyArr.push('(' + company.CompanySymbol + ') ' + company.CompanyName + ': ' + company.CompanyRelevance);
            var score = company.CompanyRelevance.toFixed(3);
            companyArr.push('`(' + company.CompanySymbol + ') ' + company.CompanyName + '` ' + score);
        });


        var socialTagsArr = [];
        var zeroTagsArr = [];
        socialTags.forEach(function(socialTag) {
            if (socialTag.Importance == 0) {
                zeroTagsArr.push(socialTag.Name);
            }
            else {
                socialTagsArr.push('`' + socialTag.Name + '` ' + socialTag.Importance);
            }
        });
        
        info.push('*' + article.Title + '*');
        info.push(article.Url);
        info.push(shortSummary + "\n");

        var tags = socialTagsArr.join('    ');
        if (zeroTagsArr.length > 0) {
            tags += '\n```' + zeroTagsArr.join(', ') + '```';
        }
        
        opts = {
            "attachments": [
                {
                    "fallback": "Topics: " + topicArr.join(' | '),
                    "color": "#e6f2ff",
                    "text": "*Topics*\n" + topicArr.join('    '),
                    "mrkdwn_in": ["text", "fields"]
                },
                {
                    "fallback": "Companies: " + companyArr.join(' | '),
                    "color": "#cce5ff",
                    "text": "*Companies*\n" + companyArr.join('    '),
                    "mrkdwn_in": ["text", "fields"]
                },
                {
                    "fallback": "Tags: " + tags,
                    "color": "#b3d7ff",
                    "text": "*Tags*\n" + tags,
                    "mrkdwn_in": ["text"]
                }
            ],
            "footer": "SQL"
        };
        
        resolve(info);
    }
    else {
        info.push("Sorry. I couldn't find anything for that url :(");
        resolve(info);
    }
}