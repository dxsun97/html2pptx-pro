<script setup lang="ts">
import { inject, computed, type Ref } from 'vue'
import SlidePreview from './SlidePreview.vue'

const props = defineProps<{
    slideId: string
    title?: string
    description?: string
}>()

const emit = defineEmits<{
    generate: [slideId: string]
}>()

const isConvertingRef = inject<Ref<boolean>>('isConverting')
const isConverting = computed(() => isConvertingRef?.value ?? false)

function onGenerate(): void {
    emit('generate', props.slideId)
}
</script>

<template>
    <div class="slide-section-wrapper">
        <p v-if="description" class="description">{{ description }}</p>

        <div class="slide-section">
            <SlidePreview :slide-id="slideId">
                <slot />
            </SlidePreview>
        </div>

        <div class="flex justify-center my-4">
            <button
                class="gen-btn"
                :disabled="isConverting"
                @click="onGenerate"
            >
                Generate PPTX
            </button>
        </div>
    </div>
</template>

<style scoped>
.slide-section-wrapper {
    margin-bottom: 48px;
}

.slide-section {
    background: #f3f4f6;
    border-radius: 8px;
    padding: 16px;
    margin: 16px 0;
}

.description {
    color: #6b7280;
    font-size: 14px;
    margin-bottom: 12px;
}

.gen-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 10px 24px;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.1s;
}

.gen-btn:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
}

.gen-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
</style>