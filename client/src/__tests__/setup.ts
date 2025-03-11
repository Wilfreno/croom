import "@testing-library/jest-dom/vitest";

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

process.env.NEXT_PUBLIC_SERVER = "http://localhost:8000";
process.env.CLIENT_URL = "http://localhost:3000";
process.env.UPLOADTHING_TOKEN = "mock-token";
