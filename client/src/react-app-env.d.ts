/// <reference types="react-scripts" />

// 🚀 Industry-Grade Fix: Explicitly declare the layout schema for global stylesheets
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}