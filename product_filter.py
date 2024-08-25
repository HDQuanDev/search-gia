from playwright.sync_api import sync_playwright
from urllib.parse import unquote, urlparse, parse_qs
from bs4 import BeautifulSoup
import re
import statistics
from unidecode import unidecode
import requests

def search_product(product_name, min_rating=0):
    """
    Tìm kiếm sản phẩm trên Google Shopping với tên sản phẩm và đánh giá tối thiểu.

    :param product_name: Tên sản phẩm cần tìm kiếm
    :param min_rating: Đánh giá tối thiểu (mặc định là 0)
    :return: Nội dung HTML của kết quả tìm kiếm
    """
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
    """
    Trích xuất URL sản phẩm từ liên kết Google Shopping.

    :param href: Liên kết Google Shopping
    :return: URL sản phẩm
    """
    parsed = urlparse(href)
    url_param = parse_qs(parsed.query).get('url', [None])[0]
    if url_param:
        return unquote(url_param)
    return None

def calculate_price_stats(products):
    """
    Tính toán giá trung bình và độ lệch chuẩn của danh sách sản phẩm.

    :param products: Danh sách sản phẩm
    :return: Giá trung bình và độ lệch chuẩn
    """
    prices = [p['price'] for p in products if isinstance(p['price'], (int, float)) and p['price'] != float('inf')]
    if not prices:
        return 0, 0  # Return 0 if no valid prices are found
    mean = statistics.mean(prices)
    stdev = statistics.stdev(prices) if len(prices) > 1 else 0
    return mean, stdev

def is_genuine_product(product, mean_price, stdev, target_product):
    """
    Kiểm tra xem sản phẩm có phải là sản phẩm chính hãng hay không.

    :param product: Sản phẩm cần kiểm tra
    :param mean_price: Giá trung bình của danh sách sản phẩm
    :param stdev: Độ lệch chuẩn của danh sách sản phẩm
    :param target_product: Tên sản phẩm cần tìm kiếm
    :return: True nếu là sản phẩm chính hãng, False nếu không
    """
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
    """
    Kiểm tra xem URL hình ảnh có hợp lệ hay không.

    :param img_url: URL hình ảnh
    :return: True nếu hợp lệ, False nếu không
    """
    try:
        response = requests.head(img_url, timeout=5)
        if response.status_code == 200 and 'image' in response.headers.get('Content-Type', ''):
            return True
    except requests.RequestException:
        pass
    return False

def filter_by_rating(products, min_rating=2.0, show_norating=True):
    """
    Lọc sản phẩm theo đánh giá tối thiểu.

    :param products: Danh sách sản phẩm
    :param min_rating: Đánh giá tối thiểu (mặc định là 2.0)
    :param show_norating: Có hiển thị sản phẩm không có đánh giá hay không (mặc định là True)
    :return: Danh sách sản phẩm đã lọc
    """
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

def keyword_match_percentage(product_name, search_keywords):
    """
    Tính toán tỷ lệ phần trăm các ký tự từ khóa tìm kiếm có trong tên sản phẩm,
    bỏ qua các ký tự đặc biệt và chuyển đổi các ký tự tiếng Việt sang tiếng Anh.

    :param product_name: Tên sản phẩm
    :param search_keywords: Từ khóa tìm kiếm
    :return: Tỷ lệ phần trăm khớp
    """
    product_name = unidecode(product_name.lower())
    search_keywords = unidecode(search_keywords.lower())

    # Remove special characters
    product_name = re.sub(r'[^\w\s]', '', product_name)
    search_keywords = re.sub(r'[^\w\s]', '', search_keywords)

    # Use a set to keep track of matched characters
    matched_chars = set()

    for char in search_keywords:
        if char in product_name:
            matched_chars.add(char)

    match_percentage = len(matched_chars) / len(search_keywords) * 100 if len(search_keywords) > 0 else 0
    return match_percentage

def filter_by_keyword_match(products, search_keywords, min_match_percentage=75):
    """
    Lọc sản phẩm dựa trên tỷ lệ phần trăm khớp từ khóa.
    Nếu không tìm thấy sản phẩm nào, giảm mức tối thiểu xuống một nửa.
    Nếu vẫn không tìm thấy, trả về tất cả sản phẩm.

    :param products: Danh sách sản phẩm
    :param search_keywords: Từ khóa tìm kiếm
    :param min_match_percentage: Tỷ lệ phần trăm khớp tối thiểu (mặc định là 75)
    :return: Danh sách sản phẩm đã lọc
    """
    filtered_products = [p for p in products if keyword_match_percentage(p['name'], search_keywords) >= min_match_percentage]

    if not filtered_products:
        # Giảm mức tối thiểu xuống một nửa
        min_match_percentage /= 2
        filtered_products = [p for p in products if keyword_match_percentage(p['name'], search_keywords) >= min_match_percentage]

        if not filtered_products:
            # Trả về tất cả sản phẩm nếu vẫn không tìm thấy
            return products

    return filtered_products

def parse_product_info(html_content, target_product):
    """
    Phân tích thông tin sản phẩm từ nội dung HTML.

    :param html_content: Nội dung HTML
    :param target_product: Tên sản phẩm cần tìm kiếm
    :return: Danh sách sản phẩm
    """
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

    # Filter by keyword match
    filtered_products = filter_by_keyword_match(filtered_products, target_product)

    # Filter by user rating
    rated_products = filter_by_rating(filtered_products)

    return rated_products if rated_products else filtered_products

def filter_cheapest_by_source(products, preferred_sources=None):
    """
    Lọc sản phẩm theo nguồn, cho phép các nguồn ưu tiên hiển thị nhiều sản phẩm,
    trong khi các nguồn khác chỉ hiển thị một sản phẩm rẻ nhất.

    :param products: Danh sách sản phẩm
    :param preferred_sources: Danh sách các nguồn ưu tiên
    :return: Danh sách sản phẩm đã lọc
    """
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
    """
    Lọc sản phẩm theo nguồn phổ biến, chỉ giữ lại các sản phẩm từ các nguồn có số lượng sản phẩm
    lớn hơn hoặc bằng min_count.

    :param products: Danh sách sản phẩm
    :param min_count: Số lượng sản phẩm tối thiểu từ một nguồn để được coi là phổ biến (mặc định là 1)
    :return: Danh sách sản phẩm đã lọc
    """
    source_count = {}
    for product in products:
        source = product['source']
        source_count[source] = source_count.get(source, 0) + 1

    popular_sources = {source for source, count in source_count.items() if count >= min_count}

    return [p for p in products if p['source'] in popular_sources]
