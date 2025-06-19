const { chromium } = require('playwright');
const { execSync } = require('child_process');

const [,, inputUrlRaw, streamUrlRaw] = process.argv;

const inputUrl = inputUrlRaw.trim();
const streamUrl = streamUrlRaw.trim();

if (!inputUrl || !streamUrl) {
  console.error('❌ Uso: node iniciar-live.js <video_url> <stream_url>');
  process.exit(1);
}

(async () => {
  console.log('🌐 Acessando URL...');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Acessar a URL original
    await page.goto(inputUrl, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForLoadState('networkidle');
    const finalUrl = page.url().trim();
    console.log('✅ Redirecionado para:', finalUrl);

    // Verificar tipo de conteúdo
    const response = await page.goto(finalUrl, { timeout: 20000 });
    const contentType = response.headers()['content-type'];

    if (!contentType || !contentType.includes('video')) {
      throw new Error(`❌ Conteúdo inválido ou não é vídeo. Tipo recebido: ${contentType}`);
    }

    await browser.close();

    console.log('📁 Vídeo:', finalUrl);
    console.log('🌐 Stream URL:', streamUrl);

    const comando = `ffmpeg -re -i "${finalUrl}" -c:v libx264 -preset veryfast -maxrate 4000k -bufsize 8000k -pix_fmt yuv420p -g 50 -c:a aac -b:a 128k -ar 44100 -f flv "${streamUrl}"`;

    console.log('▶️ Executando:', comando);
    execSync(comando, { stdio: 'inherit' });

    console.log('✅ Live finalizada com sucesso.');
  } catch (err) {
    console.error('❌ Erro ao iniciar live:', err.message);
    await browser.close();
    process.exit(1);
  }
})();
