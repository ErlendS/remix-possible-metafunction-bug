import { test, expect } from "@playwright/test";

import { PlaywrightFixture } from "./helpers/playwright-fixture.js";
import type { Fixture, AppFixture } from "./helpers/create-fixture.js";
import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";

let fixture: Fixture;
let appFixture: AppFixture;

test.beforeEach(async ({ context }) => {
  await context.route(/_data/, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 50));
    route.continue();
  });
});

test.beforeAll(async () => {
  fixture = await createFixture({
    files: {
      "app/routes/_index.tsx": js`
        import { type MetaFunction, json } from "@remix-run/node";
        import { useLoaderData, Link } from "@remix-run/react";

        export const meta: MetaFunction<typeof loader> = (loader) => {
          const metaArray = loader.data?.metaArray
          if (metaArray) {
            console.log(metaArray)
            return metaArray;
          }
          return []
        };

        export async function loader() {
          const metaArray = [
            {
              tagName: 'link',
              rel: 'icon',
              href: 'https://remix.run/favicon-32.png',
              type: 'image/png',
            },
          ];
        
          return json({ metaArray });
        }

        export default function Index() {
          return (
            <main>
              <h1>Welcome to Remix</h1>
            </main>
          );
        }
      `,
    },
  });

  appFixture = await createAppFixture(fixture);
});

test.afterAll(() => {
  appFixture.close();
});

test("Meta component renders meta links with property tagName:'link' as link tags", async ({
  page,
}) => {
  let app = new PlaywrightFixture(appFixture, page);

  await app.goto("/", true);
  let html = await app.getHtml();

  expect(html).toContain(
    '<link rel="icon" href="https://remix.run/favicon-32.png" type="image/png" />'
  );
});
