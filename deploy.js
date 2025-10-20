const https = require('https');

// Script para fazer deploy manual no Netlify
// Para usar: node deploy.js

console.log('🚀 Iniciando deploy manual no Netlify...');

// Você precisa substituir esta URL pelo seu Build Hook do Netlify
// Para obter: Netlify Dashboard > Site Settings > Build & deploy > Build hooks > Add build hook
const BUILD_HOOK_URL = 'SEU_BUILD_HOOK_AQUI';

if (BUILD_HOOK_URL === 'SEU_BUILD_HOOK_AQUI') {
    console.log('❌ Erro: Você precisa configurar o BUILD_HOOK_URL no arquivo deploy.js');
    console.log('📋 Passos para configurar:');
    console.log('1. Acesse o painel do Netlify');
    console.log('2. Vá em Site Settings > Build & deploy > Build hooks');
    console.log('3. Clique em "Add build hook"');
    console.log('4. Dê um nome (ex: "Manual Deploy")');
    console.log('5. Selecione a branch "main"');
    console.log('6. Copie a URL gerada e substitua no arquivo deploy.js');
    process.exit(1);
}

const url = new URL(BUILD_HOOK_URL);

const postData = JSON.stringify({
    trigger_title: `Deploy manual - ${new Date().toLocaleString('pt-BR')}`
});

const options = {
    hostname: url.hostname,
    port: 443,
    path: url.pathname,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

const req = https.request(options, (res) => {
    console.log(`✅ Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        if (res.statusCode === 200) {
            console.log('🎉 Deploy iniciado com sucesso!');
            console.log('⏳ Aguarde alguns minutos para o deploy ser concluído');
            console.log('🌐 Verifique o status em: https://app.netlify.com/sites/lucianomartelinho/deploys');
        } else {
            console.log('❌ Erro no deploy:', data);
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Erro na requisição:', error);
});

req.write(postData);
req.end();