/// <reference types="vite/client" />

type StringTuneInstance = ReturnType<
  (typeof import("@fiddle-digital/string-tune"))["default"]["getInstance"]
>;

declare global {
  interface Window {
    _lenis?: import("lenis").default;
    _stringTune?: StringTuneInstance;
  }
}

export {};
