<script setup lang="ts">
defineOptions({ name: 'AppDashboard' });
import { ref, computed, watchEffect } from 'vue';
import { useStore } from 'vuex';
import SalesChart from '@/components/SalesChart.vue';
import SalesTable from '@/components/SalesTable.vue';
import { useRouter } from 'vue-router';

const store = useStore();
const user = computed(() => store.state.auth.user);

const dayOptions = [7, 14, 30, 60];
const selectedDay = ref(60);

const selectedDates = ref<string[]>([]);

const router = useRouter();

watchEffect(() => {
  if (!user.value) {
    router.replace('/');
  }
});

function handleColumnClick(date: string) {
  if (date && typeof date === 'string') {
    const idx = selectedDates.value.indexOf(date);
    if (idx !== -1) {
      selectedDates.value.splice(idx, 1);
    } else if (selectedDates.value.length < 2) {
      selectedDates.value.push(date);
    } else {
      selectedDates.value.splice(0, 1);
      selectedDates.value.push(date);
    }
  } else {
    throw new Error('Invalid date');
  }
}
</script>

<template>
  <div
    class="max-w-3xl mx-auto mt-10 p-6 bg-white rounded shadow"
    :class="selectedDates.length === 2 ? 'overflow-x-auto min-w-[1200px]' : ''"
  >
    <h1 class="text-2xl font-bold mb-4">Dashboard</h1>
    <div v-if="user" class="mb-4">
      <p><strong>Seller ID:</strong> {{ user.storeId }}</p>
      <p><strong>Marketplace:</strong> {{ user.marketplaceName }}</p>
    </div>
    <div v-else class="mb-4">
      <p>User info not available.</p>
    </div>

    <!-- Day selection dropdown -->
    <div class="mb-6 flex items-center gap-2">
      <label for="day-select" class="font-medium">Day Selection:</label>
      <select id="day-select" v-model="selectedDay" class="border rounded px-2 py-1">
        <option v-for="option in dayOptions" :key="option" :value="option">{{ option }} days</option>
      </select>
    </div>

    <!-- SalesChart ve SalesTable -->
    <SalesChart
      v-if="user"
      :day="selectedDay"
      :user="user ? { ...user } : undefined"
      :selectedDates="selectedDates"
      @column-click="handleColumnClick"
    />
    <div class="mt-8">
      <SalesTable
        v-if="user && selectedDates.length > 0"
        :day="selectedDay"
        :user="user ? { ...user } : undefined"
        :salesDate="selectedDates[0]"
        :salesDate2="selectedDates[1] || ''"
      />
    </div>
  </div>
</template> 