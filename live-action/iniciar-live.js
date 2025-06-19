// iniciar-live.js
const { chromium } = require('playwright');
const { execSync } = require('child_process');
const fs = require('fs');

const [,, videoUrl, streamUrl] = process.argv;

(async () => {
  if (!videoUrl || !streamUrl) {
    console.error('❌ Uso correto: node iniciar-live.js <video_url> <stream_url>');
    process.exit(1);
  }

  console.log('🎬 Iniciando transmissão via navegador headless...');
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const videoFile = 'video_baixado.mp4';

  try {
    console.log('🌐 Acessando vídeo:', videoUrl);
    const response = await page.goto(videoUrl, { waitUntil: 'networkidle' });

    if (!response.ok()) {
      throw new Error(`Erro ao acessar vídeo: ${response.status()} ${response.statusText()}`);
    }

    const buffer = await response.body();
    fs.writeFileSync(videoFile, buffer);
    console.log(`📥 Vídeo baixado como ${videoFile}`);

    // Executa o ffmpeg
    const comando = `ffmpeg -re -i "${videoFile}" -c:v libx264 -preset veryfast -maxrate 4000k -bufsize 8000k -pix_fmt yuv420p -g 50 -c:a aac -b:a 128k -ar 44100 -f flv "${streamUrl}"`;
    console.log('▶️ Executando:', comando);
    execSync(comando, { stdio: 'inherit' });

  } catch (erro) {
    console.error('❌ Falha durante a transmissão:', erro.message);
  } finally {
    await browser.close();
    if (fs.existsSync(videoFile)) fs.unlinkSync(videoFile);
    console.log('✅ Transmissão finalizada');
  }
})();
