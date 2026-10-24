import { sendRequest } from "@/lib/api.lib";

import {
  type CompleteTaskRequest,
  type CompleteTaskResponse,
  type CreateTaskTemplateRequest,
  type CreateTaskTemplateResponse,
  type DeleteTaskTemplateRequest,
  type DeleteTaskTemplateResponse,
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
  isAddModalOpened: boolean;
  updatingTaskOccurrenceId: string | null;
};

export const globalStoreInitialValue: GlobalStore = {
  user: null,
  taskOccurrences: [],
  taskTemplates: [],
  isAddModalOpened: false,
  updatingTaskOccurrenceId: null,
};

const globalStore = createStore<GlobalStore>()
  .addGetters({
    taskOccurrences: (state) => state.taskOccurrences,
    taskTemplates: (state) => state.taskTemplates,
    user: (state) => state.user,
    isAddModalOpened: (state) => state.isAddModalOpened,
    updatingTaskOccurrenceId: (state) => state.updatingTaskOccurrenceId,
  })
  .addSetters({
    setTaskOccurrences: (state, taskOccurrences: TaskOccurrenceDTO[]) => (state.taskOccurrences = taskOccurrences),
    setTaskTemplates: (state, taskTemplates: TaskTemplateDTO[]) => (state.taskTemplates = taskTemplates),
    replaceTaskTemplates: (state, updatedTaskTemplates: TaskTemplateDTO[]) => {
      state.taskTemplates = state.taskTemplates.map(
        (taskTemplate) => updatedTaskTemplates.find((updated) => updated.id === taskTemplate.id) ?? taskTemplate,
      );

      state.taskOccurrences = state.taskOccurrences.map((taskOccurrence) => ({
        ...taskOccurrence,
        template: updatedTaskTemplates.find((tt) => tt.id === taskOccurrence.template.id) ?? taskOccurrence.template,
      }));
    },
    addTaskTemplate: (state, taskTemplate: TaskTemplateDTO) => {
      state.taskTemplates.push(taskTemplate);
    },
    setUser: (state, user: GlobalStore["user"]) => (state.user = user),
    setIsAddModalOpened: (state, isAddModalOpened: boolean) => (state.isAddModalOpened = isAddModalOpened),
    setUpdatingTaskOccurrenceId: (state, updatingTaskOccurrenceId: string | null) =>
      (state.updatingTaskOccurrenceId = updatingTaskOccurrenceId),
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
    createTaskTemplate: async (state, data: CreateTaskTemplateRequest) => {
      state.addTaskTemplate(
        await sendRequest<CreateTaskTemplateResponse>("/task-templates/create", { body: data, method: "POST" }),
      );
      await state.refetchQueries("searchTaskOccurrences");
    },
    deleteTaskTemplate: async (state, data: DeleteTaskTemplateRequest) => {
      await sendRequest<DeleteTaskTemplateResponse>("/task-templates/delete", { body: data, method: "DELETE" });
      await state.refetchQueries("searchTaskOccurrences");
    },
    completeTask: async (state, data: CompleteTaskRequest) => {
      await sendRequest<CompleteTaskResponse>("/task-templates/complete", { body: data, method: "POST" });
      await state.refetchQueries("searchTaskOccurrences");
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
