import { type LoginRequest, type SearchTasksRequest, type Task, type UserDTO } from "@repo/dtos";
import { createStore } from "@repo/state-manager";
import { fetchMe, login, searchTasks } from "../lib/api.lib";

type GlobalStore = {
  user: UserDTO | null;
  tasks: Task[];
};

export const globalStoreInitialValue: GlobalStore = {
  user: null,
  tasks: [],
};

const globalStore = createStore<GlobalStore>()
  .addGetters({
    tasks: (state) => state.tasks,
    user: (state) => state.user,
  })
  .addSetters({
    setTasks: (state, tasks: Task[]) => (state.tasks = tasks),
    setUser: (state, user: GlobalStore["user"]) => (state.user = user),
  })
  // Queries pass state.signal to their API call: it is aborted when no component uses the query anymore
  .addQueries({
    searchTasks: async (state, body: SearchTasksRequest) => {
      const tasks = await searchTasks(body, state.signal);
      state.setTasks(tasks);
    },
    fetchMe: async (state) => {
      try {
        const user = await fetchMe(state.signal);
        state.setUser(user);
      } catch (_e) {
        state.setUser(null);
      }
    },
  })
  .addMutations({
    login: async (state, body: LoginRequest) => {
      const response = await login(body);
      state.setUser(response);
    },
  });

export const {
  StoreProvider: GlobalProvider,
  StoreConsumer: GlobalConsumer,
  useGetters: useGlobalGetters,
  useSetters: useGlobalSetters,
  useQueries: useGlobalQueries,
  useMutations: useGlobalMutations,
} = globalStore;
