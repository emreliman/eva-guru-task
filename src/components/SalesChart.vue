<template>
  <div class="bg-white rounded shadow p-4">
    <h2 class="text-xl font-semibold mb-4">Sales Chart</h2>
    <div v-if="loading" class="text-center py-8">Loading chart...</div>
    <div v-else-if="error" class="text-center text-red-600 py-8">{{ error }}</div>
    <div v-else>
      <div v-if="chartOptions" ref="chartContainer" class="h-96"></div>
      <div v-else class="h-64 flex items-center justify-center bg-gray-100 rounded">
        <span>No data available.</span>
        <span class="text-xs block mt-2">(day: {{ day }}, seller: {{ user?.storeId }})</span>
      </div>
      <!-- Custom Legend -->
      <div class="flex gap-6 mt-4 justify-center">
        <div class="flex items-center gap-2 cursor-pointer" :style="{ opacity: showFBA ? 1 : 0.4 }" @click="toggleSeries(0)">
          <span class="inline-block w-4 h-4 rounded-full" style="background:#4fd1c5"></span>
          <span class="text-xs">FBA Sales</span>
        </div>
        <div class="flex items-center gap-2 cursor-pointer" :style="{ opacity: showFBM ? 1 : 0.4 }" @click="toggleSeries(1)">
          <span class="inline-block w-4 h-4 rounded-full" style="background:#7c3aed"></span>
          <span class="text-xs">FBM Sales</span>
        </div>
        <div class="flex items-center gap-2 cursor-pointer" :style="{ opacity: showProfit ? 1 : 0.4 }" @click="toggleSeries(2)">
          <span class="inline-block w-4 h-4 rounded-full" style="background:#22c55e"></span>
          <span class="text-xs">Profit</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, type PropType, onBeforeUnmount, nextTick } from 'vue';
import api from '@/services/api';
import Highcharts from 'highcharts';

const emit = defineEmits(['column-click']);

const props = defineProps({
  day: {
    type: Number,
    required: true,
  },
  user: {
    type: Object as PropType<{ storeId?: string; marketplaceName?: string }>,
    required: false,
  },
  selectedDates: {
    type: Array as PropType<string[]>,
    required: false,
    default: () => [],
  },
});

const loading = ref(false);
const error = ref('');
const chartOptions = ref<unknown>(null);
const chartInstance = ref<ChartInstance | null>(null);
const chartContainer = ref<HTMLElement | null>(null);
const showFBA = ref(true);
const showFBM = ref(true);
const showProfit = ref(false);

type ChartSeries = {
  visible: boolean;
  show: () => void;
  hide: () => void;
};
type ChartInstance = {
  series: ChartSeries[];
  destroy: () => void;
};
type ChartOptions = Record<string, unknown>;

watch(
  () => [props.day, props.user?.storeId, props.user?.marketplaceName],
  async () => {
    if (!props.user?.storeId || !props.user?.marketplaceName) return;
    loading.value = true;
    error.value = '';
    chartOptions.value = null;
    if (chartInstance.value) {
      chartInstance.value.destroy();
      chartInstance.value = null;
    }
    const requestBody = {
      marketplace: props.user.marketplaceName,
      sellerId: props.user.storeId,
      requestStatus: 0,
      day: props.day,
      excludeYoYData: true,
    };
    try {
      const response: unknown = await api.post('/data/daily-sales-overview', requestBody);
      const data = (response as { data?: { Data?: { item?: unknown } } })?.data?.Data?.item;
      if (Array.isArray(data)) {
        setupChart(data);
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'error_description' in err.response.data) {
        error.value = (err.response as { error_description?: string }).error_description || 'Failed to load chart data';
      } else {
        error.value = 'Failed to load chart data';
      }
    } finally {
      loading.value = false;
    }
  },
  { immediate: true }
);

function toggleSeries(idx: number) {
  if (!chartInstance.value) return;
  const series = chartInstance.value.series[idx];
  if (series.visible) {
    series.hide();
  } else {
    series.show();
  }
  if (idx === 0) showFBA.value = !showFBA.value;
  if (idx === 1) showFBM.value = !showFBM.value;
  if (idx === 2) showProfit.value = !showProfit.value;
}

function updateSeriesVisibility() {
  if (!chartInstance.value) return;
  [showFBA.value, showFBM.value, showProfit.value].forEach((show, idx) => {
    const series = chartInstance.value!.series[idx];
    if (series) {
      if (show && !series.visible) series.show();
      if (!show && series.visible) series.hide();
    }
  });
}

watch([showFBA, showFBM, showProfit], updateSeriesVisibility);

function setupChart(data: unknown) {
  if (!Array.isArray(data)) return;
  // data: Array<Record<string, unknown>>
  const safeData = data as Array<Record<string, unknown>>;
  const categories = safeData.map((item) => item.date as string);
  const fbaAmount = safeData.map((item) => Number(item.fbaAmount));
  const fbmAmount = safeData.map((item) => Number(item.fbmAmount));
  const profit = safeData.map((item) => Number(item.profit));
  const fbaShippingAmount = safeData.map((item) => Number(item.fbaShippingAmount));

  // Remove dynamic yAxis min/max, use default
  // Highlight selected columns: green for selected, blue/mor for others
  const selectedIndexes = props.selectedDates?.map(date => categories.indexOf(date)).filter(i => i !== -1) || [];
  const fbaColors = categories.map((_, idx) => selectedIndexes.includes(idx) ? '#22c55e' : '#4fd1c5');
  const fbmColors = categories.map((_, idx) => selectedIndexes.includes(idx) ? '#22c55e' : '#7c3aed');
  const profitColors = categories.map((_, idx) => selectedIndexes.includes(idx) ? '#22c55e' : '#22c55e'); 

  // Only show profit as a bar if positive, otherwise null
  const profitBar = profit.map((val: unknown) => typeof val === 'number' && val > 0 ? val : null);

  chartOptions.value = {
    chart: {
      type: 'column',
      events: {},
    },
    title: { text: '' },
    xAxis: { categories },
    yAxis: { min: 0, title: { text: 'Amount' } },
    tooltip: {
      formatter: function (this: { point?: { index?: number } }): string {
        const idx = this.point?.index as number;
        return `
          <b>${categories[idx]}</b><br/>
          Total Sales: ${fbaAmount[idx] + fbmAmount[idx]}<br/>
          Profit: ${profit[idx]}<br/>
          Shipping: ${fbaShippingAmount[idx]}<br/>
          FBA Sales: ${fbaAmount[idx]}<br/>
          FBM Sales: ${fbmAmount[idx]}
        `;
      },
      useHTML: true,
    },
    plotOptions: {
      column: {
        cursor: 'pointer',
        stacking: 'normal',
        point: {
          events: {
            click: function (this: { index?: number }) {
              emit('column-click', categories[this.index as number]);
            },
          },
        },
      },
    },
    series: [
      { name: 'FBA Sales', data: fbaAmount, colorByPoint: true, colors: fbaColors },
      { name: 'FBM Sales', data: fbmAmount, colorByPoint: true, colors: fbmColors },
      { name: 'Profit', data: profitBar, colorByPoint: true, colors: profitColors },
    ],
    legend: { enabled: false },
  };

  setTimeout(() => {
    if (chartContainer.value) {
      chartInstance.value = Highcharts.chart(chartContainer.value, chartOptions.value as ChartOptions) as unknown as ChartInstance;
      nextTick(() => updateSeriesVisibility());
    }
  }, 0);
}

onBeforeUnmount(() => {
  if (chartInstance.value) {
    chartInstance.value.destroy();
    chartInstance.value = null;
  }
});
</script> 