const http = require('http');

http.get('http://localhost:3001/api/laporan-langsung', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            const target = json.find(r => String(r.noInternet).includes('131164139106'));
            if (target) {
                console.log('✅ Found Target in API Response:');
                console.log(JSON.stringify(target, null, 2));
            } else {
                console.log('❌ Target 131164139106 NOT FOUND in API response');
            }
        } catch (e) {
            console.error('Error parsing JSON:', e.message);
            console.log('Raw Data:', data.substring(0, 200));
        }
    });
}).on('error', (err) => {
    console.error('Error fetching API:', err.message);
});
