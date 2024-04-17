

declare global {
  interface String {
    lastPathComponent(): string;
  }
}


if (!String.prototype.lastPathComponent) {
  String.prototype.lastPathComponent = function () {

    const pathComponents = this.split('/');
    return pathComponents[pathComponents.length - 1];
  };
}

export {};
