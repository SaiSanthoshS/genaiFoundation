const fs = require('fs');
['app.js', 'server.js'].forEach(file => {
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace(/\\\`/g, '`').replace(/\\\$/g, '$');
  fs.writeFileSync(file, c);
});
