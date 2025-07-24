import type { Module, ActionContext } from 'vuex';
import { extractApiError } from '@/utils/error';
import api from '@/services/api';

// User info type
export interface UserInfo {
  storeId: string;
  marketplaceName: string;
  userId: string;
}

// State type for authentication
export interface AuthState {
  accessToken: string | null;
  user: UserInfo | null;
}

const state: AuthState = {
  accessToken: null,
  user: null,
};

const mutations = {
  // Set the access token in the state
  setAccessToken(state: AuthState, token: string) {
    state.accessToken = token;
  },
  // Set the user info in the state
  setUser(state: AuthState, user: UserInfo) {
    state.user = user;
  },
};

const actions = {
  /**
   * Login action: calls the API and stores the access token, then fetches user info
   * @param context - Vuex action context
   * @param payload - { email: string, password: string }
   */
  async login({ commit, dispatch }: ActionContext<AuthState, unknown>, payload: { email: string; password: string }) {
    try {
      // Prepare the request body as required by the API
      const body = {
        Email: payload.email,
        Password: payload.password,
        GrantType: 'password',
        Scope: 'amazon_data',
        ClientId: 'C0001',
        ClientSecret: 'SECRET0001',
        RedirectUri: 'https://api.eva.guru',
      };
      // Make the API request
      const response = await api.post('/oauth/token', body);
      const accessToken = response.data.Data?.AccessToken;
      commit('setAccessToken', accessToken);
      await dispatch('fetchUserInfo', { email: payload.email });
      return response.data;
    } catch (error: unknown) {
      throw new Error(extractApiError(error, 'Login failed'));
    }
  },

  /**
   * Fetch user info using the access token
   * @param context - Vuex action context
   * @param payload - { email: string }
   */
  async fetchUserInfo({ state, commit }: ActionContext<AuthState, unknown>, payload: { email: string }) {
    if (!state.accessToken) {
      return;
    }
    try {
      // Set Authorization header with Bearer token
      const response = await api.post(
        '/user/user-information',
        { email: payload.email },
        {
          headers: {
            Authorization: `Bearer ${state.accessToken}`,
          },
        }
      );
      let userObj = null;
      const user = response.data.Data.user;
      // Check if user and necessary properties exist
      if (user && user.userId && Array.isArray(user.store) && user.store.length > 0) {
        userObj = {
          storeId: user.store[0].storeId, // Use store[0].storeId as sellerId
          marketplaceName: user.store[0].marketplaceName,
        };
      } else{
        throw new Error('User data or store info is missing');
      }
      commit('setUser', userObj);
    } catch (error: unknown) {
      throw new Error(extractApiError(error, 'Failed to fetch user info'));
    }
  },
};

const auth: Module<AuthState, unknown> = {
  namespaced: true,
  state,
  mutations,
  actions,
  getters: {},
};

export default auth; 