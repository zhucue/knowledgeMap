<template>
  <div class="generation-progress">
    <div class="progress-card">
      <div class="progress-header">
        <div class="spinner"></div>
        <span class="progress-text">{{ message }}</span>
      </div>
      <div class="progress-bar-container">
        <div class="progress-bar" :style="{ width: `${progress}%` }"></div>
      </div>
      <div class="progress-percentage">{{ progress }}%</div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  progress: number;
  message: string;
}

defineProps<Props>();
</script>

<style scoped>
.generation-progress {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 100;
}

.progress-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  min-width: 320px;
}

.progress-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid #E5E7EB;
  border-top-color: #3B82F6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.progress-text {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}

.progress-bar-container {
  width: 100%;
  height: 8px;
  background: #E5E7EB;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-percentage {
  text-align: right;
  font-size: 12px;
  color: #6B7280;
  font-weight: 500;
}
</style>
