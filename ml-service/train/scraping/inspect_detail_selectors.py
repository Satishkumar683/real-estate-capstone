"""
Inspect one 99acres property DETAIL page to find the current selectors
for price, area, bedrooms, bathrooms, address, etc. The old ones
(#pdPrice2, #factArea, #bedRoomNum...) are likely stale after 99acres'
redesign, same as the listing page selectors were.
"""

import time
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

# Paste in a real property detail link you saw from the listing scrape,
# or leave this one (from the example section you shared) to test.
DETAIL_URL = 'https://www.99acres.com/3-bhk-bedroom-apartment-flat-for-sale-in-sector-63a-gurgaon-3000-sqft-spid-L92571590'

options = Options()
options.add_argument('--start-maximized')
options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
                      'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36')
options.add_argument('--disable-blink-features=AutomationControlled')
options.add_argument('--disable-gpu')
options.add_argument('--no-sandbox')
options.add_experimental_option('excludeSwitches', ['enable-automation'])
options.add_experimental_option('useAutomationExtension', False)

driver = webdriver.Chrome(
    service=Service(ChromeDriverManager().install()),
    options=options
)
driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
    'source': "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
})

print(f"Loading: {DETAIL_URL}")
driver.get(DETAIL_URL)
time.sleep(5)

html = driver.page_source
with open('detail_page.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("Saved full page to detail_page.html")

soup = BeautifulSoup(html, 'html.parser')

# Look for elements whose id or class hints at the fields we need
keywords = ['price', 'area', 'bedroom', 'bathroom', 'balcony', 'address',
            'floor', 'facing', 'possession', 'description', 'furnish', 'propid', 'prop_id']

print("\n--- Candidate elements (id/class contains a keyword) ---")
seen = set()
for el in soup.find_all(True):
    identifier = (el.get('id') or '') + ' ' + ' '.join(el.get('class', []))
    identifier_lower = identifier.lower()
    if any(k in identifier_lower for k in keywords):
        text = el.get_text(strip=True)[:60]
        key = (el.name, el.get('id'), tuple(el.get('class', [])))
        if text and key not in seen:
            seen.add(key)
            print(f"<{el.name}> id={el.get('id')} class={el.get('class')} text='{text}'")

input("\nPress Enter to close browser...")
driver.quit()