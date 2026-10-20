const fs = require('fs');

const babelCode = fs.readFileSync('e:/personal/Vibecoding/Trae项目/WheatSpace2.0/babel.js', 'utf8');
const script = new (require('vm').Script)(babelCode);
const sandbox = { console, process };
script.runInNewContext(sandbox);

const content = fs.readFileSync('e:/personal/Vibecoding/Trae项目/WheatSpace2.0/other/index.html', 'utf8');
const start = content.indexOf('<script type="text/babel">');
const end = content.lastIndexOf('</script>');
const code = content.substring(start + 26, end);

try {
    sandbox.Babel.transform(code, { presets: ['react'] });
    console.log('Syntax OK');
} catch (e) {
    console.error(e.message);
}