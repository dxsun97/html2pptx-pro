<script setup lang="ts">
import { inject, computed, type Ref } from 'vue'
import type { StatusState } from '../composables/useHtml2Pptx'

const emit = defineEmits<{
    generateAll: []
}>()

const isConvertingRef = inject<Ref<boolean>>('isConverting')
const statusRef = inject<Ref<StatusState>>('status')

const isConverting = computed(() => isConvertingRef?.value ?? false)
const currentStatus = computed<StatusState>(() => statusRef?.value ?? { type: 'idle', message: '' })

const statusClass = computed(() => {
    return currentStatus.value.type !== 'idle' ? `status-bar ${currentStatus.value.type}` : 'status-bar'
})

function onGenerateAll(): void {
    emit('generateAll')
}
</script>

<template>
    <div class="demo-controls">
        <div class="flex justify-center my-5">
            <button
                id="convertAllBtn"
                class="primary-btn"
                :disabled="isConverting"
                @click="onGenerateAll"
            >
                Generate All PPTX
            </button>
        </div>

        <Transition name="fade">
            <div
                v-if="currentStatus.type !== 'idle'"
                :class="statusClass"
            >
                {{ currentStatus.message }}
            </div>
        </Transition>
    </div>
</template>

<style scoped>
.demo-controls {
    margin-bottom: 32px;
}

.primary-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 12px 32px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.1s;
}

.primary-btn:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
}

.primary-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.status-bar {
    max-width: 960px;
    margin: 0 auto 20px;
    border-radius: 8px;
    font-size: 14px;
    padding: 12px 16px;
    text-align: center;
    font-weight: 500;
}

.status-bar.loading {
    background: #dbeafe;
    color: #1e40af;
}

.status-bar.success {
    background: #dcfce7;
    color: #166534;
}

.status-bar.error {
    background: #fee2e2;
    color: #dc2626;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>