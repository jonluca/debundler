import * as espree from "espree";

export const parseBundledFIle = (code: string): Record<string, string> => {
  const fileMap: Record<string, string> = {};
  const ast = espree.parse(code);
  return fileMap;
};
