<script setup>
defineProps({
  modelValue: Boolean,
});

const emit = defineEmits(["update:modelValue"]);
</script>

<template>
  <Transition name="dialog-fade">
    <div
      v-if="modelValue"
      class="dialog-mask"
      @click="emit('update:modelValue', false)"
    >
      <div class="dialog-container" @click.stop>
        <slot></slot>
      </div>
    </div>
  </Transition>
</template>

<style>
.dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9998;
  background-color: var(--overlay-bg);
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.dialog-container {
  background: var(--glass-bg-strong);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: var(--glass-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-xl);
  min-width: 280px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  animation: dialogSlideIn 0.25s ease-out;
}

@keyframes dialogSlideIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.2s ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}
</style>
