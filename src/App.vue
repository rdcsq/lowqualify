<script setup lang="ts">
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";
import { useDropZone } from "@vueuse/core";
import { onMounted, ref } from "vue";
import { baseUrl } from "./consts";

const dropzoneRef = ref<HTMLDivElement>();
const inputRef = ref<HTMLInputElement>();
const ffmpegRef = ref<FFmpeg | null>(null);
const loading = ref<boolean>(false);

const { isOverDropZone } = useDropZone(dropzoneRef, {
  onDrop,
  dataTypes: [
    "audio/aac",
    "audio/mpeg",
    "audio/ogg",
    "audio/wav",
    "audio/flac",
    "audio/mp4",
  ],
  multiple: false,
  preventDefaultForUnhandled: false,
});

async function onDrop(files: File[] | null) {
  if (!files || files.length != 1 || !ffmpegRef.value) return;
  loading.value = true;
  const [file] = files;
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  await ffmpegRef.value.writeFile(file.name, uint8Array);
  const output = `${file.name.substring(0, file.name.lastIndexOf("."))}-lq.mp3`;
  await ffmpegRef.value.exec([
    "-i",
    `${file.name}`,
    "-map",
    "0:a:0",
    "-b:a",
    "15k",
    output,
  ]);
  const data = await ffmpegRef.value?.readFile(output);
  const atag = document.createElement("a");
  const url = URL.createObjectURL(
    new Blob([(data as Uint8Array).buffer], { type: "audio/mpeg" })
  );
  atag.target = "_blank";
  atag.href = url;
  atag.download = output;
  atag.click();
  loading.value = false;
}

function onSelect(event: Event) {
  const files = (event.target as HTMLInputElement).files;
  if (!files || files.length != 1) return;
  onDrop([files[0]]);
}

onMounted(async () => {
  const ffmpeg = new FFmpeg();
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseUrl}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseUrl}/ffmpeg-core.wasm`, "application/wasm"),
    workerURL: await toBlobURL(
      `${baseUrl}/ffmpeg-core.worker.js`,
      "text/javascript"
    ),
  });

  ffmpeg.on("log", ({ message: msg }: { message: string }) => {
    console.log(msg);
  });
  ffmpegRef.value = ffmpeg;
});
</script>

<template>
  <main
    class="w-svw h-svh flex items-center justify-center bg-zinc-900 text-white"
    ref="dropzoneRef"
    @click="inputRef?.click()"
  >
    <p v-if="ffmpegRef === null">Loading...</p>
    <div
      :class="[
        'max-w-sm w-full p-8 border-2 bg-white/10 rounded-2xl flex flex-col items-center text-center',
        isOverDropZone ? 'border-green-500' : 'border-transparent',
      ]"
      v-else-if="!loading"
    >
      Click here to select a file, or drop a file here.
    </div>
    <p v-else>Generating...</p>
    <input ref="inputRef" type="file" hidden @change="onSelect" />
  </main>
</template>
