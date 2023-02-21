import { describe, test } from "vitest";
import { parseBundledFIle } from "../src/main.js";
import { allTestHars } from "./test-utils.js";

describe("Snapshots and validity", async () => {
  const hars = allTestHars();
  await Promise.all(
    hars.map(async (entry) => {
      const { file, contents } = entry;
      const spec = await parseBundledFIle(contents);
      test(`Sample ${file} matches snapshot`, ({ expect }) => {
        expect(spec).toMatchSnapshot();
      });
    }),
  );
});
