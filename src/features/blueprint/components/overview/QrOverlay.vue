<script setup lang="ts">
defineProps<{
  status: string
  qrcodeUrl: string
  cancelLabel: string
}>()

const emit = defineEmits<{
  cancel: []
}>()
</script>

<template>
  <div class="qr-overlay">
    <div class="qr-card">
      <p class="qr-status">{{ status }}</p>
      <div v-if="qrcodeUrl" class="qr-image-wrapper">
        <img :src="qrcodeUrl" alt="QR Code" class="qr-image" />
      </div>
      <div v-else class="qr-placeholder">
        <span class="qr-spinner"></span>
      </div>
      <button type="button" class="qr-cancel-btn" @click="emit('cancel')">
        {{ cancelLabel }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.qr-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.qr-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: rgba(20, 20, 20, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  max-width: 280px;
  width: 90%;
}

.qr-status {
  color: #f7d048;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  margin: 0;
  line-height: 1.4;
}

.qr-image-wrapper {
  width: 200px;
  height: 200px;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

.qr-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.qr-placeholder {
  width: 200px;
  height: 200px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
}

.qr-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.15);
  border-top-color: #f7d048;
  border-radius: 50%;
  animation: qr-spin 0.8s linear infinite;
}

@keyframes qr-spin {
  to {
    transform: rotate(360deg);
  }
}

.qr-cancel-btn {
  padding: 8px 20px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qr-cancel-btn:hover {
  border-color: var(--gold);
  color: var(--gold);
}
</style>
