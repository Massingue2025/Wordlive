const https = require('https');
const fs = require('fs');
const { execSync } = require('child_process');

const [,, videoUrl, streamUrl] = process.argv;

if (!videoUrl || !streamUrl) {
  console.error('❌ Uso correto: node iniciar-live.js <video_url> <stream_url>');
  process.exit(1);
}

const videoFile = 'video_baixado.mp4';

function baixarVideo(url, destino) {
  return new Promise((resolve, reject) => {
    console.log('📥 Baixando vídeo:', url);
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Erro ao baixar: Código ${res.statusCode}`));
      }

      const fileStream = fs.createWriteStream(destino);
      res.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close(resolve);
      });

    }).on('error', reject);
  });
}

async function iniciarLive() {
  try {
    await baixarVideo(videoUrl, videoFile);

    const comando = `ffmpeg -re -i "${videoFile}" -c:v libx264 -preset veryfast -maxrate 4000k -bufsize 8000k -pix_fmt yuv420p -g 50 -c:a aac -b:a 128k -ar 44100 -f flv "${streamUrl}"`;

    console.log('▶️ Transmitindo com ffmpeg...');
    execSync(comando, { stdio: 'inherit' });

  } catch (e) {
    console.error('❌ Erro:', e.message);
  } finally {
    if (fs.existsSync(videoFile)) fs.unlinkSync(videoFile);
    console.log('✅ Finalizado');
  }
}

iniciarLive();
