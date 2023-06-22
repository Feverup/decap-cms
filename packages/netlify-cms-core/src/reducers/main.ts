import { produce } from 'immer';

import {
  STATUS_MAIN_REQUEST,
  STATUS_MAIN_SUCCESS,
  STATUS_MAIN_FAILURE,
  CLOSE_MAIN_REQUEST,
  CLOSE_MAIN_SUCCESS,
  CLOSE_MAIN_FAILURE,
  PUBLISH_MAIN_REQUEST,
  PUBLISH_MAIN_SUCCESS,
  PUBLISH_MAIN_FAILURE,
} from '../actions/main';

import type { MainStatusAction } from '../actions/main';

export type MainStatus = {
  isFetching: boolean;
  canStack: boolean;
  status: {
    status?: string;
    updatedAt?: string;
  };
  error: Error | undefined;
};

const defaultState: MainStatus = {
  isFetching: false,
  canStack: false,
  status: {},
  error: undefined,
};

const status = produce((state: MainStatus, action: MainStatusAction) => {
  switch (action.type) {
    case STATUS_MAIN_REQUEST:
      state.isFetching = true;
      break;
    case STATUS_MAIN_SUCCESS:
      state.isFetching = false;
      state.canStack = true;
      state.status = action.payload.status;
      break;
    case STATUS_MAIN_FAILURE:
      state.isFetching = false;
      state.canStack = false;
      state.error = action.payload.error;
      break;
    case PUBLISH_MAIN_REQUEST:
      state.isFetching = true;
      break;
    case PUBLISH_MAIN_SUCCESS:
      state.isFetching = false;
      break;
    case PUBLISH_MAIN_FAILURE:
      state.isFetching = false;
      break;
    case CLOSE_MAIN_REQUEST:
      state.isFetching = true;
      break;
    case CLOSE_MAIN_SUCCESS:
      state.isFetching = false;
      break;
    case CLOSE_MAIN_FAILURE:
      state.isFetching = false;
  }
}, defaultState);

export default status;
