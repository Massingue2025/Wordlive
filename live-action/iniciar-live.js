const { chromium } = require('playwright');
const { execSync } = require('child_process');

const [,, inputUrl, streamUrl] = process.argv;

if (!inputUrl || !streamUrl) {
  console.error('❌ Uso: node iniciar-live.js <video_url> <stream_url>');
  process.exit(1);
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log('🌐 Acessando URL...');
    await page.goto(inputUrl, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForLoadState('networkidle');
    const finalUrl = page.url();

    console.log('✅ Redirecionado para:', finalUrl);

    // Tenta acessar diretamente o conteúdo
    const response = await page.goto(finalUrl, { timeout: 20000 });
    const contentType = response.headers()['content-type'];

    if (!contentType || !contentType.includes('video')) {
      throw new Error(`❌ Conteúdo inválido. Tipo: ${contentType}`);
    }

    await browser.close();

    const cmd = `ffmpeg -re -i "${finalUrl}" -c:v libx264 -preset veryfast -maxrate 4000k -bufsize 8000k -pix_fmt yuv420p -g 50 -c:a aac -b:a 128k -ar 44100 -f flv "${streamUrl}"`;

    console.log('▶️ Executando:', cmd);
    execSync(cmd, { stdio: 'inherit' });

    console.log('✅ Live finalizada com sucesso.');
  } catch (err) {
    console.error('❌ Erro ao iniciar live:', err.message);
    await browser.close();
    process.exit(1);
  }
})();
