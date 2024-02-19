const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

async function scrapeAmazon(keyword) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(`https://www.amazon.com/s?k=${keyword}`);
    await page.waitForSelector('div[data-component-type="s-search-result"]');

    const products = await page.evaluate(() => {
        let results = [];
        const items = document.querySelectorAll('div[data-component-type="s-search-result"]');
        items.forEach(item => {
            const title = item.querySelector('h2').textContent.trim();
            const description = item.querySelector('.a-size-base').textContent.trim();
            const rating = (item.querySelector('.a-icon-star-small .a-icon-alt') || {}).textContent.trim() || 'Not Available';
            const reviews = (item.querySelector('.a-size-base').textContent.match(/\d+/) || ['0'])[0];
            const price = (item.querySelector('.a-offscreen') || item.querySelector('.a-price')).textContent.trim();
            results.push({ title, description, rating, reviews, price });
        });
        return results;
    });

    await browser.close();
    return products.slice(0, 4);
}

app.get('/search', async (req, res) => {
    const keyword = req.query.keyword;
    if (!keyword) {
        return res.status(400).json({ error: 'Keyword is required' });
    }

    try {
        const products = await scrapeAmazon(keyword);
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch products from Amazon' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

