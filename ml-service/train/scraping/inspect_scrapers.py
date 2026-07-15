"""
Inspect the actual HTML of one property listing section on 99acres,
so we can find the CURRENT class names/selectors (the old ones are stale).
"""


import time
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

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

url = 'https://www.99acres.com/flats-in-gurgaon-ffid-page-1'
driver.get(url)
time.sleep(5)

soup = BeautifulSoup(driver.page_source, 'html.parser')
search_container = soup.select_one('div[data-label="SEARCH"]')
sections = search_container.select('section[data-hydration-on-demand="true"]')

print(f"Found {len(sections)} sections\n")

if sections:
    first = sections[0]
    with open('first_section.html', 'w', encoding='utf-8') as f:
        f.write(first.prettify())
    print("Saved the first listing's HTML to first_section.html - open it and look for:")
    print("  - the element containing the property name/title")
    print("  - the <a> tag with the link to the detail page (its href)")
    print("  - the element containing the society name")
    print("\nLook at the class= or id= attributes on those elements.")

    # Try to auto-find likely candidates
    print("\n--- All <a> tags in this section (link candidates) ---")
    for a in first.find_all('a', limit=5):
        print(f"  class={a.get('class')} href={a.get('href')} text={a.get_text(strip=True)[:50]}")

    print("\n--- Elements with 'name' or 'title' or 'heading' in class/id ---")
    for el in first.find_all(True):
        attrs = ' '.join(el.get('class', [])) + ' ' + (el.get('id') or '')
        if any(k in attrs.lower() for k in ['name', 'title', 'heading', 'society']):
            print(f"  <{el.name}> class={el.get('class')} id={el.get('id')} text={el.get_text(strip=True)[:50]}")

input("\nPress Enter to close browser...")
driver.quit()