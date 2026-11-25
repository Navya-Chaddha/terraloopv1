const MAX_IMAGE_DATA_URL_LENGTH = 850_000;

function isValidImageDataUrl(value) {
  return typeof value === 'string'
    && value.length <= MAX_IMAGE_DATA_URL_LENGTH
    && /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value);
}

module.exports = { isValidImageDataUrl };
