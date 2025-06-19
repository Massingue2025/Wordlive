const { exec } = require("child_process");

const videoPath = process.argv[2];
const streamUrl = process.argv[3];

if (!videoPath || !streamUrl) {
  console.error("⚠️ Erro: Caminho do vídeo e URL do stream são obrigatórios.");
  process.exit(1);
}

console.log(`🎬 Iniciando transmissão...`);
console.log(`📁 Vídeo: ${videoPath}`);
console.log(`🌐 URL: ${streamUrl}`);

// Comando FFmpeg para transmitir ao Facebook
const ffmpegCommand = `ffmpeg -re -i "${videoPath}" -c:v libx264 -preset veryfast -maxrate 4000k -bufsize 8000k -pix_fmt yuv420p -g 50 -c:a aac -b:a 128k -ar 44100 -f flv "${streamUrl}"`;

console.log(`▶️ Executando: ${ffmpegCommand}`);

const processo = exec(ffmpegCommand);

processo.stdout.on("data", data => {
  console.log(`STDOUT: ${data}`);
});

processo.stderr.on("data", data => {
  console.error(`FFMPEG: ${data}`);
});

processo.on("exit", code => {
  console.log(`✅ Finalizado com código: ${code}`);
});
