import puppeteer from 'puppeteer';
import * as OTPAuth from 'otpauth';

// Configuration
const LOGIN_URL = 'https://oss-incident.telkom.co.id/jw/web/userview/ticketIncidentService/ticketIncidentService/_/welcome';
const USERNAME = '93158327';
const PASSWORD = 'Intandw01@';
const SECRET_STRING = 'R7GJGPZRNP5RXREUGUCIKIDWIPOGSJXQ&issuer=insera-sso.telkom.co.id';

// Parse Secret
const SECRET = SECRET_STRING.split('&')[0];

async function run() {
    console.log('Starting OSS Login Automation (SSO Priority + Cache Clear)...');

    // 1. Generate TOTP
    const totp = new OTPAuth.TOTP({
        issuer: 'insera-sso.telkom.co.id',
        label: USERNAME,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(SECRET)
    });

    const token = totp.generate();
    console.log('Generated TOTP:', token);

    // 2. Launch Browser
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });

    const page = await browser.newPage();

    try {
        console.log('Navigating to login page...');
        await page.goto(LOGIN_URL, { waitUntil: 'networkidle0' });

        // CHECK FOR JOGET REDIRECT (USER REQUEST)
        if (page.url().includes('/jw/setup')) {
            console.log('DETECTED: Redirected to Joget DX Setup page.');
            console.log('Clearing cache and cookies...');

            const client = await page.target().createCDPSession();
            await client.send('Network.clearBrowserCookies');
            await client.send('Network.clearBrowserCache');

            console.log('Cache cleared. Retrying navigation to Login...');
            await page.goto(LOGIN_URL, { waitUntil: 'networkidle0' });
        }

        // 3. Enter Credentials
        console.log('Entering credentials...');
        try {
            await page.waitForSelector('#j_username', { timeout: 10000 });
            await page.type('#j_username', USERNAME);

            await page.waitForSelector('#j_password', { timeout: 10000 });
            await page.type('#j_password', PASSWORD);

            // 4. Click Login - PRIORITIZE SSO
            console.log('Attempting login click...');

            const ssoBtn = await page.$('#openIDLogin');
            if (ssoBtn) {
                console.log('Found SSO Button (#openIDLogin). Clicking...');
                await ssoBtn.click();
            } else {
                console.log('SSO Button not found. Trying standard submit...');
                const submitBtn = await page.$('input.waves-button-input[type="submit"]');
                if (submitBtn) await submitBtn.click();
            }
        } catch (e) {
            console.log('Error identifying login fields. Taking screenshot...');
            await page.screenshot({ path: 'login_fields_error.png' });
            throw e;
        }

        // 5. Monitor Result
        console.log('Credentials submitted. Checking result...');

        try {
            await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 });
        } catch (e) {
            console.log('Navigation timeout or already loaded. Checking URL...');
        }

        const currentUrl = page.url();
        console.log('URL after login attempt:', currentUrl);

        if (currentUrl.includes('login_error=1')) {
            console.error('LOGIN FAILED: The page returned login_error=1.');
            await page.screenshot({ path: 'login_error.png' });
            console.log('Screenshot saved to login_error.png');
        } else {
            // 6. Handle TOTP
            console.log('Checking for OTP or Success...');

            try {
                await page.waitForFunction(() => {
                    return document.querySelector('input[name="otp"]') ||
                        document.querySelector('input[name="code"]') ||
                        document.querySelector('input[name="token"]') ||
                        document.querySelector('input[name*="otp"]') ||
                        document.querySelector('input[name="j_token"]') ||
                        location.href.includes('dashboard') ||
                        location.href.includes('welcome');
                }, { timeout: 5000 });
            } catch (e) { console.log('Wait for OTP selector timed out.'); }

            const otpInput = await page.$('input[name="otp"]') ||
                await page.$('input[name="code"]') ||
                await page.$('input[name="token"]') ||
                await page.$('input[name="j_token"]') ||
                await page.$('input[name*="otp"]');

            if (otpInput) {
                console.log('OTP Field Found! Entering token...');
                await otpInput.type(token);
                await otpInput.press('Enter');
                await page.waitForNavigation({ waitUntil: 'networkidle0' });
                console.log('OTP Submitted. Final URL:', page.url());
            } else {
                console.log('No obvious OTP field found.');
                if (page.url().includes('welcome') || page.url().includes('dashboard')) {
                    console.log('SUCCESS! You seem to be logged in.');
                } else {
                    console.log('Unsure of state. Taking screenshot.');
                    await page.screenshot({ path: 'unknown_state.png' });
                }
            }
        }

    } catch (error) {
        console.error('Automation failed:', error);
        await page.screenshot({ path: 'automation_crash.png' });
    }
}

run();
