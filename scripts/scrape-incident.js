import puppeteer from 'puppeteer';
import * as OTPAuth from 'otpauth';
import https from 'https';
import fs from 'fs';

// --- CONFIGURATION ---
const LOGIN_URL = 'https://oss-incident.telkom.co.id/jw/web/userview/ticketIncidentService/ticketIncidentService/_/welcome';
const USERNAME = '';
const PASSWORD = '';
const SECRET_STRING = '';
const SECRET = SECRET_STRING ? SECRET_STRING.split('&')[0] : '';

const INC_TO_FIND = process.argv[2];

if (!INC_TO_FIND) {
    console.error('Usage: node scripts/scrape-incident.js <INC_NUMBER>');
    process.exit(1);
}

// --- HELPER: SERVER TIME SYNC ---
function getNetworkTime() {
    return new Promise((resolve) => {
        // console.log('Syncing time with Insera Server...');
        const req = https.request('https://insera-sso.telkom.co.id/jw/web/login', { method: 'HEAD' }, (res) => {
            if (res.headers['date']) resolve(new Date(res.headers['date']).getTime());
            else resolve(Date.now());
        });
        req.on('error', () => resolve(Date.now()));
        req.end();
    });
}

// --- MAIN FUNCTION ---
async function run() {
    // console.log(`Starting Scraping for Incident: ${INC_TO_FIND}`);

    // 1. Prepare OTP Object
    const totp = new OTPAuth.TOTP({
        issuer: 'insera-sso.telkom.co.id',
        label: USERNAME,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(SECRET)
    });

    // 2. Launch Browser
    const browser = await puppeteer.launch({
        headless: true, // Headless for API usage
        defaultViewport: null,
        args: ['--start-maximized', '--no-sandbox']
    });
    const page = await browser.newPage();

    try {
        // --- ROBUST LOGIN FLOW ---
        await page.goto(LOGIN_URL, { waitUntil: 'networkidle0' });

        if (page.url().includes('/jw/setup')) {
            const client = await page.target().createCDPSession();
            await client.send('Network.clearBrowserCookies');
            await client.send('Network.clearBrowserCache');
            await page.goto(LOGIN_URL, { waitUntil: 'networkidle0' });
        }

        try {
            if (await page.$('#j_username')) {
                await page.type('#j_username', USERNAME);
                await page.type('#j_password', PASSWORD);
                const ssoBtn = await page.$('#openIDLogin');
                if (ssoBtn) await ssoBtn.click();
                else await page.click('input[type="submit"]');
                try { await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 }); } catch (e) { }
            }
        } catch (e) { }

        let currentUrl = page.url();

        if (currentUrl.includes('JwtSsoWebService')) {
            await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });
            currentUrl = page.url();
        }

        if (currentUrl.includes('insera-sso') && !currentUrl.includes('jwt')) {
            await page.waitForSelector('#fake-username');
            await page.evaluate((u, p) => {
                const uField = document.querySelector('#j_username') || document.querySelector('input[name="j_username"]');
                const pField = document.querySelector('#j_password') || document.querySelector('input[name="j_password"]');
                if (uField) uField.value = u;
                if (pField) pField.value = p;
            }, USERNAME, PASSWORD);

            await page.type('#fake-username', USERNAME);
            await page.type('#fake-password', PASSWORD);
            try {
                await page.evaluate(() => {
                    const cb = document.querySelector('#acceptTerms');
                    if (cb && !cb.checked) cb.click();
                });
            } catch (e) { }
            await page.click('#fake-login');
            try { await page.waitForNavigation({ waitUntil: 'networkidle0' }); } catch (e) { }
        }

        const otpFrameElement = await page.$('#jqueryDialogFrame');
        if (otpFrameElement) {
            const serverTime = await getNetworkTime();
            const token = totp.generate({ timestamp: serverTime });
            const otpFrame = await otpFrameElement.contentFrame();
            await otpFrame.type('#pin', token);
            await otpFrame.click('.form-button');
            await page.waitForNavigation({ waitUntil: 'networkidle0' });
        }

        // --- DASHBOARD SEARCH ---
        try {
            await page.waitForSelector('input', { timeout: 15000 });
        } catch (e) { }

        const potentialSelectors = [
            'input[placeholder*="Find"]',
            'input[placeholder*="Search"]',
            '#quickSearchInput',
            'input.quickSearch',
            'form[action*="search"] input'
        ];

        let searchInput;
        for (const sel of potentialSelectors) {
            if (await page.$(sel)) {
                searchInput = await page.$(sel);
                break;
            }
        }

        if (searchInput) {
            await searchInput.type(INC_TO_FIND);
            await searchInput.press('Enter');

            // Wait for content update
            try {
                await page.waitForFunction(() => {
                    return document.body.innerText.includes('Service ID') ||
                        document.body.innerText.includes('Customer Name') ||
                        document.body.innerText.includes('Customer ID') ||
                        document.body.innerText.includes('Workzone');
                }, { timeout: 15000 });
            } catch (e) { }

            // --- SCRAPE DATA ---
            const scrapedData = await page.evaluate(() => {
                const data = {};

                const getRowValue = (labelText) => {
                    // Find label
                    const elements = Array.from(document.querySelectorAll('label, th, td, span, strong'));
                    const label = elements.find(el =>
                        el.innerText && el.innerText.trim() === labelText
                    );

                    if (!label) return null;

                    // 1. Check same container Inputs
                    let container = label.parentElement;
                    if (container.tagName === 'TD') container = container.parentElement;
                    if (container.tagName === 'LABEL') container = container.parentElement;

                    const inputs = container.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"])');
                    if (inputs.length > 0) return inputs[0].value;

                    // 2. Check nearby elements (Strict Text Filtering)
                    let next = label.nextElementSibling;
                    if (!next && label.parentElement) next = label.parentElement.nextElementSibling;

                    while (next) {
                        if (next.tagName !== 'SCRIPT' && next.tagName !== 'STYLE' && next.tagName !== 'BUTTON') {

                            const innerInput = next.querySelector('input:not([type="hidden"])');
                            if (innerInput && innerInput.value) return innerInput.value;

                            const text = next.innerText ? next.innerText.trim() : '';
                            // CRITICAL: Filter out code
                            if (text.length > 0 && !text.startsWith('$(') && !text.includes('function(') && !text.includes('var ') && !text.includes('const ')) {
                                return text;
                            }
                        }
                        next = next.nextElementSibling;
                    }

                    return null;
                };

                const rawCustomer = getRowValue('Customer ID') || getRowValue('Customer Name');
                if (rawCustomer) {
                    const parts = rawCustomer.split(/\s+/);
                    if (parts.length > 1 && !isNaN(parts[0])) {
                        data.customerName = parts.slice(1).join(' ');
                    } else {
                        data.customerName = rawCustomer;
                    }
                }

                data.serviceId = getRowValue('Service ID');
                data.serviceType = getRowValue('Service Type');
                data.workzone = getRowValue('Workzone');

                return data;
            });

            // OUTPUT PURE JSON for the server to parse
            console.log(JSON.stringify(scrapedData));

        } else {
            console.error('SEARCH_FAILED_NO_INPUT');
            process.exit(1);
        }

    } catch (e) {
        console.error(e);
        process.exit(1);
    }

    await browser.close();
}

run();
