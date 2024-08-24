from playwright.sync_api import sync_playwright
from urllib.parse import unquote, urlparse, parse_qs
from bs4 import BeautifulSoup
import re
import statistics
from unidecode import unidecode
import requests

def search_product(product_name, min_rating=000):
    if min_rating > 0:
        search_url = f"https://www.google.com/search?q={product_name}+price&tbm=shop&tbs=vw:g,mr:1&&tbs=mr:1,avg_rating:{min_rating}&gl=vn"
    else:
        search_url = f"https://www.google.com/search?q={product_name}+price&tbm=shop&tbs=vw:g,mr:1,sbd:1&hl=vi"
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            page.goto(search_url, timeout=30000)  # 30 seconds timeout
            page.wait_for_selector('div.sh-dgr__gr-auto.sh-dgr__grid-result', timeout=10000)
            html_content = page.content()
        except Exception as e:
            print(f"An error occurred: {e}")
            html_content = ""
        finally:
            browser.close()
    
    return html_content

def extract_url(href):
    parsed = urlparse(href)
    url_param = parse_qs(parsed.query).get('url', [None])[0]
    if url_param:
        return unquote(url_param)
    return None

def calculate_price_stats(products):
    prices = [p['price'] for p in products if isinstance(p['price'], (int, float)) and p['price'] != float('inf')]
    if not prices:
        return 0, 0  # Return 0 if no valid prices are found
    mean = statistics.mean(prices)
    stdev = statistics.stdev(prices) if len(prices) > 1 else 0
    return mean, stdev

def is_genuine_product(product, mean_price, stdev, target_product):
    name = product['name']
    price = product['price']
    img_url = product['img_url']
    
    # Normalize name and target_product
    name_lower = unidecode(name.lower())
    target_lower = unidecode(target_product.lower())

    # Filter out fake products based on common keywords
    if re.search(r'i\d+|phien ban toan cau|fake|nhai|copy|dai loan', name_lower):
        return False

    # Kiểm tra giá thấp bất thường
    if price < mean_price * 0.5:  # Giá thấp hơn 50% so với giá trung bình
        return False

    # Kiểm tra giá nằm trong phạm vi hợp lý
    price_range = 1.5
    if stdev > 0:
        if price < mean_price - (price_range * stdev) or price > mean_price + (price_range * stdev):
            return False
    else:
        if price < mean_price * 0.3 or price > mean_price * 3:
            return False

    # Kiểm tra URL hình ảnh hợp lệ
    if not img_url or not validate_image_url(img_url):
        return False

    return True

def validate_image_url(img_url):
    try:
        response = requests.head(img_url, timeout=5)
        if response.status_code == 200 and 'image' in response.headers.get('Content-Type', ''):
            return True
    except requests.RequestException:
        pass
    return False

def filter_by_rating(products, min_rating=2.0, show_norating=True):
    def parse_rating(rating_str):
        if isinstance(rating_str, (int, float)):
            return float(rating_str)
        if isinstance(rating_str, str):
            if rating_str == "Chưa có đánh giá":
                return None  # No ratings
            try:
                return float(rating_str.split()[0].replace(',', '.'))
            except ValueError:
                return None
        return None

    filtered_products = []
    
    for p in products:
        rating = parse_rating(p['rating'])
        if rating is None and show_norating:
            filtered_products.append(p)
        elif rating is not None and rating >= min_rating:
            filtered_products.append(p)
    
    return filtered_products

def parse_product_info(html_content, target_product):
    soup = BeautifulSoup(html_content, 'html.parser')
    product_divs = soup.find_all('div', class_='sh-dgr__gr-auto sh-dgr__grid-result')
    
    products = []
    
    for div in product_divs:
        # Extract product name
        name_elem = div.find('h3', class_='tAxDx')
        name = name_elem.text.strip() if name_elem else "Không tìm thấy tên"

        # Extract product price
        price_elem = div.find('span', class_='a8Pemb OFFNJ')
        price_text = price_elem.text.strip() if price_elem else "0"
        price = int(re.sub(r'[^\d]', '', price_text)) if price_text != "0" else float('inf')
        if price < 1000:
            continue

        # Extract product source
        source_elem = div.find('div', class_='aULzUe IuHnof')
        source = source_elem.text.strip() if source_elem else "Không tìm thấy nguồn"

        # Extract image URL
        img_elem = div.find('img', id=True)
        img_url = img_elem['src'] if img_elem and 'src' in img_elem.attrs else "Không tìm thấy ảnh"

        # Extract product link
        product_link_elem = div.find('a', class_='shntl')
        product_link = extract_url(product_link_elem['href']) if product_link_elem else "Không tìm thấy link"

        # Extract product rating
        rating_elem = div.find('span', class_='Rsc7Yb')
        rating = rating_elem.text.strip() if rating_elem else "Chưa có đánh giá"

        products.append({
            "name": name,
            "price": price,
            "source": source,
            "img_url": img_url,
            "product_link": product_link,
            "rating": rating
        })
    
    # Calculate price stats
    mean_price, stdev_price = calculate_price_stats(products)
    
    # Filter genuine products
    filtered_products = [p for p in products if is_genuine_product(p, mean_price, stdev_price, target_product)]
    
    # Filter by user rating
    rated_products = filter_by_rating(filtered_products)
    
    return rated_products if rated_products else filtered_products

def filter_cheapest_by_source(products, preferred_sources=None):
    if preferred_sources is None:
        preferred_sources = ["Lazada Vietnam", "Shopee"]
    
    cheapest_by_source = {}
    for product in products:
        source = product['source']
        if source in preferred_sources:
            cheapest_by_source.setdefault(source, []).append(product)
        else:
            if source not in cheapest_by_source or product['price'] < cheapest_by_source[source]['price']:
                cheapest_by_source[source] = product
    
    final_products = []
    for source, prods in cheapest_by_source.items():
        if isinstance(prods, list):
            final_products.extend(prods)
        else:
            final_products.append(prods)
    
    return final_products

def filter_by_popular_sources(products, min_count=1):
    source_count = {}
    for product in products:
        source = product['source']
        source_count[source] = source_count.get(source, 0) + 1
    
    popular_sources = {source for source, count in source_count.items() if count >= min_count}
    
    return [p for p in products if p['source'] in popular_sources]
