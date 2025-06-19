const { chromium } = require('playwright');
const fs = require('fs');
const { execSync } = require('child_process');

const [,, videoUrl, streamUrl] = process.argv;

if (!videoUrl || !streamUrl) {
  console.error('❌ Uso correto: node iniciar-live.js <video_url> <stream_url>');
  process.exit(1);
}

const videoFile = 'video_baixado.mp4';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🎬 Iniciando transmissão via navegador headless...');
    console.log('🌐 Acessando vídeo:', videoUrl);

    const [ download ] = await Promise.all([
      page.waitForEvent('download'),
      page.goto(videoUrl, { waitUntil: 'networkidle', timeout: 60000 })
    ]);

    await download.saveAs(videoFile);
    console.log('✅ Vídeo baixado:', videoFile);

    const comando = `ffmpeg -re -i "${videoFile}" -c:v libx264 -preset veryfast -maxrate 4000k -bufsize 8000k -pix_fmt yuv420p -g 50 -c:a aac -b:a 128k -ar 44100 -f flv "${streamUrl}"`;

    console.log('▶️ Enviando com ffmpeg...');
    execSync(comando, { stdio: 'inherit' });

  } catch (err) {
    console.error('❌ Falha durante a transmissão:', err.message);
  } finally {
    await browser.close();
    if (fs.existsSync(videoFile)) fs.unlinkSync(videoFile);
    console.log('✅ Finalizado');
  }
})();
