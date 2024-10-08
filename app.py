"""
- Project: Search Giá
- File: app.py
- Author: Hứa Đức Quân (https://www.facebook.com/quancp72h)
- Website: https://search.quanhd.net
- Created: 2024-08-27
- Last Modified: 2024-08-27
** Xin vui lòng giữ lại thông tin này khi sử dụng code / Please keep this information when using the code **
"""

from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import re
import requests, datetime, json
from unidecode import unidecode
from product_filter import (
    parse_product_info,
    filter_cheapest_by_source,
    filter_by_popular_sources,
    search_product,
    calculate_price_stats
)

app = Flask(__name__)
CORS(app)

def normalize_keyword(keyword):
    """
    Chuẩn hóa từ khóa bằng cách:
    - Chuyển về chữ thường
    - Loại bỏ dấu
    - Loại bỏ ký tự đặc biệt
    - Loại bỏ khoảng trắng thừa

    :param keyword: Từ khóa cần chuẩn hóa
    :return: Từ khóa đã được chuẩn hóa
    """
    normalized = unidecode(keyword.lower())
    normalized = re.sub(r'[^a-z0-9]+', ' ', normalized)
    normalized = ' '.join(normalized.split())
    return normalized

def log_search_info(keyword, result_count, cheapest_product):
    """
    Ghi thông tin tìm kiếm vào file search_log.json, bao gồm:
    - Từ khóa
    - Số lượng kết quả
    - Sản phẩm rẻ nhất
    - Thời gian tìm kiếm

    :param keyword: Từ khóa tìm kiếm
    :param result_count: Số lượng kết quả tìm kiếm
    :param cheapest_product: Thông tin sản phẩm rẻ nhất
    """
    log_file = "search_log.json"
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    normalized_keyword = normalize_keyword(keyword)

    try:
        with open(log_file, "r", encoding="utf-8") as file:
            log_data = json.load(file)
    except (FileNotFoundError, json.JSONDecodeError):
        log_data = {}

    if normalized_keyword in log_data:
        # Cập nhật thông tin nếu từ khóa đã tồn tại
        log_data[normalized_keyword]["search_count"] += 1
        log_data[normalized_keyword]["total_results"] += result_count
        log_data[normalized_keyword]["last_search"] = timestamp

        # Cập nhật sản phẩm rẻ nhất nếu giá rẻ hơn
        log_data[normalized_keyword]["cheapest_product"] = cheapest_product
        log_data[normalized_keyword]["cheapest_price"] = cheapest_product["price"]

        # Thêm biến thể từ khóa nếu chưa tồn tại
        if keyword not in log_data[normalized_keyword]["variations"]:
            log_data[normalized_keyword]["variations"].append(keyword)
    else:
        # Tạo mới thông tin nếu từ khóa chưa tồn tại
        log_data[normalized_keyword] = {
            "search_count": 1,
            "total_results": result_count,
            "cheapest_product": cheapest_product,
            "cheapest_price": cheapest_product["price"] if cheapest_product else None,
            "first_search": timestamp,
            "last_search": timestamp,
            "variations": [keyword]
        }

    with open(log_file, "w", encoding="utf-8") as file:
        json.dump(log_data, file, ensure_ascii=False, indent=2)

def read_log_data():
    """
    Đọc dữ liệu từ file search_log.json.

    :return: Dữ liệu từ file log, hoặc một dict rỗng nếu file không tồn tại hoặc lỗi đọc file.
    """
    log_file = "search_log.json"
    try:
        with open(log_file, "r", encoding="utf-8") as file:
            return json.load(file)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}

@app.route('/')
def index():
    """
    Hiển thị trang chủ.

    :return: Template index.html
    """
    return render_template('index.html')

@app.route('/search', methods=['POST'])
def search():
    """
    API tìm kiếm sản phẩm.

    :return: Kết quả tìm kiếm dưới dạng JSON.
    """
    product_name = request.form.get('product_name')
    star_filter = request.form.get('star_filter', 0)

    if not product_name:
        return jsonify({'message': 'Vui lòng nhập tên sản phẩm cần tìm.'})

    try:
        min_rating = int(star_filter)
    except ValueError:
        min_rating = 0

    html_content = search_product(product_name, min_rating)
    products = parse_product_info(html_content, product_name)

    if not products:
        return jsonify({'message': 'Không tìm thấy sản phẩm nào phù hợp.'})

    popular_products = filter_by_popular_sources(products)
    products_to_use = popular_products if popular_products else products

    cheapest_products = filter_cheapest_by_source(products_to_use)
    cheapest_products.sort(key=lambda x: x['price'])
    cheapest_overall = min(cheapest_products, key=lambda x: x['price']) if cheapest_products else None

    mean_price, stdev_price = calculate_price_stats(products_to_use)

    # **Update cheapest product after each search:**
    log_search_info(product_name, len(products), cheapest_overall)

    return jsonify({
        'cheapest_products': cheapest_products,
        'cheapest_overall': cheapest_overall,
        'total_products_found': len(products),
        'filtered_products_count': len(products_to_use),
        'mean_price': mean_price,
        'stdev_price': stdev_price
    })

@app.route('/suggest')
def suggest():
    """
    API gợi ý từ khóa tìm kiếm.

    :return: Danh sách gợi ý từ Google dưới dạng JSON.
    """
    term = request.args.get('term', '')
    suggestions = get_google_suggestions(term)
    return jsonify(suggestions)

def get_google_suggestions(query):
    """
    Lấy gợi ý từ khóa tìm kiếm từ Google Suggest API.

    :param query: Từ khóa tìm kiếm
    :return: Danh sách gợi ý từ Google
    """
    url = f"http://suggestqueries.google.com/complete/search?client=firefox&q={query}"
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        return data[1]
    return []

@app.route('/get_log', methods=['GET'])
def get_log():
    """
    API lấy dữ liệu log tìm kiếm.

    :return: Dữ liệu log tìm kiếm dưới dạng JSON.
    """
    log_data = read_log_data()

    keyword = request.args.get('keyword')
    sort_by = request.args.get('sort_by', 'search_count')
    order = request.args.get('order', 'desc')
    limit = request.args.get('limit', type=int)

    if keyword:
        normalized_keyword = normalize_keyword(keyword)
        log_data = {k: v for k, v in log_data.items() if normalized_keyword in k}

    log_list = [{"keyword": k, **v} for k, v in log_data.items()]

    reverse = order.lower() == 'desc'
    if sort_by in ['search_count', 'total_results', 'cheapest_price']:
        log_list.sort(key=lambda x: x.get(sort_by, 0), reverse=reverse)
    elif sort_by in ['first_search', 'last_search']:
        log_list.sort(key=lambda x: x.get(sort_by, ''), reverse=reverse)

    if limit and limit > 0:
        log_list = log_list[:limit]

    return jsonify(log_list)

@app.route('/api-docs')
def api_docs():
    """
    Hiển thị trang tài liệu API.

    :return: Template api_docs.html
    """
    api_endpoints = [
        {
            'name': 'Search API',
            'endpoint': '/search',
            'method': 'POST',
            'description': 'Tìm kiếm sản phẩm',
            'parameters': [
                {'name': 'product_name', 'type': 'string', 'description': 'Tên sản phẩm cần tìm'},
                {'name': 'star_filter', 'type': 'int', 'description': 'Bộ lọc đánh giá sao, mặc định là 0, 100 = 1 sao, 200 = 2 sao, ... tối đa 500'}
            ],
            'curl_example': '''
curl -X POST https://search.quanhd.net/search \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "product_name=áo dài&star_filter=400"
            ''',
            'payload_example': '''
{
  "product_name": "áo dài",
  "star_filter": "400"
}
            ''',
            'response_example': '''
{
  "cheapest_overall": {
    "img_url": "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcQsLutX4V5dwdalpPZCQENzyDldaCSn5JIjtjb04oqAfBCgSSQYEBkAyFVkWVFzP6G0ImeoTDvWatlTtVAUFC8XKVrhTwsgk1zWCKH5f8Wm&usqp=CAE",
    "name": "Áo dài cách tân in họa tiết AD158",
    "price": 945000,
    "product_link": "https://lamia.com.vn/san-pham/ao-dai-cach-tan-in-hoa-tiet-ad158",
    "rating": "Chưa có đánh giá",
    "source": "Lamia Design"
  },
  "cheapest_products": [
    {
      "img_url": "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcQsLutX4V5dwdalpPZCQENzyDldaCSn5JIjtjb04oqAfBCgSSQYEBkAyFVkWVFzP6G0ImeoTDvWatlTtVAUFC8XKVrhTwsgk1zWCKH5f8Wm&usqp=CAE",
      "name": "Áo dài cách tân in họa tiết AD158",
      "price": 945000,
      "product_link": "https://lamia.com.vn/san-pham/ao-dai-cach-tan-in-hoa-tiet-ad158",
      "rating": "Chưa có đánh giá",
      "source": "Lamia Design"
    },
    {
      "img_url": "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcRWQbSiFyoZWkeJf3byP3PEfV1UyUCOAnUnnq3iF2XM_RxGv-TLDUxYgS-BRnZSjih6BDWS3Tsi4GY8nB9c471asr8v7P0MgaEN8l51yw0&usqp=CAE",
      "name": "Áo Dài Lụa Trơn Xám Hồn Việt",
      "price": 1100000,
      "product_link": "https://thoitrangf2.vn/products/ao-dai-lua-tron-xam-hon-viet",
      "rating": "Chưa có đánh giá",
      "source": "F2 Fashion & Freedom"
    }
  ],
  "filtered_products_count": 34,
  "mean_price": 1922785.294117647,
  "stdev_price": 915701.6406153636,
  "total_products_found": 34
}
            '''
        },
        {
            'name': 'Suggest API',
            'endpoint': '/suggest',
            'method': 'GET',
            'description': 'Lấy gợi ý từ Google',
            'parameters': [
                {'name': 'term', 'type': 'string', 'description': 'Từ khóa cần gợi ý'}
            ],
            'curl_example': 'curl "https://search.quanhd.net/suggest?term=g513"',
            'response_example': '''
[
  "g513ih-hn015t",
  "g513 rog",
  "g513ic-hn002t",
  "g513 logitech",
  "g513ie-hn246w",
  "g513im-hn008w",
  "g513rw",
  "g513ih driver",
  "g513 carbon",
  "g513qc-hn015t"
]
            '''
        },
        {
            'name': 'Get Log API',
            'endpoint': '/get_log',
            'method': 'GET',
            'description': 'Lấy dữ liệu log tìm kiếm',
            'parameters': [
                {'name': 'keyword', 'type': 'string', 'description': 'Từ khóa để lọc log (tùy chọn)'},
                {'name': 'sort_by', 'type': 'string', 'description': 'Trường để sắp xếp (mặc định: search_count)'},
                {'name': 'order', 'type': 'string', 'description': 'Thứ tự sắp xếp (asc/desc, mặc định: desc)'},
                {'name': 'limit', 'type': 'integer', 'description': 'Số lượng kết quả tối đa (tùy chọn)'}
            ],
            'curl_example': 'curl "https://search.quanhd.net/get_log?keyword=casio&sort_by=search_count&order=desc&limit=2"',
            'response_example': '''
[
  {
    "cheapest_price": 80000,
    "cheapest_product": {
      "img_url": "https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcTug3Ubtgt55pbxkH8kH9bYRNq8NTWAB61N4fUskH4VYKOMxlHpzen9xTkAlEQ-iMCmzzdYROz6yrvwM75sy0ZrVwYq0YabWAm4iZNJJUJbRNY0x-akt6aS&usqp=CAE",
      "name": "Nắp ốp trang trí máy tính Casio fx 580VNX hình tự chọn -Nhận in theo yêu cầu các ...",
      "price": 80000,
      "product_link": "https://shopee.vn/product/182128903/25857927078?gads_t_sig=VTJGc2RHVmtYMTlxTFVSVVRrdENkUm9yWVZMbGw0Q214S0d1TzNEZmUwNjViQTR3MzRyVy9Bem1rZm84Nk1PVE5SYzBIUkt1OS94ZmZFK05QeTZzSGFRNWxJVXFsU3pHengzUm1PbSs3NHhSRzJHVVRGaWljWEl6TWJNODh3K2s",
      "rating": "5,0",
      "source": "Shopee"
    },
    "first_search": "2024-08-23 16:27:38",
    "keyword": "casio fx580",
    "last_search": "2024-08-23 19:25:03",
    "search_count": 16,
    "total_results": 396,
    "variations": [
      "casio fx580"
    ]
  },
  {
    "cheapest_price": 339000,
    "cheapest_product": {
      "img_url": "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcRvMb029hPjoXRkzV7NQInovQYcKwV2sYa5bebxxhKfPuZw7F1uDZbdA5dvnyimyudKM9TFLabazVcNIEZ8fOS3dmFIO4Fnz5G-P1y1vUkzMszFEbMSj0zhuw&usqp=CAE",
      "name": "Camera IP WiFi TP-Link Tapo C200 | 360°, 1080P 2MP",
      "price": 339000,
      "product_link": "https://tinhocngoisao.com/products/camera-ip-wifi-tp-link-tapo-c200-360-1080p-2mp?srsltid=AfmBOorwEqQBz6V2IenzorOOHEHF4tZ_32dSPYG5vMiykELSGOdlhwZ8pq4",
      "rating": "4,8",
      "source": "Tinhocngoisao.com"
    },
    "first_search": "2024-08-23 16:21:31",
    "keyword": "tapo c200",
    "last_search": "2024-08-23 19:15:58",
    "search_count": 6,
    "total_results": 337,
    "variations": [
      "tapo c200"
    ]
  }
]
            '''
        }
    ]
    return render_template('api_docs.html', api_endpoints=api_endpoints)

@app.route('/web_component_demo')
def web_component_demo():
    """
    Hiển thị trang demo web component.

    :return: Template webcomponent.html
    """
    return render_template('webcomponent.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)