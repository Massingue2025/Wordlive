const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log('🌐 Acessando página protegida...');
    await page.goto('https://livestream.ct.ws/M/data.php', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForLoadState('networkidle');
    const finalUrl = page.url();
    console.log('✅ Redirecionado para:', finalUrl);

    const agora = new Date(new Date().getTime() + 2 * 60 * 60 * 1000);
    const tempoMaputo = agora.toISOString().split('.')[0];

    const resposta = await page.evaluate(async (tempo) => {
      try {
        const res = await fetch('https://livestream.ct.ws/M/data.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'tempo=' + encodeURIComponent(tempo)
        });
        return await res.text();
      } catch (e) {
        return 'Erro ao enviar: ' + e.message;
      }
    }, tempoMaputo);

    console.log('📤 Tempo enviado:', tempoMaputo);
    console.log('📦 Resposta:\n', resposta);

    fs.writeFileSync('resultado.log', `[${new Date().toISOString()}] Tempo: ${tempoMaputo}\nResposta: ${resposta}\n\n`);
  } catch (err) {
    console.error('❌ Erro geral:', err);
    fs.writeFileSync('erro.log', `[${new Date().toISOString()}] Erro: ${err.message}\n\n`);
  }

  await browser.close();
})();
