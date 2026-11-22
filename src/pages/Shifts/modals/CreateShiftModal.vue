<template>
  <v-dialog
    :model-value="modelValue"
    max-width="720"
    persistent
    scrollable
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title class="text-h6">Create shift</v-card-title>
      <v-card-subtitle>Configure the shift schedule and its attendance rules.</v-card-subtitle>
      <v-card-text>
        <v-form ref="formRef" @submit.prevent="submit">
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model.trim="form.code"
                label="Shift code"
                placeholder="e.g. DAY-01"
                variant="outlined"
                :rules="[requiredRule]"
                maxlength="50"
                counter
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-select
                v-model="form.day_of_week"
                :items="daysOfWeek"
                label="Day of week"
                variant="outlined"
                multiple
                :rules="[requiredRule]"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model="form.clock_in" label="Clock-in" type="time" variant="outlined" :rules="[requiredRule]" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model="form.clock_out" label="Clock-out" type="time" variant="outlined" :rules="[requiredRule]" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.break_in"
                label="Break-in"
                type="time"
                variant="outlined"
                :disabled="!form.allow_break"
                :rules="form.allow_break ? [requiredRule] : []"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.break_out"
                label="Break-out"
                type="time"
                variant="outlined"
                :disabled="!form.allow_break"
                :rules="form.allow_break ? [requiredRule] : []"
              />
            </v-col>
            <v-col cols="12">
              <v-textarea
                v-model="form.description"
                label="Description"
                variant="outlined"
              ></v-textarea>
            </v-col>
            <v-col cols="12">
              <v-divider class="mb-2" />
              <div class="text-subtitle-2 mb-2">Shift settings</div>
              <div><label for="">Work Hours</label>: {{ timeDiff(form.clock_out, form.clock_in) }}</div>
              <v-switch v-model="form.allow_break" label="Allow break" color="primary" hide-details />
              <v-switch v-model="form.is_flexible" label="Flexible shift" color="primary" hide-details />
              <v-switch v-model="form.is_general_shift" label="Public / general shift" color="primary" hide-details />
            </v-col>
          </v-row>
          <v-alert v-if="form.allow_break && form.break_in && form.break_out && form.break_in >= form.break_out" type="warning" variant="tonal" density="compact">
            Break-out should be later than break-in.
          </v-alert>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="close">Cancel</v-btn>
        <v-btn color="primary" :loading="loading" @click="submit">Create shift</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'

type ShiftPayload = {
  code: string,
  description: string,
  day_of_week: string[],
  clock_in: string
  clock_out: string
  break_in: string | null
  break_out: string | null
  allow_break: boolean
  is_flexible: boolean
  is_general_shift: boolean
}

const props = withDefaults(defineProps<{
  modelValue: boolean
  loading?: boolean
}>(), { loading: false })

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  create: [payload: ShiftPayload]
}>()

const formRef = ref()
const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const requiredRule = (value: unknown) => !!String(value ?? '').trim() || 'This field is required.'
const defaultForm = () => ({
  code: '',
  description: "",
  day_of_week: 'Monday',
  clock_in: '08:00',
  clock_out: '17:00',
  break_in: '12:00',
  break_out: '13:00',
  allow_break: true,
  is_flexible: false,
  is_general_shift: false,
})
const form = reactive(defaultForm())

watch(() => props.modelValue, (open) => {
  if (open) Object.assign(form, defaultForm())
})

function close() {
  emit('update:modelValue', false)
}

async function submit() {
  const result = await formRef.value?.validate()
  if (result && !result.valid) return
  if (form.allow_break && form.break_in && form.break_out && form.break_in >= form.break_out) return

  emit('create', {
    code: form.code.trim(),
    description: form.description,
    day_of_week: form.day_of_week,
    clock_in: form.clock_in,
    clock_out: form.clock_out,
    break_in: form.allow_break ? form.break_in : null,
    break_out: form.allow_break ? form.break_out : null,
    allow_break: form.allow_break,
    is_flexible: form.is_flexible,
    is_general_shift: form.is_general_shift,
  })
}

function timeDiff (timeOut : String, timeIn: String) {
  const [startH, startM] = timeIn.split(':').map(Number);
  const [endH, endM] = timeOut.split(':').map(Number);

  const startTotalMins = startH * 60 + startM;
  const endTotalMins = endH * 60 + endM;

  let diffMins = endTotalMins - startTotalMins;

  // Handle crossing midnight (e.g., 22:00 to 15:00 = 17 hours)
  if (diffMins < 0) {
    diffMins += 24 * 60;
  }

  const hours = Math.floor(diffMins / 60);
  const minutes = diffMins % 60;

  return { hours, minutes };
}
</script>
