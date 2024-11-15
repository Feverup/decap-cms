import { produce } from 'immer';

import {
  STATUS_STACK_REQUEST,
  STATUS_STACK_SUCCESS,
  STATUS_STACK_FAILURE,
  CLOSE_STACK_REQUEST,
  CLOSE_STACK_SUCCESS,
  CLOSE_STACK_FAILURE,
  PUBLISH_STACK_REQUEST,
  PUBLISH_STACK_SUCCESS,
  PUBLISH_STACK_FAILURE,
} from '../actions/stack';

import type { StackStatusAction } from '../actions/stack';

export type StackStatus = {
  isFetching: boolean;
  canStack: boolean;
  status: {
    status?: string;
    updatedAt?: string;
  };
  error: Error | undefined;
};

const defaultState: StackStatus = {
  isFetching: false,
  canStack: false,
  status: {},
  error: undefined,
};

const status = produce((state: StackStatus, action: StackStatusAction) => {
  switch (action.type) {
    case STATUS_STACK_REQUEST:
      state.isFetching = true;
      break;
    case STATUS_STACK_SUCCESS:
      state.isFetching = false;
      state.canStack = true;
      state.status = action.payload.status;
      break;
    case STATUS_STACK_FAILURE:
      state.isFetching = false;
      state.canStack = false;
      state.error = action.payload.error;
      break;
    case PUBLISH_STACK_REQUEST:
      state.isFetching = true;
      break;
    case PUBLISH_STACK_SUCCESS:
      state.isFetching = false;
      break;
    case PUBLISH_STACK_FAILURE:
      state.isFetching = false;
      break;
    case CLOSE_STACK_REQUEST:
      state.isFetching = true;
      break;
    case CLOSE_STACK_SUCCESS:
      state.isFetching = false;
      break;
    case CLOSE_STACK_FAILURE:
      state.isFetching = false;
  }
}, defaultState);

export default status;
