PAGES_PER_RUN = 10

# # Set True once things are working reliably - runs faster with no visible window
# # NOTE: keep this False while testing proxies for the first time, so you can
# # visually confirm (via whatismyip-type page) that traffic is actually
# # routing through Webshare and not leaking your real IP.
# HEADLESS = False

# # Random delay range (seconds) between page/property navigations
# MIN_DELAY = 2
# MAX_DELAY = 5

# # India's rough lat/lon bounding box, used to auto-detect and fix 99acres'
# # swapped geo.latitude / geo.longitude fields.
# INDIA_LAT_RANGE = (6, 38)
# INDIA_LON_RANGE = (67, 98)

# # ----------------------------------------------------------------------
# # >>> PROXY CONFIG - put your Webshare proxy details here <<<
# # ----------------------------------------------------------------------
# # Get these from your Webshare dashboard -> Proxy List -> pick one, or
# # https://proxy.webshare.io/proxy/list (Free plan gives you a handful of
# # datacenter proxies, each with its own IP/port but often a shared
# # username/password across all of them - check your dashboard).
# #
# #   PROXY_ENABLED : flip to True to actually route traffic through the proxy
# #   PROXY_HOST    : e.g. '38.154.227.167'
# #   PROXY_PORT    : e.g. 5868          (as an int)
# #   PROXY_USER    : your Webshare proxy username
# #   PROXY_PASS    : your Webshare proxy password
# #
# # Free Webshare proxies are shared/rate-limited and rotate slowly, so if
# # you have multiple, you can list them in PROXY_POOL and the driver will
# # pick one at random per driver creation (call create_driver() again to
# # rotate). Leave PROXY_POOL empty to just use the single PROXY_HOST above.
# PROXY_ENABLED = True

# # List every Webshare proxy you have here (Webshare free plan gives you
# # ~10). Each one is its own dict - host/port differ per proxy, user/pass is
# # often the same across all of them on the free plan, but check your
# # dashboard to be sure.
# PROXY_POOL = [
#     {'host': '31.59.20.176',    'port': 6754, 'user': 'zdwiwztl', 'pass': 'hyd9wqukuc41'},
#     {'host': '31.56.127.193',   'port': 7684, 'user': 'zdwiwztl', 'pass': 'hyd9wqukuc41'},
#     {'host': '45.38.107.97',    'port': 6014, 'user': 'zdwiwztl', 'pass': 'hyd9wqukuc41'},
#     {'host': '198.105.121.200', 'port': 6462, 'user': 'zdwiwztl', 'pass': 'hyd9wqukuc41'},
#     {'host': '64.137.96.74',    'port': 6641, 'user': 'zdwiwztl', 'pass': 'hyd9wqukuc41'},
#     {'host': '198.23.243.226',  'port': 6361, 'user': 'zdwiwztl', 'pass': 'hyd9wqukuc41'},
#     {'host': '38.154.185.97',   'port': 6370, 'user': 'zdwiwztl', 'pass': 'hyd9wqukuc41'},
#     {'host': '84.247.60.125',   'port': 6095, 'user': 'zdwiwztl', 'pass': 'hyd9wqukuc41'},
#     {'host': '142.111.67.146',  'port': 5611, 'user': 'zdwiwztl', 'pass': 'hyd9wqukuc41'},
#     {'host': '191.96.254.138',  'port': 6185, 'user': 'zdwiwztl', 'pass': 'hyd9wqukuc41'},
# ]

# # After this many driver.get() calls (listing pages + detail pages both
# # count), the current Chrome instance is closed and a new one is opened on
# # the NEXT proxy in PROXY_POOL (round-robin, wraps back to the start).
# PROXY_ROTATE_EVERY = 5


# def _build_proxy_auth_extension(proxy: dict) -> str:
#     """Chrome doesn't accept user:pass@host:port in --proxy-server, so we
#     generate a throwaway .zip Chrome extension that intercepts the proxy
#     auth challenge and supplies credentials automatically."""
#     manifest_json = """
#     {
#         "version": "1.0.0",
#         "manifest_version": 2,
#         "name": "Webshare Proxy Auth",
#         "permissions": [
#             "proxy", "tabs", "unlimitedStorage", "storage",
#             "<all_urls>", "webRequest", "webRequestBlocking"
#         ],
#         "background": {"scripts": ["background.js"]},
#         "minimum_chrome_version": "22.0.0"
#     }
#     """

#     background_js = f"""
#     var config = {{
#         mode: "fixed_servers",
#         rules: {{
#             singleProxy: {{
#                 scheme: "http",
#                 host: "{proxy['host']}",
#                 port: parseInt({proxy['port']})
#             }},
#             bypassList: ["localhost"]
#         }}
#     }};

#     chrome.proxy.settings.set({{value: config, scope: "regular"}}, function() {{}});

#     chrome.webRequest.onAuthRequired.addListener(
#         function(details) {{
#             return {{
#                 authCredentials: {{
#                     username: "{proxy['user']}",
#                     password: "{proxy['pass']}"
#                 }}
#             }};
#         }},
#         {{urls: ["<all_urls>"]}},
#         ['blocking']
#     );
#     """

#     tmp_dir = os.path.join(os.getcwd(), '.proxy_ext_tmp')
#     os.makedirs(tmp_dir, exist_ok=True)
#     suffix = ''.join(random.choices(string.ascii_lowercase, k=6))
#     ext_path = os.path.join(tmp_dir, f'proxy_auth_{suffix}.zip')

#     with zipfile.ZipFile(ext_path, 'w') as zp:
#         zp.writestr("manifest.json", manifest_json)
#         zp.writestr("background.js", background_js)

#     return ext_path


# def create_driver(proxy: dict = None):
#     """proxy=None -> no proxy (or PROXY_ENABLED=False). Pass a dict from
#     PROXY_POOL to launch Chrome wired to that specific proxy."""
#     options = Options()
#     if HEADLESS:
#         options.add_argument('--headless=new')
#     options.add_argument('--start-maximized')
#     options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
#                           'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36')
#     options.add_argument('--disable-blink-features=AutomationControlled')
#     options.add_argument('--disable-gpu')
#     options.add_argument('--no-sandbox')
#     options.add_experimental_option('excludeSwitches', ['enable-automation'])
#     options.add_experimental_option('useAutomationExtension', False)

#     # --- PROXY WIRING ---
#     if PROXY_ENABLED and proxy is not None:
#         ext_path = _build_proxy_auth_extension(proxy)
#         options.add_extension(ext_path)
#         print(f"[proxy] Using {proxy['host']}:{proxy['port']}")
#     # --- END PROXY WIRING ---

#     driver = webdriver.Chrome(
#         service=Service(ChromeDriverManager().install()),
#         options=options
#     )
#     driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
#         'source': "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
#     })

#     if PROXY_ENABLED and proxy is not None:
#         # small pause to let the extension register the proxy config
#         # before the first navigation
#         time.sleep(2)

#     return driver


# class RotatingDriver:
#     """Wraps a Selenium driver and transparently rotates it to the next
#     proxy in PROXY_POOL every PROXY_ROTATE_EVERY requests. Since a live
#     Chrome instance can't have its proxy swapped mid-session, "rotating"
#     means quitting the current browser and launching a fresh one - so use
#     .get(url) exactly like you would driver.get(url), and this class
#     handles opening a new browser behind the scenes when it's time.

#     NOTE: rotating means a brand-new browser session - any cookies from
#     the old session are gone. That's usually fine for 99acres scraping,
#     since we don't rely on login/session state, but worth knowing.
#     """

#     def __init__(self, pool, rotate_every):
#         if PROXY_ENABLED and not pool:
#             raise ValueError("PROXY_ENABLED is True but PROXY_POOL is empty - "
#                               "add at least one proxy dict to PROXY_POOL.")
#         self.pool = pool
#         self.rotate_every = rotate_every
#         self.pool_index = -1
#         self.request_count = 0
#         self.driver = None
#         self._launch_next()

#     def _launch_next(self):
#         if self.driver is not None:
#             print("[proxy] Rotating - closing current browser and opening next proxy")
#             self.driver.quit()

#         proxy = None
#         if PROXY_ENABLED:
#             self.pool_index = (self.pool_index + 1) % len(self.pool)
#             proxy = self.pool[self.pool_index]

#         self.driver = create_driver(proxy)
#         self.request_count = 0

#     def get(self, url):
#         """Drop-in replacement for driver.get(url) - rotates first if the
#         rotation threshold has been hit."""
#         if PROXY_ENABLED and self.request_count >= self.rotate_every:
#             self._launch_next()
#         self.request_count += 1
#         self.driver.get(url)

#     @property
#     def page_source(self):
#         return self.driver.page_source

#     def quit(self):
#         if self.driver is not None:
#             self.driver.quit()


# def random_delay():
#     time.sleep(random.uniform(MIN_DELAY, MAX_DELAY))


# def create_city_directories(project_dir: str, city: str) -> None:
#     dir_path = os.path.join(project_dir, city, 'flats')
#     if not os.path.exists(dir_path):
#         os.makedirs(dir_path)
#         print(f"Created directory: {dir_path}")
#     else:
#         print(f"Directory already exists: {dir_path}")


# def safe_text(soup_obj, selector):
#     try:
#         return soup_obj.select_one(selector).text.strip()
#     except AttributeError:
#         return ''


# def safe_list(soup_obj, selector, sub_selector):
#     try:
#         container = soup_obj.select_one(selector)
#         return [el.text.strip() for el in container.select(sub_selector)]
#     except AttributeError:
#         return ''


# # ----------------------------------------------------------------------
# # NEW: JSON-LD based extraction (more reliable than DOM scraping for
# # geo-coordinates, society name, main image, and breadcrumb hierarchy)
# # ----------------------------------------------------------------------

# def _load_all_jsonld_blocks(soup):
#     blocks = []
#     for script in soup.find_all('script', attrs={'type': 'application/ld+json'}):
#         try:
#             blocks.append(json.loads(script.string))
#         except (TypeError, ValueError):
#             continue
#     return blocks


# def extract_geo_and_society(soup):
#     """Pulls latitude/longitude, society name, and main image from the
#     Apartment/House JSON-LD block. Auto-corrects 99acres' occasional swap
#     of latitude <-> longitude using India's coordinate bounding box."""
#     lat, lon, society_name, image_url = '', '', '', ''

#     for data in _load_all_jsonld_blocks(soup):
#         if isinstance(data, dict) and 'geo' in data:
#             geo = data.get('geo') or {}
#             raw_lat = geo.get('latitude', '')
#             raw_lon = geo.get('longitude', '')
#             society_name = (data.get('address') or {}).get('name', '')
#             image_url = data.get('image', '')

#             try:
#                 lat_f, lon_f = float(raw_lat), float(raw_lon)
#                 lat_in_range = INDIA_LAT_RANGE[0] <= lat_f <= INDIA_LAT_RANGE[1]
#                 lon_in_range = INDIA_LON_RANGE[0] <= lon_f <= INDIA_LON_RANGE[1]

#                 if lat_in_range and lon_in_range:
#                     lat, lon = raw_lat, raw_lon
#                 elif INDIA_LAT_RANGE[0] <= lon_f <= INDIA_LAT_RANGE[1] and \
#                         INDIA_LON_RANGE[0] <= lat_f <= INDIA_LON_RANGE[1]:
#                     # Values are swapped - 99acres does this often. Fix it.
#                     lat, lon = raw_lon, raw_lat
#                 else:
#                     # Can't confidently place it - keep raw values as-is.
#                     lat, lon = raw_lat, raw_lon
#             except (TypeError, ValueError):
#                 lat, lon = raw_lat, raw_lon
#             break

#     return lat, lon, society_name, image_url


# def extract_breadcrumb_hierarchy(soup):
#     """Returns a list like ['Home', 'Property in Gurgaon', 'Flats in Gurgaon',
#     'Flats in Golf Course Ext Road', 'Flats in Sector 63A Gurgaon', ...]
#     pulled from the BreadcrumbList JSON-LD - more reliable than scraping the
#     visible breadcrumb <span> tags."""
#     for data in _load_all_jsonld_blocks(soup):
#         if isinstance(data, dict) and data.get('@type') == 'BreadcrumbList':
#             items = data.get('itemListElement', [])
#             names = []
#             for item in items:
#                 name = (item.get('item') or {}).get('name', '')
#                 if name:
#                     names.append(name)
#             return names
#     return []


# def extract_additional_details(soup):
#     """Generic parser over #AdditionalDetailsComponent - reads whatever
#     label/value <li> rows are present (Transaction Type, Ownership, Facing,
#     Flooring, Furnishing, Width of facing road, Parking, Power Backup, etc.)
#     instead of relying on hardcoded ids that may not exist on every listing."""
#     result = {}
#     container = soup.select_one('#AdditionalDetailsComponent ul')
#     if not container:
#         return result
#     for li in container.select('li'):
#         spans = li.select('span')
#         if len(spans) >= 2:
#             label = spans[0].get_text(strip=True).rstrip(':').strip()
#             value = spans[1].get_text(strip=True)
#             if label:
#                 result[label] = value
#     return result


# def extract_rera(soup):
#     status, website = '', ''
#     rera_block = soup.select_one('.component__reraWrap, .clearWrap .reraWrap')
#     if rera_block:
#         status_el = rera_block.select_one('.component__status')
#         status = status_el.get_text(strip=True) if status_el else ''
#         text = rera_block.get_text(' ', strip=True)
#         m = re.search(r'Website:\s*(\S+)', text)
#         if m:
#             website = m.group(1)
#     return status, website


# def extract_dealer_info(soup):
#     dealer = {
#         'dealerName': '',
#         'dealerCompany': '',
#         'dealerMemberSince': '',
#         'dealerAddress': '',
#         'dealerWebsite': '',
#     }
#     card = soup.select_one('#DealerCardComponent')
#     if not card:
#         return dealer

#     name_el = card.select_one('.list_header_semiBold')
#     company_el = card.select_one('.fdDetail__capitalize')
#     since_el = card.select_one('.caption_subdued_medium')

#     dealer['dealerName'] = name_el.get_text(strip=True) if name_el else ''
#     dealer['dealerCompany'] = company_el.get_text(strip=True) if company_el else ''
#     dealer['dealerMemberSince'] = since_el.get_text(strip=True) if since_el else ''

#     add_info = card.select_one('.FeatureDealerCard__addInfo')
#     if add_info:
#         text = add_info.get_text(' ', strip=True)
#         m_addr = re.search(r'Address:\s*(.*?)(?:Website:|$)', text)
#         if m_addr:
#             dealer['dealerAddress'] = m_addr.group(1).strip()
#         website_el = add_info.select_one('a[href]')
#         if website_el:
#             dealer['dealerWebsite'] = website_el.get_text(strip=True)

#     return dealer


# def extract_property_id_from_url(url):
#     """The `#Prop_Id` element used by the old scraper does not exist on the
#     current 99acres detail page template (confirmed against a live page) and
#     always returned blank. The listing ID is reliably present in the URL
#     itself as `...-spid-L92571590`."""
#     m = re.search(r'spid-([A-Za-z0-9]+)', url)
#     return m.group(1) if m else ''


# def parse_area_sqm(area_text):
#     """Pulls the sq.m. value out of strings like
#     'Super Built-up area 3000 (278.71 sq.m.)'."""
#     m = re.search(r'\(([\d,.]+)\s*sq\.?\s*m', area_text)
#     return m.group(1).replace(',', '') if m else ''


# # ----------------------------------------------------------------------
# # Main scraping logic
# # ----------------------------------------------------------------------

# def scrape_flats_for_city(driver_rotator, city: str, start: int, end: int, project_dir: str) -> pd.DataFrame:
#     page_number = start
#     flats = pd.DataFrame()

#     try:
#         while page_number < end:
#             i = 1
#             url = f'https://www.99acres.com/flats-in-{city}-ffid-page-{page_number}'
#             print(f"[{city}] Loading page {page_number}: {url}")
#             driver_rotator.get(url)
#             random_delay()

#             page_soup = BeautifulSoup(driver_rotator.page_source, 'html.parser')
#             search_container = page_soup.select_one('div[data-label="SEARCH"]')
#             if search_container is None:
#                 print(f"[{city}] No results container found on page {page_number}, stopping.")
#                 break

#             sections = search_container.select('section[data-hydration-on-demand="true"]')
#             print(f"[{city}] Found {len(sections)} listings on page {page_number}")

#             # Collect links first (from the listing page), then visit each
#             # detail page one at a time with the same driver.
#             listing_data = []
#             for soup in sections:
#                 try:
#                     heading_anchor = soup.select_one('a.tupleNew__propertyHeading')
#                     property_name = heading_anchor.get_text(strip=True)
#                     link = heading_anchor['href']
#                     society = safe_text(soup, 'div.tupleNew__locationName')
#                     area = safe_text(soup, 'div.tupleNew__perSqftWrap.ellipsis')
#                     id_wrapper = soup.select_one('div.tupleNew__outerTupleWrap')
#                     property_id = id_wrapper.get('id', '') if id_wrapper else ''
#                     listing_data.append({
#                         'property_name': property_name,
#                         'link': link,
#                         'society': society,
#                         'area': area,
#                         'property_id': property_id,
#                     })
#                 except AttributeError:
#                     continue

#             for item in listing_data:
#                 driver_rotator.get(item['link'])
#                 random_delay()
#                 dpage_soup = BeautifulSoup(driver_rotator.page_source, 'html.parser')

#                 price = safe_text(dpage_soup, '#pdPrice2')
#                 price_per_sqft = safe_text(dpage_soup, '#pricePerUnitArea')
#                 area_with_type = safe_text(dpage_soup, '#factArea')
#                 area_sqm = parse_area_sqm(area_with_type)
#                 bed_room = safe_text(dpage_soup, '#bedRoomNum')
#                 bathroom = safe_text(dpage_soup, '#bathroomNum')
#                 balcony = safe_text(dpage_soup, '#balconyNum')
#                 additional_room = safe_text(dpage_soup, '#additionalRooms')
#                 address = safe_text(dpage_soup, '#address')
#                 floor_num = safe_text(dpage_soup, '#floorNumLabel')
#                 facing = safe_text(dpage_soup, '#facingLabel')
#                 overlooking = safe_text(dpage_soup, '#overlooking')
#                 age_possession = safe_text(dpage_soup, '#agePossessionLbl')
#                 posted_date = safe_text(dpage_soup, '#pdPropDate')
#                 nearby_locations = safe_list(dpage_soup, 'div.NearByLocation__tagWrap', 'span.NearByLocation__infoText')
#                 description = safe_text(dpage_soup, '#description')
#                 furnish_details = safe_list(dpage_soup, '#FurnishDetails', 'li')

#                 if furnish_details:
#                     try:
#                         features = [el.text.strip() for el in dpage_soup.select('#features')[1].select('li')]
#                     except (IndexError, AttributeError):
#                         features = ''
#                 else:
#                     try:
#                         features = [el.text.strip() for el in dpage_soup.select('#features')[0].select('li')]
#                     except (IndexError, AttributeError):
#                         features = ''

#                 try:
#                     rating_container = dpage_soup.select_one('div.review__rightSide>div>ul>li>div')
#                     rating = [el.text for el in rating_container.select('div.ratingByFeature__circleWrap')]
#                 except AttributeError:
#                     rating = ''

#                 # --- NEW extractions ---
#                 latitude, longitude, society_name, main_image = extract_geo_and_society(dpage_soup)
#                 breadcrumb_hierarchy = extract_breadcrumb_hierarchy(dpage_soup)
#                 additional_details = extract_additional_details(dpage_soup)
#                 rera_status, rera_website = extract_rera(dpage_soup)
#                 dealer_info = extract_dealer_info(dpage_soup)
#                 property_id = extract_property_id_from_url(item['link'])

#                 property_data = {
#                     'city': city,
#                     'property_name': item['property_name'],
#                     'link': item['link'],
#                     'property_id': property_id,
#                     'society': item['society'],
#                     'societyName': society_name,
#                     'latitude': latitude,
#                     'longitude': longitude,
#                     'price': price,
#                     'pricePerSqft': price_per_sqft,
#                     'area': item['area'],
#                     'areaWithType': area_with_type,
#                     'areaSqm': area_sqm,
#                     'bedRoom': bed_room,
#                     'bathroom': bathroom,
#                     'balcony': balcony,
#                     'additionalRoom': additional_room,
#                     'address': address,
#                     'floorNum': floor_num,
#                     'facing': facing,
#                     'overlooking': overlooking,
#                     'agePossession': age_possession,
#                     'postedDate': posted_date,
#                     'nearbyLocations': nearby_locations,
#                     'description': description,
#                     'furnishDetails': furnish_details,
#                     'features': features,
#                     'rating': rating,
#                     'mainImage': main_image,
#                     'breadcrumbHierarchy': breadcrumb_hierarchy,
#                     # generic label/value block (transaction type, ownership,
#                     # flooring, furnishing, width of facing road, parking,
#                     # power backup, etc. - whatever 99acres shows for this listing)
#                     'additionalDetailsJson': json.dumps(additional_details, ensure_ascii=False),
#                     'reraStatus': rera_status,
#                     'reraWebsite': rera_website,
#                 }
#                 property_data.update(dealer_info)

#                 temp_df = pd.DataFrame.from_records([property_data])
#                 flats = pd.concat([flats, temp_df], ignore_index=True)
#                 i += 1

#             print(f'[{city}] page {page_number} -> {i} items')
#             page_number += 1

#     except Exception as e:
#         print(f"[{city}] Error: {e}")
#         print("Saving whatever was scraped so far before stopping.")

#     finally:
#         # One persistent file per city - NOT keyed by page range, so
#         # re-running the scraper (even on different pages, even days later)
#         # keeps appending to the same file instead of creating a new one
#         # every time.
#         csv_file_path = os.path.join(project_dir, city, 'flats', f'flats_{city}.csv')
#         if not flats.empty:
#             file_exists = os.path.isfile(csv_file_path)
#             flats.to_csv(csv_file_path, mode='a', header=not file_exists, index=False)
#             print(f"[{city}] Appended {len(flats)} rows to {csv_file_path}")
#             dedupe_csv_by_property_id(csv_file_path)
#         else:
#             print(f"[{city}] No data scraped - nothing to save.")

#     return flats


# def dedupe_csv_by_property_id(csv_file_path: str) -> None:
#     """Since runs now append to one growing file per city, re-scraping a page
#     you already covered (or the same listing appearing on two different
#     pages, which 99acres does sometimes) would create duplicate rows. This
#     reloads the file, drops duplicate property_id rows (keeping the most
#     recently scraped version), and rewrites it."""
#     try:
#         df = pd.read_csv(csv_file_path)
#     except pd.errors.EmptyDataError:
#         return

#     before = len(df)
#     if 'property_id' in df.columns:
#         df = df.drop_duplicates(subset='property_id', keep='last')
#     else:
#         df = df.drop_duplicates(keep='last')
#     after = len(df)

#     if after != before:
#         df.to_csv(csv_file_path, index=False)
#         print(f"Deduped {csv_file_path}: {before} -> {after} rows")


# if __name__ == '__main__':
#     driver_rotator = RotatingDriver(PROXY_POOL, PROXY_ROTATE_EVERY)

#     try:
#         for city in CITIES:
#             print(f"\n=== Starting {city} ===")
#             create_city_directories(PROJECT_DIR, city)

#             start_page = int(input(f"[{city}] Enter page number to start from: "))
#             end_page = start_page + PAGES_PER_RUN

#             scrape_flats_for_city(driver_rotator, city, start_page, end_page, PROJECT_DIR)
#     finally:
#         driver_rotator.quit()