const sanitize = require('sanitize-html');

function validateAndSanitizeInput(input) {
  // Perform input validation, e.g. checking the input length, format, etc.
  if (typeof input !== 'string' || input.length > 100) {
    throw new Error('Invalid input');
  }

  // Sanitize the input to remove unsafe characters and HTML tags
  const sanitizedInput = sanitize(input, {
    allowedTags: [], // Disallow all HTML tags
    allowedAttributes: {}, // Disallow all attributes
  });

  return sanitizedInput;
}

module.exports = validateAndSanitizeInput;