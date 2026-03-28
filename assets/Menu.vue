<script setup>
defineProps({
  modelValue: Boolean,
  items: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue", "click"]);
</script>

<template>
  <div class="menu">
    <Transition name="menu-fade">
      <div
        v-show="modelValue"
        class="menu-modal"
        @click="emit('update:modelValue', false)"
      ></div>
    </Transition>
    <Transition name="menu-pop">
      <div v-show="modelValue" class="menu-content">
        <ul>
          <li
            v-for="(item, index) in items"
            :key="index"
            @click="
              emit('update:modelValue', false);
              emit('click', item.text);
            "
          >
            <span v-text="item.text"></span>
          </li>
        </ul>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.menu-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: var(--overlay-bg);
  z-index: 1;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.menu-content {
  position: absolute;
  background: var(--glass-bg-strong);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: var(--glass-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  z-index: 2;
  right: -100%;
  min-width: 160px;
  overflow: hidden;
  animation: menuSlideIn 0.2s ease-out;
}

@keyframes menuSlideIn {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.menu-content ul {
  padding: var(--space-sm);
}

.menu-content li {
  padding: var(--space-md) var(--space-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-weight: 500;
  color: var(--text-primary);
}

.menu-content li:hover {
  background-color: var(--bg-hover);
  color: var(--color-primary);
}

.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: opacity 0.2s ease;
}

.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
}

.menu-pop-enter-active {
  transition: all 0.2s ease-out;
}

.menu-pop-leave-active {
  transition: all 0.15s ease-in;
}

.menu-pop-enter-from,
.menu-pop-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}
</style>
