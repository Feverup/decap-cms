import { actions as notifActions } from 'redux-notifications';

import { currentBackend } from '../backend';

import type { ThunkDispatch } from 'redux-thunk';
import type { AnyAction } from 'redux';
import type { State } from '../types/redux';

export const STATUS_STACK_REQUEST = 'STATUS_STACK_REQUEST';
export const STATUS_STACK_SUCCESS = 'STATUS_STACK_SUCCESS';
export const STATUS_STACK_FAILURE = 'STATUS_STACK_FAILURE';

export const CLOSE_STACK_REQUEST = 'CLOSE_STACK_REQUEST';
export const CLOSE_STACK_SUCCESS = 'CLOSE_STACK_SUCCESS';
export const CLOSE_STACK_FAILURE = 'CLOSE_STACK_FAILURE';

export const PUBLISH_STACK_REQUEST = 'PUBLISH_STACK_REQUEST';
export const PUBLISH_STACK_SUCCESS = 'PUBLISH_STACK_SUCCESS';
export const PUBLISH_STACK_FAILURE = 'PUBLISH_STACK_FAILURE';

const { notifSend } = notifActions;

export function stackStatusRequest() {
  return {
    type: STATUS_STACK_REQUEST,
  } as const;
}

export function stackStatusSuccess(status: { status?: string; updatedAt?: string } = {}) {
  return {
    type: STATUS_STACK_SUCCESS,
    payload: { status },
  } as const;
}

export function stackStatusFailure(error: Error) {
  return {
    type: STATUS_STACK_FAILURE,
    payload: { error },
  } as const;
}

export function stackPublishRequest() {
  return {
    type: PUBLISH_STACK_REQUEST,
  } as const;
}

export function stackPublishSuccess() {
  return {
    type: PUBLISH_STACK_SUCCESS,
  } as const;
}

export function stackPublishFailure() {
  return {
    type: PUBLISH_STACK_FAILURE,
  } as const;
}

export function stackCloseRequest() {
  return {
    type: CLOSE_STACK_REQUEST,
  } as const;
}

export function stackCloseSuccess() {
  return {
    type: CLOSE_STACK_SUCCESS,
  } as const;
}

export function stackCloseFailure() {
  return {
    type: CLOSE_STACK_FAILURE,
  } as const;
}

export function checkStackStatus() {
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    try {
      const state = getState();
      if (state.stack.isFetching || !state.config.backend.stack) {
        return;
      }
      dispatch(stackStatusRequest());

      const backend = currentBackend(state.config);
      const stackStatus = await backend.stackStatus();

      dispatch(stackStatusSuccess(stackStatus));
    } catch (error) {
      dispatch(stackStatusFailure(error));
    }
  };
}

export function updateStackStatus(oldStatus: string, newStatus: string) {
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    try {
      if (oldStatus === newStatus) return;
      const state = getState();
      if (state.stack.isFetching || !state.config.backend.stack) {
        return;
      }
      dispatch(stackStatusRequest());

      const backend = currentBackend(state.config);
      await backend.updateStackStatus(newStatus);

      const stackStatus = await backend.stackStatus();
      dispatch(stackStatusSuccess(stackStatus));
      dispatch(
        notifSend({
          message: {
            key: 'ui.toast.stackUpdated',
          },
          kind: 'success',
          dismissAfter: 4000,
        }),
      );
    } catch (error) {
      dispatch(stackStatusFailure(error));
    }
  };
}

export function publishStack() {
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    try {
      const state = getState();
      if (state.stack.isFetching || !state.config.backend.stack) {
        return;
      }
      dispatch(stackPublishRequest());

      const backend = currentBackend(state.config);
      await backend.publishStack();

      dispatch(stackStatusSuccess({}));
      dispatch(stackPublishSuccess());
      dispatch(
        notifSend({
          message: {
            key: 'ui.toast.stackPublished',
          },
          kind: 'success',
          dismissAfter: 4000,
        }),
      );
    } catch (error) {
      dispatch(stackPublishFailure(error));
    }
  };
}

export function closeStack() {
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    try {
      const state = getState();
      if (state.stack.isFetching || !state.config.backend.stack) {
        return;
      }
      dispatch(stackCloseRequest());

      const backend = currentBackend(state.config);
      await backend.closeStack();

      dispatch(stackStatusSuccess({}));
      dispatch(stackCloseSuccess());
      dispatch(
        notifSend({
          message: {
            key: 'ui.toast.stackClosed',
          },
          kind: 'success',
          dismissAfter: 4000,
        }),
      );
    } catch (error) {
      dispatch(stackCloseFailure(error));
    }
  };
}

export type StackStatusAction = ReturnType<
  | typeof stackStatusRequest
  | typeof stackStatusSuccess
  | typeof stackStatusFailure
  | typeof stackPublishRequest
  | typeof stackPublishSuccess
  | typeof stackPublishFailure
  | typeof stackCloseRequest
  | typeof stackCloseSuccess
  | typeof stackCloseFailure
>;
