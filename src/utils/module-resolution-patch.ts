// Module resolution patch to fix trailing space bug in shaclc-write package
// This patches Node's Module._resolveFilename to handle './property-param ' (with trailing space)

// @ts-ignore - Deno's Node compatibility
if (typeof require !== "undefined" && require("module")) {
  const Module = require("module");
  const originalResolveFilename = Module._resolveFilename;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type ModuleParent = any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type ModuleOptions = any;

  Module._resolveFilename = function (
    request: string,
    parent: ModuleParent,
    isMain: boolean,
    options?: ModuleOptions,
  ) {
    // Fix trailing space in module paths
    const fixedRequest = request.trimEnd();
    if (fixedRequest !== request) {
      try {
        return originalResolveFilename.call(
          this,
          fixedRequest,
          parent,
          isMain,
          options,
        );
      } catch {
        // Fall back to original if fixed path doesn't work
      }
    }
    return originalResolveFilename.call(this, request, parent, isMain, options);
  };
}
