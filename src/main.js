import './style.css'
import {toBlobURL} from "@ffmpeg/util";
import {FFmpeg} from "@ffmpeg/ffmpeg";

const loading = document.querySelector('#loading')
const clickHereBox = document.querySelector('#click-here')
const processing = document.querySelector('#processing')
const progress = document.querySelector('#progress')
const fileInput = document.querySelector('#file-input')

export const baseUrl = "https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm";

const ffmpeg = new FFmpeg();

ffmpeg.on("log", ({message: msg}) => {
    progress.innerText = msg;
});

clickHereBox.addEventListener('click', () => {
    fileInput.click()
})

fileInput.addEventListener('change', (e) => {
    const files = e.target.files;
    if (!files || files.length !== 1) return;
    processFile(files[0])
})

async function processFile(file) {
    clickHereBox.classList.add('hidden')
    clickHereBox.classList.remove('flex')
    processing.classList.remove('hidden')

    progress.innerText = ""
    
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    await ffmpeg.writeFile(file.name, uint8Array);
    const output = `${file.name.substring(0, file.name.lastIndexOf("."))}-lq.mp3`;
    await ffmpeg.exec([
        "-i",
        `${file.name}`,
        "-map",
        "0:a:0",
        "-b:a",
        "15k",
        output,
    ]);
    const data = await ffmpeg.readFile(output);
    const atag = document.createElement("a");
    const url = URL.createObjectURL(
        new Blob([data.buffer], {type: "audio/mpeg"})
    );
    atag.target = "_blank";
    atag.href = url;
    atag.download = output;
    atag.click();

    clickHereBox.classList.remove('hidden')
    clickHereBox.classList.add('flex')
    processing.classList.add('hidden')
}

async function bootstrap() {
    await ffmpeg.load({
        coreURL: await toBlobURL(`${baseUrl}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseUrl}/ffmpeg-core.wasm`, "application/wasm"),
        workerURL: await toBlobURL(
            `${baseUrl}/ffmpeg-core.worker.js`,
            "text/javascript"
        ),
    });
    loading.classList.add('hidden')
    clickHereBox.classList.remove('hidden')
    clickHereBox.classList.add('flex')
}

bootstrap();