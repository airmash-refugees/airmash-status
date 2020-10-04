const httpsConnectivity = require('../shared/httpsConnectivity');

module.exports = async function (context, myTimer) {
	context.log('Weekly status check function started');

  let summaryResult = '✔️';
	let html = '';

	const statuses = await httpsConnectivity.getAllServerStatuses();
	statuses.forEach(category => {
	  html += `<h3>${category.name}</h3>`;
    html += '<table style="width: 800px; border-collapse: collapse; text-align: left; border: 1px solid lightgrey"><thead><tr><th style="width: 200px; border: 1px solid lightgrey">Server</th><th style="width: 75px; border: 1px solid lightgrey">Status</th><th style="border: 1px solid lightgrey">Detail</th></tr></thead><tbody>';
  
	  category.servers.forEach(server => {
		html += `<tr><td><a style="color: black; text-decoration: none">${server.name}</a></td>`;
		if (server.status && server.status.result) {
		  const valid_to = server.status.valid_to;
		  const datediff = valid_to - Date.now();
		  if (datediff > 1209600000) { /* more than 14 days */
			  html += `<td>✔️</td>`;
		  }
		  else if (datediff > 86400000) { /* more than a day */
        html += `<td>⚠️</td>`;
        if (summaryResult != '❌') {
          summaryResult = '⚠️';
        }
		  }
		  else if (datediff > 0) { /* less than a day */
        html += `<td>❌</td>`;
        summaryResult = '❌';
		  }
		  else { /* expired */
        html += `<td>❌</td>`;
        summaryResult = '❌';
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
      summaryResult = '❌';
		}
		html += '</tr>'
	  });
	  
	  html += '</tbody></table></div>';
	});
  
	html += '</div></body></html>';  

  context.log(`Summary result: ${summaryResult}`);

	context.bindings.message = {
		from: { 
			name: 'Airmash Status', 
			email: 'status@airmash.online' 
		},
		subject: `${summaryResult} Weekly status check (${(new Date()).toISOString().slice(0,10)})`,
		content: [{
			type: 'text/html',
			value: html
		}]
	};

	context.log('Weekly status check function complete');
};