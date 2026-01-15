import puppeteer from 'puppeteer';
import * as OTPAuth from 'otpauth';
import https from 'https';

// Configuration
const LOGIN_URL = 'https://oss-incident.telkom.co.id/jw/web/userview/ticketIncidentService/ticketIncidentService/_/welcome';
const USERNAME = '93158327';
const PASSWORD = 'Intandw01@';
const SECRET_STRING = 'R7GJGPZRNP5RXREUGUCIKIDWIPOGSJXQ&issuer=insera-sso.telkom.co.id';

// Parse Secret
const SECRET = SECRET_STRING.split('&')[0];

// Helper: Fetch Server Time from Insera/OSS directly (Avoids external blocks)
function getNetworkTime() {
    return new Promise((resolve) => {
        console.log('Attempting to sync time with Insera Server...');
        const req = https.request('https://insera-sso.telkom.co.id/jw/web/login', { method: 'HEAD' }, (res) => {
            const dateStr = res.headers['date'];
            if (dateStr) {
                console.log('Server Time (Insera Header):', dateStr);
                const serverTime = new Date(dateStr).getTime();
                resolve(serverTime);
            } else {
                console.log('No Date header from Insera, trying Google...');
                // Fallback to Google
                const req2 = https.request('https://www.google.com', { method: 'HEAD' }, (res2) => {
                    if (res2.headers['date']) resolve(new Date(res2.headers['date']).getTime());
                    else resolve(Date.now());
                });
                req2.on('error', () => resolve(Date.now()));
                req2.end();
            }
        });
        req.on('error', (e) => {
            console.log('Insera Time check failed:', e.message);
            resolve(Date.now());
        });
        req.end();
    });
}

async function run() {
    console.log('Starting OSS Login Automation (JIT OTP + Time Sync)...');

    // 1. Setup TOTP Object (Don't generate yet)
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
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });

    const page = await browser.newPage();

    try {
        console.log('Navigating to login page...');
        await page.goto(LOGIN_URL, { waitUntil: 'networkidle0' });

        // CHECK FOR JOGET REDIRECT
        if (page.url().includes('/jw/setup')) {
            console.log('DETECTED: Redirected to Joget DX Setup page.');
            console.log('Clearing cache and cookies...');

            const client = await page.target().createCDPSession();
            await client.send('Network.clearBrowserCookies');
            await client.send('Network.clearBrowserCache');

            console.log('Cache cleared. Retrying navigation to Login...');
            await page.goto(LOGIN_URL, { waitUntil: 'networkidle0' });
        }

        // 3. Enter Credentials (Initial Attempt)
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
        try { await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }); } catch (e) { }
        let currentUrl = page.url();
        console.log('URL after login attempt:', currentUrl);

        // --- SEQUENTIAL LOGIC BLOCKS ---

        // A. HANDLE BLANK SSO PAGE
        if (currentUrl.includes('JwtSsoWebService')) {
            console.log('DETECTED: Stuck on JwtSsoWebService page.');
            console.log('Attempting manual navigation to Dashboard/Welcome...');
            await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });
            currentUrl = page.url();
            console.log('URL after manual redirect:', currentUrl);
        }

        // B. HANDLE LOCAL LOGIN FALLBACK
        if (currentUrl.includes('oss-incident') && (currentUrl.includes('/login') || currentUrl.includes('j_spring_security_check'))) {
            console.log('DETECTED: Back at Local OSS Login page.');
            console.log('Re-entering credentials for Local Fallback...');
            try {
                await page.waitForSelector('#j_username', { timeout: 5000 });
                await page.type('#j_username', USERNAME);
                await page.type('#j_password', PASSWORD);

                const arrowBtn = await page.$('input.waves-button-input[type="submit"]');
                if (arrowBtn) await arrowBtn.click();
                else await page.click('#openIDLogin');

                try { await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }); } catch (e) { }
                currentUrl = page.url();
            } catch (err) { console.log('Local login retry failed:', err.message); }
        }

        // C. HANDLE INSERA SSO FALLBACK
        if (currentUrl.includes('insera-sso') && !currentUrl.includes('jwt') && !currentUrl.includes('login_error')) {
            console.log('DETECTED: Redirected to Insera SSO Page.');
            console.log('Attempting to fill Insera SSO credentials...');
            try {
                await page.waitForSelector('#fake-username', { timeout: 5000 });

                // ROBUST FILL
                await page.evaluate((u, p) => {
                    const uField = document.querySelector('#j_username') || document.querySelector('input[name="j_username"]');
                    const pField = document.querySelector('#j_password') || document.querySelector('input[name="j_password"]');
                    if (uField) uField.value = u;
                    if (pField) pField.value = p;
                }, USERNAME, PASSWORD);

                await page.click('#fake-username', { clickCount: 3 });
                await page.keyboard.press('Backspace');
                await page.type('#fake-username', USERNAME, { delay: 50 });

                await page.click('#fake-password', { clickCount: 3 });
                await page.keyboard.press('Backspace');
                await page.type('#fake-password', PASSWORD, { delay: 50 });

                console.log('Clicking "I agree to Terms" checkbox...');
                try {
                    await page.evaluate(() => {
                        const cb = document.querySelector('#acceptTerms');
                        if (cb && !cb.checked) cb.click();
                    });
                } catch (e) { }

                console.log('Clicking Insera Login button...');
                await page.click('#fake-login');
                try { await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }); } catch (e) { }
                currentUrl = page.url();
                console.log('Insera SSO Login Submitted. New URL:', currentUrl);
            } catch (err) {
                console.log('Insera SSO retry failed:', err.message);
            }
        }

        // --- OTP HANDLING (JIT Generation) ---
        console.log('Checking for OTP Stage...');

        // GENERATE OTP NOW (Just-in-Time)
        console.log('Syncing Time and Generating TOTP...');
        const realTime = await getNetworkTime();
        const token = totp.generate({ timestamp: realTime });
        console.log('Generated TOTP:', token, 'based on time:', new Date(realTime).toString());

        try { await page.waitForNetworkIdle({ timeout: 5000 }); } catch (e) { }

        const otpFrameElement = await page.$('#jqueryDialogFrame');
        if (otpFrameElement) {
            console.log('DETECTED: OTP Iframe (#jqueryDialogFrame). Switching context...');
            const otpFrame = await otpFrameElement.contentFrame();

            if (otpFrame) {
                try {
                    await otpFrame.waitForSelector('#pin', { timeout: 5000 });
                    console.log('OTP Field Found in iframe! Entering token...');

                    await otpFrame.type('#pin', token);
                    await otpFrame.click('.form-button');

                    console.log('OTP Submitted. Waiting for final navigation...');
                    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 });
                    console.log('Final URL:', page.url());
                    console.log('You should be logged in now!');

                    await page.screenshot({ path: 'login_success.png' });
                } catch (e) {
                    console.log('Failed to interact with OTP frame:', e.message);
                    await page.screenshot({ path: 'otp_frame_error.png' });
                }
            }
        } else {
            console.log('No OTP Iframe found. Checking main page for OTP fields...');
            const otpInput = await page.$('input[name="otp"]') ||
                await page.$('input[name="code"]') ||
                await page.$('input[name="token"]') ||
                await page.$('input[name*="otp"]');
            if (otpInput) {
                await otpInput.type(token);
                await otpInput.press('Enter');
                await page.waitForNavigation({ waitUntil: 'networkidle0' });
                console.log('OTP Submitted. Final URL:', page.url());
            }
        }

    } catch (error) {
        console.error('Automation failed:', error);
        await page.screenshot({ path: 'automation_crash.png' });
    }
}

run();
