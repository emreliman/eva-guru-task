import { createStore } from 'vuex';
import auth from './modules/auth.ts';

export default createStore({
  modules: {
    auth,
  },
}); 