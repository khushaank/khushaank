# Khushaank Gupta

A static personal website for **https://khushaankgupta.qzz.io**. The premium design is now `index.html`; its shared visual styles live in `styles.css`. No build step or dependencies are required.

## Pages

- `/` — homepage
- `/404.html` — custom error page, excluded from indexing

The sitemap lists only the homepage, which has a title, description, canonical URL, social preview metadata, and JSON-LD structured data. The 404 page has `noindex` and is omitted from the sitemap. It uses a plain white layout with the error number, a vertical divider, and the message “This page could not be found.”

## Check and preview

Run `node scripts/check-site.mjs` to check page metadata, local links, structured data, crawl files, and error-page handling. It uses only Node's standard library.

Run `node scripts/serve.mjs` and open `http://127.0.0.1:4173` for a local preview. Stop the server with Ctrl+C. The preview serves only the public website files and returns the custom 404 page for unknown URLs. It is a development helper, not a production server.

Use a server rather than opening HTML files directly, because root-relative links also need to work when the 404 page is served at a missing nested URL.

## Publish

Deploy this directory as a static website, with `index.html` as the entry point. Configure the host to serve `404.html` with HTTP status **404** for unknown URLs. Avoid a single-page-app fallback that returns the homepage with status 200 for missing pages.

For GitHub Pages, publish the repository root. `CNAME` records the intended custom domain and `.nojekyll` keeps the site static. Configure the custom domain and HTTPS in the hosting dashboard and point the domain's DNS to that host. These local files do not change DNS or deploy the website.

After deployment:

1. Verify the domain uses HTTPS and redirects other hostnames to `https://khushaankgupta.qzz.io`.
2. Check `/robots.txt`, `/sitemap.xml`, and a nonexistent URL such as `/missing-page`.
3. Verify domain ownership in Google Search Console and submit `https://khushaankgupta.qzz.io/sitemap.xml`.
4. Inspect the homepage in Search Console and test its structured data with Google's Rich Results Test. Metadata and sitemaps help discovery; indexing and search presentation are determined by search engines.

If the domain changes, update canonical and social URLs, JSON-LD, `sitemap.xml`, `robots.txt`, and `CNAME` together.

## References

- [Google: canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Google: sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Google: profile-page structured data](https://developers.google.com/search/docs/appearance/structured-data/profile-page)
- [GitHub Pages: custom 404 pages](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-custom-404-page-for-your-github-pages-site)
