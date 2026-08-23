export function validateNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    return `${fieldName} is required and must be a non-empty string.`;
  }
  return null;
}

export function validateProductPayload(payload) {
  const errors = [];

  if (payload.name !== undefined) {
    const error = validateNonEmptyString(payload.name, "name");
    if (error) errors.push(error);
  }

  if (payload.slug !== undefined) {
    const error = validateNonEmptyString(payload.slug, "slug");
    if (error) errors.push(error);
  }

  if (payload.category_id !== undefined) {
    const error = validateNonEmptyString(payload.category_id, "category_id");
    if (error) errors.push(error);
  }

  if (payload.price !== undefined) {
    const priceValue = Number(payload.price);
    if (!Number.isFinite(priceValue) || priceValue < 0) {
      errors.push("price must be a valid non-negative number.");
    }
  }

  if (payload.stock_status !== undefined) {
    const error = validateNonEmptyString(payload.stock_status, "stock_status");
    if (error) errors.push(error);
  }

  return errors;
}
