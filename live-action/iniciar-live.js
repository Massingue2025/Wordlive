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
  const page = await browser.newPage();

  try {
    console.log('🎬 Iniciando transmissão via navegador headless...');
    console.log('🌐 Acessando vídeo:', videoUrl);

    await page.goto('about:blank'); // iniciar com página vazia

    const videoData = await page.evaluate(async (url) => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Erro ao baixar vídeo: ' + response.status);
        const blob = await response.arrayBuffer();
        return Array.from(new Uint8Array(blob)); // serializa para Node.js
      } catch (e) {
        return { erro: e.message };
      }
    }, videoUrl);

    if (videoData.erro) {
      throw new Error(videoData.erro);
    }

    // Salvar vídeo no disco
    fs.writeFileSync(videoFile, Buffer.from(videoData));
    console.log('✅ Vídeo salvo:', videoFile);

    // Comando ffmpeg
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
