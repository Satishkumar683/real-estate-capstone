"""
Diagnostic: use a real (visible) Chrome browser via Selenium to check
whether 99acres serves real content instead of an access-denied page.
"""

import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup

city = 'chandigarh'
page_number = 1
url = f'https://www.99acres.com/flats-in-{city}-ffid-page-{page_number}'

options = Options()
# NOT headless for this test - we want to visually inspect what loads
options.add_argument('--start-maximized')
options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
                      'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36')

# Basic anti-detection: hide the automation flag most sites check for
options.add_argument('--disable-blink-features=AutomationControlled')
options.add_experimental_option('excludeSwitches', ['enable-automation'])
options.add_experimental_option('useAutomationExtension', False)

driver = webdriver.Chrome(
    service=Service(ChromeDriverManager().install()),
    options=options
)

# Further hide navigator.webdriver via CDP before any page loads
driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
    'source': "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
})

print(f"Navigating to: {url}")
driver.get(url)

# Let the page fully load / run any JS challenge
time.sleep(5)

html = driver.page_source

with open('debug_page_selenium.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("Saved rendered HTML to debug_page_selenium.html")

lower_html = html.lower()
if 'access denied' in lower_html or 'forbidden' in lower_html:
    print("⚠️  Still blocked - access denied text present")
elif 'captcha' in lower_html:
    print("⚠️  Captcha challenge present - may need manual solve or longer wait")
else:
    soup = BeautifulSoup(html, 'html.parser')
    search_container = soup.select_one('div[data-label="SEARCH"]')
    if search_container:
        sections = search_container.select('section[data-hydration-on-demand="true"]')
        print(f"✓ Found SEARCH container with {len(sections)} property sections")
    else:
        print("⚠️  No block detected, but div[data-label=\"SEARCH\"] not found - "
              "HTML structure may have changed. Check debug_page_selenium.html manually.")

input("\nPress Enter to close the browser (inspect the window first if you want)...")
driver.quit()