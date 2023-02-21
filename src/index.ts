import jsdom from "jsdom";
import * as path from "path";
import { axiosClient } from "./axiosClient.js";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import Crawler from "crawler";
import { parseBundledFIle } from "./main.js";

const { JSDOM } = jsdom;

const args = yargs(hideBin(process.argv))
  .options({
    url: { type: "string", alias: "u", demandOption: true },
    dir: { type: "string", demandOption: true, alias: "d" },
    crawl: { type: "boolean", alias: "c", default: false },
    verbose: { type: "boolean", alias: "v", default: false },
  })
  .parseSync();

const BASE_URL = args.url;
const OUT_DIR = args.dir;

const fetchAndParseJsFile = async (url: string) => {
  const { data } = await axiosClient.get(url);
  await parseBundledFIle(data);
};

const run = async (baseUrl: string) => {
  if (!BASE_URL || !OUT_DIR) {
    console.error("Must pass url as first argument and directory to save into as second");
    process.exit(1);
  }
  const { data, request } = await axiosClient.get(baseUrl);
  const dom = new JSDOM(data);
  if (!dom) {
    console.error("Invalid DOM");
    process.exit(1);
  }
  const links = dom.window.document.querySelectorAll("script");
  const srcList: string[] = [];
  links.forEach((l) => {
    const src = l.src;
    if (src && request) {
      if (src.startsWith("//")) {
        srcList.push(`${request.protocol || "https:"}${src}`);
      } else {
        srcList.push(src);
      }
    }
  });

  if (!srcList.length) {
    console.log("No sources found, bailing");
    process.exit(0);
  }

  for (const s of srcList) {
    try {
      if (s.startsWith("http:") || s.startsWith("https:")) {
        await fetchAndParseJsFile(s);
      } else {
        const parsedUrl = new URL(baseUrl);
        parsedUrl.pathname = s?.startsWith("/") ? s : path.join(parsedUrl.pathname, s);
        await fetchAndParseJsFile(parsedUrl.toString());
      }
    } catch (e) {
      console.error(`Error parsing source ${s}`);
      console.error(e);
    }
  }
  console.error(`Done`);
};
if (args.crawl) {
  console.log(`Crawling ${BASE_URL}`);

  const urls = new Set<string>();
  const c = new Crawler({
    maxConnections: 10,
    // This will be called for each crawled page
    callback(error, res, done) {
      if (error) {
        return done();
      }
      if (!res.$) {
        return done();
      }
      const anchorTags = res.$("a");
      const urlsOnPage = (Array.from(anchorTags) as cheerio.TagElement[])
        .map((l) => l.attribs?.href)
        .filter((l) => l && l.startsWith(BASE_URL));
      const unique = [
        ...new Set(
          urlsOnPage.map((l) => {
            const parsed = new URL(l);
            parsed.hash = "";
            parsed.search = "";
            return parsed.href;
          }),
        ),
      ];
      unique.forEach((u) => {
        if (!urls.has(u)) {
          urls.add(u);
          c.queue(u);
        }
      });
      if (res?.options?.uri) {
        urls.add(res.options.uri);
      }
      done();
    },
  });

  c.on("drain", async () => {
    for (const url of urls) {
      await run(url);
    }
  });

  // Queue just one URL, with default callback
  c.queue(BASE_URL);
} else {
  run(BASE_URL);
}
