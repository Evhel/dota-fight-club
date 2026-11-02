import { rename, writeFile } from "node:fs/promises";

await rename("dist-pages/index.pages.html", "dist-pages/index.html");
await writeFile("dist-pages/.nojekyll", "");
await writeFile("dist-pages/404.html", `<!doctype html><html lang="ru"><meta charset="utf-8"><title>Бойцовский клуб Dota 2</title>
<script>
const base = '/dota-fight-club';
const route = location.pathname.slice(base.length) + location.search + location.hash;
location.replace(base + '/?__route=' + encodeURIComponent(route));
</script><p>Открываем страницу клуба…</p></html>`);
