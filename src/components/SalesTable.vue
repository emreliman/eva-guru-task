<template>
  <div class="bg-white rounded shadow p-4">
    <h2 class="text-xl font-semibold mb-4">Sales Table</h2>
    <div v-if="loading || refundLoading" class="text-center py-8">Loading table...</div>
    <div v-else-if="error || refundError" class="text-center text-red-600 py-8">{{ error || refundError }}</div>
    <div v-else>
      <template v-if="pagedSkuList && pagedSkuList.length">
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm text-left">
            <thead>
              <tr class="bg-gray-100">
                <th class="px-4 py-2" rowspan="2">SKU</th>
                <th class="px-4 py-2" rowspan="2">Product Name</th>
                <template v-if="!isCompareMode">
                  <th class="px-4 py-2" colspan="3">{{ props.salesDate }}</th>
                </template>
                <template v-else>
                  <th class="px-4 py-2 text-center" colspan="3">{{ props.salesDate }}</th>
                  <th class="px-4 py-2 text-center" colspan="3">{{ props.salesDate2 }}</th>
                </template>
                <th class="px-4 py-2" rowspan="2">SKU Refund Rate</th>
              </tr>
              <tr class="bg-gray-50">
                <template v-if="!isCompareMode">
                  <th class="px-4 py-2">Sales $ / Units</th>
                  <th class="px-4 py-2">Avg. Selling Price</th>
                  <th class="px-4 py-2">Shipping</th>
                </template>
                <template v-else>
                  <th class="px-4 py-2">Sales $ / Units</th>
                  <th class="px-4 py-2">Avg. Selling Price</th>
                  <th class="px-4 py-2">Shipping</th>
                  <th class="px-4 py-2">Sales $ / Units</th>
                  <th class="px-4 py-2">Avg. Selling Price</th>
                  <th class="px-4 py-2">Shipping</th>
                </template>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in pagedSkuList" :key="row.sku">
                <td class="border px-4 py-2">{{ row.sku }}</td>
                <td class="border px-4 py-2">{{ row.productName }}</td>
                <template v-if="!isCompareMode">
                  <td class="border px-4 py-2 text-green-700 font-semibold">${{ row.amount?.toFixed(2) || '-' }} / {{ row.qty ?? '-' }}</td>
                  <td class="border px-4 py-2">${{ row.qty && row.amount ? (row.amount / row.qty).toFixed(2) : '-' }}</td>
                  <td class="border px-4 py-2">${{ row.shippingAmount?.toFixed(2) || '-' }}</td>
                </template>
                <template v-else>
                  <td class="border px-4 py-2 text-green-700 font-semibold">${{ row.amount?.toFixed(2) || '-' }} / {{ row.qty ?? '-' }}</td>
                  <td class="border px-4 py-2">${{ row.qty && row.amount ? (row.amount / row.qty).toFixed(2) : '-' }}</td>
                  <td class="border px-4 py-2">${{ row.shippingAmount?.toFixed(2) || '-' }}</td>
                  <td class="border px-4 py-2 text-green-700 font-semibold">${{ row.amount2?.toFixed(2) || '-' }} / {{ row.qty2 ?? '-' }}</td>
                  <td class="border px-4 py-2">${{ row.qty2 && row.amount2 ? (row.amount2 / row.qty2).toFixed(2) : '-' }}</td>
                  <td class="border px-4 py-2">${{ row.shippingAmount2?.toFixed(2) || '-' }}</td>
                </template>
                <td class="border px-4 py-2">{{ row.refundRate ?? '-' }}<span v-if="row.refundRate !== undefined">%</span></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="flex justify-between items-center mt-4">
          <button @click="prevPage" :disabled="tablePage === 1" class="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Previous</button>
          <span>Page {{ tablePage }}</span>
          <button @click="nextPage" :disabled="pagedSkuList.length < itemsPerTablePage" class="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Next</button>
        </div>
      </template>
      <template v-else>
        <div class="h-32 flex items-center justify-center bg-gray-100 rounded">
          <span>No data available.</span>
          <span class="text-xs block mt-2">(day: {{ day }}, seller: {{ user?.storeId }})</span>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, type PropType, computed } from 'vue';
import api from '@/services/api';
import { extractApiError } from '@/utils/error';

type SkuRow = {
  sku: string;
  productName?: string;
  amount?: number;
  qty?: number;
  shippingAmount?: number;
  amount2?: number;
  qty2?: number;
  shippingAmount2?: number;
  refundRate?: number | string;
};

const props = defineProps({
  day: {
    type: Number,
    required: true,
  },
  user: {
    type: Object as PropType<{ storeId?: string; marketplaceName?: string }>,
    required: false,
  },
  salesDate: {
    type: String,
    required: true,
  },
  salesDate2: {
    type: String,
    required: false,
    default: '',
  },
});

const loading = ref(false);
const error = ref('');
const tableData = ref<unknown>(null);
const pageNumber = ref(1); // API page
const tablePage = ref(1); // UI page (1-3, 4-6, ...)
const itemsPerApiPage = 30;
const itemsPerTablePage = 10;

const refundLoading = ref(false);
const refundError = ref('');

const isCompareMode = computed(() => !!props.salesDate2 && props.salesDate2 !== '');

async function fetchTableData() {
  if (!props.user?.storeId || !props.user?.marketplaceName || !props.salesDate) return;
  loading.value = true;
  error.value = '';
  tableData.value = null;
  const requestBody = {
    isDaysCompare: props.salesDate2 && props.salesDate2 !== '' ? 1 : 0,
    marketplace: props.user.marketplaceName,
    pageNumber: pageNumber.value,
    pageSize: itemsPerApiPage,
    salesDate: props.salesDate,
    salesDate2: props.salesDate2 || '',
    sellerId: props.user.storeId,
  };
  try {
    const response: unknown = await api.post('/data/daily-sales-sku-list', requestBody);
    tableData.value = (response as { data?: unknown }).data;
  } catch (err: unknown) {
    error.value = extractApiError(err, 'Failed to load table data');
  } finally {
    loading.value = false;
  }
}

async function fetchRefundRates(skuList: SkuRow[]): Promise<SkuRow[]> {
  if (!skuList || skuList.length === 0) return skuList;
  refundLoading.value = true;
  refundError.value = '';
  try {
    const skuArray = skuList.map(row => row.sku);
    const requestBody = {
      marketplace: props.user?.marketplaceName || '',
      sellerId: props.user?.storeId || '',
      skuList: skuArray,
      requestedDay: props.day,
    };
    const response: unknown = await api.post('/data/get-sku-refund-rate', requestBody);
    const dataArr = (response as { data?: { Data?: Array<{ sku: string; refundRate: number | string }> } })?.data?.Data || [];
    const refundMap = dataArr.reduce<Record<string, number | string>>((acc, cur) => {
      acc[cur.sku] = cur.refundRate;
      return acc;
    }, {});
    // Merge refundRate into skuList
    return skuList.map(row => ({ ...row, refundRate: refundMap[row.sku] ?? '-' }));
  } catch (err: unknown) {
    refundError.value = extractApiError(err, 'Failed to load refund rates');
    return skuList;
  } finally {
    refundLoading.value = false;
  }
}

const pagedSkuList = ref<SkuRow[]>([]);

async function updatePagedSkuList() {
  const data = tableData.value as { Data?: { item?: { skuList?: SkuRow[] } } };
  if (!data || !data.Data || !data.Data.item || !Array.isArray(data.Data.item.skuList)) {
    pagedSkuList.value = [];
    return;
  }
  const all = data.Data.item.skuList;
  const start = ((tablePage.value - 1) % 3) * itemsPerTablePage;
  const pageItems = all.slice(start, start + itemsPerTablePage);
  pagedSkuList.value = await fetchRefundRates(pageItems);
}

function nextPage() {
  if (tablePage.value % 3 === 0) {
    pageNumber.value++;
    tablePage.value++;
    fetchTableData();
  } else {
    tablePage.value++;
  }
}
function prevPage() {
  if (tablePage.value === 1) return;
  if ((tablePage.value - 1) % 3 === 0) {
    pageNumber.value--;
    tablePage.value--;
    fetchTableData();
  } else {
    tablePage.value--;
  }
}

watch(
  () => [props.day, props.user?.storeId, props.user?.marketplaceName, props.salesDate, props.salesDate2],
  () => {
    pageNumber.value = 1;
    tablePage.value = 1;
    fetchTableData();
  },
  { immediate: true }
);

watch([tableData, tablePage], updatePagedSkuList);
</script> 