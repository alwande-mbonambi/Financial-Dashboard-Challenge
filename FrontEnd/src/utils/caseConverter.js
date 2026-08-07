
function snakeToCamel(key) {
  return key.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}

export function toCamelCase(input) {
  if (Array.isArray(input)) {
    return input.map(toCamelCase);
  }
  if (input !== null && typeof input === 'object' && !(input instanceof Date)) {
    return Object.fromEntries(
      Object.entries(input).map(([key, value]) => [snakeToCamel(key), toCamelCase(value)]),
    );
  }
  return input;
}

// Converts every key in an object (or array of objects) from snake_case
// to camelCase, recursively. Used by every function in src/api/ to
// translate the backend's raw response shape into what DataContext.jsx
// and every component expects in the Frontend prototype that i made before the backend. 