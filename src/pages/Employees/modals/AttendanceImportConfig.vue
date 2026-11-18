<template>
  <v-dialog
    :model-value="modelValue"
    max-width="480"
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title>Configure attendance import</v-card-title>
      <v-card-text>
        <div class="text-body-2 mb-4">
          Before processing <strong>{{ fileName }}</strong>, tell us how many
          columns are in the uploaded file.
        </div>
        <v-text-field
          v-model.number="columnCount"
          label="Number of columns"
          type="number"
          min="1"
          step="1"
          variant="outlined"
          autofocus
          :error-messages="error"
          @update:model-value="error = ''"
        />
        <div class="text-caption text-medium-emphasis">
          Count all columns in the file, including columns that may not contain
          attendance information.
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="emit('cancel')">Cancel</v-btn>
        <v-btn color="primary" :disabled="!isValid" @click="confirm">
          Continue to processing
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  modelValue: boolean
  fileName: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: [columnCount: number]
  cancel: []
}>()

const columnCount = ref<number | null>(null)
const error = ref('')

const isValid = computed(() =>
  Number.isInteger(columnCount.value) && Number(columnCount.value) > 0
)

watch(() => props.modelValue, (open) => {
  if (open) {
    columnCount.value = null
    error.value = ''
  }
})

function confirm() {
  if (!isValid.value) {
    error.value = 'Enter a whole number greater than zero.'
    return
  }
  emit('confirm', Number(columnCount.value))
}
</script>
