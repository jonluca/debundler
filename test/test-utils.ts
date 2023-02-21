import { fileURLToPath } from "url";
import path, { dirname } from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataDir = path.join(__dirname, "data");
const readDirectory = (dir: string): { file: string; contents: string }[] => {
  const files = fs.readdirSync(dir);
  const all = [];
  for (const file of files) {
    const filePath = path.join(dir, file);
    const contents = fs.readFileSync(filePath, { encoding: "utf8" }) as string;
    all.push({ file, contents });
  }
  return all;
};

const readFile = (name: string): string => fs.readFileSync(path.join(dataDir, name), { encoding: "utf8" }) as string;

export const githubPolyfillSimple = () => readFile("github-polyfill.js");
export const allTestHars = () => readDirectory(path.join(__dirname, "data"));
