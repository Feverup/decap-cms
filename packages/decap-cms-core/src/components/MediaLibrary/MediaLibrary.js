import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { connect } from 'react-redux';
import { orderBy, map } from 'lodash';
import { translate } from 'react-polyglot';
import fuzzy from 'fuzzy';
import { basename, fileExtension } from 'decap-cms-lib-util';

import {
  loadMedia as loadMediaAction,
  persistMedia as persistMediaAction,
  deleteMedia as deleteMediaAction,
  insertMedia as insertMediaAction,
  loadMediaDisplayURL as loadMediaDisplayURLAction,
  closeMediaLibrary as closeMediaLibraryAction,
} from '../../actions/mediaLibrary';
import { selectMediaFiles } from '../../reducers/mediaLibrary';
import MediaLibraryModal, { fileShape } from './MediaLibraryModal';

/**
 * Extensions used to determine which files to show when the media library is
 * accessed from an image insertion field.
 */
const IMAGE_EXTENSIONS_VIEWABLE = [
  'jpg',
  'jpeg',
  'webp',
  'gif',
  'png',
  'bmp',
  'tiff',
  'svg',
  'avif',
];
const IMAGE_EXTENSIONS = [...IMAGE_EXTENSIONS_VIEWABLE];

class MediaLibrary extends React.Component {
  static propTypes = {
    isVisible: PropTypes.bool,
    loadMediaDisplayURL: PropTypes.func,
    displayURLs: ImmutablePropTypes.map,
    canInsert: PropTypes.bool,
    files: PropTypes.arrayOf(PropTypes.shape(fileShape)).isRequired,
    dynamicSearch: PropTypes.bool,
    dynamicSearchActive: PropTypes.bool,
    forImage: PropTypes.bool,
    value: PropTypes.string,
    validation: ImmutablePropTypes.map,
    isLoading: PropTypes.bool,
    isPersisting: PropTypes.bool,
    isDeleting: PropTypes.bool,
    hasNextPage: PropTypes.bool,
    isPaginating: PropTypes.bool,
    privateUpload: PropTypes.bool,
    config: ImmutablePropTypes.map,
    loadMedia: PropTypes.func.isRequired,
    dynamicSearchQuery: PropTypes.string,
    page: PropTypes.number,
    persistMedia: PropTypes.func.isRequired,
    deleteMedia: PropTypes.func.isRequired,
    insertMedia: PropTypes.func.isRequired,
    closeMediaLibrary: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
  };

  static defaultProps = {
    files: [],
  };

  /**
   * The currently selected file and query are tracked in component state as
   * they do not impact the rest of the application.
   */
  state = {
    selectedFile: {},
    query: '',
    isPersisted: false,
  };

  componentDidMount() {
    this.props.loadMedia();
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    /**
     * We clear old state from the media library when it's being re-opened
     * because, when doing so on close, the state is cleared while the media
     * library is still fading away.
     */
    const isOpening = !this.props.isVisible && nextProps.isVisible;
    if (isOpening) {
      this.setState({ selectedFile: {}, query: '' });
    }

    if (this.state.isPersisted) {
      this.setState({
        selectedFile: nextProps.files[0],
        isPersisted: false,
      });
    }
  }

  componentDidUpdate(prevProps) {
    const isOpening = !prevProps.isVisible && this.props.isVisible;

    if (isOpening && prevProps.privateUpload !== this.props.privateUpload) {
      this.props.loadMedia({ privateUpload: this.props.privateUpload });
    }

    if (this.state.isPersisted) {
      this.setState({
        selectedFile: this.props.files[0],
        isPersisted: false,
      });
    }
  }

  loadDisplayURL = file => {
    const { loadMediaDisplayURL } = this.props;
    loadMediaDisplayURL(file);
  };

  /**
   * Filter an array of file data to include only images.
   */
  filterImages = files => {
    return this.filterFiles(files, IMAGE_EXTENSIONS);
  };

  /**
   * Filter an array of file data to include only extensions specified.
   */
  filterFiles = (files, extensions) => {
    return files.filter(file => {
      const ext = fileExtension(file.name).toLowerCase();
      return extensions.includes(ext);
    });
  };

  /**
   * Transform file data for table display.
   */
  toTableData = files => {
    const tableData =
      files &&
      files.map(({ key, name, id, size, path, queryOrder, displayURL, draft }) => {
        const ext = fileExtension(name).toLowerCase();
        return {
          key,
          id,
          name,
          path,
          type: ext.toUpperCase(),
          size,
          queryOrder,
          displayURL,
          draft,
          isImage: IMAGE_EXTENSIONS.includes(ext),
          isViewableImage: IMAGE_EXTENSIONS_VIEWABLE.includes(ext),
        };
      });

    /**
     * Get the sort order for use with `lodash.orderBy`, and always add the
     * `queryOrder` sort as the lowest priority sort order.
     */
    const { sortFields } = this.state;
    const fieldNames = map(sortFields, 'fieldName').concat('queryOrder');
    const directions = map(sortFields, 'direction').concat('asc');
    return orderBy(tableData, fieldNames, directions);
  };

  loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  getAspectRatio = (width, height) => {
    function gcd(width, height) {
      return (height == 0) ? width : gcd(height, width % height);
    }
    const gcdValue = gcd(width, height);
    return `${width / gcdValue}:${height / gcdValue}`
  }

  getRoundAspectRatio = (width, height) => {
    const ratio = width / height;
    return Math.round(ratio * 10) / 10;
  }

  getDisplayURL = (file) => {
    if (!file) return

    const { displayURL } = file;

    if (typeof displayURL === 'string') return displayURL;
    const isFile = file instanceof File;
    if (isFile) return URL.createObjectURL(file);

    const { displayURLs } = this.props;
    const loadedDisplayURLs = displayURLs.toJS();
    return loadedDisplayURLs[displayURL.id]?.url;
  }

  validateFile = async (file) => {
    const { files: currentFiles, forImage, t, validation, value, } = this.props;

    if (!validation) return file;

    const fileExtensions = validation.get('file_extensions')?.toJS();
    if (fileExtensions && !fileExtensions.find(extension => new RegExp(`.*${extension}$`).test(file.name))) {
      return window.alert(
        t('mediaLibrary.mediaLibrary.fileNamePatternError', {
          pattern: fileExtensions.join(),
        }),
      );
    }

    const fileNamePattern = validation.get('file_name_pattern');
    if (fileNamePattern && !(new RegExp(fileNamePattern).test(file.name))) {
      return window.alert(
        t('mediaLibrary.mediaLibrary.fileNamePatternError', {
          pattern: fileNamePattern,
        }),
      );
    }

    const keepFileName = validation.get('keep_file_name');
    if (keepFileName && value) {
      const isFile = file instanceof File;
      if (isFile) {
        const valueName = basename(value);
        const fileModuleName = valueName.replace(/^([^_]*).*/, "$1_");
        const fileNameRegex = new RegExp(`^${fileModuleName}`);
        if (!fileNameRegex.test(file.name)) {
          return window.alert(
            t('mediaLibrary.mediaLibrary.fileNamePatternError', {
              pattern: `${fileModuleName}name`,
            })
          );

        }
      }
    }

    const maxFileSize = validation.get('max_file_size');
    if (maxFileSize && file.size > maxFileSize * 100) {
      return window.alert(
        t('mediaLibrary.mediaLibrary.fileTooLarge', {
          size: Math.floor(maxFileSize),
        }),
      );
    }

    const imageValidation = forImage && validation.get('images')?.toJS();
    if (imageValidation) {
      const {
        aspect_ratio: aspectRatio,
        keep_aspect_ratio: keepAspectRatio,
        max_width: maxWidth,
        max_height: maxHeight,
        min_width: minWidth,
        min_height: minHeight,
      } = imageValidation;


      const displayURL = this.getDisplayURL(file);
      const fileImage = await this.loadImage(displayURL);

      if (aspectRatio) {
        const aspectRatioToValid = this.getAspectRatio(fileImage.width, fileImage.height);

        if (aspectRatio !== aspectRatioToValid) {
          return window.alert(`${file.name} must have an aspect ratio of ${aspectRatio}.`);
        }
      }

      if (keepAspectRatio && value) {
        const valueName = basename(value);
        const currentFile = currentFiles && currentFiles.find(findFile => findFile.name === valueName);
        if (currentFile) {
          const displayURL = this.getDisplayURL(currentFile);
          const existingImage = await this.loadImage(displayURL);

          const currentRoundAspectRatio = this.getRoundAspectRatio(existingImage.width, existingImage.height);
          const fileRoundAspectRatio = this.getRoundAspectRatio(fileImage.width, fileImage.height);
          if (currentRoundAspectRatio !== fileRoundAspectRatio) {
            return window.alert(`${file.name} should have a size of ${existingImage.width}x${existingImage.height} the current size is ${fileImage.width}x${fileImage.height}.`);
          }
        }
      }

      if (maxWidth && fileImage.width > maxWidth) {
        return window.alert(`${file.name} must have a max width of ${maxWidth}.`)
      }

      if (maxHeight && fileImage.height > maxHeight) {
        return window.alert(`${file.name} must have a max height of ${maxHeight}.`)
      }

      if (minWidth && fileImage.width < minWidth) {
        return window.alert(`${file.name} must have a min width of ${minWidth}.`)
      }

      if (minHeight && fileImage.height < minHeight) {
        return window.alert(`${file.name} must have a min height of ${minHeight}.`)
      }
    }

    return file;
  }

  handleClose = () => {
    this.props.closeMediaLibrary();
  };

  /**
   * Toggle asset selection on click.
   */
  handleAssetClick = async asset => {
    const isSameFile = this.state.selectedFile.key === asset.key;
    const selectedFile = isSameFile ? {} : asset;
    if (!isSameFile) {
      const file = await this.validateFile(selectedFile);
      if (!file) return;
    }
    this.setState({ selectedFile });
  };

  /**
   * Upload a file.
   */
  handlePersist = async event => {
    /**
     * Stop the browser from automatically handling the file input click, and
     * get the file for upload, and retain the synthetic event for access after
     * the asynchronous persist operation.
     */
    event.persist();
    event.stopPropagation();
    event.preventDefault();
    const { forImage, persistMedia, privateUpload, field, validation, } = this.props;
    const { files: fileList } = event.dataTransfer || event.target;
    const files = [...fileList];
    const file = await this.validateFile(files[0]);

    if (!file) return;

    await persistMedia(file, { forImage, privateUpload, field, validation });

    const selectedFile = this.props.files[0];
    if (selectedFile) {
      this.setState({ selectedFile, isPersisted: true });

      this.scrollToTop();

      event.target.value = null;
    }
  };

  /**
   * Stores the public path of the file in the application store, where the
   * editor field that launched the media library can retrieve it.
   */
  handleInsert = () => {
    const { selectedFile } = this.state;
    const { path } = selectedFile;
    const { insertMedia, field } = this.props;
    insertMedia(path, field);
    this.handleClose();
  };

  /**
   * Removes the selected file from the backend.
   */
  handleDelete = () => {
    const { selectedFile } = this.state;
    const { files, deleteMedia, privateUpload, t } = this.props;
    if (!window.confirm(t('mediaLibrary.mediaLibrary.onDelete'))) {
      return;
    }
    const file = files.find(file => selectedFile.key === file.key);
    deleteMedia(file, { privateUpload }).then(() => {
      this.setState({ selectedFile: {} });
    });
  };

  /**
   * Downloads the selected file.
   */
  handleDownload = () => {
    const { selectedFile } = this.state;
    const { displayURLs } = this.props;
    const url = displayURLs.getIn([selectedFile.id, 'url']) || selectedFile.url;
    if (!url) {
      return;
    }

    const filename = selectedFile.name;

    const element = document.createElement('a');
    element.setAttribute('href', url);
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
    this.setState({ selectedFile: {} });
  };

  /**
   *
   */

  handleLoadMore = () => {
    const { loadMedia, dynamicSearchQuery, page, privateUpload } = this.props;
    loadMedia({ query: dynamicSearchQuery, page: page + 1, privateUpload });
  };

  /**
   * Executes media library search for implementations that support dynamic
   * search via request. For these implementations, the Enter key must be
   * pressed to execute search. If assets are being stored directly through
   * the GitHub backend, search is in-memory and occurs as the query is typed,
   * so this handler has no impact.
   */
  handleSearchKeyDown = async event => {
    const { dynamicSearch, loadMedia, privateUpload } = this.props;
    if (event.key === 'Enter' && dynamicSearch) {
      await loadMedia({ query: this.state.query, privateUpload });
      this.scrollToTop();
    }
  };

  scrollToTop = () => {
    this.scrollContainerRef.scrollTop = 0;
  };

  /**
   * Updates query state as the user types in the search field.
   */
  handleSearchChange = event => {
    this.setState({ query: event.target.value });
  };

  /**
   * Filters files that do not match the query. Not used for dynamic search.
   */
  queryFilter = (query, files) => {
    /**
     * Because file names don't have spaces, typing a space eliminates all
     * potential matches, so we strip them all out internally before running the
     * query.
     */
    const strippedQuery = query.replace(/ /g, '');
    const matches = fuzzy.filter(strippedQuery, files, { extract: file => file.name });
    const matchFiles = matches.map((match, queryIndex) => {
      const file = files[match.index];
      return { ...file, queryIndex };
    });
    return matchFiles;
  };

  render() {
    const {
      isVisible,
      canInsert,
      files,
      dynamicSearch,
      dynamicSearchActive,
      forImage,
      value,
      validation,
      isLoading,
      isPersisting,
      isDeleting,
      hasNextPage,
      isPaginating,
      privateUpload,
      displayURLs,
      t,
    } = this.props;

    return (
      <MediaLibraryModal
        isVisible={isVisible}
        canInsert={canInsert}
        files={files}
        dynamicSearch={dynamicSearch}
        dynamicSearchActive={dynamicSearchActive}
        forImage={forImage}
        value={value}
        validation={validation}
        isLoading={isLoading}
        isPersisting={isPersisting}
        isDeleting={isDeleting}
        hasNextPage={hasNextPage}
        isPaginating={isPaginating}
        privateUpload={privateUpload}
        query={this.state.query}
        selectedFile={this.state.selectedFile}
        handleFilter={this.filterFiles}
        handleImageFilter={this.filterImages}
        handleQuery={this.queryFilter}
        toTableData={this.toTableData}
        handleClose={this.handleClose}
        handleSearchChange={this.handleSearchChange}
        handleSearchKeyDown={this.handleSearchKeyDown}
        handlePersist={this.handlePersist}
        handleDelete={this.handleDelete}
        handleInsert={this.handleInsert}
        handleDownload={this.handleDownload}
        setScrollContainerRef={ref => (this.scrollContainerRef = ref)}
        handleAssetClick={this.handleAssetClick}
        handleLoadMore={this.handleLoadMore}
        displayURLs={displayURLs}
        loadDisplayURL={this.loadDisplayURL}
        t={t}
      />
    );
  }
}

function mapStateToProps(state) {
  const { mediaLibrary } = state;
  const field = mediaLibrary.get('field');
  const validation = mediaLibrary.get('validation');
  const mediaLibraryProps = {
    isVisible: mediaLibrary.get('isVisible'),
    canInsert: mediaLibrary.get('canInsert'),
    files: selectMediaFiles(state, field),
    displayURLs: mediaLibrary.get('displayURLs'),
    dynamicSearch: mediaLibrary.get('dynamicSearch'),
    dynamicSearchActive: mediaLibrary.get('dynamicSearchActive'),
    dynamicSearchQuery: mediaLibrary.get('dynamicSearchQuery'),
    forImage: mediaLibrary.get('forImage'),
    value: mediaLibrary.get('value'),
    validation,
    isLoading: mediaLibrary.get('isLoading'),
    isPersisting: mediaLibrary.get('isPersisting'),
    isDeleting: mediaLibrary.get('isDeleting'),
    privateUpload: mediaLibrary.get('privateUpload'),
    config: mediaLibrary.get('config'),
    page: mediaLibrary.get('page'),
    hasNextPage: mediaLibrary.get('hasNextPage'),
    isPaginating: mediaLibrary.get('isPaginating'),
    field,
  };
  return { ...mediaLibraryProps };
}

const mapDispatchToProps = {
  loadMedia: loadMediaAction,
  persistMedia: persistMediaAction,
  deleteMedia: deleteMediaAction,
  insertMedia: insertMediaAction,
  loadMediaDisplayURL: loadMediaDisplayURLAction,
  closeMediaLibrary: closeMediaLibraryAction,
};

export default connect(mapStateToProps, mapDispatchToProps)(translate()(MediaLibrary));
