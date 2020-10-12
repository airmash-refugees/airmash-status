const tls = require('tls');

/**
 * HTTPS endpoints grouped by functionality
 */
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
    'ctf.herrmash.com',
    'dev.airbattle.xyz',
    'eu.airmash.online',
    'ffa.herrmash.com',
    'game.airmash.cc',
    'us.airmash.online',
  ],
  'Other services': [
    'status.airmash.online'
  ]
};

/**
 * Make TLS connection to HTTPS port
 */
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

/**
 * Checks connection result, extracts certificate expiry time and issuer
 */
async function getHttpServerStatus(server) {
  try {
    const socket = await httpsConnect(server);
    const cert = socket.getPeerCertificate();
    const valid_to = new Date(cert.valid_to);
    const issuer = cert.issuer && (cert.issuer.O || cert.issuer.CN);
    return { server, result: true, valid_to, issuer }
  }
  catch(error) {
    return { server, result: false, error };
  }
}

/**
 * Get HTTPS connectivity status for all servers
 */
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

/**
 * Pretty-printed certificate expiry durations
 */
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


module.exports = {
  getAllServerStatuses,
  getDateDiffString
}
