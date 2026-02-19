<template>
  <div class="split-button" :class="{ disabled }">
    <button
      class="main-button"
      :disabled="disabled"
      @click="$emit('click')"
    >
      <slot name="icon"></slot>
      <slot></slot>
    </button>
    <button
      class="dropdown-button"
      :disabled="disabled"
      @click="toggleMenu"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M3 5L6 8L9 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <Teleport to="body">
      <Transition name="menu-fade">
        <div
          v-if="showMenu"
          ref="menuRef"
          class="dropdown-menu"
          :style="menuStyle"
        >
          <slot name="menu"></slot>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';

interface Props {
  disabled?: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  click: [];
  'menu-open': [];
  'menu-close': [];
}>();

const showMenu = ref(false);
const menuRef = ref<HTMLElement>();
const menuStyle = ref({});

function toggleMenu() {
  showMenu.value = !showMenu.value;

  if (showMenu.value) {
    emit('menu-open');
    nextTick(() => {
      updateMenuPosition();
    });
  } else {
    emit('menu-close');
  }
}

function updateMenuPosition() {
  if (!menuRef.value) return;

  const button = document.querySelector('.split-button') as HTMLElement;
  if (!button) return;

  const rect = button.getBoundingClientRect();

  menuStyle.value = {
    position: 'fixed',
    top: `${rect.bottom + 8}px`,
    right: `${window.innerWidth - rect.right}px`,
    minWidth: `${rect.width}px`,
  };
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (!target.closest('.split-button') && !target.closest('.dropdown-menu')) {
    showMenu.value = false;
    emit('menu-close');
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  window.addEventListener('resize', updateMenuPosition);
  window.addEventListener('scroll', updateMenuPosition);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('resize', updateMenuPosition);
  window.removeEventListener('scroll', updateMenuPosition);
});
</script>

<style scoped>
.split-button {
  display: inline-flex;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.split-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.main-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #3B82F6;
  color: white;
  font-size: 15px;
  font-weight: 500;
  border: none;
  border-right: 1px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: background 0.2s;
}

.main-button:hover:not(:disabled) {
  background: #2563EB;
}

.main-button:disabled {
  cursor: not-allowed;
}

.dropdown-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background: #3B82F6;
  color: white;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
}

.dropdown-button:hover:not(:disabled) {
  background: #2563EB;
}

.dropdown-button:disabled {
  cursor: not-allowed;
}

.dropdown-menu {
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.05);
  z-index: 9999;
  max-height: 400px;
  overflow-y: auto;
}

.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: all 0.2s ease;
}

.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
