import { actions as notifActions } from 'redux-notifications';

import { currentBackend } from '../backend';

import type { ThunkDispatch } from 'redux-thunk';
import type { AnyAction } from 'redux';
import type { State } from '../types/redux';

export const STATUS_MAIN_REQUEST = 'STATUS_MAIN_REQUEST';
export const STATUS_MAIN_SUCCESS = 'STATUS_MAIN_SUCCESS';
export const STATUS_MAIN_FAILURE = 'STATUS_MAIN_FAILURE';

export const CLOSE_MAIN_REQUEST = 'CLOSE_MAIN_REQUEST';
export const CLOSE_MAIN_SUCCESS = 'CLOSE_MAIN_SUCCESS';
export const CLOSE_MAIN_FAILURE = 'CLOSE_MAIN_FAILURE';

export const PUBLISH_MAIN_REQUEST = 'PUBLISH_MAIN_REQUEST';
export const PUBLISH_MAIN_SUCCESS = 'PUBLISH_MAIN_SUCCESS';
export const PUBLISH_MAIN_FAILURE = 'PUBLISH_MAIN_FAILURE';

const { notifSend } = notifActions;

export function mainStatusRequest() {
  return {
    type: STATUS_MAIN_REQUEST,
  } as const;
}

export function mainStatusSuccess(status: { status?: string; updatedAt?: string } = {}) {
  return {
    type: STATUS_MAIN_SUCCESS,
    payload: { status },
  } as const;
}

export function mainStatusFailure(error: Error) {
  return {
    type: STATUS_MAIN_FAILURE,
    payload: { error },
  } as const;
}
export function mainPublishRequest() {
  return {
    type: PUBLISH_MAIN_REQUEST,
  } as const;
}

export function mainPublishSuccess() {
  return {
    type: PUBLISH_MAIN_SUCCESS,
  } as const;
}

export function mainPublishFailure() {
  return {
    type: PUBLISH_MAIN_FAILURE,
  } as const;
}

export function mainCloseRequest() {
  return {
    type: CLOSE_MAIN_REQUEST,
  } as const;
}

export function mainCloseSuccess() {
  return {
    type: CLOSE_MAIN_SUCCESS,
  } as const;
}

export function mainCloseFailure() {
  return {
    type: CLOSE_MAIN_FAILURE,
  } as const;
}

export function checkMainStatus() {
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    try {
      const state = getState();
      if (state.main.isFetching || !state.config.backend.main) {
        return;
      }
      dispatch(mainStatusRequest());

      const backend = currentBackend(state.config);
      const mainStatus = await backend.mainStatus();

      dispatch(mainStatusSuccess(mainStatus));
    } catch (error) {
      dispatch(mainStatusFailure(error));
    }
  };
}

export function updateMainStatus(oldStatus: string, newStatus: string) {
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    try {
      if (oldStatus === newStatus) return;
      const state = getState();
      if (state.main.isFetching || !state.config.backend.main) {
        return;
      }
      dispatch(mainStatusRequest());

      const backend = currentBackend(state.config);
      await backend.updateMainStatus(newStatus);

      const mainStatus = await backend.mainStatus();
      dispatch(mainStatusSuccess(mainStatus));
      dispatch(
        notifSend({
          message: {
            key: 'ui.toast.mainUpdated',
          },
          kind: 'success',
          dismissAfter: 4000,
        }),
      );
    } catch (error) {
      dispatch(mainStatusFailure(error));
    }
  };
}

export function publishMain() {
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    try {
      const state = getState();
      if (state.main.isFetching || !state.config.backend.main) {
        return;
      }
      dispatch(mainPublishRequest());

      const backend = currentBackend(state.config);
      await backend.publishMain();

      dispatch(mainStatusSuccess({}));
      dispatch(mainPublishSuccess());
      dispatch(
        notifSend({
          message: {
            key: 'ui.toast.mainPublished',
          },
          kind: 'success',
          dismissAfter: 4000,
        }),
      );
    } catch (error) {
      dispatch(mainPublishFailure(error));
    }
  };
}

export function closeMain() {
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    try {
      const state = getState();
      if (state.main.isFetching || !state.config.backend.main) {
        return;
      }
      dispatch(mainCloseRequest());

      const backend = currentBackend(state.config);
      await backend.closeMain();

      dispatch(mainStatusSuccess({}));
      dispatch(mainCloseSuccess());
      dispatch(
        notifSend({
          message: {
            key: 'ui.toast.mainClosed',
          },
          kind: 'success',
          dismissAfter: 4000,
        }),
      );
    } catch (error) {
      dispatch(mainCloseFailure(error));
    }
  };
}

export type MainStatusAction = ReturnType<
  | typeof mainStatusRequest
  | typeof mainStatusSuccess
  | typeof mainStatusFailure
  | typeof mainPublishRequest
  | typeof mainPublishSuccess
  | typeof mainPublishFailure
  | typeof mainCloseRequest
  | typeof mainCloseSuccess
  | typeof mainCloseFailure
>;
