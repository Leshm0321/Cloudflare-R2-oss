<script setup>
defineProps({
  contentType: {
    type: String,
    default: "",
  },
  thumbnail: {
    type: String,
    default: "",
  },
  size: {
    type: Number,
    default: 32,
  },
});

function getFileCategory(contentType) {
  if (!contentType) return 'file';
  
  const type = contentType.toLowerCase();
  
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';
  if (type === 'application/pdf') return 'pdf';
  if (['application/zip', 'application/x-zip-compressed', 'application/gzip', 'application/x-rar', 'application/vnd.rar', 'application/x-7z-compressed'].includes(type)) return 'archive';
  if (type.startsWith('text/')) return 'text';
  if (['application/javascript', 'application/json', 'application/xml', 'application/xhtml+xml'].includes(type)) return 'code';
  if (['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(type)) return 'word';
  if (['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(type)) return 'excel';
  if (['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'].includes(type)) return 'ppt';
  if (type.includes('spreadsheet') || type.includes('excel')) return 'excel';
  if (type.includes('document') || type.includes('word')) return 'word';
  if (type.includes('presentation') || type.includes('powerpoint')) return 'ppt';
  
  return 'file';
}
</script>

<template>
  <div class="file-icon">
    <img
      v-if="thumbnail"
      :src="thumbnail"
      :width="size"
      :height="size"
      alt="Image thumbnail"
      loading="lazy"
      class="thumbnail-img"
    />
    <svg
      v-else
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      :width="size"
      :height="size"
      :class="'icon-' + getFileCategory(contentType)"
    >
      <!-- Folder Icon -->
      <template v-if="getFileCategory(contentType) === 'folder'">
        <path fill="#FFA726" d="M40 12H22l-4-4H8c-2.2 0-4 1.8-4 4v24c0 2.2 1.8 4 4 4h32c2.2 0 4-1.8 4-4V16c0-2.2-1.8-4-4-4z"/>
        <path fill="#FFB74D" d="M38 14H20l-2-2H8c-1.1 0-2 .9-2 2v24c0 1.1.9 2 2 2h32c1.1 0 2-.9 2-2V16c0-1.1-.9-2-2-2z"/>
      </template>

      <!-- Image Icon -->
      <template v-else-if="getFileCategory(contentType) === 'image'">
        <rect fill="#42A5F5" x="6" y="10" width="36" height="28" rx="3"/>
        <circle fill="#FFF59D" cx="16" cy="18" r="4"/>
        <path fill="#81C784" d="M42 32l-10-10-18 18V38h28V32z"/>
        <path fill="#A5D6A7" d="M42 32l-6-6-4 4 10 10V32z"/>
      </template>

      <!-- Video Icon -->
      <template v-else-if="getFileCategory(contentType) === 'video'">
        <rect fill="#7E57C2" x="6" y="8" width="36" height="32" rx="3"/>
        <path fill="#B39DDB" d="M42 12H6c-1.1 0-2 .9-2 2v24c0 1.1.9 2 2 2h36c1.1 0 2-.9 2-2V14c0-1.1-.9-2-2-2z"/>
        <polygon fill="#FFF" points="20,14 34,24 20,34"/>
      </template>

      <!-- Audio Icon -->
      <template v-else-if="getFileCategory(contentType) === 'audio'">
        <rect fill="#26A69A" x="8" y="6" width="32" height="36" rx="3"/>
        <circle fill="#80CBC4" cx="24" cy="26" r="10"/>
        <circle fill="#26A69A" cx="24" cy="26" r="4"/>
        <rect fill="#80CBC4" x="20" y="10" width="8" height="8"/>
      </template>

      <!-- PDF Icon -->
      <template v-else-if="getFileCategory(contentType) === 'pdf'">
        <path fill="#F44336" d="M48 10L32 6v6H20v6h12v6H20v12h12v6L48 34V10z"/>
        <text x="24" y="36" fill="#FFF" font-size="14" font-weight="bold" text-anchor="middle">PDF</text>
      </template>

      <!-- Archive Icon -->
      <template v-else-if="getFileCategory(contentType) === 'archive'">
        <rect fill="#FFA726" x="8" y="6" width="32" height="36" rx="2"/>
        <rect fill="#FFB74D" x="12" y="2" width="24" height="8" rx="2"/>
        <rect fill="#8D6E63" x="20" y="16" width="8" height="20"/>
        <circle fill="#795548" cx="24" cy="12" r="4"/>
      </template>

      <!-- Text File Icon -->
      <template v-else-if="getFileCategory(contentType) === 'text'">
        <path fill="#90A4AE" d="M38 4H14c-2.2 0-4 1.8-4 4v32c0 2.2 1.8 4 4 4h28c2.2 0 4-1.8 4-4V12L38 4z"/>
        <path fill="#B0BEC5" d="M38 4v8h8l-8-8z"/>
        <rect fill="#ECEFF1" x="14" y="18" width="20" height="2"/>
        <rect fill="#ECEFF1" x="14" y="24" width="16" height="2"/>
        <rect fill="#ECEFF1" x="14" y="30" width="18" height="2"/>
        <rect fill="#ECEFF1" x="14" y="36" width="12" height="2"/>
      </template>

      <!-- Code File Icon -->
      <template v-else-if="getFileCategory(contentType) === 'code'">
        <path fill="#37474F" d="M38 4H14c-2.2 0-4 1.8-4 4v32c0 2.2 1.8 4 4 4h28c2.2 0 4-1.8 4-4V12L38 4z"/>
        <path fill="#546E7A" d="M38 4v8h8l-8-8z"/>
        <path fill="#81D4FA" d="M18 20l-6 6 6 6 2-2-4-4 4-4z"/>
        <path fill="#80CBC4" d="M30 20l6 6-6 6-2-2 4-4-4-4z"/>
        <path fill="#FFF59D" d="M26 30l-2 2 2 2 2-2z"/>
      </template>

      <!-- Word Document Icon -->
      <template v-else-if="getFileCategory(contentType) === 'word'">
        <path fill="#2196F3" d="M46 8H26v6h12v6H14v24h24V26h8V8z"/>
        <path fill="#1976D2" d="M24 8H10v6h6v24h8V14h6V8z"/>
        <path fill="#64B5F6" d="M32 22H18v-6h14v6z"/>
      </template>

      <!-- Excel Spreadsheet Icon -->
      <template v-else-if="getFileCategory(contentType) === 'excel'">
        <path fill="#4CAF50" d="M46 8H26v6h12v6H14v24h24V26h8V8z"/>
        <path fill="#388E3C" d="M24 8H10v6h6v24h8V14h6V8z"/>
        <path fill="#81C784" d="M32 22H18v-6h14v6zm0 10H18v-6h14v6z"/>
      </template>

      <!-- PPT Presentation Icon -->
      <template v-else-if="getFileCategory(contentType) === 'ppt'">
        <path fill="#FF5722" d="M46 8H26v6h12v6H14v24h24V26h8V8z"/>
        <path fill="#E64A19" d="M24 8H10v6h6v24h8V14h6V8z"/>
        <rect fill="#FFAB91" x="16" y="20" width="20" height="3"/>
        <rect fill="#FFAB91" x="16" y="26" width="14" height="3"/>
        <rect fill="#FFAB91" x="16" y="32" width="8" height="3"/>
      </template>

      <!-- Default File Icon -->
      <template v-else>
        <path fill="#78909C" d="M38 4H14c-2.2 0-4 1.8-4 4v32c0 2.2 1.8 4 4 4h24c2.2 0 4-1.8 4-4V12L38 4z"/>
        <path fill="#90A4AE" d="M38 4v8h8l-8-8z"/>
        <path fill="#B0BEC5" d="M38 4H14c-2.2 0-4 1.8-4 4v32c0 2.2 1.8 4 4 4h24c2.2 0 4-1.8 4-4V12L38 4z"/>
      </template>
    </svg>
  </div>
</template>

<style scoped>
.file-icon {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.file-icon svg {
  width: 32px;
  height: 32px;
}

.thumbnail-img {
  width: 32px;
  height: 32px;
  object-fit: cover;
  border-radius: var(--radius-sm);
}

.icon-folder svg {
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));
}

.icon-image svg {
  filter: drop-shadow(0 1px 2px rgba(66,165,245,0.4));
}

.icon-video svg {
  filter: drop-shadow(0 1px 2px rgba(126,87,194,0.4));
}

.icon-pdf svg {
  filter: drop-shadow(0 1px 2px rgba(244,67,54,0.4));
}

.icon-code svg {
  filter: drop-shadow(0 1px 2px rgba(55,71,79,0.4));
}

.icon-word svg {
  filter: drop-shadow(0 1px 2px rgba(33,150,243,0.4));
}

.icon-excel svg {
  filter: drop-shadow(0 1px 2px rgba(76,175,80,0.4));
}

.icon-ppt svg {
  filter: drop-shadow(0 1px 2px rgba(255,87,34,0.4));
}

.icon-archive svg {
  filter: drop-shadow(0 1px 2px rgba(255,167,38,0.4));
}
</style>
