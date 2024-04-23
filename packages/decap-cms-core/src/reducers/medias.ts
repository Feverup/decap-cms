import { produce } from 'immer';

import {
  ADD_ASSETS,
  ADD_ASSET,
  REMOVE_ASSETS,
  REMOVE_ASSET,
  LOAD_ASSET_REQUEST,
  LOAD_ASSET_SUCCESS,
  LOAD_ASSET_FAILURE,
  getEntryMediaFilePath,
  getEntryMapMediaFilePath,
  getMediaFilePath,
} from '../actions/media';

import type { MediasAction } from '../actions/media';
import type AssetProxy from '../valueObjects/AssetProxy';

export type Medias = {
  [path: string]: { asset: AssetProxy | undefined; isLoading: boolean; error: Error | null };
};

const defaultState: Medias = {};

const medias = produce((state: Medias, action: MediasAction) => {
  switch (action.type) {
    case ADD_ASSETS: {
      const { entry, assets } = action.payload;
      assets.forEach(asset => {
        const resolvedPath = getEntryMediaFilePath(entry, asset.path);
        state[resolvedPath] = { asset, isLoading: false, error: null };
      });
      break;
    }
    case ADD_ASSET: {
      const { entry, asset } = action.payload;
      const resolvedPath = getEntryMapMediaFilePath(entry, asset.path);
      state[resolvedPath] = { asset, isLoading: false, error: null };
      break;
    }
    case REMOVE_ASSETS: {
      Object.keys(state).forEach(path => {
        delete state[path];
      });
      break;
    }
    case REMOVE_ASSET: {
      const { entryPath, path } = action.payload;
      const resolvedPath = getMediaFilePath(entryPath, path);
      delete state[resolvedPath];
      break;
    }
    case LOAD_ASSET_REQUEST: {
      const { path } = action.payload;
      state[path] = state[path] || {};
      state[path].isLoading = true;
      break;
    }
    case LOAD_ASSET_SUCCESS: {
      const { path } = action.payload;
      state[path] = state[path] || {};
      state[path].isLoading = false;
      state[path].error = null;
      break;
    }
    case LOAD_ASSET_FAILURE: {
      const { path, error } = action.payload;
      state[path] = state[path] || {};
      state[path].isLoading = false;
      state[path].error = error;
    }
  }
}, defaultState);

export function selectIsLoadingAsset(state: Medias) {
  return Object.values(state).some(state => state.isLoading);
}

export default medias;
