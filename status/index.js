const httpsConnectivity = require('../shared/httpsConnectivity');

function getBootstrapHtml() {
  return '<meta charset="utf-8"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap.min.css" integrity="sha384-HSMxcRTRxnN+Bdg0JdbxYKrThecOKuH5zCYotlSAcp1+c8xmyTe9GYg1l9a69psu" crossorigin="anonymous"><link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap-theme.min.css" integrity="sha384-6pzBo3FDv/PJ8r2KRkGHifhEocL+1X2rVCTTkUfGk7/0pbek5mMa1upzvWbrUbOZ" crossorigin="anonymous"><script src="https://stackpath.bootstrapcdn.com/bootstrap/3.4.1/js/bootstrap.min.js" integrity="sha384-aJ21OjlMXNL5UyIl/XNwTMqvzeRMZH2w8c5cRVpzpU8Y5bApTppSuUkhZXN0VxHd" crossorigin="anonymous"></script>';
}

module.exports = async function (context, req) {
  context.log('Status endpoint function started');

  let html = `<!doctype html><html lang="en"><head>${getBootstrapHtml()}</head><body><div class="container">`;
  html += '<div class="page-header"><h2>Airmash status</h2></div>'

  html += `<br><h3>HTTPS connectivity</h3><br>`;

  const statuses = await httpsConnectivity.getAllServerStatuses();
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
          html += `<td>Certificate expires in <b>${httpsConnectivity.getDateDiffString(datediff)}</b> (${valid_to.toISOString().slice(0,19).replace('T', ' ')})`;
          if (server.status.issuer) {
            html += `, issued by <i>${server.status.issuer}</i>`;
          }
          html += '</td>';
        }
        else {
          html += `<td>Certificate expired at ${valid_to.toISOString().slice(0,19).replace('T', ' ')}</td>`;
        }
      }
      else {
        html += `<td>❌</td>`;
        html += `<td><font color="red">${server.status && server.status.error}</font></td>`;
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

  context.log('Status endpoint function complete');
}
