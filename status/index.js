const tls = require('tls');

async function httpsConnect(server) {
  return new Promise(function(resolve, reject) {
    const socket = tls.connect(443, server, { servername: server }, () => {
      resolve(socket);
    });
    socket.setTimeout(2500);
    socket.on('error', reject);
    socket.on('timeout', function() { socket.destroy(); reject('Connection timed out')});
  });
}

async function getHttpServerStatus(server) {
  try {
    const socket = await httpsConnect(server);
    const cert = socket.getPeerCertificate();
    const valid_to = new Date(cert.valid_to);
    return { server, result: true, valid_to }
  }
  catch(error) {
    return { server, result: false, error };
  }
}

const serverCategories = {
  'Frontends': [
    'airmash.online',
    'starma.sh',
    'starmash.test.airmash.online',
    'spatiebot.github.io',
    'new.airmash.online',
    'test.airmash.online',
  ],
  'Backend services': [
    'data.airmash.online',
    'login.airmash.online',
  ],
  'Game servers': [
    'eu.airmash.online',
    'dev.airbattle.xyz',
    'game.airmash.cc',
    'us.airmash.online',
  ],
  'Other services': [
    'status.airmash.online'
  ]
};

async function getAllServerStatuses() {  
  let results = [];
  let promises = [];
  Object.keys(serverCategories).forEach(categoryName => {
    let category = { name: categoryName, servers: [] };
    results.push(category);

    serverCategories[categoryName].forEach(serverName => {
      let server = { name: serverName };
      category.servers.push(server);

      let promise = getHttpServerStatus(serverName);
      promise.server = server;

      promises.push(promise);
    });
  });

  const statuses = await Promise.all(promises);

  for (i = 0; i < promises.length; i++) {
    promises[i].server.status = statuses[i];
  }

  return results;
}

function getBootstrapHtml() {
  return '<meta charset="utf-8"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap.min.css" integrity="sha384-HSMxcRTRxnN+Bdg0JdbxYKrThecOKuH5zCYotlSAcp1+c8xmyTe9GYg1l9a69psu" crossorigin="anonymous"><link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap-theme.min.css" integrity="sha384-6pzBo3FDv/PJ8r2KRkGHifhEocL+1X2rVCTTkUfGk7/0pbek5mMa1upzvWbrUbOZ" crossorigin="anonymous"><script src="https://stackpath.bootstrapcdn.com/bootstrap/3.4.1/js/bootstrap.min.js" integrity="sha384-aJ21OjlMXNL5UyIl/XNwTMqvzeRMZH2w8c5cRVpzpU8Y5bApTppSuUkhZXN0VxHd" crossorigin="anonymous"></script>';
}

function getDateDiffString(datediff) {
  if (datediff >= 172800000) {
    return `${Math.floor(datediff / 86400000)} days`;
  }
  else if (datediff >= 86400000) {
    return '1 day';
  }
  else if (datediff >= 7200000) {
    return `${Math.floor(datediff / 3600000)} hours`;
  }
  else if (datediff >= 3600000) {
    return '1 hour';
  }
  else {
    return 'less than an hour';
  }
}

module.exports = async function (context, req) {
  context.log('Status function started');

  let html = `<!doctype html><html lang="en"><head>${getBootstrapHtml()}</head><body><div class="container">`;
  html += '<div class="page-header"><h2>Airmash status</h2></div>'

  html += `<br><h3>HTTPS connectivity</h3><br>`;

  const statuses = await getAllServerStatuses();
  statuses.forEach(category => {
    html += `<h4>${category.name}</h4>`;
    html += '<div class="table-responsive"><table class="table"><thead><tr><th class="col-xs-3">Server</th><th class="col-xs-1">Status</th><th>Detail</th></tr></thead><tbody>';

    category.servers.forEach(server => {
      html += `<tr><td>${server.name}</td>`;
      if (server.status && server.status.result) {
        const valid_to = server.status.valid_to;
        const datediff = valid_to - Date.now();
        if (datediff > 1209600000) { /* more than 14 days */
          html += `<td>✔️</td>`;
        }
        else if (datediff > 86400000) { /* more than a day */
          html += `<td>⚠️</td>`;
        }
        else if (datediff > 0) { /* less than a day */
          html += `<td>❌</td>`;
        }
        else { /* expired */
          html += `<td>❌</td>`;
        }

        if (datediff > 0) {
          html += `<td>Certificate expires in ${getDateDiffString(datediff)} (${valid_to.toISOString().slice(0,19).replace('T', ' ')})</td>`;
        }
        else {
          html += `<td>Certificate expired at ${valid_to.toISOString().slice(0,19).replace('T', ' ')}</td>`;
        }
      }
      else {
        html += `<td>❌</td>`;
        html += `<td>${server.status && server.status.error}</td>`;
      }
      html += '</tr>'
    });
    
    html += '</tbody></table></div>';
  });

  html += '</div></body></html>';

  context.res = {
    body: html,
    headers: {
      'Content-Type': 'text/html'
    }
  };

  context.log('Status function complete');
}
