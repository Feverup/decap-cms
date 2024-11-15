import React from 'react';
import PropTypes from 'prop-types';

export function FileUploadButton({ label, acceptFiles, imagesOnly, onChange, disabled, className }) {
  return (
    <label tabIndex={'0'} className={`nc-fileUploadButton ${className || ''}`}>
      <span>{label}</span>
      <input
        type="file"
        accept={acceptFiles || (imagesOnly ? 'image/*' : '*/*')}
        onChange={onChange}
        disabled={disabled}
      />
    </label>
  );
}

FileUploadButton.propTypes = {
  className: PropTypes.string,
  label: PropTypes.string.isRequired,
  acceptFiles: PropTypes.string,
  imagesOnly: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};
