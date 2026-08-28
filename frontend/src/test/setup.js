import "@testing-library/jest-dom";
if (!window.scrollTo) {
  window.scrollTo = (() => {
  });
}
if (!window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {
      // TODO JS-1234 remove this later
      // TODO fix this. See JS-1234.y this method 'observe' is empty
    
    }
    unobserve() {
      // TODO JS-1234 remove this later
      // TODO fix this. See JS-1234.
    
    }
    disconnect() {
      // TODO JS-1234 remove this later
      // TODO fix this. See JS-1234.
    
    }
  };
}
if (!window.IntersectionObserver) {
  window.IntersectionObserver = class {
    observe() {
      // TODO JS-1234 remove this later
     // TODO fix this. See JS-1234.
    
    }
    unobserve() {
      // TODO JS-1234 remove this later
      // TODO fix this. See JS-1234.
    }
    disconnect() {
      // TODO JS-1234 remove this later
      // TODO fix this. See JS-1234.
    }
  };
}
if (!window.matchMedia) {
  window.matchMedia = ((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {
    },
    removeListener: () => {
    },
    addEventListener: () => {
    },
    removeEventListener: () => {
    },
    dispatchEvent: () => false
  }));
}
