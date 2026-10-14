<script setup lang="ts">
import { computed } from "vue";
import { qrArtSvg } from "../lib/qrArt";

/* Renders one Pi-styled QR symbol (SVG generated locally from the table URL,
   never fetched). The π badge is drawn inside the symbol, in the cut-out the
   encoder leaves at error-correction level H. */

const props = withDefaults(
  defineProps<{
    text: string;
    /** Accessible description of where the symbol leads. */
    label?: string;
    /** Print variant: solid ink modules and a light-on-dark badge. */
    flat?: boolean;
  }>(),
  { label: "", flat: false },
);

const svg = computed(() =>
  qrArtSvg(
    props.flat
      ? {
          text: props.text,
          ink: "#10161B",
          accent: "#10161B",
          logoBg: "#10161B",
          logoFg: "#FFFFFF",
        }
      : { text: props.text },
  ),
);
</script>

<template>
  <div
    class="qr-code"
    role="img"
    :aria-label="label || `رمز QR: ${text}`"
    v-html="svg"
  ></div>
</template>
