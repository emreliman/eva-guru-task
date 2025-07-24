<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-gray-100">
    <div class="bg-white p-8 rounded shadow-md w-full max-w-sm">
      <h2 class="text-2xl font-bold mb-6 text-center">Login</h2>
      <form @submit.prevent="handleLogin">
        <div class="mb-4">
          <label class="block text-gray-700 mb-2" for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            class="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
            required
            autocomplete="username"
          />
        </div>
        <div class="mb-6">
          <label class="block text-gray-700 mb-2" for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            class="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
            required
            autocomplete="current-password"
          />
        </div>
        <button
          type="submit"
          class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          :disabled="loading"
        >
          <span v-if="loading">Loading...</span>
          <span v-else>Login</span>
        </button>
        <div v-if="error" class="mt-4 text-red-600 text-center">{{ error }}</div>
      </form>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

export default defineComponent({
  name: 'LoginPanel',
  setup() {
    const store = useStore();
    const router = useRouter();
    const email = ref('homework@eva.guru');
    const password = ref('Homeworkeva1**');
    const loading = ref(false);
    const error = ref('');

    const handleLogin = async () => {
      loading.value = true;
      error.value = '';
      try {
        await store.dispatch('auth/login', {
          email: email.value,
          password: password.value,
        });
        router.push({ name: 'Dashboard' });
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'message' in err) {
          error.value = (err as { message?: string }).message || 'Login failed';
        } else {
          error.value = 'Login failed';
        }
      } finally {
        loading.value = false;
      }
    };

    return {
      email,
      password,
      loading,
      error,
      handleLogin,
    };
  },
});
</script>

<style scoped>
</style> 