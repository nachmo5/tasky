import { sendRequest } from "@/lib/api.lib";
import {
  type LoginRequest,
  type LoginResponse,
  type MeResponse,
  type SearchTaskOccurrencesRequest,
  type SearchTaskOccurrencesResponse,
  type SearchTaskTemplatesResponse,
  type TaskOccurrenceDTO,
  type TaskTemplateDTO,
  type UpdateTaskTemplatesRequest,
  type UpdateTaskTemplatesResponse,
  type UserDTO,
} from "@repo/dtos";
import { createStore } from "@repo/state-manager";

type GlobalStore = {
  user: UserDTO | null;
  taskOccurrences: TaskOccurrenceDTO[];
  taskTemplates: TaskTemplateDTO[];
};

export const globalStoreInitialValue: GlobalStore = {
  user: null,
  taskOccurrences: [],
  taskTemplates: [],
};

const globalStore = createStore<GlobalStore>()
  .addGetters({
    taskOccurrences: (state) => state.taskOccurrences,
    taskTemplates: (state) => state.taskTemplates,
    user: (state) => state.user,
  })
  .addSetters({
    setTaskOccurrences: (state, taskOccurrences: TaskOccurrenceDTO[]) => (state.taskOccurrences = taskOccurrences),
    setTaskTemplates: (state, taskTemplates: TaskTemplateDTO[]) => (state.taskTemplates = taskTemplates),
    replaceTaskTemplates: (state, updatedTaskTemplates: TaskTemplateDTO[]) =>
      (state.taskTemplates = state.taskTemplates.map(
        (taskTemplate) => updatedTaskTemplates.find((updated) => updated.id === taskTemplate.id) ?? taskTemplate,
      )),
    setUser: (state, user: GlobalStore["user"]) => (state.user = user),
  })
  .addQueries({
    searchTaskOccurrences: async (state, data: SearchTaskOccurrencesRequest) => {
      state.setTaskOccurrences(
        await sendRequest<SearchTaskOccurrencesResponse>("/task-occurrences", {
          queryString: data,
          signal: state.signal,
        }),
      );
    },
    searchTaskTemplates: async (state) => {
      state.setTaskTemplates(
        await sendRequest<SearchTaskTemplatesResponse>("/task-templates", { signal: state.signal }),
      );
    },
    fetchMe: async (state) => {
      try {
        const user = await sendRequest<MeResponse>("/auth/me", { signal: state.signal });
        state.setUser(user);
      } catch (_e) {
        state.setUser(null);
      }
    },
  })
  .addMutations({
    login: async (state, data: LoginRequest) => {
      const response = await sendRequest<LoginResponse>("/auth/login", { body: data, method: "POST" });
      state.setUser(response);
    },
    updateTaskTemplates: async (state, data: UpdateTaskTemplatesRequest) => {
      state.replaceTaskTemplates(
        await sendRequest<UpdateTaskTemplatesResponse>("/task-templates/update", { body: data, method: "PATCH" }),
      );
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
