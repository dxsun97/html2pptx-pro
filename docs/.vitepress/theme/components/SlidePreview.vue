<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = withDefaults(defineProps<{
    slideId: string
    width?: number
    height?: number
}>(), {
    width: 960,
    height: 540
})

const scalerRef = ref<HTMLElement | null>(null)
const slideRef = ref<HTMLElement | null>(null)
const currentScale = ref(1)
let resizeObserver: ResizeObserver | null = null

const slideStyle = computed(() => ({
    width: `${props.width}px`,
    height: `${props.height}px`,
    transform: `scale(${currentScale.value})`,
    transformOrigin: 'top left'
}))

const scalerStyle = computed(() => ({
    height: `${props.height * currentScale.value}px`
}))

function updateScale(): void {
    if (!scalerRef.value) return
    const available = scalerRef.value.clientWidth
    currentScale.value = Math.min(1, available / props.width)
}

onMounted(() => {
    updateScale()
    if (scalerRef.value) {
        resizeObserver = new ResizeObserver(updateScale)
        resizeObserver.observe(scalerRef.value)
    }
})

onUnmounted(() => {
    if (resizeObserver) {
        resizeObserver.disconnect()
    }
})

function getElement(): HTMLElement | null {
    return slideRef.value
}

defineExpose({ getElement })
</script>

<template>
    <div ref="scalerRef" class="slide-scaler" :style="scalerStyle">
        <div
            :id="slideId"
            ref="slideRef"
            class="slide"
            :style="slideStyle"
        >
            <slot />
        </div>
    </div>
</template>

<style scoped>
.slide-scaler {
    width: 100%;
    overflow: hidden;
}

.slide {
    background: white;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    border-radius: 4px;
}
</style>